import httpx
from typing import Dict, List, Optional
from config import (
    HEYGEN_API_KEY,
    HEYGEN_BASE_URL,
    HEYGEN_DEFAULT_AVATAR_ID,
)


def _headers() -> Dict[str, str]:
    if not HEYGEN_API_KEY:
        raise ValueError("HEYGEN_API_KEY not configured")
    return {
        "X-Api-Key": HEYGEN_API_KEY,
        "Content-Type": "application/json",
    }


async def list_avatars(ownership: Optional[str] = None) -> List[Dict]:
    """Fetch list of available HeyGen avatar looks.

    ownership: 'public', 'private', or None for all.
    """
    url = f"{HEYGEN_BASE_URL}/v3/avatars/looks"
    params: Dict = {"limit": 50}
    if ownership:
        params["ownership"] = ownership
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=_headers(), params=params)

    if response.status_code != 200:
        raise RuntimeError(f"HeyGen list avatars error: {response.status_code} - {response.text[:200]}")

    data = response.json()
    avatars = data.get("data", [])
    return avatars


async def create_video(
    script: str,
    audio_url: Optional[str] = None,
    avatar_id: Optional[str] = None,
    voice_id: Optional[str] = None,
) -> Dict:
    """Submit a video generation job to HeyGen v3.

    If audio_url is provided, uses custom audio lip-sync.
    Otherwise falls back to text with a HeyGen voice.
    """
    url = f"{HEYGEN_BASE_URL}/v3/videos"

    selected_avatar_id = avatar_id or HEYGEN_DEFAULT_AVATAR_ID

    payload: Dict = {
        "type": "avatar",
        "avatar_id": selected_avatar_id,
        "aspect_ratio": "9:16",
        "resolution": "1080p",
    }

    if audio_url:
        payload["audio_url"] = audio_url
    else:
        payload["script"] = script
        if voice_id:
            payload["voice_id"] = voice_id

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=_headers(), json=payload)

    if response.status_code != 200:
        raise RuntimeError(f"HeyGen create video error: {response.status_code} - {response.text[:500]}")

    data = response.json()
    if data.get("error"):
        raise RuntimeError(f"HeyGen create video rejected: {data['error']}")

    return data.get("data", {})


async def get_video_status(video_id: str) -> Dict:
    """Poll the status of a HeyGen video generation job."""
    url = f"{HEYGEN_BASE_URL}/v3/videos/{video_id}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=_headers())

    if response.status_code != 200:
        raise RuntimeError(f"HeyGen status error: {response.status_code} - {response.text[:200]}")

    data = response.json()
    return data.get("data", {})


async def create_avatar(
    name: str,
    avatar_type: str,
    file_url: str,
) -> Dict:
    """Create a new HeyGen avatar from an image, video, or prompt.

    avatar_type: 'photo', 'digital_twin', or 'prompt'
    file_url: public URL of the source image/video (for photo/digital_twin)
    """
    url = f"{HEYGEN_BASE_URL}/v3/avatars"

    payload: Dict = {
        "type": avatar_type,
        "name": name,
    }

    if avatar_type in ("photo", "digital_twin"):
        payload["file"] = {"type": "url", "url": file_url}
    elif avatar_type == "prompt":
        payload["prompt"] = file_url

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=_headers(), json=payload)

    if response.status_code != 200:
        raise RuntimeError(f"HeyGen create avatar error: {response.status_code} - {response.text[:500]}")

    data = response.json()
    if data.get("error"):
        raise RuntimeError(f"HeyGen create avatar rejected: {data['error']}")

    return data.get("data", {})


async def download_video(video_url: str) -> bytes:
    """Download a completed HeyGen video from its URL."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(video_url)

    if response.status_code != 200:
        raise RuntimeError(f"HeyGen video download failed: {response.status_code}")

    return response.content
