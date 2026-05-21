import os
from typing import Dict, List
from dotenv import load_dotenv

load_dotenv()

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))

# Reddit
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "StoryFyne/1.0")

# R2 Storage
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_API_TOKEN = os.getenv("R2_API_TOKEN", "")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "storyfyne-audio")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "")

# TTS
GEMINI_TTS_MODEL = os.getenv("GEMINI_TTS_MODEL", "gemini-3.1-flash-tts-preview")
GEMINI_TTS_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_TTS_MODEL}:generateContent"
TTS_MAX_CHARS = 15000
TTS_COST_PER_MILLION_CHARS = 4.20  # TODO: update with Gemini pricing when available

# Audio Assembly
SILENCE_BETWEEN_SPEAKERS_MS = 300
SILENCE_BETWEEN_CHUNKS_MS = 150
SILENCE_END_MS = 1000

# Voice Assignments (Story Mode)
VOICE_ASSIGNMENTS: Dict[str, str] = {
    "NARRATOR": "Puck",
    "SPEAKER_A": "Kore",
    "SPEAKER_B": "Fenrir",
    "SPEAKER_C": "Leda",
    "SPEAKER_D": "Orus",
}

VOICE_CYCLE: List[str] = ["Kore", "Fenrir"]

# Claude
CLAUDE_MODEL = "claude-haiku-4-5-20251001"
CLAUDE_MAX_TOKENS = 4096

# R2 Paths
R2_AUDIO_PREFIX = "audio/"
R2_INDEX_PREFIX = "index/"
MASTER_INDEX_KEY = f"{R2_INDEX_PREFIX}stories.json"

# Supported Gemini TTS voices
VOICES = [
    "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede",
    "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba",
    "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
    "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi",
    "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat"
]

# Supported languages
LANGUAGES = [
    "auto", "en", "ar-EG", "ar-SA", "ar-AE", "bn", "zh", "fr", "de", "hi",
    "id", "it", "ja", "ko", "pt-BR", "pt-PT", "ru", "es-MX", "es-ES", "tr", "vi"
]

# HeyGen AI
HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY", "")
HEYGEN_BASE_URL = os.getenv("HEYGEN_BASE_URL", "https://api.heygen.com")
HEYGEN_DEFAULT_AVATAR_ID = os.getenv("HEYGEN_DEFAULT_AVATAR_ID", "")

# App
PUBLIC_URL = os.getenv("PUBLIC_URL", "")

# Video
R2_VIDEO_PREFIX = "video/"

# Assets
R2_ASSET_PREFIX = "assets/"

# Cache
STORIES_CACHE_TTL_SECONDS = 60
