import json
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timezone
import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from config import (
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
    R2_AUDIO_PREFIX,
    R2_INDEX_PREFIX,
    MASTER_INDEX_KEY,
)


def get_s3_client():
    """Create and return an S3-compatible client for Cloudflare R2."""
    endpoint = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=BotoConfig(signature_version="s3v4"),
    )


def get_audio_url(story_id: int) -> str:
    """Get public URL for a story's audio file."""
    return f"{R2_PUBLIC_URL}/{R2_AUDIO_PREFIX}story_{story_id}_final.mp3"


def get_story_key(story_id: int) -> str:
    """Get R2 key for a story's metadata file."""
    return f"{R2_INDEX_PREFIX}story_{story_id}.json"


async def upload_file(key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    """Upload bytes to R2."""
    s3 = get_s3_client()
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=data,
            ContentType=content_type,
        ),
    )


async def download_file(key: str) -> Optional[bytes]:
    """Download bytes from R2. Returns None if not found."""
    s3 = get_s3_client()
    loop = asyncio.get_event_loop()
    try:
        response = await loop.run_in_executor(
            None,
            lambda: s3.get_object(Bucket=R2_BUCKET_NAME, Key=key),
        )
        return response["Body"].read()
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


async def delete_file(key: str) -> None:
    """Delete a file from R2."""
    s3 = get_s3_client()
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: s3.delete_object(Bucket=R2_BUCKET_NAME, Key=key),
    )


async def upload_story_audio(story_id: int, audio_bytes: bytes) -> str:
    """Upload story audio to R2 and return its public URL."""
    key = f"{R2_AUDIO_PREFIX}story_{story_id}_final.mp3"
    await upload_file(key, audio_bytes, content_type="audio/mpeg")
    return get_audio_url(story_id)


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


async def delete_story(story_id: int) -> bool:
    """Delete a story's audio and metadata from R2 and update index."""
    metadata = await get_story_metadata(story_id)
    if metadata is None:
        return False

    # Delete audio
    audio_key = f"{R2_AUDIO_PREFIX}story_{story_id}_final.mp3"
    try:
        await delete_file(audio_key)
    except ClientError:
        pass

    # Delete metadata
    try:
        await delete_file(get_story_key(story_id))
    except ClientError:
        pass

    # Update index
    await remove_story_from_index(story_id)
    return True
