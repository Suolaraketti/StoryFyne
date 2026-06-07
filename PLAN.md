# Plan: Replace Remotion with HyperFrames for Explainer Videos

## Goal
Replace the Remotion-based explainer video renderer in StoryFyne with HyperFrames, while preserving:
1. AI scene generation (Claude → scene JSON)
2. Voice over generation (Gemini TTS per scene)
3. Background music (auto-select + volume ducking)
4. Frontend API contract (same endpoints, same polling)
5. R2 upload and share page delivery

## Architecture

```
┌─────────────────┐     POST /api/process-explainer      ┌─────────────────┐
│  Frontend       │ ───────────────────────────────────► │  Backend        │
│  (unchanged)    │                                      │  (main.py)      │
│                 │ ◄─── {story_id, status:"processing"} │                 │
└─────────────────┘                                      └────────┬────────┘
                                                                   │
                                                                   ▼
                              ┌─────────────────────────────────────────────────┐
                              │  BACKGROUND TASK: _process_explainer()          │
                              │  Step 1: Scene breakdown (Claude) ── UNCHANGED  │
                              │  Step 2: Per-scene audio (Gemini TTS) ── UNCHANGED
                              │  Step 3: Audio analysis (phrase markers) ── UNCHANGED
                              │  Step 4: Music selection ── UNCHANGED           │
                              │  Step 5: Build hyperframes HTML project         │
                              │  Step 6: Render via hyperframes producer API    │
                              │  Step 7: Upload output to R2 ── UNCHANGED       │
                              └─────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. HyperFrames as a Python-subprocess render
The backend will:
- Dynamically generate a hyperframes project directory (HTML + assets)
- Call hyperframes programmatically via `subprocess` (npx hyperframes render)
- Poll the output file for completion

Why not use the JS API directly? The `@hyperframes/producer` package is ESM-only, deeply tied to Node/Bun, and uses Puppeteer + FFmpeg. Calling it as a subprocess from Python is the cleanest integration.

### 2. Scene-to-HTML Mapping
Each scene from Claude becomes a `<div class="clip">` in the hyperframes HTML with:
- `data-start`, `data-duration`, `data-track-index` attributes
- GSAP timeline animations for entrance/exit
- Scene-type-specific visual layout (title, text, stats, etc.)

### 3. Audio Integration
- Narration: `<audio>` elements per scene, positioned at `data-start`
- Background music: Separate `<audio>` element with loop, volume controlled via GSAP

### 4. No Frontend Changes
The frontend calls the same endpoints with the same payloads. Only the backend render path changes.

## Implementation Steps

### Phase 1: Create HyperFrames HTML Builder (NEW FILE)
**File:** `storyfyne-backend/hyperframes_builder.py`

Functions:
- `build_explainer_project(scenes, config) -> project_dir`
  - Creates temp directory with `index.html`, `assets/`
  - Generates HTML with all scenes as clips
  - Adds audio elements for narration + music
  - Adds GSAP timeline with entrance/exit animations
  - Adds CSS design system tokens from brand colors

- `scene_to_html(scene, start_time, duration) -> html_fragment`
  - Maps scene types to HTML layouts:
    - `statement` → centered headline + subtext
    - `evidence` → text with supporting visual
    - `metric` → big number + label
    - `feature` → icon + title + description
    - `cta` → call-to-action button
    - etc.

- `get_gsap_timeline(scenes) -> js_code`
  - Generates GSAP timeline with per-scene animations
  - Fade in/out, slide, scale effects

### Phase 2: Replace Render Submission in Backend
**File:** `storyfyne-backend/main.py`

Changes in `_process_explainer()`:
- Remove: Remotion Lambda / GPU worker submission
- Add: Call `hyperframes_builder.build_explainer_project()`
- Add: Run `npx hyperframes render` via subprocess
- Add: Poll for output file
- Keep: R2 upload, metadata update, progress tracking

New config/env vars:
- `HYPERFRAMES_NODE_PATH` — path to node/bun for running hyperframes
- `HYPERFRAMES_RENDER_QUALITY` — draft/standard/high

### Phase 3: Add HyperFrames to Dependencies
**File:** `storyfyne-backend/Dockerfile` or deployment config

- Install Node.js + Bun in the Python backend container
- Install hyperframes CLI globally or in a shared node_modules

### Phase 4: Test & Validate
- Test scene generation → HTML → render → output
- Verify voice sync, music ducking, brand colors
- Test both 16:9 and 9:16 aspect ratios

## Files to Modify

| File | Change |
|------|--------|
| `storyfyne-backend/main.py` | Replace Remotion render calls with hyperframes subprocess |
| `storyfyne-backend/config.py` | Add hyperframes config vars |
| `storyfyne-backend/hyperframes_builder.py` | NEW: HTML project builder |
| `storyfyne-backend/requirements.txt` | No changes (uses subprocess) |
| `storyfyne-frontend/app/page.tsx` | No changes |
| `storyfyne-remotion/` | Can be removed or kept for reference |

## Rollback Plan
If hyperframes doesn't work out, we can revert by restoring the Remotion render calls in `main.py`. The frontend and scene generation are unchanged.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| HyperFrames requires Node/Bun in Python container | Install Node in Dockerfile, or run hyperframes in separate container |
| HyperFrames render slower than Remotion Lambda | Acceptable for MVP; can optimize later with caching |
| Scene HTML mapping loses visual fidelity | Start with simple layouts, iterate based on output quality |
| Audio sync issues | Use hyperframes `<audio data-start>` attributes; test thoroughly |
| GSAP animations not deterministic | Follow hyperframes determinism rules (no Math.random, etc.) |
