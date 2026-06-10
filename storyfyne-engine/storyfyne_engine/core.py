"""Script loader, validator, and HTML assembler.

A video = script.json + assets/. The engine owns all HTML/GSAP/CSS so that
quality (flicker-safe motion, center axis, track assignment, orientation) is
structural. Validation is strict and friendly: every problem is reported with
the beat index and a fix hint, so low-context authors fail fast and clearly.
"""
import json
import os

from . import beats as beats_mod
from .anim import esc
from .theme import (DEFAULT_THEME, LIGHT_OVERRIDES, LIGHT_CSS, fontface_css,
                    resolve_color, BASE_CSS, BASE_PORTRAIT_CSS)

_STAGE_EXTRA_CSS = r"""
.chap{position:absolute;inset:0;pointer-events:none;opacity:0}
.sweepbar{position:absolute;top:-20%;left:0;width:34%;height:140%;pointer-events:none;opacity:0;mix-blend-mode:screen;
  transform:translateX(-160%) skewX(-14deg);
  background:linear-gradient(90deg,transparent,rgba(150,190,255,.0) 20%,rgba(180,210,255,.55) 50%,rgba(150,190,255,.0) 80%,transparent)}
body.light .sweepbar{mix-blend-mode:multiply;background:linear-gradient(90deg,transparent,rgba(42,147,245,.0) 20%,rgba(42,147,245,.25) 50%,rgba(42,147,245,.0) 80%,transparent)}
.dustlayer{position:absolute;inset:0;pointer-events:none}
.dust{position:absolute;border-radius:50%;background:rgba(255,255,255,.35);filter:blur(1px);animation:dustf linear infinite}
body.light .dust{background:rgba(30,60,110,.25)}
@keyframes dustf{0%{transform:translate(0,0);opacity:0}12%{opacity:.5}88%{opacity:.5}100%{transform:translate(46px,-110px);opacity:0}}
"""

DOC = r"""<!doctype html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=__W__, height=__H__"/>
<title>__TITLE__</title><script src="assets/gsap.min.js"></script><style>__CSS__</style></head>
<body class="__BODYCLASS__">
<div id="main" data-composition-id="main" data-width="__W__" data-height="__H__" data-start="0" data-duration="__DUR__">
__BODY__
<script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});
__GSAP__
window.__timelines['main']=tl;</script></div></body></html>"""


class ScriptError(Exception):
    pass


def load_script(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def validate(script, project_dir):
    errors, warnings = [], []
    bts = script.get("beats")
    if not isinstance(bts, list) or not bts:
        raise ScriptError("script.beats must be a non-empty list")

    dur = script.get("duration") or max(b.get("end", 0) for b in bts) + 0.4
    prev_start = -1.0
    for idx, b in enumerate(bts):
        where = "beat %d (%s)" % (idx, b.get("type", "?"))
        kind = b.get("type")
        if kind not in beats_mod.REGISTRY:
            errors.append("%s: unknown type. Available: %s" % (where, ", ".join(sorted(beats_mod.REGISTRY))))
            continue
        for f in ("start", "end"):
            if not isinstance(b.get(f), (int, float)):
                errors.append("%s: missing/invalid '%s' (seconds, number)" % (where, f))
        if isinstance(b.get("start"), (int, float)) and isinstance(b.get("end"), (int, float)):
            if b["end"] <= b["start"]:
                errors.append("%s: end (%.2f) must be > start (%.2f)" % (where, b["end"], b["start"]))
            if b["end"] > dur + 0.01:
                errors.append("%s: end %.2f exceeds video duration %.2f" % (where, b["end"], dur))
            if b["start"] < prev_start:
                warnings.append("%s: starts before the previous beat — beats should be in order" % where)
            prev_start = max(prev_start, b["start"])
        for f in beats_mod.REGISTRY[kind]["required"]:
            if f not in b:
                errors.append("%s: missing required field '%s'" % (where, f))
        # Quality guidance: kinetic lines should be punchy.
        if kind == "line" and len(str(b.get("t", "")).split()) > 6:
            warnings.append("%s: %d words — kinetic lines read best at <=5 words. Split it."
                            % (where, len(b["t"].split())))
        # Asset existence.
        if kind == "grab" and b.get("asset"):
            if not os.path.exists(os.path.join(project_dir, b["asset"])):
                errors.append("%s: asset not found: %s" % (where, b["asset"]))

    # Project-level assets.
    for rel, why in [("assets/gsap.min.js", "vendored GSAP (CDN is blocked in sandboxes)"),
                     ("assets/fonts/inter-latin-800-normal.woff2", "self-hosted Inter")]:
        if not os.path.exists(os.path.join(project_dir, rel)):
            errors.append("project missing %s (%s)" % (rel, why))
    snd = script.get("soundtrack")
    if snd and not os.path.exists(os.path.join(project_dir, snd)):
        errors.append("soundtrack not found: %s" % snd)
    logo = (script.get("brand") or {}).get("logo", "assets/logos/dialfyne.png")
    if not os.path.exists(os.path.join(project_dir, logo)):
        warnings.append("brand logo not found at %s — brand/cta beats will show a broken image" % logo)

    if errors:
        raise ScriptError("Script has %d error(s):\n  - %s" % (len(errors), "\n  - ".join(errors)))
    return warnings, dur


def assemble(script, project_dir, portrait=True):
    """Build index.html content for the requested orientation."""
    warnings, dur = validate(script, project_dir)
    W, H = (1080, 1920) if portrait else (1920, 1080)
    tover = dict(script.get("theme") or {})
    light = tover.pop("mode", "") == "light"
    theme = dict(DEFAULT_THEME, **(LIGHT_OVERRIDES if light else {}), **tover)
    logo = (script.get("brand") or {}).get("logo", "assets/logos/dialfyne.png")
    ctx = {
        "W": W, "H": H, "PORTRAIT": portrait, "theme": theme, "logo": logo,
        "project_dir": project_dir,
        "color": lambda name: resolve_color(name, theme),
    }

    body, gsap, used = [], [], set()
    # Persistent stage: bg + grid + orbs + optional ambient float words.
    floats = script.get("floats") or []
    pos = [(8, 18), (72, 24), (15, 70), (78, 66), (40, 12), (60, 82)]
    flt = "".join('<span class="flt" style="left:%d%%;top:%d%%;animation-delay:%.1fs">%s</span>'
                  % (pos[i % 6][0], pos[i % 6][1], -i * 1.7, esc(t)) for i, t in enumerate(floats[:6]))
    body.append('<div class="bg clip" data-start="0" data-duration="%.1f" data-track-index="1">'
                '<div class="grid"></div><div class="orb a"></div><div class="orb b"></div>%s</div>'
                % (dur, flt))

    # Chapter hue-drift: full-screen tint layers crossfading at chapter times
    # (the Chamelio trick — the room slowly changes color as the story turns).
    for ci, ch in enumerate(script.get("chapters") or []):
        tint = resolve_color(ch.get("tint"), theme)
        body.append('<div id="chap-%d" class="chap clip" data-start="0" data-duration="%.1f" '
                    'data-track-index="%d" style="background:radial-gradient(ellipse 75%% 60%% at 50%% 42%%,'
                    '%s14,transparent 65%%)"></div>' % (ci, dur, 3 + ci, tint))
        at = float(ch.get("at", 0))
        gsap.append("tl.set('#chap-%d',{opacity:%d},0);" % (ci, 1 if at <= 0.01 else 0))
        if at > 0.01:
            gsap.append("tl.to('#chap-%d',{opacity:1,duration:2.0,ease:'sine.inOut'},%.2f);" % (ci, at))

    # Dust: faint drifting particles for depth ("dust": true)
    if script.get("dust"):
        dots = "".join('<i class="dust" style="left:%d%%;top:%d%%;width:%dpx;height:%dpx;'
                       'animation-duration:%ds;animation-delay:-%ds"></i>'
                       % ((j * 37 + 11) % 97, (j * 53 + 7) % 93, 3 + j % 4, 3 + j % 4,
                          14 + (j * 7) % 12, (j * 5) % 14) for j in range(18))
        body.append('<div class="dustlayer clip" data-start="0" data-duration="%.1f" '
                    'data-track-index="2">%s</div>' % (dur, dots))

    # Light-sweep transitions at beat boundaries ("sweep": true)
    if script.get("sweep"):
        body.append('<div class="sweepbar clip" data-start="0" data-duration="%.1f" data-track-index="95"></div>' % dur)
        for bb in script["beats"][1:]:
            bs = float(bb.get("start", 0))
            gsap.append("tl.set('.sweepbar',{xPercent:-160,opacity:0},%.3f);" % max(0, bs - 0.18))
            gsap.append("tl.to('.sweepbar',{opacity:1,duration:0.12},%.3f);" % (bs - 0.16))
            gsap.append("tl.to('.sweepbar',{xPercent:320,opacity:0,duration:0.42,ease:'power2.inOut'},%.3f);" % (bs - 0.16))

    bts = script["beats"]
    for i, b in enumerate(bts):
        spec = beats_mod.REGISTRY[b["type"]]
        used.add(b["type"])
        html, g = spec["build"](i, b, ctx, last=(i == len(bts) - 1))
        body.append(html)
        gsap += g

    if script.get("soundtrack"):
        body.append('<audio id="snd" preload="none" src="%s" data-start="0" data-duration="%.2f" '
                    'data-track-index="100"></audio>' % (script["soundtrack"], dur))

    css = BASE_CSS + _STAGE_EXTRA_CSS + "".join(beats_mod.REGISTRY[k]["css"] for k in sorted(used))
    if light:
        css += LIGHT_CSS
    if portrait:
        css += BASE_PORTRAIT_CSS + "".join(beats_mod.REGISTRY[k]["pcss"] for k in sorted(used))
    css = css.replace("__FONTFACE__", fontface_css())
    for key, val in [("__BG__", theme["bg"]), ("__PRIMARY__", theme["primary"]),
                     ("__ACCENT__", theme["accent"]), ("__SECONDARY__", theme["secondary"]),
                     ("__RED__", theme["red"]), ("__GREEN__", theme["green"]),
                     ("__AMBER__", theme["amber"]), ("__MUTED__", theme["muted"]),
                     ("__FONT__", theme["font"]), ("__TEXT__", theme["text"]), ("__W__", str(W)), ("__H__", str(H))]:
        css = css.replace(key, val)

    # Beat HTML may carry theme tokens too (kw() emits __PRIMARY__ defaults).
    doc = (DOC.replace("__CSS__", css)
              .replace("__TITLE__", esc(script.get("title", "StoryFyne video")))
              .replace("__BODYCLASS__", ("p " if portrait else "") + ("light" if light else ""))
              .replace("__BODY__", "\n".join(body))
              .replace("__GSAP__", "\n".join(gsap))
              .replace("__DUR__", "%.2f" % dur)
              .replace("__W__", str(W)).replace("__H__", str(H)))
    for key, val in [("__PRIMARY__", theme["primary"]), ("__ACCENT__", theme["accent"]),
                     ("__RED__", theme["red"]), ("__GREEN__", theme["green"]),
                     ("__AMBER__", theme["amber"])]:
        doc = doc.replace(key, val)
    return doc, warnings, dur


def build_project(project_dir, portrait=True, script_name="script.json"):
    spath = os.path.join(project_dir, script_name)
    if not os.path.exists(spath):
        raise ScriptError("no %s in %s" % (script_name, project_dir))
    script = load_script(spath)
    doc, warnings, dur = assemble(script, project_dir, portrait=portrait)
    outp = os.path.join(project_dir, "index.html")
    with open(outp, "w", encoding="utf-8") as f:
        f.write(doc)
    return outp, warnings, dur
