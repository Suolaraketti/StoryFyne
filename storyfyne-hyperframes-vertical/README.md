# Dialfyne roleplay explainer — 9:16 (vertical)

The **portrait / 9:16** cut of the explainer for Reels, TikTok, and Shorts.
Same content, scenes, captions, and audio as the 16:9 version — re-laid-out for a
1080×1920 frame (split panels stack vertically, chip/objection rows become columns,
before/after stacks with a downward arrow, captions sit in the lower-safe zone).

Self-contained and identical in spirit to `../storyfyne-hyperframes`. `build.py` is the
same orientation-aware generator; here it's run in portrait mode.

## Render (on a machine with FFmpeg + Chrome; GPU recommended)

```bash
npx hyperframes render . -o final-vertical.mp4 -q high --fps 30 --gpu --browser-gpu
```

Output: `final-vertical.mp4` (1080×1920, ~72s, narration + ducked music baked in).

## Regenerate the composition

```bash
python build.py portrait      # writes a 1080x1920 index.html
# (python build.py            -> would write a 1920x1080 landscape index.html)
npx hyperframes lint .
```
