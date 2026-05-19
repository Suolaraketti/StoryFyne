import httpx
from typing import Dict, List, Optional
from config import (
    TRUGEN_API_KEY,
    TRUGEN_BASE_URL,
    TRUGEN_DEFAULT_AVATAR_ID,
    TRUGEN_DEFAULT_VOICE_ID,
    TRUGEN_DEFAULT_PROVIDER,
    TRUGEN_DEFAULT_MODEL,
)


def _headers() -> Dict[str, str]:
    if not TRUGEN_API_KEY:
        raise ValueError("TRUGEN_API_KEY not configured")
    return {
        "x-api-key": TRUGEN_API_KEY,
        "Content-Type": "application/json",
    }


async def list_avatars() -> List[Dict]:
    """Fetch list of available TruGen stock avatars."""
    url = f"{TRUGEN_BASE_URL}/ext/avatars"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=_headers())

    if response.status_code != 200:
        raise RuntimeError(f"TruGen list avatars error: {response.status_code} - {response.text[:200]}")

    return response.json()


async def create_video(
    script: str,
    avatar_id: Optional[str] = None,
    voice_id: Optional[str] = None,
    provider_name: Optional[str] = None,
    model_name: Optional[str] = None,
    callback_url: Optional[str] = None,
) -> Dict:
    """Submit a script to TruGen Text-to-Video and return generation info."""
    url = f"{TRUGEN_BASE_URL}/script-to-video/createVideo"

    payload = {
        "avatar_id": avatar_id or TRUGEN_DEFAULT_AVATAR_ID,
        "voice_id": voice_id or TRUGEN_DEFAULT_VOICE_ID,
        "provider_name": provider_name or TRUGEN_DEFAULT_PROVIDER,
        "model_name": model_name or TRUGEN_DEFAULT_MODEL,
        "script": script,
    }
    if callback_url:
        payload["callback_url"] = callback_url

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=_headers(), json=payload)

    if response.status_code != 200:
        raise RuntimeError(f"TruGen create video error: {response.status_code} - {response.text[:500]}")

    data = response.json()
    if data.get("status") == -1 or data.get("error"):
        raise RuntimeError(f"TruGen create video rejected: {data.get('error', data)}")

    return data


async def get_generation_status(generation_id: str) -> Dict:
    """Poll the status of a TruGen video generation job."""
    url = f"{TRUGEN_BASE_URL}/script-to-video/genStatus/{generation_id}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=_headers())

    if response.status_code != 200:
        raise RuntimeError(f"TruGen status error: {response.status_code} - {response.text[:200]}")

    return response.json()


async def download_video(video_url: str) -> bytes:
    """Download a completed TruGen video from its URL."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(video_url)

    if response.status_code != 200:
        raise RuntimeError(f"TruGen video download failed: {response.status_code}")

    return response.content
