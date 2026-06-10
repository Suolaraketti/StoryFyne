# Authoring a StoryFyne video

You do **not** write HTML, CSS, or GSAP. You write a `script.json` — a list of
timed **beats** — and the engine produces a polished HyperFrames composition in
9:16 and 16:9. All craft rules (flicker-safe animation, center-axis layout,
orientation re-flow, track assignment) are enforced by the engine.

## Workflow

```bash
# 1. (once per video) premix the soundtrack: VO on top, music ducked under
python make_video.py audio --vo vo.mp3 --music music.mp3 -o <project>/assets/soundtrack.mp3

# 2. write <project>/script.json   (this file is the whole video)

# 3. build (validates first; errors tell you exactly what to fix)
python make_video.py build <project>              # 9:16
python make_video.py build <project> --landscape  # 16:9

# 4. verify before rendering — ALWAYS
npx hyperframes lint <project>
npx hyperframes snapshot <project> --at <one time per beat> --describe false
#    ...then LOOK at snapshots/contact-sheet.jpg and fix what's ugly.

# 5. render
npx hyperframes render <project> -o out.mp4 -q high --fps 60 --gpu --browser-gpu
```

A project folder needs: `script.json` + `assets/` (gsap.min.js, fonts/, logos/,
shots/, soundtrack.mp3). Copy `assets/` from an existing project to start.

## The story rules (non-negotiable)

1. **Narrative arc, not a feature tour**: World today → the hidden problem →
   the pivot ("what if…") → your solution as payoff → CTA.
2. **≤5 words per kinetic line.** Split long sentences into multiple `line` beats.
3. **Screenshots are PROOF, not the show.** Use 1–2 `grab` beats at the payoff,
   cropped to ONE feature. Custom text/graphics carry the story.
4. **Time beats to the VO** (use the SRT) or to the music's bar grid. Cuts land
   where the audio lands.
5. **Center axis.** The engine centers everything; don't fight it.
6. **End on CTA or a brand line** — the last beat holds (no exit).

## script.json schema

```json
{
  "title": "Name",
  "duration": 80.6,                      // optional; defaults to last end + 0.4
  "soundtrack": "assets/soundtrack.mp3", // optional
  "brand":  { "logo": "assets/logos/dialfyne.png" },
  "theme":  { "primary": "#2a93f5" },    // optional color overrides
  "floats": ["ambient", "background", "phrases"],  // optional, max 6
  "beats":  [ ... ]
}
```

Every beat has `type`, `start`, `end` (seconds). Colors: `"col"` accepts
`primary|red|green|amber|muted` or any `#hex`. `"acc"` colors specific words.

## Beat catalog

### line — kinetic headline (the workhorse)
```json
{ "type": "line", "start": 0.3, "end": 2.5, "t": "We killed that.",
  "acc": "killed", "col": "red", "size": "big" }       // size: big | sm | (default)
```

### typewriter — monospace prompt typing itself
```json
{ "type": "typewriter", "start": 7.9, "end": 9.9, "t": "What if it knew YOUR deals?" }
```

### strike — names struck out in red, one per beat ("show, don't tell" dismissal)
```json
{ "type": "strike", "start": 4.7, "end": 6.6,
  "names": ["Hyperbound", "Mindtickle", "Second Nature"],
  "times": [4.7, 5.3, 6.0] }                            // optional; else auto-stagger
```

### brand — logo reveal + optional subline
```json
{ "type": "brand", "start": 9.9, "end": 11.1, "sub": "Meet Dialfyne." }
```

### cta — logo + optional headline + url pill + optional subline (good closer)
```json
{ "type": "cta", "start": 72.8, "end": 77.3, "headline": "Build yours — free.",
  "acc": "free.", "url": "dialfyne.com/roleplay", "sub": "See if it fits your team." }
```

### grab — REAL screenshot, cropped to one feature, center stage (the proof shot)
```json
{ "type": "grab", "start": 36.5, "end": 41.0,
  "asset": "assets/shots/revenue-command-center.png",
  "img":  [1184, 1296],                 // the PNG's pixel size
  "crop": [0.02, 0.105, 0.96, 0.135],  // x0,y0,w,h as fractions of the image
  "eyebrow": "Pulled from your live pipeline", "title": "Answers in seconds.",
  "cursor": true, "pop": "✓ Synced" }   // optional: cursor click + green pop
```

### metric — number counts up, sparkline draws itself
```json
{ "type": "metric", "start": 13.7, "end": 16.3, "value": 9.0, "suffix": "/10",
  "decimals": 1, "label": "Team avg score", "delta": "+29%",
  "eyebrow": "The outcome", "title": "Reps get sharper." }
```

### born — custom "AI compiled into being" graphic (data lines → node + rings)
```json
{ "type": "born", "start": 16.3, "end": 18.2, "node": "AI",
  "eyebrow": "Built from your reality", "title": "An AI buyer that knows the deal." }
```

### dash — chaos collage of fake app windows (overwhelm, "too many tools")
```json
{ "type": "dash", "start": 7.6, "end": 13.4,
  "items": ["CRM", "Calendar", "Reports", "Phone logs", "Inbox"],   // 3–5
  "cap": "Five dashboards. Every morning.", "acc": "dashboards.", "col": "red" }
```

### ask — chat panel: questions type in, data answers pop back (the AI hero shot)
```json
{ "type": "ask", "start": 28.4, "end": 36.4, "boom": 34.9,
  "name": "Ask Dialfyne", "subtitle": "Connected to Claude & ChatGPT",
  "qas": [
    { "q": "How many leads did we miss?", "n": "12", "sub": "missed · 3 high-value",
      "color": "amber", "ask": 28.5, "answer": 30.7 }
  ] }
```

### pillars — icon cards (row in 16:9, stacked rows in 9:16)
```json
{ "type": "pillars", "start": 58.1, "end": 62.9, "cap": "All of it.",
  "items": [ { "label": "AI voice agents", "icon": "&#9742;" },
             { "label": "Automations",     "icon": "&#9889;" } ] }
```
Icon entities that render reliably: ☎ `&#9742;` ⚡ `&#9889;` ◎ `&#9678;`
● `&#9679;` ✓ `&#10003;`. **Don't use emoji or exotic glyphs** — headless
Chrome may render tofu.

## Checklist before you call it done

- [ ] `build` ran with **zero errors** and you read every warning
- [ ] `npx hyperframes lint` → 0 errors
- [ ] You snapshotted ~1 frame per beat and **looked at them**
- [ ] No line over 5–6 words; cuts land on VO phrases / music bars
- [ ] Screenshots appear only as proof beats; the story is carried by type + graphics
- [ ] Last beat is a CTA/brand hold

## Atmosphere & cinematic additions (v1.1)

### hero — glow statement type (echo-trail entrance, gradient accent words)
The premium "brand sting" typography: words land with a vertical light-trail
that evaporates, glow tightens from bloom to clean. `acc` words get a gradient fill.
```json
{ "type": "hero", "start": 7.6, "end": 12.0, "t": "Work, evolved.",
  "acc": "evolved.", "size": "big" }
```

### sting — the logo moment (spark streak → bloom spike → logo born from light)
```json
{ "type": "sting", "start": 2.6, "end": 7.6,
  "tagline": "The revenue command center" }
```
Optional `wordmark` text under the logo — omit it if your logo image already
contains the wordmark. Use a sting to open or close a video; pair with `hero`.

### chapters — the room slowly changes color as the story turns
```json
"chapters": [ { "at": 0, "tint": "primary" }, { "at": 30, "tint": "#9b7bff" } ]
```

### dust — faint drifting particles for depth
```json
"dust": true
```

### light mode — airy enterprise look (white stage, soft pastel orbs)
```json
"theme": { "mode": "light" }
```
Best with: line, hero, grab, brand, cta, sting. The dark glass beats
(metric, ask, dash) keep their dark cards — readable, but preview first.

## Custom code-drawn assets (v1.2) — zero external files, pure CSS/SVG/GSAP

### orbit — your stack as a constellation around a core ("everything, connected")
```json
{ "type": "orbit", "start": 7.6, "end": 11.6, "node": "AI",
  "eyebrow": "One brain for your stack", "title": "Everything, connected.", "acc": "connected.",
  "items": ["&#9742;","&#9993;","&#9203;","&#9873;","&#9678;"] }   // 3–6 satellite glyphs
```

### stream — sources pipe live data into a target ("your pipeline, flowing")
```json
{ "type": "stream", "start": 11.6, "end": 15.6, "target": "AI",
  "eyebrow": "Live data, in motion", "title": "Your pipeline, flowing.", "acc": "flowing.",
  "sources": ["CRM","Calls","Calendar","Email"] }                 // 2–5
```

### wave — reactive voice waveform (for the voice-agent product)
```json
{ "type": "wave", "start": 15.6, "end": 19.4, "bars": 38,
  "eyebrow": "AI voice agents", "title": "It answers every call.", "acc": "every" }
```

### isogrid — perspective floor+ceiling energy grid behind a centered title
```json
{ "type": "isogrid", "start": 4.6, "end": 7.6, "t": "Built for revenue teams.", "acc": "revenue" }
```

Reference reel using all of them: `storyfyne-hyperframes-reel/script.json`.

## Flagship / cinematic (v1.3)

### logoreveal — the brand mark, animated. The premium opener/closer.
Reads `brand.logo`. Works two ways automatically:

- **PNG** (default `assets/logos/dialfyne.png`): 3D turn-in → left→right build-on
  wipe → light sweep → bloom. One clean reveal of the whole lockup.
- **SVG** (`brand.logo` ends in `.svg`): the SVG is **inlined** (resolution-
  independent), and if it carries the piece ids below, each one animates on its
  own — the dot pops, the tube grows in, the **bars fire out one at a time**,
  then the wordmark wipes on. With no ids, the whole SVG does the build-on wipe.

```json
{ "type": "logoreveal", "start": 0.3, "end": 5.0,
  "tagline": "The revenue command center" }
```
3D turn-in → dot pop → tube → bars fire (staggered) → sweep → bloom → wordmark wipe.

**To unlock per-piece animation**, give the SVG these ids (any subset works):
`#mark-dot`, `#mark-tube`, `#bar-1`, `#bar-2`, `#bar-3`, `#wordmark`. Drop your
SVG in `brand-source/` and point `brand.logo` at it. See
`brand-source/dialfyne-mark-example.svg` for the exact structure.

### flythrough — real product screenshots suspended in 3D space, parallax drift
```json
{ "type": "flythrough", "start": 8.6, "end": 13.0,
  "eyebrow": "One platform", "title": "Your whole revenue stack.", "acc": "stack.",
  "cards": ["assets/shots/revenue-command-center.png", "assets/shots/connected-apps.png",
            "assets/shots/metrics-row.png", "assets/shots/roleplay-kit-card.png"] }   // 3–6
```
Needs a real GPU for smooth 3D — render with `--browser-gpu`.

### sweep — light-bar wipe transition at every beat boundary (stage option)
```json
"sweep": true
```
Pairs well with `chapters` + `dust` for a cinematic brand film.

Flagship reference: `storyfyne-hyperframes-film/script.json` (logoreveal → flythrough
→ stream → wave → metric → hero → cta; chapters + dust + sweep).
