# StoryFyne Engine

Beat scripts in → polished HyperFrames video compositions out, in **9:16 and
16:9 from the same script**. Built so that writing a new video is a small JSON
file (see `AUTHORING.md`) — the craft lives in the engine, not the author.

```
storyfyne_engine/
  anim.py    flicker-safe motion core (set+to only — the renderer seeks frames,
             so GSAP from() tweens flash; rev()/out() make that impossible)
  theme.py   brand tokens + stage CSS (dark stage, grid, orbs, type scale)
  beats.py   the beat library (11 types) — each = HTML + GSAP + CSS + portrait CSS
  core.py    script loader, strict friendly validator, document assembler
  cli.py     build / audio (VO+music premix) / beats (catalog)
```

## Use

From the repo root (no install needed):

```bash
python make_video.py beats                       # catalog
python make_video.py build <project>             # 9:16  -> <project>/index.html
python make_video.py build <project> --landscape # 16:9
python make_video.py audio --vo vo.mp3 --music m.mp3 -o <project>/assets/soundtrack.mp3
```

Then `npx hyperframes lint <project>` and render. Each video project keeps the
shim `build.py` so `python build.py [portrait|landscape]` also works.

## Quality is structural

- **No flicker:** beats can only animate through `rev()` (set hidden at clip
  start, tween to natural at reveal time). `from()` does not exist here.
- **No track collisions:** the engine assigns `data-track-index` per beat.
- **Orientation:** every beat ships portrait CSS; one script → both formats.
- **Validation:** unknown types, missing fields, bad timing, missing assets,
  too-wordy lines — all caught at build with the beat index and a fix hint.

## Existing scripts (working examples)

- `storyfyne-hyperframes-cc/script.json` — 80s VO-driven Command Center video
- `storyfyne-hyperframes-story/script.json` — 20s music-cut roleplay story

## Adding a beat type

Add one function in `beats.py` with the `@beat("kind", css=..., pcss=...,
required=(...))` decorator. Use `rev()`/`out()` for all motion, `kw()` for
kinetic text, keep content center-anchored, and give it portrait CSS.
