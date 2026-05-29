import re
import io
import base64
import math
import httpx
from typing import List, Tuple, Dict
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
from config import (
    GEMINI_API_KEY,
    GEMINI_TTS_URL,
    TTS_MAX_CHARS,
    SILENCE_BETWEEN_SPEAKERS_MS,
    SILENCE_BETWEEN_CHUNKS_MS,
    SILENCE_END_MS,
    VOICE_ASSIGNMENTS,
    VOICE_CYCLE,
    VOICES,
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
    """Parse a voice hint and return the best matching Gemini voice.

    Story mode uses only Kore (female) and Fenrir (male).
    Sales mode can use any voice.
    """
    hint_lower = hint.lower()

    # Direct voice mentions (any mode)
    for voice in VOICES:
        if voice.lower() in hint_lower:
            return voice

    # Story mode gender mapping (only Kore and Fenrir)
    if "female" in hint_lower or "woman" in hint_lower or "feminine" in hint_lower:
        return "Kore"

    if "male" in hint_lower or "man" in hint_lower or "masculine" in hint_lower:
        return "Fenrir"

    # Default to Puck for neutral/narrator in story mode
    return "Puck"


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


def _convert_xai_tags_to_gemini(text: str) -> str:
    """Convert xAI TTS tags to Gemini TTS expressive tags."""
    # Non-speech sounds
    text = re.sub(r'\[laugh\]', '[laughing]', text)
    text = re.sub(r'\[sigh\]', '[sighing]', text)
    text = re.sub(r'\[pause\]', '[short pause]', text)
    text = re.sub(r'\[long-pause\]', '[long pause]', text)
    text = re.sub(r'\[breath\]', '', text)
    text = re.sub(r'\[whisper\]', '[whispering]', text)
    text = re.sub(r'\[cry\]', '[crying]', text)

    # XML wrapping tags → Gemini style modifiers (affect text that follows)
    text = re.sub(r'<whisper>(.*?)</whisper>', r'[whispering] \1', text)
    text = re.sub(r'<emphasis>(.*?)</emphasis>', r'[excitedly] \1', text)
    text = re.sub(r'<slow>(.*?)</slow>', r'[speaking slowly] \1', text)
    text = re.sub(r'<soft>(.*?)</soft>', r'[speaking softly] \1', text)
    text = re.sub(r'<loud>(.*?)</loud>', r'[shouting] \1', text)
    text = re.sub(r'<fast>(.*?)</fast>', r'[extremely fast] \1', text)

    # Clean up extra spaces
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def _pcm_to_mp3(pcm_bytes: bytes) -> bytes:
    """Convert raw PCM 16-bit 24kHz mono audio to MP3 bytes."""
    audio = AudioSegment(
        data=pcm_bytes,
        sample_width=2,      # 16-bit
        frame_rate=24000,    # 24kHz
        channels=1           # mono
    )
    buf = io.BytesIO()
    audio.export(buf, format="mp3")
    return buf.getvalue()


async def generate_tts_audio(text: str, voice_id: str, output_format: str = "mp3") -> bytes:
    """Call Gemini TTS API to generate audio for text."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")

    text = _convert_xai_tags_to_gemini(text)

    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": voice_id}
                }
            }
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            GEMINI_TTS_URL,
            headers={
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if response.status_code != 200:
        raise RuntimeError(f"Gemini TTS error: {response.status_code} - {response.text}")

    data = response.json()
    try:
        parts = data["candidates"][0]["content"]["parts"]
        for part in parts:
            if "inlineData" in part:
                b64_audio = part["inlineData"]["data"]
                pcm_bytes = base64.b64decode(b64_audio)
                return _pcm_to_mp3(pcm_bytes)
    except (KeyError, IndexError, TypeError) as e:
        raise RuntimeError(f"Unexpected Gemini TTS response format: {e}")

    raise RuntimeError("No audio data in Gemini TTS response")


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


def _strip_pause_tags(text: str) -> str:
    """Remove pause tags that would inject silence into TTS output."""
    text = re.sub(r'\[pause\]', '', text)
    text = re.sub(r'\[long-pause\]', '', text)
    text = re.sub(r'\[short pause\]', '', text)
    text = re.sub(r'\[medium pause\]', '', text)
    text = re.sub(r'\[long pause\]', '', text)
    return text


async def assemble_story_audio(
    segments: List[Tuple[str, str, str]],
    voice_assignments: Dict[str, str],
    sales_mode: bool = False
) -> Tuple[bytes, int]:
    """Assemble all segments into final MP3 with proper silences."""
    final_audio = AudioSegment.empty()

    # Use much shorter silences for sales mode to keep the flow continuous
    inter_speaker_ms = 50 if sales_mode else SILENCE_BETWEEN_SPEAKERS_MS
    intra_speaker_ms = 50 if sales_mode else SILENCE_BETWEEN_CHUNKS_MS
    end_ms = 300 if sales_mode else SILENCE_END_MS

    inter_speaker_silence = AudioSegment.silent(duration=inter_speaker_ms)
    intra_speaker_silence = AudioSegment.silent(duration=intra_speaker_ms)
    end_silence = AudioSegment.silent(duration=end_ms)

    prev_speaker = None

    for speaker, text, _ in segments:
        if sales_mode:
            text = _strip_pause_tags(text)

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


# ─── Audio Analysis for Visual Sync ─────────────────────────────────
# Detect phrase boundaries and accent peaks so visuals hit on audio cues.


def analyze_audio_markers(audio_bytes: bytes, fps: int = 30) -> List[int]:
    """Analyze audio to find frame offsets where visual events should sync.

    Returns a sorted list of frame numbers (within the scene) representing:
    - Phrase boundaries (detected via silence gaps)
    - Amplitude peaks (accent beats / emphasis moments)

    These markers replace hardcoded frame delays in the frontend.
    """
    try:
        audio = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
    except Exception:
        return []

    if len(audio) < 200:
        return []

    markers_ms: List[int] = []

    # ── 1. Phrase boundaries ──
    # detect_nonsilent returns speech segments; gaps between them are phrases.
    # Use a relatively sensitive threshold to catch natural pauses.
    speech_ranges = detect_nonsilent(audio, min_silence_len=200, silence_thresh=-42)
    for start_ms, _ in speech_ranges:
        # Slight lead-in so visuals are ready when speech starts
        lead_ms = max(0, start_ms - 60)
        markers_ms.append(lead_ms)

    # ── 2. Accent peaks within each phrase ──
    # Sample RMS in 40ms windows, find local maxima above threshold.
    window_ms = 40
    rms_samples: List[Tuple[int, float]] = []
    for t in range(0, len(audio), window_ms):
        chunk = audio[t:t + window_ms]
        rms = chunk.rms
        if rms > 0:
            rms_samples.append((t, rms))

    if not rms_samples:
        return _ms_to_frames_sorted(markers_ms, fps)

    # Dynamic threshold: median + 1.2× MAD (robust peak detection)
    rms_values = [v for _, v in rms_samples]
    rms_values.sort()
    median = rms_values[len(rms_values) // 2]
    mad = sum(abs(v - median) for v in rms_values) / len(rms_values)
    threshold = median + max(mad * 1.4, 150)

    # Find local maxima
    for i in range(2, len(rms_samples) - 2):
        t, val = rms_samples[i]
        if val < threshold:
            continue
        if val > rms_samples[i - 1][1] and val > rms_samples[i - 2][1] \
                and val >= rms_samples[i + 1][1] and val >= rms_samples[i + 2][1]:
            markers_ms.append(t)

    return _ms_to_frames_sorted(markers_ms, fps)


def _ms_to_frames_sorted(markers_ms: List[int], fps: int) -> List[int]:
    """Convert millisecond markers to frame numbers, dedupe and sort."""
    frames = []
    seen = set()
    for ms in markers_ms:
        f = int(round((ms / 1000.0) * fps))
        # Deduplicate within 3 frames
        if not any(abs(f - s) <= 3 for s in seen):
            frames.append(f)
            seen.add(f)
    frames.sort()
    return frames
