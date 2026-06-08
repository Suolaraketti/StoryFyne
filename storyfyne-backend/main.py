import os
import time
import asyncio
import json
import logging
import httpx
from typing import Optional, Dict
from datetime import datetime, timezone
from contextlib import asynccontextmanager

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("storyfyne")

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
    RENDER_GATEWAY_URL,
    REMOTION_SERVE_URL,
    REMOTION_FPS,
    REMOTION_COMPOSITION_ID,
    GPU_WORKER_URL,
    GPU_WORKER_TIMEOUT,
    HYPERFRAMES_ENABLED,
    HYPERFRAMES_RENDER_QUALITY,
)
from scraper import scrape_reddit_post, scrape_website
from tagger import tag_text_with_claude
from generator import (
    parse_speaker_segments,
    build_voice_assignments,
    assemble_story_audio,
    generate_segment_audio,
    analyze_audio_markers,
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
from music_library import select_music, list_music, get_by_id

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
    aspect_ratio: str = "9:16"
    tagged_text: str = ""
    context: str = ""


class ExplainerRequest(BaseModel):
    text: str
    title: str = "Explainer Video"
    author: str = "Unknown"
    voice_id: str = "Puck"
    aspect_ratio: str = "16:9"
    language: str = "en-US"
    logo_url: str = ""
    brand_name: str = ""
    font_family: str = "Instrument Sans, Inter, Arial, sans-serif"
    primary_color: str = "#10a37f"
    secondary_color: str = "#19c59f"
    bg_color: str = "#050505"
    text_color: str = "#ffffff"
    accent_color: str = "#10a37f"
    music_url: str = ""
    music_volume: float = 0.24
    maintain_background: bool = True
    template: str = "modern"
    image_urls: list[str] = []
    render_quality: str = "standard"  # "standard" = Lambda, "premium" = GPU worker
    scenes_json: str = ""  # Optional pre-built scenes JSON (from preview/edit)
    music_enabled: bool = True       # auto-score a background track to the vibe
    music_track_id: str = ""         # explicit track override (from the editor)
    music_url: str = ""              # explicit URL override
    music_bpm: int = 0               # explicit BPM (with music_url)
    music_volume: float = 0.22       # 0..1 mix level under narration


class PreviewExplainerResponse(BaseModel):
    scenes: list


class PreviewInfluencerResponse(BaseModel):
    tagged_text: str


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

# Serve the bundled royalty-free music beds at /music (used by the renderer).
_MUSIC_DIR = os.path.join(os.path.dirname(__file__), "assets", "music")
if os.path.isdir(_MUSIC_DIR):
    from fastapi.staticfiles import StaticFiles
    app.mount("/music", StaticFiles(directory=_MUSIC_DIR), name="music")


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


@app.post("/api/preview-influencer", response_model=PreviewInfluencerResponse)
async def preview_influencer(request: InfluencerRequest):
    """Generate an expressive tagged script for an influencer video without creating audio."""
    raw_text = request.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        tagged_text = await tag_text_with_claude(raw_text, influencer_mode=True, context=request.context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tagging failed: {str(e)}")

    return PreviewInfluencerResponse(tagged_text=tagged_text)


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
    aspect_ratio: str = "9:16",
    tagged_text: str = "",
    context: str = "",
):
    """Background task: generate Gemini audio + HeyGen avatar video with custom voice."""
    start_time = time.time()
    raw_text = text.strip()
    char_count = len(raw_text)
    estimated_cost = estimate_cost(char_count)
    slug = slugify(title)

    # Step 1: Tag with Claude for expressive delivery (skip if pre-tagged)
    if tagged_text.strip():
        tagged_text_for_audio = tagged_text.strip()
        update_job_progress(story_id, "generating", f"Synthesizing expressive Dialfyne audio... (est. ${estimated_cost:.4f})")
    else:
        update_job_progress(story_id, "tagging", "Crafting expressive delivery with Claude...")
        try:
            tagged_text_for_audio = await tag_text_with_claude(raw_text, influencer_mode=True, context=context)
        except Exception as e:
            tagged_text_for_audio = raw_text
            update_job_progress(story_id, "generating", f"Tagging failed, using raw text. Generating audio...")

    # Strip tags for HeyGen text fallback (HeyGen doesn't understand our tags)
    clean_text_for_heygen = _strip_stage_directions(tagged_text_for_audio)

    # Step 2: Generate Gemini TTS audio using tagged text for expressive delivery
    try:
        audio_bytes = await generate_segment_audio(tagged_text_for_audio, voice_id)
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
            "tagged_text_preview": tagged_text_for_audio[:200],
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
            aspect_ratio=aspect_ratio,
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
                aspect_ratio=aspect_ratio,
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
                aspect_ratio=request.aspect_ratio,
                tagged_text=request.tagged_text,
                context=request.context,
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


@app.get("/api/music-library")
async def music_library_endpoint():
    """Curated background-music catalog for the editor."""
    return {"tracks": list_music()}


@app.post("/api/preview-explainer", response_model=PreviewExplainerResponse)
async def preview_explainer(request: ExplainerRequest):
    """Break text into explainer scenes without generating audio."""
    raw_text = request.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        tagged_text = await tag_text_with_claude(raw_text, explainer_mode=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scene breakdown failed: {str(e)}")

    # Parse JSON response
    try:
        data = json.loads(tagged_text)
        scenes = data.get("scenes", [])
        if not scenes:
            raise ValueError("No scenes returned")
    except Exception as e:
        # Fallback: treat entire text as single scene
        scenes = [{
            "scene_text": raw_text,
            "template": "heroStatement",
            "type": "statement",
            "headline": raw_text[:72],
            "visual_direction": "A restrained typography-led launch statement.",
        }]

    return PreviewExplainerResponse(scenes=scenes)


async def submit_to_gpu_worker(
    story_id: int,
    input_props: dict,
    composition_id: str,
    output_filename: str,
) -> dict:
    """Submit a render job to the GPU worker and poll until complete."""
    if not GPU_WORKER_URL:
        raise RuntimeError("GPU_WORKER_URL not configured")

    job_id = f"story-{story_id}"
    payload = {
        "jobId": job_id,
        "storyId": str(story_id),
        "serveUrl": REMOTION_SERVE_URL,
        "compositionId": composition_id,
        "inputProps": json.dumps(input_props),
        "outputFileName": output_filename,
        "durationInFrames": sum(s.get("durationInFrames", 30) for s in input_props.get("scenes", [])),
        "fps": REMOTION_FPS,
        "width": 1920,
        "height": 1080,
    }

    logger.info(f"[story {story_id}] GPU WORKER SUBMIT | url={GPU_WORKER_URL} | job={job_id}")

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(f"{GPU_WORKER_URL}/render", json=payload)

    if response.status_code != 200:
        raise RuntimeError(f"GPU worker rejected job: {response.status_code} - {response.text}")

    accept_data = response.json()
    if not accept_data.get("accepted"):
        raise RuntimeError(f"GPU worker did not accept job: {accept_data}")

    # Poll GPU worker status
    logger.info(f"[story {story_id}] GPU WORKER POLLING | job={job_id}")
    for poll in range(120):  # 120 × 5s = 10 minutes max
        await asyncio.sleep(5)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                status_resp = await client.get(f"{GPU_WORKER_URL}/status/{job_id}")
            if status_resp.status_code == 200:
                status_data = status_resp.json()
                status = status_data.get("status")
                if status == "done":
                    logger.info(f"[story {story_id}] GPU WORKER DONE | url={status_data.get('outputUrl')}")
                    return status_data
                elif status == "error":
                    raise RuntimeError(f"GPU render failed: {status_data.get('error')}")
                # else: still rendering, continue polling
        except Exception as e:
            logger.warning(f"[story {story_id}] GPU WORKER POLL {poll+1} | {e}")

    raise RuntimeError("GPU worker render timed out after 10 minutes")


async def _process_explainer(
    story_id: int,
    text: str,
    title: str,
    author: str,
    voice_id: str,
    aspect_ratio: str,
    language: str = "en-US",
    logo_url: str = "",
    brand_name: str = "",
    font_family: str = "Instrument Sans, Inter, Arial, sans-serif",
    primary_color: str = "#10a37f",
    secondary_color: str = "#19c59f",
    bg_color: str = "#050505",
    text_color: str = "#ffffff",
    accent_color: str = "#10a37f",
    music_url: str = "",
    music_volume: float = 0.24,
    maintain_background: bool = True,
    template: str = "modern",
    image_urls: list[str] = None,
    render_quality: str = "standard",
    prebuilt_scenes: list[dict] = None,
    music_enabled: bool = True,
    music_track_id: str = "",
    music_bpm: int = 0,
):
    """Background task: break text into scenes, generate audio, render via Remotion Lambda."""
    start_time = time.time()
    slug = slugify(title)
    logger.info(f"[story {story_id}] EXPLAINER START | title={title!r} | voice={voice_id} | ratio={aspect_ratio} | chars={len(text)}")

    # Step 1: Scene breakdown (use prebuilt if provided, otherwise call Claude)
    if prebuilt_scenes:
        logger.info(f"[story {story_id}] USING PREBUILT SCENES | {len(prebuilt_scenes)} scenes from preview")
        scenes = prebuilt_scenes
        scene_data = {"mood": "clean", "scenes": scenes}
        update_job_progress(story_id, "tagging", f"Using {len(scenes)} pre-built scenes from preview...")
    else:
        update_job_progress(story_id, "tagging", "Breaking script into scenes with Claude...")
        try:
            scene_json_text = await tag_text_with_claude(text, explainer_mode=True)
            scene_data = json.loads(scene_json_text)
            scenes = scene_data.get("scenes", [])
            if not scenes:
                raise ValueError("No scenes returned by Claude")
            logger.info(f"[story {story_id}] SCENE BREAKDOWN | {len(scenes)} scenes")
            for i, s in enumerate(scenes):
                logger.info(f"[story {story_id}]   scene {i+1}: type={s.get('type','?')} | text={s.get('scene_text','')[:60]!r}")
        except Exception as e:
            logger.warning(f"[story {story_id}] SCENE BREAKDOWN FAILED | {e}")
            scenes = [{
                "scene_text": text,
                "template": "heroStatement",
                "type": "statement",
                "headline": text[:72],
                "visual_direction": "A restrained typography-led launch statement.",
            }]
            scene_data = {"mood": "clean", "scenes": scenes}
            update_job_progress(story_id, "tagging", f"Scene breakdown failed, using single scene. {str(e)}")

    # Step 2: Generate per-scene audio
    update_job_progress(story_id, "generating", f"Synthesizing audio for {len(scenes)} scenes...")
    scene_audios: list[dict] = []
    total_duration_seconds = 0

    for idx, scene in enumerate(scenes):
        scene_text = scene.get("scene_text", "").strip()
        if not scene_text:
            logger.warning(f"[story {story_id}] SCENE {idx+1} EMPTY | skipping")
            continue

        try:
            audio_bytes = await generate_segment_audio(scene_text, voice_id)
            logger.info(f"[story {story_id}] AUDIO GEN scene {idx+1} | {len(audio_bytes)} bytes")
        except Exception as e:
            logger.error(f"[story {story_id}] AUDIO GEN FAILED scene {idx+1} | {e}")
            update_job_progress(story_id, "generating", f"Audio failed for scene {idx + 1}: {str(e)}")
            continue

        filename = f"scene_{story_id}_{idx}.mp3"
        try:
            audio_url = await upload_asset(audio_bytes, filename, content_type="audio/mpeg")
            logger.info(f"[story {story_id}] AUDIO UPLOAD scene {idx+1} | {audio_url}")
        except Exception as e:
            logger.error(f"[story {story_id}] AUDIO UPLOAD FAILED scene {idx+1} | {e}")
            update_job_progress(story_id, "generating", f"Upload failed for scene {idx + 1}: {str(e)}")
            continue

        try:
            import io
            from pydub import AudioSegment
            seg = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
            duration_ms = len(seg)
        except Exception as e:
            logger.warning(f"[story {story_id}] AUDIO DURATION FAIL scene {idx+1} | {e}")
            duration_ms = 0

        duration_seconds = duration_ms / 1000
        total_duration_seconds += duration_seconds

        # Analyze audio for visual sync markers (phrase boundaries + accent peaks)
        try:
            audio_markers = analyze_audio_markers(audio_bytes, fps=REMOTION_FPS)
            logger.info(f"[story {story_id}] AUDIO MARKERS scene {idx+1} | {len(audio_markers)} markers: {audio_markers[:8]}{'...' if len(audio_markers) > 8 else ''}")
        except Exception as e:
            logger.warning(f"[story {story_id}] AUDIO MARKER ANALYSIS FAIL scene {idx+1} | {e}")
            audio_markers = []

        scene_type = scene.get("type", "evidence")
        valid_types = ("statement", "evidence", "flow", "metric", "lockup", "title", "problem", "solution", "feature", "benefit", "process", "stats", "socialProof", "comparison", "cta")
        if scene_type not in valid_types:
            scene_type = "evidence"

        scene_audios.append({
            "type": scene_type,
            "template": scene.get("template", ""),
            "text": scene_text,
            "headline": scene.get("headline", ""),
            "subheadline": scene.get("subheadline", ""),
            "eyebrow": scene.get("eyebrow", ""),
            "visualDirection": scene.get("visual_direction", ""),
            "metrics": scene.get("metrics", []),
            "before": scene.get("before", ""),
            "after": scene.get("after", ""),
            "steps": scene.get("steps", []),
            "features": scene.get("features", []),
            "messages": scene.get("messages", []),
            "statusPills": scene.get("status_pills", scene.get("statusPills", [])),
            "dashboardCards": scene.get("dashboard_cards", scene.get("dashboardCards", [])),
            "chartLabel": scene.get("chart_label", scene.get("chartLabel", "")),
            "command": scene.get("command", ""),
            "quote": scene.get("quote", ""),
            "attribution": scene.get("attribution", ""),
            "plans": scene.get("plans", []),
            "cta": scene.get("cta", ""),
            "url": scene.get("url", ""),
            "imageUrl": scene.get("imageUrl", scene.get("image_url", "")),
            "imageUrls": scene.get("imageUrls", scene.get("image_urls", [])),
            "imageFit": scene.get("imageFit", scene.get("image_fit", "cover")),
            "device": scene.get("device", "browser"),
            "background": scene.get("background", ""),
            "highlight": scene.get("highlight", ""),
            "audioUrl": audio_url,
            "durationInFrames": max(int(duration_seconds * REMOTION_FPS), 1),
            "audioMarkers": audio_markers,
        })

    if not scene_audios:
        logger.error(f"[story {story_id}] ALL AUDIO FAILED | bailing")
        metadata = {
            "id": story_id, "reddit_url": "", "title": title, "author": author,
            "subreddit": "explainer", "mode": "explainer", "status": "generate_failed",
            "audio_url": "", "video_url": "", "duration_seconds": 0, "file_size_bytes": 0,
            "voice_assignments": {"NARRATOR": voice_id},
            "tagged_text_preview": text[:200],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processing_time_seconds": 0, "error": "All scene audio generation failed",
        }
        await upload_story_metadata(story_id, metadata)
        await add_story_to_index({"id": story_id, "title": title, "subreddit": "explainer", "mode": "explainer", "status": "generate_failed", "audio_url": "", "duration_seconds": 0, "created_at": metadata["created_at"]})
        invalidate_cache()
        update_job_progress(story_id, "generate_failed", "All scene audio generation failed")
        return

    logger.info(f"[story {story_id}] AUDIO COMPLETE | {len(scene_audios)} scenes | total_duration={total_duration_seconds:.1f}s")

    # Step 3: Submit to Render Gateway
    update_job_progress(story_id, "rendering", "Submitting video render to Remotion Lambda...")

    # Per-scene images (from the editor) win. Positional image_urls only
    # backfill scenes that don't already carry their own asset.
    image_list = [u for u in (image_urls or []) if u]
    fill_iter = iter(image_list)
    for sa in scene_audios:
        if not sa.get("imageUrl") and not sa.get("imageUrls"):
            nxt = next(fill_iter, "")
            if nxt:
                sa["imageUrl"] = nxt

    composition_id = "ExplainerVideoMobile" if aspect_ratio == "9:16" else REMOTION_COMPOSITION_ID
    # Extract mood from Claude response if present
    mood = scene_data.get("mood", "clean") if isinstance(scene_data, dict) else "clean"

    # ─── Background music: vibe-matched from the curated library ──────
    final_music_url, final_music_bpm = "", 0
    if music_url:
        final_music_url, final_music_bpm = music_url, music_bpm
    elif music_track_id:
        chosen = get_by_id(music_track_id)
        if chosen:
            final_music_url, final_music_bpm = chosen["url"], chosen.get("bpm", 0)
    elif music_enabled:
        directive = scene_data.get("music", {}) if isinstance(scene_data, dict) else {}
        chosen = select_music(
            mood=mood,
            energy=str(directive.get("energy", "")),
            bpm=int(directive.get("bpm", 0) or 0),
        )
        if chosen:
            final_music_url, final_music_bpm = chosen["url"], chosen.get("bpm", 0)
            logger.info(f"[story {story_id}] MUSIC SELECTED | id={chosen.get('id')} | bpm={final_music_bpm} | mood={mood}")
    if music_enabled and not final_music_url:
        logger.info(f"[story {story_id}] MUSIC | none available (catalog empty or disabled)")

    input_props = {
        "scenes": scene_audios,
        "aspectRatio": aspect_ratio,
        "logoUrl": logo_url,
        "brandName": brand_name or title,
        "fontFamily": font_family,
        "primaryColor": primary_color,
        "secondaryColor": secondary_color,
        "bgColor": bg_color,
        "textColor": text_color,
        "accentColor": accent_color,
        "musicUrl": music_url,
        "musicVolume": max(0, min(1, music_volume)),
        "maintainBackground": maintain_background,
        "mood": mood,
        "musicUrl": final_music_url,
        "musicBpm": final_music_bpm,
        "musicVolume": music_volume,
    }
    logger.info(f"[story {story_id}] RENDER SUBMIT | scenes={len(scene_audios)} | hyperframes=enabled")
    logger.info(f"[story {story_id}] RENDER PROPS | logo={logo_url!r} | colors={primary_color},{secondary_color},{bg_color},{text_color},{accent_color}")

    # Step 4: Render video via HyperFrames
    video_url = ""
    video_bytes = b""
    polling_error = ""
    render_id = ""
    bucket_name = ""

    update_job_progress(story_id, "rendering", "Building HyperFrames composition...")
    logger.info(f"[story {story_id}] HYPERFRAMES | Building project...")

    try:
        from hyperframes_builder import build_explainer_project
        import tempfile
        import subprocess

        # Build the hyperframes HTML project
        project_dir = tempfile.mkdtemp(prefix=f"hf_story_{story_id}_")

        hf_config = {
            "aspect_ratio": aspect_ratio,
            "primary_color": primary_color,
            "secondary_color": secondary_color,
            "bg_color": bg_color,
            "text_color": text_color,
            "accent_color": accent_color,
            "logo_url": logo_url,
            "brand_name": brand_name or title,
            "font_family": font_family,
            "music_url": final_music_url,
            "music_volume": music_volume,
            "fps": 30,
        }

        build_explainer_project(
            scenes=scene_audios,
            output_dir=project_dir,
            config=hf_config,
        )
        logger.info(f"[story {story_id}] HYPERFRAMES | Project built at {project_dir}")

        # Run hyperframes render via subprocess
        output_path = os.path.join(project_dir, "output.mp4")
        update_job_progress(story_id, "rendering", "Rendering via HyperFrames...")

        # Check if npx is available, fallback to local hyperframes
        cmd = [
            "npx", "--yes", "hyperframes@latest",
            "render",
            "--output", output_path,
            "--quality", HYPERFRAMES_RENDER_QUALITY,
            "--fps", "30",
            "--format", "mp4",
        ]

        logger.info(f"[story {story_id}] HYPERFRAMES | Running: {' '.join(cmd)}")

        # Run with a generous timeout (10 minutes)
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=project_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=600)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            raise RuntimeError("HyperFrames render timed out after 10 minutes")

        if proc.returncode != 0:
            stderr_text = stderr.decode("utf-8", errors="replace")[-2000:] if stderr else ""
            stdout_text = stdout.decode("utf-8", errors="replace")[-2000:] if stdout else ""
            raise RuntimeError(f"HyperFrames render failed (exit {proc.returncode}). stderr: {stderr_text}. stdout: {stdout_text}")

        logger.info(f"[story {story_id}] HYPERFRAMES | Render complete. stdout: {stdout.decode('utf-8', errors='replace')[-500:]}")

        # Read output video
        if os.path.exists(output_path):
            video_bytes = open(output_path, "rb").read()
            logger.info(f"[story {story_id}] HYPERFRAMES | Video read: {len(video_bytes)} bytes")
            update_job_progress(story_id, "rendering", f"Video rendered ({len(video_bytes) // 1024} KB).")
        else:
            raise RuntimeError(f"HyperFrames render succeeded but output file not found at {output_path}")

        # Cleanup temp dir
        try:
            shutil.rmtree(project_dir, ignore_errors=True)
        except Exception:
            pass

    except Exception as e:
        polling_error = f"HyperFrames render failed: {e}"
        logger.error(f"[story {story_id}] HYPERFRAMES RENDER FAILED | {e}")
        # Fall back to audio-only if render fails
        metadata = {
            "id": story_id, "reddit_url": "", "title": title, "author": author,
            "subreddit": "explainer", "mode": "explainer", "status": "audio_only",
            "audio_url": scene_audios[0]["audioUrl"] if scene_audios else "",
            "video_url": "", "duration_seconds": int(total_duration_seconds),
            "file_size_bytes": 0, "voice_assignments": {"NARRATOR": voice_id},
            "tagged_text_preview": text[:200],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processing_time_seconds": int(time.time() - start_time),
            "error": f"Render failed: {str(e)}",
        }
        await upload_story_metadata(story_id, metadata)
        await add_story_to_index({"id": story_id, "title": title, "subreddit": "explainer", "mode": "explainer", "status": "audio_only", "audio_url": metadata["audio_url"], "duration_seconds": metadata["duration_seconds"], "created_at": metadata["created_at"]})
        invalidate_cache()
        update_job_progress(story_id, "complete", "Audio ready. Video render failed.")
        return

    # Step 5: Upload final video (or keep S3 URL if download failed)
    video_upload_url = ""
    if video_bytes:
        update_job_progress(story_id, "uploading", "Saving video to R2...")
        try:
            video_upload_url = await upload_story_video(story_id, video_bytes, slug=slug)
            logger.info(f"[story {story_id}] VIDEO UPLOADED R2 | {video_upload_url}")
        except Exception as e:
            update_job_progress(story_id, "uploading", f"Video upload failed: {str(e)}")
            polling_error = f"Video download OK but R2 upload failed: {e}"
            logger.error(f"[story {story_id}] R2 UPLOAD FAILED | {e}")
    elif video_url and not polling_error:
        video_upload_url = video_url
        update_job_progress(story_id, "uploading", "Using S3 video URL directly...")
        logger.info(f"[story {story_id}] USING S3 URL | {video_url[:120]}")

    processing_time = int(time.time() - start_time)
    final_status = "complete" if (video_upload_url or video_url) else "audio_only"
    logger.info(f"[story {story_id}] EXPLAINER END | status={final_status} | duration={processing_time}s | video_url_set={bool(video_upload_url)}")

    metadata = {
        "id": story_id, "reddit_url": "", "title": title, "author": author,
        "subreddit": "explainer", "mode": "explainer", "status": final_status,
        "audio_url": scene_audios[0]["audioUrl"] if scene_audios else "",
        "video_url": video_upload_url,
        "video_key": get_video_key(story_id, slug=slug) if video_upload_url and not video_url else "",
        "duration_seconds": int(total_duration_seconds), "file_size_bytes": 0,
        "video_size_bytes": len(video_bytes) if video_bytes else 0,
        "voice_assignments": {"NARRATOR": voice_id},
        "tagged_text_preview": text[:200],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processing_time_seconds": processing_time,
        "char_count": len(text),
        "estimated_cost_usd": round(estimate_cost(len(text)), 6),
        "error": polling_error or "",
        "scenes": scene_audios,
        "render_id": render_id,
        "render_bucket": bucket_name,
    }

    await upload_story_metadata(story_id, metadata)
    await add_story_to_index({"id": story_id, "title": title, "subreddit": "explainer", "mode": "explainer", "status": final_status, "audio_url": metadata["audio_url"], "duration_seconds": metadata["duration_seconds"], "created_at": metadata["created_at"]})
    invalidate_cache()
    update_job_progress(story_id, "complete", "Done!" if video_upload_url else "Audio ready. Video unavailable.")


@app.post("/api/process-explainer", response_model=ProcessResponse)
async def process_explainer(request: ExplainerRequest):
    """Generate an explainer video: scenes + audio + Remotion Lambda render."""
    raw_text = request.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Text is required")

    story_id = await get_next_story_id()
    update_job_progress(story_id, "tagging", "Starting explainer generation...")

    voice_id = request.voice_id if request.voice_id in VOICES else "Puck"

    # Save placeholder immediately
    placeholder = {
        "id": story_id,
        "reddit_url": "",
        "title": request.title or "Explainer Video",
        "author": request.author or "Unknown",
        "subreddit": "explainer",
        "mode": "explainer",
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
        "title": request.title or "Explainer Video",
        "subreddit": "explainer",
        "mode": "explainer",
        "status": "processing",
        "audio_url": "",
        "duration_seconds": 0,
        "created_at": placeholder["created_at"],
    })
    invalidate_cache()

    # Parse optional prebuilt scenes
    prebuilt_scenes = None
    if request.scenes_json:
        try:
            parsed = json.loads(request.scenes_json)
            if isinstance(parsed, list) and len(parsed) > 0:
                prebuilt_scenes = parsed
                logger.info(f"[story {story_id}] RECEIVED PREBUILT SCENES | {len(prebuilt_scenes)} scenes")
        except Exception as e:
            logger.warning(f"[story {story_id}] FAILED TO PARSE scenes_json | {e}")

    # Kick off background task
    async def _wrapped_task():
        try:
            await _process_explainer(
                story_id=story_id,
                text=raw_text,
                title=request.title or "Explainer Video",
                author=request.author or "Unknown",
                voice_id=voice_id,
                aspect_ratio=request.aspect_ratio,
                language=request.language,
                logo_url=request.logo_url,
                primary_color=request.primary_color,
                secondary_color=request.secondary_color,
                bg_color=request.bg_color,
                text_color=request.text_color,
                accent_color=request.accent_color,
                template=request.template,
                image_urls=request.image_urls,
                render_quality=request.render_quality,
                brand_name=request.brand_name,
                font_family=request.font_family,
                music_url=request.music_url,
                music_volume=request.music_volume,
                maintain_background=request.maintain_background,
                prebuilt_scenes=prebuilt_scenes,
                music_enabled=request.music_enabled,
                music_track_id=request.music_track_id,
                music_bpm=request.music_bpm,
            )
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            metadata = {
                "id": story_id,
                "reddit_url": "",
                "title": request.title or "Explainer Video",
                "author": request.author or "Unknown",
                "subreddit": "explainer",
                "mode": "explainer",
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
                    "title": request.title or "Explainer Video",
                    "subreddit": "explainer",
                    "mode": "explainer",
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


@app.post("/api/render-complete")
async def render_complete_webhook(request: Request):
    """Webhook called by GPU render worker when a render finishes."""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    story_id_str = data.get("storyId", "")
    status = data.get("status", "")
    output_url = data.get("outputUrl", "")
    error = data.get("error", "")
    render_time_ms = data.get("renderTimeMs", 0)

    logger.info(f"[webhook] RENDER COMPLETE | story={story_id_str} | status={status} | time={render_time_ms}ms")

    try:
        story_id = int(story_id_str)
    except ValueError:
        logger.error(f"[webhook] Invalid story_id: {story_id_str}")
        return {"ok": False, "error": "Invalid story_id"}

    if status == "done":
        update_job_progress(story_id, "complete", f"GPU render complete. Video: {output_url[:80]}...")
    else:
        update_job_progress(story_id, "render_failed", f"GPU render failed: {error}")

    if status == "done" and output_url:
        try:
            async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
                dl = await client.get(output_url)
            if dl.status_code == 200:
                video_upload_url = await upload_story_video(story_id, dl.content, slug="explainer")
                logger.info(f"[webhook] VIDEO SAVED | story={story_id} | url={video_upload_url}")

                metadata = await get_story_metadata(story_id)
                if metadata:
                    metadata["video_url"] = video_upload_url
                    metadata["status"] = "complete"
                    metadata["file_size_bytes"] = len(dl.content)
                    await upload_story_metadata(story_id, metadata)
                    await add_story_to_index({
                        "id": story_id,
                        "title": metadata.get("title", "Explainer Video"),
                        "subreddit": "explainer",
                        "mode": "explainer",
                        "status": "complete",
                        "audio_url": metadata.get("audio_url", ""),
                        "video_url": video_upload_url,
                        "duration_seconds": metadata.get("duration_seconds", 0),
                        "created_at": metadata.get("created_at", ""),
                    })
                    invalidate_cache()
            else:
                logger.error(f"[webhook] VIDEO DOWNLOAD FAILED | HTTP {dl.status_code}")
        except Exception as e:
            logger.error(f"[webhook] VIDEO SAVE FAILED | {e}")

    return {"ok": True}


@app.post("/api/diagnostic-render")
async def diagnostic_render():
    """Zero-cost diagnostic: render a 2-second dummy video through the full pipeline.
    Tests: backend→gateway→AWS Lambda→Remotion site→S3 output.
    Returns full step-by-step diagnostics. No Gemini/Claude calls.
    """
    from fastapi.responses import JSONResponse
    diagnostics: list[dict] = []
    start = time.time()

    def log(step: str, detail: str, data: dict = None):
        entry = {"step": step, "detail": detail, "elapsed": round(time.time() - start, 2)}
        if data:
            entry["data"] = data
        diagnostics.append(entry)
        logger.info(f"[DIAGNOSTIC] {step} | {detail}")

    # Step 1: Gateway health
    log("1_gateway_health", f"Checking {RENDER_GATEWAY_URL}/health")
    try:
        r = await httpx.AsyncClient(timeout=10.0).get(f"{RENDER_GATEWAY_URL}/health")
        log("1_gateway_health", f"HTTP {r.status_code}", {"response": r.json()})
        if r.status_code != 200:
            return JSONResponse({"success": False, "diagnostics": diagnostics}, status_code=200)
    except Exception as e:
        log("1_gateway_health", f"FAILED: {e}")
        return JSONResponse({"success": False, "diagnostics": diagnostics}, status_code=200)

    # Step 2: Submit minimal render
    composition_id = REMOTION_COMPOSITION_ID
    input_props = {
        "scenes": [{"type": "title", "text": "Test", "subtext": "", "visualDirection": "Test", "template": "heroStatement", "audioUrl": "", "durationInFrames": 60}],
        "aspectRatio": "16:9",
        "logoUrl": "",
        "primaryColor": "#4f46e5",
        "secondaryColor": "#0ea5e9",
        "bgColor": "#0f172a",
        "textColor": "#f8fafc",
        "accentColor": "#6366f1",
        "mood": "clean",
    }
    log("2_render_submit", f"Submitting to gateway | composition={composition_id} | serveUrl={REMOTION_SERVE_URL[:60]}...")
    render_id = ""
    bucket_name = ""
    try:
        r = await httpx.AsyncClient(timeout=60.0).post(
            f"{RENDER_GATEWAY_URL}/render",
            json={
                "serveUrl": REMOTION_SERVE_URL,
                "compositionId": composition_id,
                "inputProps": input_props,
                "outName": f"diagnostic_{int(start)}.mp4",
            },
        )
        body = r.json()
        log("2_render_submit", f"HTTP {r.status_code}", {"response": body})
        if r.status_code != 200:
            return JSONResponse({"success": False, "diagnostics": diagnostics}, status_code=200)
        render_id = body.get("renderId", "")
        bucket_name = body.get("bucketName", "")
        if not render_id:
            log("2_render_submit", "No renderId in response")
            return JSONResponse({"success": False, "diagnostics": diagnostics}, status_code=200)
    except Exception as e:
        log("2_render_submit", f"FAILED: {e}")
        return JSONResponse({"success": False, "diagnostics": diagnostics}, status_code=200)

    # Step 3: Poll status
    log("3_poll", f"Polling status | renderId={render_id} | bucket={bucket_name}")
    final_status = ""
    output_file = ""
    for i in range(40):  # 3.5 min max
        await asyncio.sleep(5)
        try:
            r = await httpx.AsyncClient(timeout=30.0).get(
                f"{RENDER_GATEWAY_URL}/status",
                params={"renderId": render_id, "bucketName": bucket_name},
            )
            if r.status_code != 200:
                log("3_poll", f"Poll {i+1}: HTTP {r.status_code}")
                continue
            data = r.json()
            status = data.get("status", "")
            progress = data.get("progressPercent", 0)
            if status in ("completed", "failed"):
                final_status = status
                output_file = data.get("outputFile", "")
                log("3_poll", f"Poll {i+1}: {status.upper()}", {"data": data})
                break
            else:
                if i % 3 == 0:  # log every 15s to avoid spam
                    log("3_poll", f"Poll {i+1}: {progress}%", {"data": data})
        except Exception as e:
            log("3_poll", f"Poll {i+1} exception: {e}")

    if final_status != "completed":
        log("4_result", "Render did not complete successfully")
        return JSONResponse({"success": False, "diagnostics": diagnostics}, status_code=200)

    # Step 4: Try downloading the video
    log("4_download", f"Downloading from {output_file[:80]}...")
    video_bytes = b""
    try:
        r = await httpx.AsyncClient(timeout=60.0, follow_redirects=True).get(output_file)
        video_bytes = r.content
        log("4_download", f"HTTP {r.status_code} | {len(video_bytes)} bytes")
        if r.status_code != 200:
            return JSONResponse({"success": False, "diagnostics": diagnostics}, status_code=200)
    except Exception as e:
        log("4_download", f"FAILED: {e}")
        return JSONResponse({"success": False, "diagnostics": diagnostics}, status_code=200)

    log("5_done", "Full pipeline succeeded")
    return JSONResponse({
        "success": True,
        "video_size_bytes": len(video_bytes),
        "video_url": output_file,
        "elapsed_seconds": round(time.time() - start, 2),
        "diagnostics": diagnostics,
    }, status_code=200)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
