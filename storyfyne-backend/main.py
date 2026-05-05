import os
import time
import asyncio
from typing import Optional, Dict
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from config import (
    TTS_COST_PER_MILLION_CHARS,
    TTS_MAX_CHARS,
    STORIES_CACHE_TTL_SECONDS,
)
from scraper import scrape_reddit_post, scrape_website
from tagger import tag_text_with_claude
from generator import (
    parse_speaker_segments,
    build_voice_assignments,
    assemble_story_audio,
)
from storage import (
    upload_story_audio,
    upload_story_metadata,
    get_master_index,
    get_story_metadata,
    get_next_story_id,
    add_story_to_index,
    delete_story,
    get_audio_url,
)

# In-memory cache for stories index
_stories_cache: Optional[Dict] = None
_cache_timestamp: float = 0.0

# In-memory job progress tracking
_job_progress: Dict[int, Dict] = {}


class ProcessRequest(BaseModel):
    url: str


class ProcessTextRequest(BaseModel):
    text: str
    title: str = "Untitled Story"
    author: str = "Unknown"
    subreddit: str = "pasted"


class SalesRequest(BaseModel):
    text: str
    title: str = "Dialfyne Pitch"
    author: str = "Dennis Kaczmarowski"
    website_url: str = ""
    voice_id: str = "rex"
    tagged_text: str = ""


class DraftSalesResponse(BaseModel):
    tagged_text: str
    voice_assignments: Dict


class ProcessResponse(BaseModel):
    story_id: int
    audio_url: str
    duration_seconds: int
    status: str


class StoriesResponse(BaseModel):
    stories: list
    total_stories: int
    last_updated: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    yield
    # Shutdown: nothing special needed


app = FastAPI(
    title="StoryFyne API",
    description="Reddit story to expressive audio generator",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow Vercel frontend and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_cached_stories() -> Dict:
    """Get stories index with caching."""
    global _stories_cache, _cache_timestamp
    now = time.time()
    if _stories_cache is not None and (now - _cache_timestamp) < STORIES_CACHE_TTL_SECONDS:
        return _stories_cache
    _stories_cache = await get_master_index()
    _cache_timestamp = now
    return _stories_cache


def invalidate_cache():
    """Invalidate the stories cache."""
    global _stories_cache, _cache_timestamp
    _stories_cache = None
    _cache_timestamp = 0.0


def update_job_progress(story_id: int, step: str, detail: str = ""):
    """Update progress for a story job."""
    _job_progress[story_id] = {
        "step": step,
        "detail": detail,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def estimate_cost(char_count: int) -> float:
    """Estimate TTS cost in USD."""
    return (char_count * TTS_COST_PER_MILLION_CHARS) / 1_000_000


@app.post("/api/process", response_model=ProcessResponse)
async def process_story(request: ProcessRequest):
    """Process a Reddit URL into expressive audio."""
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    story_id = await get_next_story_id()
    update_job_progress(story_id, "scraping", "Fetching Reddit post...")

    start_time = time.time()

    # Step 1: Scrape
    try:
        post_data = scrape_reddit_post(url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Scraping failed: {str(e)}")

    raw_text = post_data["full_text"]
    char_count = len(raw_text)
    estimated_cost = estimate_cost(char_count)

    update_job_progress(story_id, "tagging", f"Analyzing with Claude... (est. ${estimated_cost:.4f})")

    # Step 2: Tag with Claude
    try:
        tagged_text = await tag_text_with_claude(raw_text)
    except Exception as e:
        # Save raw text, mark as tag_failed
        metadata = {
            "id": story_id,
            "reddit_url": url,
            "title": post_data["title"],
            "author": post_data["author"],
            "subreddit": post_data["subreddit"],
            "status": "tag_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "file_size_bytes": 0,
            "voice_assignments": {},
            "tagged_text_preview": raw_text[:200],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processing_time_seconds": 0,
            "error": str(e),
        }
        await upload_story_metadata(story_id, metadata)
        await add_story_to_index({
            "id": story_id,
            "title": post_data["title"],
            "subreddit": post_data["subreddit"],
            "status": "tag_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "created_at": metadata["created_at"],
        })
        invalidate_cache()
        raise HTTPException(status_code=500, detail=f"Tagging failed: {str(e)}")

    update_job_progress(story_id, "generating", "Synthesizing speech with xAI TTS...")

    # Step 3: Parse segments and assign voices
    segments = parse_speaker_segments(tagged_text)
    voice_assignments = build_voice_assignments(segments)

    # Step 4: Generate audio
    try:
        audio_bytes, duration_ms = await assemble_story_audio(segments, voice_assignments)
    except Exception as e:
        metadata = {
            "id": story_id,
            "reddit_url": url,
            "title": post_data["title"],
            "author": post_data["author"],
            "subreddit": post_data["subreddit"],
            "status": "generate_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "file_size_bytes": 0,
            "voice_assignments": voice_assignments,
            "tagged_text_preview": tagged_text[:200],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processing_time_seconds": 0,
            "error": str(e),
        }
        await upload_story_metadata(story_id, metadata)
        await add_story_to_index({
            "id": story_id,
            "title": post_data["title"],
            "subreddit": post_data["subreddit"],
            "status": "generate_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "created_at": metadata["created_at"],
        })
        invalidate_cache()
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

    duration_seconds = duration_ms // 1000
    file_size_bytes = len(audio_bytes)

    update_job_progress(story_id, "uploading", "Saving to Cloudflare R2...")

    # Step 5: Upload audio and metadata
    try:
        audio_url = await upload_story_audio(story_id, audio_bytes)
    except Exception as e:
        # Retry loop: save locally, retry every 30s for 5 mins
        temp_path = f"/tmp/story_{story_id}_final.mp3"
        os.makedirs("/tmp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)

        for attempt in range(10):
            await asyncio.sleep(30)
            try:
                audio_url = await upload_story_audio(story_id, audio_bytes)
                os.remove(temp_path)
                break
            except Exception:
                continue
        else:
            raise HTTPException(status_code=500, detail=f"R2 upload failed after retries: {str(e)}")

    processing_time = int(time.time() - start_time)

    metadata = {
        "id": story_id,
        "reddit_url": url,
        "title": post_data["title"],
        "author": post_data["author"],
        "subreddit": post_data["subreddit"],
        "status": "complete",
        "audio_url": audio_url,
        "duration_seconds": duration_seconds,
        "file_size_bytes": file_size_bytes,
        "voice_assignments": voice_assignments,
        "tagged_text_preview": tagged_text[:200],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processing_time_seconds": processing_time,
        "char_count": char_count,
        "estimated_cost_usd": round(estimate_cost(char_count), 6),
    }

    await upload_story_metadata(story_id, metadata)
    await add_story_to_index({
        "id": story_id,
        "title": post_data["title"],
        "subreddit": post_data["subreddit"],
        "status": "complete",
        "audio_url": audio_url,
        "duration_seconds": duration_seconds,
        "created_at": metadata["created_at"],
    })
    invalidate_cache()
    update_job_progress(story_id, "complete", "Done!")

    return ProcessResponse(
        story_id=story_id,
        audio_url=audio_url,
        duration_seconds=duration_seconds,
        status="complete",
    )


@app.post("/api/process-text", response_model=ProcessResponse)
async def process_text(request: ProcessTextRequest):
    """Process pasted text into expressive audio."""
    raw_text = request.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Text is required")

    story_id = await get_next_story_id()
    update_job_progress(story_id, "tagging", "Analyzing with Claude...")

    start_time = time.time()
    char_count = len(raw_text)
    estimated_cost = estimate_cost(char_count)

    # Step 1: Tag with Claude
    try:
        tagged_text = await tag_text_with_claude(raw_text)
    except Exception as e:
        metadata = {
            "id": story_id,
            "reddit_url": "",
            "title": request.title,
            "author": request.author,
            "subreddit": request.subreddit,
            "status": "tag_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "file_size_bytes": 0,
            "voice_assignments": {},
            "tagged_text_preview": raw_text[:200],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processing_time_seconds": 0,
            "error": str(e),
        }
        await upload_story_metadata(story_id, metadata)
        await add_story_to_index({
            "id": story_id,
            "title": request.title,
            "subreddit": request.subreddit,
            "status": "tag_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "created_at": metadata["created_at"],
        })
        invalidate_cache()
        raise HTTPException(status_code=500, detail=f"Tagging failed: {str(e)}")

    update_job_progress(story_id, "generating", f"Synthesizing speech with xAI TTS... (est. ${estimated_cost:.4f})")

    # Step 2: Parse segments and assign voices
    segments = parse_speaker_segments(tagged_text)
    voice_assignments = build_voice_assignments(segments)

    # Step 3: Generate audio
    try:
        audio_bytes, duration_ms = await assemble_story_audio(segments, voice_assignments)
    except Exception as e:
        metadata = {
            "id": story_id,
            "reddit_url": "",
            "title": request.title,
            "author": request.author,
            "subreddit": request.subreddit,
            "status": "generate_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "file_size_bytes": 0,
            "voice_assignments": voice_assignments,
            "tagged_text_preview": tagged_text[:200],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processing_time_seconds": 0,
            "error": str(e),
        }
        await upload_story_metadata(story_id, metadata)
        await add_story_to_index({
            "id": story_id,
            "title": request.title,
            "subreddit": request.subreddit,
            "status": "generate_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "created_at": metadata["created_at"],
        })
        invalidate_cache()
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

    duration_seconds = duration_ms // 1000
    file_size_bytes = len(audio_bytes)

    update_job_progress(story_id, "uploading", "Saving to Cloudflare R2...")

    # Step 4: Upload audio and metadata
    try:
        audio_url = await upload_story_audio(story_id, audio_bytes)
    except Exception as e:
        temp_path = f"/tmp/story_{story_id}_final.mp3"
        os.makedirs("/tmp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)

        for attempt in range(10):
            await asyncio.sleep(30)
            try:
                audio_url = await upload_story_audio(story_id, audio_bytes)
                os.remove(temp_path)
                break
            except Exception:
                continue
        else:
            raise HTTPException(status_code=500, detail=f"R2 upload failed after retries: {str(e)}")

    processing_time = int(time.time() - start_time)

    metadata = {
        "id": story_id,
        "reddit_url": "",
        "title": request.title,
        "author": request.author,
        "subreddit": request.subreddit,
        "status": "complete",
        "audio_url": audio_url,
        "duration_seconds": duration_seconds,
        "file_size_bytes": file_size_bytes,
        "voice_assignments": voice_assignments,
        "tagged_text_preview": tagged_text[:200],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processing_time_seconds": processing_time,
        "char_count": char_count,
        "estimated_cost_usd": round(estimate_cost(char_count), 6),
    }

    await upload_story_metadata(story_id, metadata)
    await add_story_to_index({
        "id": story_id,
        "title": request.title,
        "subreddit": request.subreddit,
        "status": "complete",
        "audio_url": audio_url,
        "duration_seconds": duration_seconds,
        "created_at": metadata["created_at"],
    })
    invalidate_cache()
    update_job_progress(story_id, "complete", "Done!")

    return ProcessResponse(
        story_id=story_id,
        audio_url=audio_url,
        duration_seconds=duration_seconds,
        status="complete",
    )


@app.post("/api/draft-sales", response_model=DraftSalesResponse)
async def draft_sales(request: SalesRequest):
    """Generate a sales pitch draft (tagged text) without creating audio.

    Optionally scrapes a prospect website for context.
    """
    raw_text = request.text.strip()
    website_url = request.website_url.strip()

    if not raw_text and not website_url:
        raise HTTPException(status_code=400, detail="Provide text, a website URL, or both")

    website_content = ""
    if website_url:
        try:
            website_content = scrape_website(website_url, max_chars=8000)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to scrape website: {str(e)}")

    # Build the prompt for Claude
    user_content = raw_text
    if website_content:
        if raw_text:
            user_content = f"Prospect website content:\n{website_content}\n\nAdditional context from me:\n{raw_text}"
        else:
            user_content = f"Prospect website content:\n{website_content}\n\nBuild a Dialfyne sales pitch for this company."

    try:
        tagged_text = await tag_text_with_claude(user_content, sales_mode=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tagging failed: {str(e)}")

    segments = parse_speaker_segments(tagged_text)
    voice_assignments = build_voice_assignments(segments)

    return DraftSalesResponse(
        tagged_text=tagged_text,
        voice_assignments=voice_assignments,
    )


@app.post("/api/process-sales", response_model=ProcessResponse)
async def process_sales(request: SalesRequest):
    """Convert pasted text (or pre-tagged text) into a Dialfyne sales pitch audio."""
    raw_text = request.text.strip()
    website_url = request.website_url.strip()

    if not raw_text and not website_url:
        raise HTTPException(status_code=400, detail="Provide text, a website URL, or both")

    story_id = await get_next_story_id()
    start_time = time.time()
    char_count = len(raw_text)

    # If pre-tagged text is provided, skip Claude
    if request.tagged_text.strip():
        tagged_text = request.tagged_text.strip()
        update_job_progress(story_id, "generating", "Synthesizing speech with xAI TTS...")
    else:
        update_job_progress(story_id, "tagging", "Crafting sales pitch with Claude...")

        website_content = ""
        if website_url:
            try:
                website_content = scrape_website(website_url, max_chars=8000)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to scrape website: {str(e)}")

        # Build the prompt for Claude
        user_content = raw_text
        if website_content:
            if raw_text:
                user_content = f"Prospect website content:\n{website_content}\n\nAdditional context from me:\n{raw_text}"
            else:
                user_content = f"Prospect website content:\n{website_content}\n\nBuild a Dialfyne sales pitch for this company."

        try:
            tagged_text = await tag_text_with_claude(user_content, sales_mode=True)
        except Exception as e:
            metadata = {
                "id": story_id,
                "reddit_url": "",
                "title": request.title,
                "author": request.author,
                "subreddit": "sales",
                "status": "tag_failed",
                "audio_url": "",
                "duration_seconds": 0,
                "file_size_bytes": 0,
                "voice_assignments": {},
                "tagged_text_preview": raw_text[:200],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "processing_time_seconds": 0,
                "error": str(e),
            }
            await upload_story_metadata(story_id, metadata)
            await add_story_to_index({
                "id": story_id,
                "title": request.title,
                "subreddit": "sales",
                "status": "tag_failed",
                "audio_url": "",
                "duration_seconds": 0,
                "created_at": metadata["created_at"],
            })
            invalidate_cache()
            raise HTTPException(status_code=500, detail=f"Tagging failed: {str(e)}")

    update_job_progress(story_id, "generating", "Synthesizing speech with xAI TTS...")

    # Parse segments and assign voices
    segments = parse_speaker_segments(tagged_text)
    voice_assignments = build_voice_assignments(segments)

    # Override voice if user selected one
    if request.voice_id and request.voice_id in ["eve", "ara", "rex", "sal", "leo"]:
        for speaker in voice_assignments:
            voice_assignments[speaker] = request.voice_id

    # Generate audio
    try:
        audio_bytes, duration_ms = await assemble_story_audio(segments, voice_assignments)
    except Exception as e:
        metadata = {
            "id": story_id,
            "reddit_url": "",
            "title": request.title,
            "author": request.author,
            "subreddit": "sales",
            "status": "generate_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "file_size_bytes": 0,
            "voice_assignments": voice_assignments,
            "tagged_text_preview": tagged_text[:200],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processing_time_seconds": 0,
            "error": str(e),
        }
        await upload_story_metadata(story_id, metadata)
        await add_story_to_index({
            "id": story_id,
            "title": request.title,
            "subreddit": "sales",
            "status": "generate_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "created_at": metadata["created_at"],
        })
        invalidate_cache()
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

    duration_seconds = duration_ms // 1000
    file_size_bytes = len(audio_bytes)

    update_job_progress(story_id, "uploading", "Saving to Cloudflare R2...")

    try:
        audio_url = await upload_story_audio(story_id, audio_bytes)
    except Exception as e:
        temp_path = f"/tmp/story_{story_id}_final.mp3"
        os.makedirs("/tmp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)

        for attempt in range(10):
            await asyncio.sleep(30)
            try:
                audio_url = await upload_story_audio(story_id, audio_bytes)
                os.remove(temp_path)
                break
            except Exception:
                continue
        else:
            raise HTTPException(status_code=500, detail=f"R2 upload failed after retries: {str(e)}")

    processing_time = int(time.time() - start_time)

    metadata = {
        "id": story_id,
        "reddit_url": "",
        "title": request.title,
        "author": request.author,
        "subreddit": "sales",
        "status": "complete",
        "audio_url": audio_url,
        "duration_seconds": duration_seconds,
        "file_size_bytes": file_size_bytes,
        "voice_assignments": voice_assignments,
        "tagged_text_preview": tagged_text[:200],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processing_time_seconds": processing_time,
        "char_count": char_count,
        "estimated_cost_usd": round(estimate_cost(char_count), 6),
    }

    await upload_story_metadata(story_id, metadata)
    await add_story_to_index({
        "id": story_id,
        "title": request.title,
        "subreddit": "sales",
        "status": "complete",
        "audio_url": audio_url,
        "duration_seconds": duration_seconds,
        "created_at": metadata["created_at"],
    })
    invalidate_cache()
    update_job_progress(story_id, "complete", "Done!")

    return ProcessResponse(
        story_id=story_id,
        audio_url=audio_url,
        duration_seconds=duration_seconds,
        status="complete",
    )


@app.get("/api/stories")
async def list_stories():
    """Return the master stories index from R2 (cached)."""
    return await get_cached_stories()


@app.get("/api/stories/{story_id}")
async def get_story(story_id: int):
    """Return individual story metadata."""
    metadata = await get_story_metadata(story_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Story not found")

    # Merge with progress if job is in progress
    progress = _job_progress.get(story_id)
    if progress:
        metadata["progress"] = progress

    return metadata


@app.get("/api/download/{story_id}")
async def download_story(story_id: int):
    """Redirect to the R2 audio URL."""
    metadata = await get_story_metadata(story_id)
    if metadata is None or not metadata.get("audio_url"):
        raise HTTPException(status_code=404, detail="Audio not found")
    return RedirectResponse(url=metadata["audio_url"])


@app.delete("/api/stories/{story_id}")
async def delete_story_endpoint(story_id: int):
    """Delete a story and its audio."""
    success = await delete_story(story_id)
    if not success:
        raise HTTPException(status_code=404, detail="Story not found")
    invalidate_cache()
    if story_id in _job_progress:
        del _job_progress[story_id]
    return {"deleted": True, "story_id": story_id}


@app.get("/")
async def root():
    """Root endpoint for Railway health checks."""
    return {"status": "ok", "service": "storyfyne"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
