import os
import tempfile
from typing import Optional, Tuple
from moviepy import VideoFileClip, AudioFileClip


def _crop_to_aspect_ratio(clip: VideoFileClip, target_w: int, target_h: int) -> VideoFileClip:
    """Resize and center-crop a clip to target dimensions."""
    orig_w, orig_h = clip.size

    # Scale so that the target dimension is covered
    scale_w = target_w / orig_w
    scale_h = target_h / orig_h

    # Use the larger scale so we crop (not letterbox)
    scale = max(scale_w, scale_h)
    new_w = int(orig_w * scale)
    new_h = int(orig_h * scale)

    resized = clip.resized(width=new_w, height=new_h)

    # Center crop
    x1 = (new_w - target_w) // 2
    y1 = (new_h - target_h) // 2
    return resized.cropped(x1=x1, y1=y1, width=target_w, height=target_h)


def replace_audio_in_video(
    video_bytes: bytes,
    audio_bytes: bytes,
    target_size: Tuple[int, int] = (1080, 1920),
) -> bytes:
    """Replace the audio track in a video with a new audio file, and crop to 9:16.

    Returns the muxed MP4 as bytes.
    """
    tmp_dir = tempfile.gettempdir()
    video_path = os.path.join(tmp_dir, "trugen_video.mp4")
    audio_path = os.path.join(tmp_dir, "gemini_audio.mp3")
    output_path = os.path.join(tmp_dir, "muxed_output.mp4")

    try:
        # Write temp files
        with open(video_path, "wb") as f:
            f.write(video_bytes)
        with open(audio_path, "wb") as f:
            f.write(audio_bytes)

        # Load clips
        video_clip = VideoFileClip(video_path)
        audio_clip = AudioFileClip(audio_path)

        # Crop video to 9:16 (default 1080x1920 for TikTok/Reels)
        video_clip = _crop_to_aspect_ratio(video_clip, *target_size)

        # Replace audio
        final_clip = video_clip.with_audio(audio_clip)

        # Write output (use libx264 + aac for compatibility)
        final_clip.write_videofile(
            output_path,
            codec="libx264",
            audio_codec="aac",
            temp_audiofile=os.path.join(tmp_dir, "temp-audio.m4a"),
            remove_temp=True,
            logger=None,  # suppress moviepy console output
        )

        # Read output bytes
        with open(output_path, "rb") as f:
            result = f.read()

        return result

    finally:
        # Cleanup temp files
        for p in [video_path, audio_path, output_path]:
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass
