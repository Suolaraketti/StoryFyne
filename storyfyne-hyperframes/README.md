# Dialfyne — "Why Dialfyne for Roleplay" explainer

A polished SaaS explainer video built with **[HyperFrames](https://hyperframes.heygen.com)**
(HTML + GSAP compositions rendered to MP4 via headless Chrome + FFmpeg).

`build.py` generates a single self-contained `index.html` composition from the source
voiceover + SRT. 14 scenes are locked to the SRT timing so the animated captions and
on-screen UI stay in sync with the narration.

## What's in the video
- Hero problem statement → competitor call-out (Hyperbound, Mindtickle, Second Nature)
- The "scripted objection" problem, then the Dialfyne pivot
- Integrations wall (Salesforce / Gong / HubSpot) feeding Dialfyne
- AI-buyer persona card, the "objections that killed your last 10 deals" cards
- Made-up-persona → real-buyer comparison, a live roleplay call mock with waveform
- Outcome counters, `$60 / seat / month` pricing, and the `dialfyne.com/roleplay` CTA
- Karaoke-style animated subtitles across the whole runtime

## Assets (`assets/`)
- `narration.mp3` — supplied voiceover
- `soundtrack.mp3` — narration pre-mixed with the supplied background music (ducked, faded)
- `gsap.min.js` — vendored locally (the network policy here blocks the jsdelivr CDN HyperFrames ships with)
- `fonts/inter-*.woff2` — self-hosted Inter
- `logos/dialfyne.png` — brand logo (competitor + integration marks are inlined SVG in the HTML)

## Build & render (offline)

```bash
python3 build.py                      # regenerate index.html
npx hyperframes lint .                # validate

# This sandbox has no system Chrome/FFmpeg on PATH, so point at the bundled ones:
export PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
export PATH="/usr/local/bin:$PATH"    # static ffmpeg/ffprobe
npx hyperframes render . -o renders/final.mp4 -q high --fps 30 --no-browser-gpu
```

To regenerate `soundtrack.mp3` from the raw inputs:

```bash
ffmpeg -i assets/narration.mp3 -stream_loop -1 -i <music.mp3> \
  -filter_complex "[1:a]volume=0.17,afade=t=in:st=0:d=1.5,afade=t=out:st=69.8:d=2[m];\
[0:a][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.96[a]" \
  -map "[a]" -ar 44100 -ac 2 assets/soundtrack.mp3
```
