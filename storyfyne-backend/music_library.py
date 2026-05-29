"""Curated background-music library + vibe-matched selection.

Tracks are royalty-free/licensed files you host in R2 (or anywhere public).
Manage the catalog in ONE of two ways:

1. Edit MUSIC_LIBRARY below and set MUSIC_BASE_URL to your R2 music prefix
   (each track's `file` is resolved against it), or give each track a full `url`.
2. Set MUSIC_LIBRARY_JSON to a JSON array of the same shape (no redeploy needed).

Each track:
  {
    "id": "uplift-tech-120",
    "file": "uplift-tech-120.mp3",   # resolved against MUSIC_BASE_URL, OR:
    "url":  "https://.../track.mp3",  # full URL (wins over file)
    "moods": ["clean", "tech", "uplifting"],
    "bpm": 120,
    "energy": "build"                  # calm | steady | build | high
  }

Selection is vibe-matched: it scores tracks by mood overlap, energy, and BPM
closeness to the director's `music` directive, then returns the best match.
If the catalog is empty, selection returns None and the video renders silent —
fully backwards compatible.
"""

import os
import json
import random
import logging

logger = logging.getLogger("storyfyne")

MUSIC_BASE_URL = os.getenv("MUSIC_BASE_URL", "").rstrip("/")

# Seed catalog. Replace `file`/`url` with your hosted tracks. Empty url+no
# MUSIC_BASE_URL → the entry is skipped (so an unconfigured app stays silent).
MUSIC_LIBRARY = [
    {"id": "clean-tech-110", "file": "clean-tech-110.mp3", "moods": ["clean", "minimal", "tech"], "bpm": 110, "energy": "steady"},
    {"id": "uplift-tech-120", "file": "uplift-tech-120.mp3", "moods": ["clean", "tech", "uplifting", "warm"], "bpm": 120, "energy": "build"},
    {"id": "cinematic-90", "file": "cinematic-90.mp3", "moods": ["dramatic", "cold"], "bpm": 90, "energy": "build"},
    {"id": "synthwave-118", "file": "synthwave-118.mp3", "moods": ["cyber", "retro", "dramatic"], "bpm": 118, "energy": "high"},
    {"id": "warm-ambient-92", "file": "warm-ambient-92.mp3", "moods": ["warm", "minimal", "clean"], "bpm": 92, "energy": "calm"},
    {"id": "drive-house-124", "file": "drive-house-124.mp3", "moods": ["clean", "tech", "uplifting"], "bpm": 124, "energy": "high"},
]

_ENERGY_RANK = {"calm": 0, "steady": 1, "build": 2, "high": 3}


def _resolve_url(track: dict) -> str:
    if track.get("url"):
        return track["url"]
    if track.get("file") and MUSIC_BASE_URL:
        return f"{MUSIC_BASE_URL}/{track['file']}"
    return ""


def load_library() -> list[dict]:
    """Catalog from MUSIC_LIBRARY_JSON env override, else the static list.

    Only tracks that resolve to a playable URL are returned.
    """
    raw = os.getenv("MUSIC_LIBRARY_JSON", "")
    catalog = MUSIC_LIBRARY
    if raw.strip():
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                catalog = parsed
        except Exception as e:
            logger.warning(f"MUSIC_LIBRARY_JSON parse failed: {e}")

    resolved = []
    for t in catalog:
        url = _resolve_url(t)
        if not url:
            continue
        resolved.append({
            "id": t.get("id", url.rsplit("/", 1)[-1]),
            "url": url,
            "moods": [m.lower() for m in t.get("moods", [])],
            "bpm": int(t.get("bpm", 0) or 0),
            "energy": (t.get("energy") or "steady").lower(),
        })
    return resolved


def list_music() -> list[dict]:
    """Public catalog for the editor (id, bpm, energy, moods, url)."""
    return load_library()


def get_by_id(track_id: str) -> dict | None:
    for t in load_library():
        if t["id"] == track_id:
            return t
    return None


def select_music(mood: str = "clean", energy: str = "", bpm: int = 0) -> dict | None:
    """Vibe-match a track to the director's directive.

    Returns {"id", "url", "bpm", ...} or None when the catalog is empty.
    """
    catalog = load_library()
    if not catalog:
        return None

    mood = (mood or "clean").lower()
    energy = (energy or "").lower()

    def score(t: dict) -> float:
        s = 0.0
        if mood in t["moods"]:
            s += 5
        # adjacent-mood credit
        s += 1.5 * len({mood} & set(t["moods"]))
        if energy and t["energy"] == energy:
            s += 3
        elif energy and energy in _ENERGY_RANK and t["energy"] in _ENERGY_RANK:
            s += max(0, 2 - abs(_ENERGY_RANK[energy] - _ENERGY_RANK[t["energy"]]))
        if bpm and t["bpm"]:
            s += max(0, 2 - abs(bpm - t["bpm"]) / 12.0)
        return s

    ranked = sorted(catalog, key=score, reverse=True)
    best = score(ranked[0])
    # Randomize among the top-scoring tracks so repeated renders vary.
    top = [t for t in ranked if score(t) >= best - 0.5]
    return random.choice(top) if top else ranked[0]
