import re
import io
import httpx
from typing import List, Tuple, Dict
from pydub import AudioSegment
from config import (
    XAI_API_KEY,
    XAI_TTS_URL,
    TTS_MAX_CHARS,
    SILENCE_BETWEEN_SPEAKERS_MS,
    SILENCE_BETWEEN_CHUNKS_MS,
    SILENCE_END_MS,
    VOICE_ASSIGNMENTS,
    VOICE_CYCLE,
)


def split_at_sentence_boundaries(text: str, max_chars: int = TTS_MAX_CHARS) -> List[str]:
    """Split text at sentence boundaries to stay under max_chars."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks: List[str] = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= max_chars:
            current = f"{current} {sentence}".strip() if current else sentence
        else:
            if current:
                chunks.append(current)
            if len(sentence) > max_chars:
                for i in range(0, len(sentence), max_chars):
                    chunks.append(sentence[i:i + max_chars])
            else:
                current = sentence
    if current:
        chunks.append(current)

    return chunks


def parse_speaker_segments(tagged_text: str) -> List[Tuple[str, str, str]]:
    """Parse tagged text into (speaker, text, voice_hint) segments.

    Voice hints look like [NARRATOR: male] or [SPEAKER_A: female, confident]
    """
    # Pattern matches [SPEAKER] or [SPEAKER: hint]
    pattern = r'\[(NARRATOR|SPEAKER_[A-Z])(?::\s*([^\]]*))?\]'
    parts = re.split(pattern, tagged_text)

    segments: List[Tuple[str, str, str]] = []
    current_speaker = "NARRATOR"
    current_text = ""
    current_hint = ""

    i = 0
    while i < len(parts):
        part = parts[i]
        if part is None:
            i += 1
            continue

        if re.match(r'^(NARRATOR|SPEAKER_[A-Z])$', part):
            # This is a speaker tag like NARRATOR or SPEAKER_A
            speaker = part
            hint = ""
            if i + 1 < len(parts) and parts[i + 1] is not None:
                hint = parts[i + 1].strip()
                i += 1
            if current_text.strip():
                segments.append((current_speaker, current_text.strip(), current_hint))
            current_speaker = speaker
            current_text = ""
            current_hint = hint
        else:
            current_text += part
        i += 1

    if current_text.strip():
        segments.append((current_speaker, current_text.strip(), current_hint))

    # If no speaker tags found, treat entire text as NARRATOR
    if not segments and tagged_text.strip():
        segments.append(("NARRATOR", tagged_text.strip(), ""))

    return segments


def _parse_voice_hint(hint: str) -> str:
    """Parse a voice hint and return the best matching xAI voice."""
    hint_lower = hint.lower()

    # Direct voice mentions
    for voice in ["eve", "ara", "rex", "sal", "leo"]:
        if voice in hint_lower:
            return voice

    # Gender-based mapping
    if "male" in hint_lower:
        if "confident" in hint_lower or "clear" in hint_lower:
            return "rex"
        if "authoritative" in hint_lower or "strong" in hint_lower or "powerful" in hint_lower:
            return "leo"
        return "rex"

    if "female" in hint_lower or "woman" in hint_lower:
        if "warm" in hint_lower or "friendly" in hint_lower or "gentle" in hint_lower:
            return "ara"
        if "energetic" in hint_lower or "upbeat" in hint_lower:
            return "eve"
        return "ara"

    # Personality-based mapping
    if "energetic" in hint_lower or "upbeat" in hint_lower:
        return "eve"
    if "warm" in hint_lower or "friendly" in hint_lower:
        return "ara"
    if "confident" in hint_lower or "clear" in hint_lower:
        return "rex"
    if "authoritative" in hint_lower or "strong" in hint_lower:
        return "leo"
    if "smooth" in hint_lower or "balanced" in hint_lower or "neutral" in hint_lower or "calm" in hint_lower:
        return "sal"

    return ""


def get_voice_for_speaker(speaker: str, hint: str = "", existing_assignments: Dict[str, str] = None) -> str:
    """Determine voice for a speaker using hint if available, otherwise fall back to defaults."""
    speaker_upper = speaker.upper()

    # Use hint if provided
    if hint:
        voice = _parse_voice_hint(hint)
        if voice:
            return voice

    if existing_assignments and speaker_upper in existing_assignments:
        return existing_assignments[speaker_upper]

    if speaker_upper in VOICE_ASSIGNMENTS:
        return VOICE_ASSIGNMENTS[speaker_upper]

    # For SPEAKER_E and beyond, cycle through voices
    match = re.match(r'SPEAKER_([A-Z])', speaker_upper)
    if match:
        idx = ord(match.group(1)) - ord('A')
        return VOICE_CYCLE[idx % len(VOICE_CYCLE)]

    return VOICE_ASSIGNMENTS["NARRATOR"]


def build_voice_assignments(segments: List[Tuple[str, str, str]], existing: Dict[str, str] = None) -> Dict[str, str]:
    """Build voice assignment map for all speakers in segments."""
    assignments = dict(existing) if existing else {}
    for speaker, _, hint in segments:
        speaker_upper = speaker.upper()
        if speaker_upper not in assignments:
            assignments[speaker_upper] = get_voice_for_speaker(speaker_upper, hint, assignments)
    return assignments


async def generate_tts_audio(text: str, voice_id: str, output_format: str = "mp3") -> bytes:
    """Call xAI TTS API to generate audio for text."""
    if not XAI_API_KEY:
        raise ValueError("XAI_API_KEY not configured")

    payload = {
        "text": text,
        "voice_id": voice_id,
        "language": "en",
        "output_format": {
            "format": output_format,
            "sample_rate": 24000,
            "bitrate": 128000,
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            XAI_TTS_URL,
            headers={
                "Authorization": f"Bearer {XAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if response.status_code != 200:
        raise RuntimeError(f"xAI TTS error: {response.status_code} - {response.text}")

    return response.content


async def generate_segment_audio(segment_text: str, voice_id: str) -> bytes:
    """Generate audio for a segment, chunking if necessary."""
    if len(segment_text) <= TTS_MAX_CHARS:
        return await generate_tts_audio(segment_text, voice_id)

    chunks = split_at_sentence_boundaries(segment_text)
    audio_parts: List[AudioSegment] = []

    for chunk in chunks:
        chunk_audio = await generate_tts_audio(chunk, voice_id)
        segment = AudioSegment.from_mp3(io.BytesIO(chunk_audio))
        audio_parts.append(segment)

    # Combine with silence between chunks
    combined = AudioSegment.empty()
    silence = AudioSegment.silent(duration=SILENCE_BETWEEN_CHUNKS_MS)

    for i, part in enumerate(audio_parts):
        if i > 0:
            combined += silence
        combined += part

    buf = io.BytesIO()
    combined.export(buf, format="mp3")
    return buf.getvalue()


async def assemble_story_audio(
    segments: List[Tuple[str, str, str]],
    voice_assignments: Dict[str, str]
) -> Tuple[bytes, int]:
    """Assemble all segments into final MP3 with proper silences."""
    final_audio = AudioSegment.empty()
    inter_speaker_silence = AudioSegment.silent(duration=SILENCE_BETWEEN_SPEAKERS_MS)
    intra_speaker_silence = AudioSegment.silent(duration=SILENCE_BETWEEN_CHUNKS_MS)
    end_silence = AudioSegment.silent(duration=SILENCE_END_MS)

    prev_speaker = None

    for speaker, text, _ in segments:
        voice_id = voice_assignments.get(speaker.upper(), VOICE_ASSIGNMENTS["NARRATOR"])

        # Generate audio for this segment
        if len(text) <= TTS_MAX_CHARS:
            audio_bytes = await generate_tts_audio(text, voice_id)
            segment_audio = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
        else:
            chunks = split_at_sentence_boundaries(text)
            segment_audio = AudioSegment.empty()
            for i, chunk in enumerate(chunks):
                if i > 0:
                    segment_audio += intra_speaker_silence
                chunk_bytes = await generate_tts_audio(chunk, voice_id)
                segment_audio += AudioSegment.from_mp3(io.BytesIO(chunk_bytes))

        # Add appropriate silence before this segment
        if prev_speaker is not None and prev_speaker.upper() != speaker.upper():
            final_audio += inter_speaker_silence
        elif prev_speaker is not None:
            final_audio += intra_speaker_silence

        final_audio += segment_audio
        prev_speaker = speaker

    final_audio += end_silence

    buf = io.BytesIO()
    final_audio.export(buf, format="mp3")
    return buf.getvalue(), len(final_audio)
