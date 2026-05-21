import json
import re
import httpx
from typing import Dict, List, Optional
from datetime import datetime, timezone
from config import (
    R2_ACCOUNT_ID,
    R2_API_TOKEN,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
    R2_AUDIO_PREFIX,
    R2_VIDEO_PREFIX,
    R2_INDEX_PREFIX,
    R2_ASSET_PREFIX,
    MASTER_INDEX_KEY,
)


def slugify(text: str, max_length: int = 50) -> str:
    """Convert a title to a URL-safe slug."""
    if not text:
        return "untitled"
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text.strip("-")[:max_length]

CF_API_BASE = "https://api.cloudflare.com/client/v4"


def _headers() -> Dict[str, str]:
    if not R2_API_TOKEN:
        raise ValueError("R2_API_TOKEN not configured")
    return {
        "Authorization": f"Bearer {R2_API_TOKEN}",
    }


def _bucket_url() -> str:
    if not R2_ACCOUNT_ID:
        raise ValueError("R2_ACCOUNT_ID not configured")
    return f"{CF_API_BASE}/accounts/{R2_ACCOUNT_ID}/r2/buckets/{R2_BUCKET_NAME}/objects"


def get_audio_key(story_id: int, slug: str = "") -> str:
    """Get R2 key for a story's audio file."""
    suffix = f"-{slug}" if slug else ""
    return f"{R2_AUDIO_PREFIX}story_{story_id}{suffix}_final.mp3"


def get_audio_url(story_id: int, slug: str = "") -> str:
    """Get public URL for a story's audio file."""
    if not R2_PUBLIC_URL:
        raise ValueError("R2_PUBLIC_URL not configured")
    suffix = f"-{slug}" if slug else ""
    return f"{R2_PUBLIC_URL}/{R2_AUDIO_PREFIX}story_{story_id}{suffix}_final.mp3"


def get_story_key(story_id: int) -> str:
    """Get R2 key for a story's metadata file."""
    return f"{R2_INDEX_PREFIX}story_{story_id}.json"


async def upload_file(key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    """Upload bytes to R2 via Cloudflare REST API."""
    url = f"{_bucket_url()}/{key}"
    headers = {**_headers(), "Content-Type": content_type}

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.put(url, headers=headers, content=data)

    if response.status_code not in (200, 201):
        raise RuntimeError(f"R2 upload failed: {response.status_code} - {response.text[:200]}")


async def download_file(key: str) -> Optional[bytes]:
    """Download bytes from R2 via Cloudflare REST API. Returns None if not found."""
    url = f"{_bucket_url()}/{key}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(url, headers=_headers())

    if response.status_code == 404:
        return None
    if response.status_code != 200:
        raise RuntimeError(f"R2 download failed: {response.status_code} - {response.text[:200]}")

    return response.content


async def delete_file(key: str) -> None:
    """Delete a file from R2 via Cloudflare REST API."""
    url = f"{_bucket_url()}/{key}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.delete(url, headers=_headers())

    if response.status_code not in (200, 204, 404):
        raise RuntimeError(f"R2 delete failed: {response.status_code} - {response.text[:200]}")


async def upload_story_audio(story_id: int, audio_bytes: bytes, slug: str = "") -> str:
    """Upload story audio to R2 and return its public URL."""
    key = get_audio_key(story_id, slug)
    await upload_file(key, audio_bytes, content_type="audio/mpeg")
    return get_audio_url(story_id, slug)


async def upload_story_metadata(story_id: int, metadata: Dict) -> None:
    """Upload story metadata JSON to R2."""
    key = get_story_key(story_id)
    data = json.dumps(metadata, indent=2).encode("utf-8")
    await upload_file(key, data, content_type="application/json")


async def get_master_index() -> Dict:
    """Download and return the master stories index. Creates new if not exists."""
    data = await download_file(MASTER_INDEX_KEY)
    if data is None:
        return {
            "stories": [],
            "total_stories": 0,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
    return json.loads(data.decode("utf-8"))


async def save_master_index(index: Dict) -> None:
    """Upload the master stories index to R2."""
    index["last_updated"] = datetime.now(timezone.utc).isoformat()
    data = json.dumps(index, indent=2).encode("utf-8")
    await upload_file(MASTER_INDEX_KEY, data, content_type="application/json")


async def add_story_to_index(story_summary: Dict) -> None:
    """Add a story summary to the master index."""
    index = await get_master_index()
    stories = index.get("stories", [])

    # Replace if exists
    found = False
    for i, s in enumerate(stories):
        if s.get("id") == story_summary["id"]:
            stories[i] = story_summary
            found = True
            break

    if not found:
        stories.append(story_summary)

    index["stories"] = stories
    index["total_stories"] = len(stories)
    await save_master_index(index)


async def remove_story_from_index(story_id: int) -> None:
    """Remove a story from the master index."""
    index = await get_master_index()
    stories = [s for s in index.get("stories", []) if s.get("id") != story_id]
    index["stories"] = stories
    index["total_stories"] = len(stories)
    await save_master_index(index)


async def get_story_metadata(story_id: int) -> Optional[Dict]:
    """Download individual story metadata."""
    data = await download_file(get_story_key(story_id))
    if data is None:
        return None
    return json.loads(data.decode("utf-8"))


async def get_next_story_id() -> int:
    """Get the next available story ID."""
    index = await get_master_index()
    stories = index.get("stories", [])
    if not stories:
        return 1
    return max(s.get("id", 0) for s in stories) + 1


def get_video_key(story_id: int, slug: str = "") -> str:
    """Get R2 key for a story's video file."""
    suffix = f"-{slug}" if slug else ""
    return f"{R2_VIDEO_PREFIX}story_{story_id}{suffix}_video.mp4"


def get_video_url(story_id: int, slug: str = "") -> str:
    """Get public URL for a story's video file."""
    if not R2_PUBLIC_URL:
        raise ValueError("R2_PUBLIC_URL not configured")
    suffix = f"-{slug}" if slug else ""
    return f"{R2_PUBLIC_URL}/{R2_VIDEO_PREFIX}story_{story_id}{suffix}_video.mp4"


async def upload_story_video(story_id: int, video_bytes: bytes, slug: str = "") -> str:
    """Upload story video to R2 and return its public URL."""
    key = get_video_key(story_id, slug)
    await upload_file(key, video_bytes, content_type="video/mp4")
    return get_video_url(story_id, slug)


def get_asset_key(filename: str) -> str:
    """Get R2 key for a generic asset file."""
    return f"{R2_ASSET_PREFIX}{filename}"


def get_asset_url(filename: str) -> str:
    """Get public URL for a generic asset file."""
    if not R2_PUBLIC_URL:
        raise ValueError("R2_PUBLIC_URL not configured")
    return f"{R2_PUBLIC_URL}/{R2_ASSET_PREFIX}{filename}"


async def upload_asset(data: bytes, filename: str, content_type: str = "application/octet-stream") -> str:
    """Upload a generic asset to R2 and return its public URL."""
    key = get_asset_key(filename)
    await upload_file(key, data, content_type=content_type)
    return get_asset_url(filename)


async def delete_story(story_id: int) -> bool:
    """Delete a story's audio, video, and metadata from R2 and update index."""
    metadata = await get_story_metadata(story_id)
    if metadata is None:
        return False

    # Delete audio
    audio_key = metadata.get("audio_key") or f"{R2_AUDIO_PREFIX}story_{story_id}_final.mp3"
    try:
        await delete_file(audio_key)
    except RuntimeError:
        pass

    # Delete video
    video_key = metadata.get("video_key")
    if video_key:
        try:
            await delete_file(video_key)
        except RuntimeError:
            pass

    # Delete metadata
    try:
        await delete_file(get_story_key(story_id))
    except RuntimeError:
        pass

    # Update index
    await remove_story_from_index(story_id)
    return True
