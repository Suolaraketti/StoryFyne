"""Design tokens + base stage CSS.

One place for the brand system. Scripts may override colors via "theme": {...}.
All CSS uses __TOKEN__ placeholders resolved by core.assemble().
"""

DEFAULT_THEME = {
    "primary":   "#2a93f5",
    "accent":    "#1f86f0",
    "secondary": "#6cbef9",
    "bg":        "#060912",
    "red":       "#ff5d6c",
    "green":     "#34d399",
    "amber":     "#ffb454",
    "muted":     "#9aa3b8",
    "font":      "Inter,-apple-system,sans-serif",
}

# Named colors usable in scripts ("col": "red") — resolved against the theme.
def resolve_color(name, theme):
    if not name:
        return theme["primary"]
    if str(name).startswith("#"):
        return name
    return theme.get(str(name).lower(), theme["primary"])


FONT_WEIGHTS = (400, 500, 600, 700, 800, 900)

def fontface_css():
    return "\n".join(
        "@font-face{font-family:'Inter';font-weight:%s;font-style:normal;font-display:block;"
        "src:url('assets/fonts/inter-latin-%s-normal.woff2') format('woff2')}" % (w, w)
        for w in FONT_WEIGHTS)


# ── Shared stage + core component CSS (union of what shipped in both videos) ──
BASE_CSS = r"""
__FONTFACE__
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:__W__px;height:__H__px;overflow:hidden;background:__BG__;font-family:__FONT__;color:#fff;-webkit-font-smoothing:antialiased}
#main{position:relative;width:__W__px;height:__H__px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 62% 46% at 50% 42%,rgba(42,147,245,.11),transparent 62%),__BG__}
.grid{position:absolute;inset:0;opacity:.045;background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse 78% 60% at 50% 48%,#000,transparent 80%)}
.orb{position:absolute;border-radius:50%;opacity:.5}
.orb.a{width:900px;height:900px;left:-240px;top:-220px;background:radial-gradient(circle,rgba(42,147,245,.16),transparent 68%);animation:d1 22s ease-in-out infinite}
.orb.b{width:820px;height:820px;right:-220px;bottom:-240px;background:radial-gradient(circle,rgba(108,190,249,.12),transparent 68%);animation:d2 26s ease-in-out infinite}
@keyframes d1{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,40px)}}
@keyframes d2{0%,100%{transform:translate(0,0)}50%{transform:translate(-44px,-34px)}}
.flt{position:absolute;font-size:26px;font-weight:600;color:rgba(154,163,184,.16);white-space:nowrap;animation:flt 14s ease-in-out infinite}
@keyframes flt{0%,100%{transform:translate(0,0)}50%{transform:translate(0,-26px)}}
.ev{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 7%}
.line{font-size:108px;font-weight:850;letter-spacing:-.03em;line-height:1.04;max-width:92%}
.line.big{font-size:150px}.line.sm{font-size:84px}
.line .w{display:inline-block;margin:0 .14em;will-change:transform,opacity,filter}
.kicker{margin-bottom:38px}
.k-eyebrow{font-size:19px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:__PRIMARY__;margin-bottom:14px}
.k-title{font-size:74px;font-weight:850;letter-spacing:-.03em}.k-title .w{display:inline-block;margin:0 .12em}
.caret{display:inline-block;width:4px;height:1em;background:__PRIMARY__;margin-left:4px;vertical-align:middle;animation:blink 1.05s step-end infinite}
@keyframes blink{50%{opacity:0}}
"""

BASE_PORTRAIT_CSS = r"""
body.p .ev{padding:0 6%}
body.p .line{font-size:84px}body.p .line.big{font-size:112px}body.p .line.sm{font-size:60px}
body.p .k-title{font-size:60px}body.p .kicker{margin-bottom:30px}
body.p .flt{font-size:20px}
"""
