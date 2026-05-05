import os
from typing import Dict, List
from dotenv import load_dotenv

load_dotenv()

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
XAI_API_KEY = os.getenv("XAI_API_KEY", "")

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
XAI_TTS_URL = "https://api.x.ai/v1/tts"
TTS_MAX_CHARS = 15000
TTS_COST_PER_MILLION_CHARS = 4.20

# Audio Assembly
SILENCE_BETWEEN_SPEAKERS_MS = 300
SILENCE_BETWEEN_CHUNKS_MS = 150
SILENCE_END_MS = 1000

# Voice Assignments
VOICE_ASSIGNMENTS: Dict[str, str] = {
    "NARRATOR": "eve",
    "SPEAKER_A": "ara",
    "SPEAKER_B": "rex",
    "SPEAKER_C": "leo",
    "SPEAKER_D": "sal",
}

VOICE_CYCLE: List[str] = ["eve", "ara", "rex", "leo", "sal"]

# Claude
CLAUDE_MODEL = "claude-haiku-4-5-20251001"
CLAUDE_MAX_TOKENS = 4096

# R2 Paths
R2_AUDIO_PREFIX = "audio/"
R2_INDEX_PREFIX = "index/"
MASTER_INDEX_KEY = f"{R2_INDEX_PREFIX}stories.json"

# Supported xAI TTS voices
VOICES = ["eve", "ara", "rex", "sal", "leo"]

# Supported languages
LANGUAGES = [
    "auto", "en", "ar-EG", "ar-SA", "ar-AE", "bn", "zh", "fr", "de", "hi",
    "id", "it", "ja", "ko", "pt-BR", "pt-PT", "ru", "es-MX", "es-ES", "tr", "vi"
]

# Cache
STORIES_CACHE_TTL_SECONDS = 60
