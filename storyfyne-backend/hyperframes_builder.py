"""
HyperFrames HTML project builder for StoryFyne explainer videos.

Generates a complete HyperFrames project directory with:
- index.html: Main composition with all scenes as clips
- assets/: Audio files (narration + background music)
- GSAP timeline animations for each scene
- Design system tokens from brand colors
"""

import os
import shutil
import json
from typing import List, Dict, Any
from pathlib import Path


def build_explainer_project(
    scenes: List[Dict[str, Any]],
    output_dir: str,
    config: Dict[str, Any],
) -> str:
    """
    Build a complete HyperFrames project directory.

    Args:
        scenes: List of scene dicts with audioUrl, durationInFrames, type, etc.
        output_dir: Directory to create the project in
        config: Brand/config dict with colors, aspect_ratio, music_url, etc.

    Returns:
        Path to the project directory
    """
    project_dir = Path(output_dir)
    project_dir.mkdir(parents=True, exist_ok=True)
    assets_dir = project_dir / "assets"
    assets_dir.mkdir(exist_ok=True)

    aspect_ratio = config.get("aspect_ratio", "16:9")
    width, height = (1920, 1080) if aspect_ratio == "16:9" else (1080, 1920)
    resolution_attr = "landscape" if aspect_ratio == "16:9" else "portrait"
    fps = config.get("fps", 30)

    # Download/copy audio assets locally
    scene_audios = _prepare_audio_assets(scenes, assets_dir)

    # Build HTML
    html = _build_html(
        scenes=scene_audios,
        width=width,
        height=height,
        fps=fps,
        config=config,
    )

    (project_dir / "index.html").write_text(html, encoding="utf-8")

    return str(project_dir)


def _prepare_audio_assets(scenes: List[Dict], assets_dir: Path) -> List[Dict]:
    """Download remote audio URLs to local assets dir, return updated scenes."""
    import httpx

    updated = []
    for i, scene in enumerate(scenes):
        s = dict(scene)
        audio_url = s.get("audioUrl", "")
        if audio_url and audio_url.startswith("http"):
            ext = ".mp3"
            local_name = f"scene_{i}{ext}"
            local_path = assets_dir / local_name
            try:
                r = httpx.get(audio_url, timeout=30, follow_redirects=True)
                if r.status_code == 200:
                    local_path.write_bytes(r.content)
                    s["audioUrl"] = f"assets/{local_name}"
                else:
                    s["audioUrl"] = ""
            except Exception:
                s["audioUrl"] = ""
        updated.append(s)
    return updated


def _build_html(
    scenes: List[Dict],
    width: int,
    height: int,
    fps: int,
    config: Dict[str, Any],
) -> str:
    """Generate the main index.html composition."""

    primary = config.get("primary_color", "#10a37f")
    secondary = config.get("secondary_color", "#19c59f")
    bg = config.get("bg_color", "#050505")
    text = config.get("text_color", "#ffffff")
    accent = config.get("accent_color", "#10a37f")
    logo_url = config.get("logo_url", "")
    brand_name = config.get("brand_name", "")
    music_url = config.get("music_url", "")
    music_volume = config.get("music_volume", 0.22)
    font_family = config.get("font_family", "Inter, Arial, sans-serif")

    # Calculate scene timings
    total_duration = 0.0
    timed_scenes = []
    for scene in scenes:
        duration_frames = scene.get("durationInFrames", 90)
        duration_sec = duration_frames / fps
        timed_scenes.append({
            **scene,
            "start": total_duration,
            "duration": duration_sec,
        })
        total_duration += duration_sec

    # Add 1s padding at end
    total_duration += 1.0

    # Build clip HTML for each scene
    colors = {"primary": primary, "accent": accent, "secondary": secondary}
    clips_html = []
    for i, scene in enumerate(timed_scenes):
        clip = _build_scene_clip(scene, i, width, height, colors)
        clips_html.append(clip)

    # Build audio elements
    audio_elements = []
    for i, scene in enumerate(timed_scenes):
        audio_url = scene.get("audioUrl", "")
        if audio_url:
            start = scene["start"]
            audio_elements.append(
                f'    <audio src="{audio_url}" data-start="{start:.3f}" data-duration="{scene["duration"]:.3f}" data-track-index="{10 + i}"></audio>'
            )

    # Background music
    if music_url:
        audio_elements.append(
            f'    <audio src="{music_url}" data-start="0" data-duration="{total_duration:.3f}" data-track-index="1" loop></audio>'
        )

    # Build GSAP timeline
    has_music = bool(config.get("music_url"))
    timeline_js = _build_gsap_timeline(timed_scenes, music_volume, has_music)

    # Logo overlay HTML
    logo_html = ""
    if logo_url:
        logo_html = f'''
    <div class="clip" data-start="0" data-duration="{total_duration:.3f}" data-track-index="100" style="position:absolute;top:24px;left:24px;z-index:1000">
      <img src="{logo_url}" style="height:40px;object-fit:contain" />
    </div>'''

    clips_str = "\n".join(clips_html)
    audio_str = "\n".join(audio_elements)

    resolution_attr = "landscape" if width > height else "portrait"

    html = f'''<!doctype html>
<html lang="en" data-composition-duration="{total_duration:.1f}" data-resolution="{resolution_attr}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={width}, height={height}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{
        margin: 0;
        width: {width}px;
        height: {height}px;
        overflow: hidden;
        background: {bg};
        font-family: {font_family};
      }}
      :root {{
        --ds-canvas: {bg};
        --ds-foreground: {text};
        --ds-accent: {accent};
        --ds-primary: {primary};
        --ds-secondary: {secondary};
        --ds-muted: #6b7280;
        --ds-display: {font_family};
        --ds-body: {font_family};
      }}
      .clip {{
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }}
      .scene-bg {{
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
      }}
      .scene-bg::before {{
        content: '';
        position: absolute;
        inset: -50%;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.03) 0%, transparent 50%),
                    radial-gradient(circle at 70% 70%, rgba(255,255,255,0.02) 0%, transparent 40%);
        animation: bgDrift 20s ease-in-out infinite;
      }}
      @keyframes bgDrift {{
        0%, 100% {{ transform: translate(0, 0) rotate(0deg); }}
        33% {{ transform: translate(2%, 1%) rotate(1deg); }}
        66% {{ transform: translate(-1%, 2%) rotate(-1deg); }}
      }}
      .glow-orb {{
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.15;
        z-index: 0;
        pointer-events: none;
      }}
      .scene-content {{
        position: relative;
        z-index: 1;
        width: 100%;
        padding: 60px 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }}
      .headline {{
        font-size: {56 if width > height else 72}px;
        font-weight: 700;
        color: {text};
        line-height: 1.15;
        margin-bottom: 20px;
        max-width: 85%;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }}
      .subheadline {{
        font-size: {28 if width > height else 36}px;
        font-weight: 400;
        color: {secondary};
        line-height: 1.4;
        max-width: 80%;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }}
      .eyebrow {{
        font-size: 16px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: {accent};
        margin-bottom: 12px;
      }}
      .metric-value {{
        font-size: {80 if width > height else 100}px;
        font-weight: 800;
        color: {primary};
        line-height: 1;
      }}
      .metric-label {{
        font-size: 22px;
        color: {text};
        margin-top: 10px;
      }}
      .feature-title {{
        font-size: 36px;
        font-weight: 700;
        color: {text};
        margin-bottom: 10px;
        max-width: 85%;
      }}
      .feature-desc {{
        font-size: 20px;
        color: {secondary};
        max-width: 75%;
        line-height: 1.5;
      }}
      .cta-text {{
        font-size: {48 if width > height else 56}px;
        font-weight: 700;
        color: {text};
        max-width: 85%;
        line-height: 1.15;
      }}
      .cta-sub {{
        font-size: 22px;
        color: {secondary};
        margin-top: 14px;
        max-width: 75%;
      }}
      .stats-grid {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 32px;
        width: 100%;
        max-width: 1000px;
      }}
      .stat-item {{
        text-align: center;
      }}
      .stat-value {{
        font-size: 48px;
        font-weight: 700;
        color: {primary};
      }}
      .stat-label {{
        font-size: 18px;
        color: {text};
        margin-top: 6px;
      }}
      .quote-text {{
        font-size: 28px;
        font-style: italic;
        color: {text};
        max-width: 75%;
        line-height: 1.5;
      }}
      .quote-attrib {{
        font-size: 18px;
        color: {secondary};
        margin-top: 16px;
      }}
      .step-list {{
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        max-width: 800px;
      }}
      .step-item {{
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 20px;
        color: {text};
        max-width: 90%;
      }}
      .step-num {{
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: {primary};
        color: {bg};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
        flex-shrink: 0;
      }}
      .before-after {{
        display: flex;
        gap: 40px;
        width: 100%;
        max-width: 1000px;
      }}
      .before-after > div {{
        flex: 1;
        padding: 32px;
        border-radius: 12px;
      }}
      .before-box {{ background: rgba(255,255,255,0.05); }}
      .after-box {{ background: rgba({ _hex_to_rgb(primary) }, 0.15); }}
      .problem-text {{
        font-size: 36px;
        font-weight: 700;
        color: #ef4444;
        line-height: 1.2;
        max-width: 90%;
      }}
      .solution-text {{
        font-size: 36px;
        font-weight: 700;
        color: {primary};
        line-height: 1.2;
        max-width: 90%;
      }}
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="main" data-start="0" data-duration="{total_duration:.1f}" data-width="{width}" data-height="{height}">
{clips_str}
{logo_html}
    </div>

{audio_str}

    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
{timeline_js}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>'''
    return html


def _hex_to_rgb(hex_color: str) -> str:
    """Convert #RRGGBB to 'R, G, B' for rgba()."""
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r = int(h[0:2], 16)
    g = int(h[2:4], 16)
    b = int(h[4:6], 16)
    return f"{r}, {g}, {b}"


def _build_scene_clip(scene: Dict, index: int, width: int, height: int, colors: Dict[str, str]) -> str:
    """Build a single scene clip HTML."""
    start = scene["start"]
    duration = scene["duration"]
    scene_type = scene.get("type", "statement")
    track = index + 1
    primary = colors.get("primary", "#10a37f")
    accent = colors.get("accent", "#10a37f")
    secondary = colors.get("secondary", "#19c59f")

    # Background gradient
    bg_gradient = _get_background_gradient(scene_type, scene.get("background", ""))

    content = _build_scene_content(scene, scene_type)

    # Add decorative glow orbs for visual interest
    orb_colors = [primary, accent, secondary]
    orbs_html = ""
    for oi, oc in enumerate(orb_colors[:2]):
        ox = 20 + oi * 45
        oy = 15 + (oi % 2) * 50
        ow = 200 + oi * 100
        oh = 200 + oi * 80
        orbs_html += f'        <div class="glow-orb" style="left:{ox}%;top:{oy}%;width:{ow}px;height:{oh}px;background:{oc};"></div>\n'

    return f'''      <!-- Scene {index + 1}: {scene_type} -->
      <div id="scene-{index}" class="clip" data-start="{start:.3f}" data-duration="{duration:.3f}" data-track-index="{track}">
        <div class="scene-bg" style="background: {bg_gradient}"></div>
{orbs_html}        <div class="scene-content">
{content}
        </div>
      </div>'''


def _get_background_gradient(scene_type: str, override: str) -> str:
    """Get a background gradient for a scene type."""
    if override:
        return override
    gradients = {
        "statement": "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)",
        "title": "radial-gradient(ellipse at center, rgba(16,163,127,0.1) 0%, transparent 70%)",
        "problem": "radial-gradient(ellipse at center, rgba(239,68,68,0.06) 0%, transparent 70%)",
        "solution": "radial-gradient(ellipse at center, rgba(16,163,127,0.1) 0%, transparent 70%)",
        "feature": "radial-gradient(ellipse at center, rgba(25,197,159,0.08) 0%, transparent 70%)",
        "benefit": "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)",
        "evidence": "radial-gradient(ellipse at center, rgba(107,114,128,0.06) 0%, transparent 70%)",
        "metric": "radial-gradient(ellipse at center, rgba(16,163,127,0.12) 0%, transparent 70%)",
        "stats": "radial-gradient(ellipse at center, rgba(25,197,159,0.1) 0%, transparent 70%)",
        "process": "radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)",
        "cta": "radial-gradient(ellipse at center, rgba(16,163,127,0.15) 0%, transparent 70%)",
        "socialProof": "radial-gradient(ellipse at center, rgba(107,114,128,0.06) 0%, transparent 70%)",
        "comparison": "radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)",
        "lockup": "radial-gradient(ellipse at center, rgba(16,163,127,0.1) 0%, transparent 70%)",
        "flow": "radial-gradient(ellipse at center, rgba(25,197,159,0.06) 0%, transparent 70%)",
    }
    return gradients.get(scene_type, "transparent")


def _build_scene_content(scene: Dict, scene_type: str) -> str:
    """Build the inner HTML content for a scene based on its type."""
    headline = scene.get("headline", scene.get("text", ""))[:120]
    subheadline = scene.get("subheadline", "")
    eyebrow = scene.get("eyebrow", "")
    metrics = scene.get("metrics", [])
    before = scene.get("before", "")
    after = scene.get("after", "")
    steps = scene.get("steps", [])
    features = scene.get("features", [])
    quote = scene.get("quote", "")
    attribution = scene.get("attribution", "")
    cta = scene.get("cta", "")

    lines = []

    if eyebrow:
        lines.append(f'          <div class="eyebrow">{_escape_html(eyebrow)}</div>')

    if scene_type == "metric" and metrics:
        for m in metrics[:3]:
            val = m.get("value", "")
            lbl = m.get("label", "")
            lines.append(f'          <div class="metric-value">{_escape_html(val)}</div>')
            lines.append(f'          <div class="metric-label">{_escape_html(lbl)}</div>')
    elif scene_type == "stats" and metrics:
        lines.append('          <div class="stats-grid">')
        for m in metrics[:4]:
            val = m.get("value", "")
            lbl = m.get("label", "")
            lines.append(f'            <div class="stat-item"><div class="stat-value">{_escape_html(val)}</div><div class="stat-label">{_escape_html(lbl)}</div></div>')
        lines.append('          </div>')
    elif scene_type in ("beforeAfter", "comparison") and (before or after):
        lines.append('          <div class="before-after">')
        if before:
            lines.append(f'            <div class="before-box"><div style="font-size:18px;color:#6b7280;margin-bottom:8px">Before</div><div class="problem-text">{_escape_html(before)}</div></div>')
        if after:
            lines.append(f'            <div class="after-box"><div style="font-size:18px;color:#6b7280;margin-bottom:8px">After</div><div class="solution-text">{_escape_html(after)}</div></div>')
        lines.append('          </div>')
    elif scene_type == "process" and steps:
        lines.append('          <div class="step-list">')
        for i, step in enumerate(steps[:5]):
            lines.append(f'            <div class="step-item"><div class="step-num">{i+1}</div><span>{_escape_html(step)}</span></div>')
        lines.append('          </div>')
    elif scene_type == "feature" and features:
        for f in features[:2]:
            ft = f.get("title", "")
            fd = f.get("description", "")
            lines.append(f'          <div class="feature-title">{_escape_html(ft)}</div>')
            if fd:
                lines.append(f'          <div class="feature-desc">{_escape_html(fd)}</div>')
    elif scene_type == "socialProof" and quote:
        lines.append(f'          <div class="quote-text">&ldquo;{_escape_html(quote)}&rdquo;</div>')
        if attribution:
            lines.append(f'          <div class="quote-attrib">&mdash; {_escape_html(attribution)}</div>')
    elif scene_type == "cta":
        lines.append(f'          <div class="cta-text">{_escape_html(headline or cta)}</div>')
        if subheadline:
            lines.append(f'          <div class="cta-sub">{_escape_html(subheadline)}</div>')
    else:
        # Default: headline + subheadline
        if headline:
            lines.append(f'          <div class="headline">{_escape_html(headline)}</div>')
        if subheadline:
            lines.append(f'          <div class="subheadline">{_escape_html(subheadline)}</div>')

    return "\n".join(lines)


def _build_gsap_timeline(scenes: List[Dict], music_volume: float, has_music: bool = False) -> str:
    """Build rich GSAP timeline with dynamic transitions per scene type."""
    lines = []
    transitions = ["slide", "zoom", "flip", "blur", "split"]

    for i, scene in enumerate(scenes):
        start = scene["start"]
        duration = scene["duration"]
        sid = f"scene-{i}"
        stype = scene.get("type", "statement")
        trans = transitions[i % len(transitions)]

        # ── Background entrance ──
        lines.append(f"      // Scene {i+1} ({stype}) - {trans} transition")
        lines.append(f"      tl.fromTo('#{sid} .scene-bg', {{ opacity: 0, scale: 1.1 }}, {{ opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }}, {start:.2f});")

        # ── Content entrance based on scene type ──
        if stype == "title":
            lines.append(f"      tl.from('#{sid} .eyebrow', {{ opacity: 0, y: -30, letterSpacing: '0.5em', duration: 0.6, ease: 'power3.out' }}, {start + 0.1:.2f});")
            lines.append(f"      tl.from('#{sid} .headline', {{ opacity: 0, y: 60, scale: 0.9, duration: 0.9, ease: 'back.out(1.2)' }}, {start + 0.3:.2f});")
            lines.append(f"      tl.from('#{sid} .subheadline', {{ opacity: 0, y: 30, duration: 0.7, ease: 'power2.out' }}, {start + 0.6:.2f});")
        elif stype == "problem":
            lines.append(f"      tl.from('#{sid} .headline', {{ opacity: 0, x: -80, duration: 0.7, ease: 'power3.out' }}, {start + 0.1:.2f});")
            lines.append(f"      tl.from('#{sid} .subheadline', {{ opacity: 0, x: -40, duration: 0.6, ease: 'power2.out' }}, {start + 0.35:.2f});")
            lines.append(f"      tl.to('#{sid} .headline', {{ x: '+=5', y: '+=3', duration: 0.08, repeat: 5, yoyo: true, ease: 'none' }}, {start + 0.8:.2f});")
        elif stype == "solution":
            lines.append(f"      tl.from('#{sid} .headline', {{ opacity: 0, scale: 0.5, rotation: -3, duration: 0.8, ease: 'back.out(1.5)' }}, {start + 0.1:.2f});")
            lines.append(f"      tl.from('#{sid} .subheadline', {{ opacity: 0, y: 40, duration: 0.6, ease: 'power2.out' }}, {start + 0.45:.2f});")
            lines.append(f"      tl.fromTo('#{sid} .scene-bg', {{ backgroundPosition: '0% 50%' }}, {{ backgroundPosition: '100% 50%', duration: {duration * 0.6:.1f}, ease: 'none' }}, {start + 0.2:.2f});")
        elif stype == "metric":
            child_sel = f"#{sid} .metric-value, #{sid} .stat-value"
            lines.append(f"      tl.from('{child_sel}', {{ opacity: 0, scale: 0, duration: 0.7, stagger: 0.15, ease: 'back.out(2)' }}, {start + 0.1:.2f});")
            lines.append(f"      tl.from('#{sid} .metric-label, #{sid} .stat-label', {{ opacity: 0, y: 20, duration: 0.5, stagger: 0.1, ease: 'power2.out' }}, {start + 0.4:.2f});")
        elif stype == "stats":
            lines.append(f"      tl.from('#{sid} .stat-item', {{ opacity: 0, y: 50, scale: 0.9, duration: 0.6, stagger: 0.12, ease: 'power3.out' }}, {start + 0.1:.2f});")
        elif stype == "cta":
            lines.append(f"      tl.from('#{sid} .cta-text', {{ opacity: 0, y: 50, scale: 0.8, duration: 0.8, ease: 'back.out(1.4)' }}, {start + 0.1:.2f});")
            lines.append(f"      tl.from('#{sid} .cta-sub', {{ opacity: 0, y: 30, duration: 0.6, ease: 'power2.out' }}, {start + 0.45:.2f});")
            lines.append(f"      tl.to('#{sid} .cta-text', {{ scale: 1.03, duration: 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut' }}, {start + 1.0:.2f});")
        elif stype == "feature":
            lines.append(f"      tl.from('#{sid} .feature-title', {{ opacity: 0, x: -50, duration: 0.6, ease: 'power3.out' }}, {start + 0.1:.2f});")
            lines.append(f"      tl.from('#{sid} .feature-desc', {{ opacity: 0, x: -30, duration: 0.5, ease: 'power2.out' }}, {start + 0.3:.2f});")
        elif stype == "socialProof":
            lines.append(f"      tl.from('#{sid} .quote-text', {{ opacity: 0, y: 30, filter: 'blur(8px)', duration: 0.8, ease: 'power2.out' }}, {start + 0.1:.2f});")
            lines.append(f"      tl.from('#{sid} .quote-attrib', {{ opacity: 0, x: 30, duration: 0.5, ease: 'power2.out' }}, {start + 0.5:.2f});")
        elif stype == "process":
            lines.append(f"      tl.from('#{sid} .step-item', {{ opacity: 0, x: -40, duration: 0.5, stagger: 0.15, ease: 'power3.out' }}, {start + 0.1:.2f});")
        elif stype in ("beforeAfter", "comparison"):
            lines.append(f"      tl.from('#{sid} .before-box', {{ opacity: 0, x: -60, duration: 0.6, ease: 'power3.out' }}, {start + 0.1:.2f});")
            lines.append(f"      tl.from('#{sid} .after-box', {{ opacity: 0, x: 60, duration: 0.6, ease: 'power3.out' }}, {start + 0.25:.2f});")
        else:
            # Default: staggered reveal
            lines.append(f"      tl.from('#{sid} .scene-content > *', {{ opacity: 0, y: 35, duration: 0.55, stagger: 0.12, ease: 'power3.out' }}, {start + 0.1:.2f});")

        # ── Transition between scenes ──
        exit_start = start + duration - 0.5
        if exit_start > start + 0.8:
            if trans == "slide":
                lines.append(f"      tl.to('#{sid}', {{ x: -100, opacity: 0, duration: 0.45, ease: 'power3.in' }}, {exit_start:.2f});")
                if i + 1 < len(scenes):
                    nsid = f"scene-{i+1}"
                    lines.append(f"      tl.fromTo('#{nsid}', {{ x: 100, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }}, {exit_start + 0.15:.2f});")
            elif trans == "zoom":
                lines.append(f"      tl.to('#{sid}', {{ scale: 1.15, opacity: 0, duration: 0.5, ease: 'power2.in' }}, {exit_start:.2f});")
                if i + 1 < len(scenes):
                    nsid = f"scene-{i+1}"
                    lines.append(f"      tl.fromTo('#{nsid}', {{ scale: 0.85, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }}, {exit_start + 0.15:.2f});")
            elif trans == "flip":
                lines.append(f"      tl.to('#{sid}', {{ rotationY: 90, opacity: 0, duration: 0.45, ease: 'power2.in' }}, {exit_start:.2f});")
                if i + 1 < len(scenes):
                    nsid = f"scene-{i+1}"
                    lines.append(f"      tl.fromTo('#{nsid}', {{ rotationY: -90, opacity: 0 }}, {{ rotationY: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }}, {exit_start + 0.15:.2f});")
            elif trans == "blur":
                lines.append(f"      tl.to('#{sid}', {{ filter: 'blur(12px)', opacity: 0, duration: 0.5, ease: 'power2.in' }}, {exit_start:.2f});")
                if i + 1 < len(scenes):
                    nsid = f"scene-{i+1}"
                    lines.append(f"      tl.fromTo('#{nsid}', {{ filter: 'blur(12px)', opacity: 0 }}, {{ filter: 'blur(0px)', opacity: 1, duration: 0.5, ease: 'power2.out' }}, {exit_start + 0.15:.2f});")
            elif trans == "split":
                lines.append(f"      tl.to('#{sid} .scene-content > *:nth-child(odd)', {{ x: -80, opacity: 0, duration: 0.4, ease: 'power2.in' }}, {exit_start:.2f});")
                lines.append(f"      tl.to('#{sid} .scene-content > *:nth-child(even)', {{ x: 80, opacity: 0, duration: 0.4, ease: 'power2.in' }}, {exit_start:.2f});")

    # ── Ambient motion (subtle background pulse on all scenes) ──
    for i, scene in enumerate(scenes):
        sid = f"scene-{i}"
        start = scene["start"]
        duration = scene["duration"]
        lines.append(f"      tl.fromTo('#{sid} .scene-bg', {{ scale: 1 }}, {{ scale: 1.03, duration: {duration * 0.5:.1f}, ease: 'sine.inOut', yoyo: true, repeat: 1 }}, {start + 0.2:.2f});")

    if has_music and music_volume > 0:
        total_dur = sum(s['duration'] for s in scenes)
        lines.append(f"      // Music volume fade in/out")
        lines.append(f"      const musicEl = document.querySelector('audio[loop]');")
        lines.append(f"      if (musicEl) {{")
        lines.append(f"        tl.fromTo(musicEl, {{ volume: 0 }}, {{ volume: {music_volume}, duration: 1.5 }}, 0);")
        lines.append(f"        tl.to(musicEl, {{ volume: 0, duration: 1.5 }}, {max(0, total_dur - 1.5):.2f});")
        lines.append(f"      }}")

    return "\n".join(lines)


def _escape_html(text: str) -> str:
    """Escape HTML special characters."""
    if not text:
        return ""
    return (text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
