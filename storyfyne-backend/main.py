import os
import time
import asyncio
from typing import Optional, Dict
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from config import (
    TTS_COST_PER_MILLION_CHARS,
    TTS_MAX_CHARS,
    STORIES_CACHE_TTL_SECONDS,
    VOICES,
    PUBLIC_URL,
)
from scraper import scrape_reddit_post, scrape_website
from tagger import tag_text_with_claude
from generator import (
    parse_speaker_segments,
    build_voice_assignments,
    assemble_story_audio,
    generate_segment_audio,
)
from storage import (
    upload_story_audio,
    upload_story_video,
    upload_story_metadata,
    upload_asset,
    get_master_index,
    get_story_metadata,
    get_next_story_id,
    add_story_to_index,
    delete_story,
    get_audio_url,
    get_audio_key,
    get_video_url,
    get_video_key,
    slugify,
)
import heygen as heygen_client
from video_muxer import replace_audio_in_video

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
    voice_id: str = "Puck"
    tagged_text: str = ""


class InfluencerRequest(BaseModel):
    text: str
    title: str = "AI Influencer"
    author: str = "Unknown"
    voice_id: str = "Kore"
    avatar_id: str = ""


class AvatarCreateRequest(BaseModel):
    name: str
    avatar_type: str = "photo"
    file_url: str = ""


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

    update_job_progress(story_id, "generating", "Synthesizing speech with Gemini TTS...")

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
        audio_url = await upload_story_audio(story_id, audio_bytes, slug=slugify(post_data["title"]))
    except Exception as e:
        # Retry loop: save locally, retry every 30s for 5 mins
        temp_path = f"/tmp/story_{story_id}_final.mp3"
        os.makedirs("/tmp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)

        for attempt in range(10):
            await asyncio.sleep(30)
            try:
                audio_url = await upload_story_audio(story_id, audio_bytes, slug=slugify(post_data["title"]))
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
        "audio_key": get_audio_key(story_id, slug=slugify(post_data["title"])),
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

    update_job_progress(story_id, "generating", f"Synthesizing speech with Gemini TTS... (est. ${estimated_cost:.4f})")

    # Step 2: Parse segments and assign voices
    segments = parse_speaker_segments(tagged_text)
    voice_assignments = build_voice_assignments(segments)

    # Step 3: Generate audio
    try:
        audio_bytes, duration_ms = await assemble_story_audio(segments, voice_assignments, sales_mode=True)
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
        audio_url = await upload_story_audio(story_id, audio_bytes, slug=slugify(request.title))
    except Exception as e:
        temp_path = f"/tmp/story_{story_id}_final.mp3"
        os.makedirs("/tmp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)

        for attempt in range(10):
            await asyncio.sleep(30)
            try:
                audio_url = await upload_story_audio(story_id, audio_bytes, slug=slugify(request.title))
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
        "audio_key": get_audio_key(story_id, slug=slugify(request.title)),
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
        update_job_progress(story_id, "generating", "Synthesizing speech with Gemini TTS...")
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

    update_job_progress(story_id, "generating", "Synthesizing speech with Gemini TTS...")

    # Parse segments and assign voices
    segments = parse_speaker_segments(tagged_text)
    voice_assignments = build_voice_assignments(segments)

    # Override voice if user selected one
    if request.voice_id and request.voice_id in VOICES:
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
        audio_url = await upload_story_audio(story_id, audio_bytes, slug=slugify(request.title))
    except Exception as e:
        temp_path = f"/tmp/story_{story_id}_final.mp3"
        os.makedirs("/tmp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)

        for attempt in range(10):
            await asyncio.sleep(30)
            try:
                audio_url = await upload_story_audio(story_id, audio_bytes, slug=slugify(request.title))
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
        "audio_key": get_audio_key(story_id, slug=slugify(request.title)),
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
    """Redirect to the R2 audio or video URL."""
    metadata = await get_story_metadata(story_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Story not found")
    # Prefer video for influencer content, fallback to audio
    url = metadata.get("video_url") or metadata.get("audio_url")
    if not url:
        raise HTTPException(status_code=404, detail="Media not found")
    return RedirectResponse(url=url)


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


import re as _re


def _strip_stage_directions(text: str) -> str:
    """Remove bracketed stage directions like [Clara on camera...] from scripts."""
    text = _re.sub(r'\[.*?\]', '', text, flags=_re.DOTALL)
    text = _re.sub(r'\n+', ' ', text)
    return text.strip()


async def _process_heygen(
    story_id: int,
    text: str,
    title: str,
    author: str,
    voice_id: str,
    avatar_id: str,
):
    """Background task: generate Gemini audio + HeyGen avatar video with custom voice."""
    start_time = time.time()
    text = _strip_stage_directions(text)
    char_count = len(text)
    estimated_cost = estimate_cost(char_count)
    slug = slugify(title)

    # Step 1: Generate Gemini TTS audio (Dialfyne voice)
    update_job_progress(story_id, "generating", f"Synthesizing Dialfyne audio... (est. ${estimated_cost:.4f})")
    try:
        audio_bytes = await generate_segment_audio(text, voice_id)
    except Exception as e:
        metadata = {
            "id": story_id,
            "reddit_url": "",
            "title": title,
            "author": author,
            "subreddit": "influencer",
            "status": "generate_failed",
            "audio_url": "",
            "video_url": "",
            "duration_seconds": 0,
            "file_size_bytes": 0,
            "voice_assignments": {},
            "tagged_text_preview": text[:200],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processing_time_seconds": 0,
            "error": str(e),
        }
        await upload_story_metadata(story_id, metadata)
        await add_story_to_index({
            "id": story_id,
            "title": title,
            "subreddit": "influencer",
            "status": "generate_failed",
            "audio_url": "",
            "duration_seconds": 0,
            "created_at": metadata["created_at"],
        })
        invalidate_cache()
        update_job_progress(story_id, "generate_failed", f"Dialfyne audio failed: {str(e)}")
        return

    # Step 2: Upload audio to R2
    update_job_progress(story_id, "uploading", "Saving audio to R2...")
    try:
        audio_url = await upload_story_audio(story_id, audio_bytes, slug=slug)
    except Exception as e:
        temp_path = f"/tmp/story_{story_id}_final.mp3"
        os.makedirs("/tmp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)
        for attempt in range(10):
            await asyncio.sleep(30)
            try:
                audio_url = await upload_story_audio(story_id, audio_bytes, slug=slug)
                os.remove(temp_path)
                break
            except Exception:
                continue
        else:
            update_job_progress(story_id, "generate_failed", f"Audio upload failed: {str(e)}")
            return

    # Calculate audio duration using pydub
    try:
        import io
        from pydub import AudioSegment
        audio_seg = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
        audio_duration_seconds = len(audio_seg) // 1000
    except Exception:
        audio_duration_seconds = 0

    # Step 3: Submit HeyGen video job with custom audio URL
    update_job_progress(story_id, "rendering", "Rendering HeyGen avatar video with Dialfyne voice...")
    use_custom_audio = True
    try:
        gen_result = await heygen_client.create_video(
            script=text,
            audio_url=audio_url,
            avatar_id=avatar_id,
        )
        video_id = gen_result.get("video_id")
        if not video_id:
            raise RuntimeError("No video_id in HeyGen response")
    except Exception as e:
        # Fallback: generate with text and mux audio later
        update_job_progress(story_id, "rendering", f"Custom audio lip-sync failed ({str(e)}). Falling back to text generation...")
        try:
            gen_result = await heygen_client.create_video(
                script=text,
                avatar_id=avatar_id,
            )
            video_id = gen_result.get("video_id")
            if not video_id:
                raise RuntimeError("No video_id in HeyGen fallback response")
            use_custom_audio = False
        except Exception as e2:
            # Save audio-only metadata since audio succeeded
            metadata = {
                "id": story_id,
                "reddit_url": "",
                "title": title,
                "author": author,
                "subreddit": "influencer",
                "status": "audio_only",
                "audio_url": audio_url,
                "audio_key": get_audio_key(story_id, slug=slug),
                "video_url": "",
                "duration_seconds": audio_duration_seconds,
                "file_size_bytes": len(audio_bytes),
                "voice_assignments": {"NARRATOR": voice_id},
                "tagged_text_preview": text[:200],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "processing_time_seconds": int(time.time() - start_time),
                "char_count": char_count,
                "estimated_cost_usd": round(estimate_cost(char_count), 6),
                "error": f"HeyGen video failed: {str(e2)}",
            }
            await upload_story_metadata(story_id, metadata)
            await add_story_to_index({
                "id": story_id,
                "title": title,
                "subreddit": "influencer",
                "status": "audio_only",
                "audio_url": audio_url,
                "duration_seconds": audio_duration_seconds,
                "created_at": metadata["created_at"],
            })
            invalidate_cache()
            update_job_progress(story_id, "complete", "Audio ready. Video generation failed.")
            return

    # Step 4: Poll HeyGen status
    update_job_progress(story_id, "rendering", f"Rendering HeyGen avatar video... (job {str(video_id)[:8]})")
    video_url = ""
    video_bytes = b""
    polling_error = ""
    for _ in range(300):  # poll for up to 15 minutes
        await asyncio.sleep(3)
        try:
            status_result = await heygen_client.get_video_status(video_id)
            status = status_result.get("status", "")
            if status == "completed":
                video_url = status_result.get("video_url", "")
                if video_url:
                    try:
                        video_bytes = await heygen_client.download_video(video_url)
                    except Exception as dl_err:
                        polling_error = f"Video ready but download failed: {dl_err}"
                        update_job_progress(story_id, "rendering", polling_error)
                break
            elif status == "failed":
                failure_code = status_result.get("failure_code", "")
                failure_message = status_result.get("failure_message", "Unknown HeyGen error")
                polling_error = f"{failure_code}: {failure_message}" if failure_code else failure_message
                update_job_progress(story_id, "rendering", f"HeyGen video failed: {polling_error}")
                break
            else:
                # still processing (pending / processing)
                pass
        except Exception as poll_err:
            # continue polling
            continue
    else:
        # timed out
        polling_error = "HeyGen video timed out."
        update_job_progress(story_id, "rendering", f"{polling_error} Saving audio only.")

    # Step 5: If we fell back to text generation, mux Gemini audio into HeyGen video
    final_video_bytes = b""
    if not use_custom_audio and video_bytes and audio_bytes:
        update_job_progress(story_id, "rendering", "Muxing Dialfyne audio into avatar video...")
        try:
            loop = asyncio.get_event_loop()
            final_video_bytes = await loop.run_in_executor(
                None, replace_audio_in_video, video_bytes, audio_bytes
            )
        except Exception as e:
            update_job_progress(story_id, "rendering", f"Audio muxing failed: {str(e)}. Using raw video.")
            final_video_bytes = video_bytes
    elif video_bytes:
        final_video_bytes = video_bytes

    # Step 6: Upload final video
    video_upload_url = ""
    if final_video_bytes:
        update_job_progress(story_id, "uploading", "Saving video to R2...")
        try:
            video_upload_url = await upload_story_video(story_id, final_video_bytes, slug=slug)
        except Exception as e:
            update_job_progress(story_id, "uploading", f"Video upload failed: {str(e)}")

    processing_time = int(time.time() - start_time)
    final_status = "complete" if video_upload_url else "audio_only"

    metadata = {
        "id": story_id,
        "reddit_url": "",
        "title": title,
        "author": author,
        "subreddit": "influencer",
        "status": final_status,
        "audio_url": audio_url,
        "audio_key": get_audio_key(story_id, slug=slug),
        "video_url": video_upload_url,
        "video_key": get_video_key(story_id, slug=slug) if video_upload_url else "",
        "heygen_video_id": video_id,
        "duration_seconds": audio_duration_seconds,
        "file_size_bytes": len(audio_bytes),
        "video_size_bytes": len(final_video_bytes) if final_video_bytes else 0,
        "voice_assignments": {"NARRATOR": voice_id},
        "tagged_text_preview": text[:200],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processing_time_seconds": processing_time,
        "char_count": char_count,
        "estimated_cost_usd": round(estimate_cost(char_count), 6),
        "error": polling_error or "",
    }

    await upload_story_metadata(story_id, metadata)
    await add_story_to_index({
        "id": story_id,
        "title": title,
        "subreddit": "influencer",
        "status": final_status,
        "audio_url": audio_url,
        "duration_seconds": audio_duration_seconds,
        "created_at": metadata["created_at"],
    })
    invalidate_cache()
    update_job_progress(story_id, "complete", "Done!" if video_upload_url else "Audio ready. Video unavailable.")


@app.post("/api/process-influencer", response_model=ProcessResponse)
async def process_influencer(request: InfluencerRequest):
    """Generate an AI influencer video: Dialfyne audio + HeyGen avatar."""
    raw_text = request.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Text is required")

    story_id = await get_next_story_id()
    update_job_progress(story_id, "generating", "Starting influencer generation...")

    # Validate voice
    voice_id = request.voice_id if request.voice_id in VOICES else "Kore"
    avatar_id = request.avatar_id or ""

    # Save a placeholder immediately so the frontend doesn't 404 while processing
    placeholder = {
        "id": story_id,
        "reddit_url": "",
        "title": request.title or "AI Influencer",
        "author": request.author or "Unknown",
        "subreddit": "influencer",
        "status": "processing",
        "audio_url": "",
        "video_url": "",
        "duration_seconds": 0,
        "file_size_bytes": 0,
        "voice_assignments": {},
        "tagged_text_preview": raw_text[:200],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processing_time_seconds": 0,
    }
    await upload_story_metadata(story_id, placeholder)
    await add_story_to_index({
        "id": story_id,
        "title": request.title or "AI Influencer",
        "subreddit": "influencer",
        "status": "processing",
        "audio_url": "",
        "duration_seconds": 0,
        "created_at": placeholder["created_at"],
    })
    invalidate_cache()

    # Kick off background task so the request returns immediately
    async def _wrapped_task():
        try:
            await _process_heygen(
                story_id=story_id,
                text=raw_text,
                title=request.title or "AI Influencer",
                author=request.author or "Unknown",
                voice_id=voice_id,
                avatar_id=avatar_id,
            )
        except Exception as e:
            # Catch anything that slipped through and save error metadata
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            metadata = {
                "id": story_id,
                "reddit_url": "",
                "title": request.title or "AI Influencer",
                "author": request.author or "Unknown",
                "subreddit": "influencer",
                "status": "generate_failed",
                "audio_url": "",
                "video_url": "",
                "duration_seconds": 0,
                "file_size_bytes": 0,
                "voice_assignments": {},
                "tagged_text_preview": raw_text[:200],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "processing_time_seconds": 0,
                "error": error_msg,
            }
            try:
                await upload_story_metadata(story_id, metadata)
                await add_story_to_index({
                    "id": story_id,
                    "title": request.title or "AI Influencer",
                    "subreddit": "influencer",
                    "status": "generate_failed",
                    "audio_url": "",
                    "duration_seconds": 0,
                    "created_at": metadata["created_at"],
                })
                invalidate_cache()
            except Exception:
                pass
            update_job_progress(story_id, "generate_failed", f"Unhandled error: {str(e)}")

    asyncio.create_task(_wrapped_task())

    return ProcessResponse(
        story_id=story_id,
        audio_url="",
        duration_seconds=0,
        status="processing",
    )


@app.get("/api/heygen/avatars")
async def list_heygen_avatars():
    """Fetch available HeyGen avatars (public + private)."""
    try:
        avatars = await heygen_client.list_avatars()
        return {"avatars": avatars}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch avatars: {str(e)}")


@app.post("/api/avatars")
async def create_avatar_endpoint(request: AvatarCreateRequest):
    """Create a new HeyGen avatar (photo, digital_twin, or prompt)."""
    name = request.name.strip()
    avatar_type = request.avatar_type.strip()
    file_url = request.file_url.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Avatar name is required")
    if avatar_type not in ("photo", "digital_twin", "prompt"):
        raise HTTPException(status_code=400, detail="avatar_type must be 'photo', 'digital_twin', or 'prompt'")
    if not file_url:
        raise HTTPException(status_code=400, detail="file_url is required")

    try:
        result = await heygen_client.create_avatar(
            name=name,
            avatar_type=avatar_type,
            file_url=file_url,
        )
        return {
            "avatar_item": result.get("avatar_item"),
            "avatar_group": result.get("avatar_group"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create avatar: {str(e)}")


@app.post("/api/upload-asset")
async def upload_asset_endpoint(request: Request):
    """Upload a file to R2 and return its public URL."""
    content_type = request.headers.get("content-type", "application/octet-stream")
    filename = request.headers.get("x-filename", "upload")

    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        public_url = await upload_asset(
            data=body,
            filename=filename,
            content_type=content_type,
        )
        return {"url": public_url, "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
