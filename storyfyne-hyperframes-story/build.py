#!/usr/bin/env python3
"""
Dialfyne — STORY opening (proof of the kinetic-text direction, ~9.6s).
Custom typography carries the narrative; a custom competitor strike-out graphic and a
woven typewriter line. Center-anchored, cut to the beat (95.7 BPM), constant secondary
motion. NO screenshots here on purpose — this is the 'not everything is a product shot'
part. Screenshots come later as PROOF at the payoff.
"""
W, H, FPS, DUR = 1920, 1080, 30, 9.7
PRIMARY, ACCENT, BG = "#2a93f5", "#1f86f0", "#060912"
RED, MUTED = "#ff5d6c", "#9aa3b8"
FONT = "Inter,-apple-system,sans-serif"
B0, BEAT = 0.19, 0.644
def b(i): return round(B0 + BEAT * i, 3)

def kw(text, accent="", color=PRIMARY):
    out = []
    aset = set(accent.split()) if accent else set()
    for w in text.split(" "):
        c = (' style="color:%s"' % color) if w.strip(".,!?") in aset else ""
        out.append('<span class="w"%s>%s</span>' % (c, w))
    return "".join(out)

# events: (start, end, type, payload)
EVENTS = [
    (b(0),  b(2),  "line", dict(t="Every call is practice.")),
    (b(2),  b(4),  "line", dict(t="On a real customer.", acc="real customer.", col=RED)),
    (b(4),  b(5),  "line", dict(t="That's expensive.", big=True)),
    (b(5),  b(7),  "line", dict(t="So teams try AI roleplay.")),
    (b(7),  b(10), "strike", dict(names=[("Hyperbound", b(7)), ("Mindtickle", b(8)), ("Second Nature", b(9))])),
    (b(10), b(11), "line", dict(t="Same generic scripts.", sm=True)),
    (b(11), b(12), "line", dict(t="Fake buyers.", acc="Fake", col=RED)),
    (b(12), b(15), "type", dict(t="What if it knew YOUR deals?")),
]

FONTFACE = "\n".join(
    "@font-face{font-family:'Inter';font-weight:%s;font-style:normal;font-display:block;"
    "src:url('assets/fonts/inter-latin-%s-normal.woff2') format('woff2')}" % (w, w)
    for w in (400, 500, 600, 700, 800, 900))
FLOATS = ["Too expensive", "We already use one", "No budget", "Call me next quarter", "Not interested", "Send me an email"]

def build():
    body, gsap = [], []
    body.append('<div class="bg clip" data-start="0" data-duration="%.1f" data-track-index="1">'
                '<div class="grid"></div><div class="orb a"></div><div class="orb b"></div>' % DUR
                + "".join('<span class="flt" style="left:%d%%;top:%d%%;animation-delay:%.1fs">%s</span>'
                          % ([8,72,15,78,40,60][i], [18,24,70,66,12,82][i], -i*1.7, f) for i, f in enumerate(FLOATS))
                + '</div>')

    for i, (t0, t1, kind, p) in enumerate(EVENTS):
        sid = "#ev-%d" % i
        win = (t1 - t0) + 0.35
        tk = 10 + i

        if kind == "line":
            cls = "line" + (" big" if p.get("big") else "") + (" sm" if p.get("sm") else "")
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">'
                        '<div class="%s">%s</div></div>' % (i, t0, win, tk, cls, kw(p["t"], p.get("acc",""), p.get("col",PRIMARY))))
            gsap.append("tl.from('%s .w',{opacity:0,yPercent:95,filter:'blur(7px)',stagger:0.045,duration:0.42,ease:'back.out(1.5)'},%.2f);" % (sid, t0))
            gsap.append("tl.to('%s .w',{opacity:0,yPercent:-60,filter:'blur(6px)',stagger:0.02,duration:0.26,ease:'power3.in'},%.2f);" % (sid, t1 - 0.04))

        elif kind == "strike":
            rows = "".join('<div class="srow" id="ev-%d-r%d"><span>%s</span><i class="strike"></i></div>' % (i, j, nm)
                           for j, (nm, _) in enumerate(p["names"]))
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">'
                        '<div class="strikewrap">%s</div></div>' % (i, t0, win, tk, rows))
            for j, (nm, nt) in enumerate(p["names"]):
                gsap.append("tl.from('#ev-%d-r%d span',{opacity:0,x:-40,filter:'blur(6px)',duration:0.3,ease:'power3.out'},%.2f);" % (i, j, nt))
                gsap.append("tl.fromTo('#ev-%d-r%d .strike',{scaleX:0},{scaleX:1,duration:0.22,ease:'power3.out'},%.2f);" % (i, j, nt + 0.22))
                gsap.append("tl.to('#ev-%d-r%d span',{opacity:0.4,duration:0.3},%.2f);" % (i, j, nt + 0.34))
            gsap.append("tl.to('%s',{opacity:0,scale:0.95,filter:'blur(8px)',duration:0.28,ease:'power3.in'},%.2f);" % (sid, t1 - 0.02))

        elif kind == "type":
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">'
                        '<div class="typed"><span class="brak">&gt;_</span> <span id="tw-%d"></span><span class="caret"></span></div></div>'
                        % (i, t0, win, tk, i))
            txt = p["t"]
            gsap.append("(function(){var o={n:0};tl.fromTo('%s',{opacity:0,y:20},{opacity:1,y:0,duration:0.4,ease:'power3.out'},%.2f);"
                        "tl.to(o,{n:%d,duration:%.2f,ease:'none',onUpdate:function(){var e=document.getElementById('tw-%d');"
                        "if(e)e.textContent=%s.slice(0,Math.round(o.n));}},%.2f);})();"
                        % (sid, t0, len(txt), (t1 - t0) * 0.62, i, _json(txt), t0 + 0.25))

    body.append('<audio id="music" preload="none" src="assets/music.mp3" data-start="0" data-duration="%.1f" data-track-index="100"></audio>' % DUR)

    css = CSS
    for k, v in [("__BG__",BG),("__PRIMARY__",PRIMARY),("__RED__",RED),("__MUTED__",MUTED),
                 ("__FONT__",FONT),("__FONTFACE__",FONTFACE),("__W__",str(W)),("__H__",str(H))]:
        css = css.replace(k, v)
    doc = DOC.replace("__CSS__",css).replace("__W__",str(W)).replace("__H__",str(H)).replace("__DUR__",str(DUR)) \
             .replace("__BODY__","\n".join(body)).replace("__GSAP__","\n".join(gsap))
    open("index.html","w",encoding="utf-8").write(doc)
    print("wrote story opening (%d events, %.1fs)" % (len(EVENTS), DUR))

import json as _j
def _json(s): return _j.dumps(s)

CSS = r"""
__FONTFACE__
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:__W__px;height:__H__px;overflow:hidden;background:__BG__;font-family:__FONT__;color:#fff;-webkit-font-smoothing:antialiased}
#main{position:relative;width:__W__px;height:__H__px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 45%,rgba(42,147,245,.10),transparent 62%),__BG__}
.grid{position:absolute;inset:0;opacity:.045;background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),
  linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:64px 64px;
  -webkit-mask-image:radial-gradient(ellipse 75% 65% at 50% 50%,#000,transparent 78%)}
.orb{position:absolute;border-radius:50%;opacity:.5}
.orb.a{width:1000px;height:1000px;left:-280px;top:-300px;background:radial-gradient(circle,rgba(42,147,245,.16),transparent 68%);animation:d1 22s ease-in-out infinite}
.orb.b{width:900px;height:900px;right:-260px;bottom:-300px;background:radial-gradient(circle,rgba(108,190,249,.12),transparent 68%);animation:d2 26s ease-in-out infinite}
@keyframes d1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,44px)}}
@keyframes d2{0%,100%{transform:translate(0,0)}50%{transform:translate(-54px,-40px)}}
.flt{position:absolute;font-size:26px;font-weight:600;color:rgba(154,163,184,.16);white-space:nowrap;animation:flt 14s ease-in-out infinite}
@keyframes flt{0%,100%{transform:translate(0,0)}50%{transform:translate(0,-26px)}}

.ev{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 8%}
.line{font-size:104px;font-weight:850;letter-spacing:-.03em;line-height:1.05;max-width:90%}
.line.big{font-size:150px}.line.sm{font-size:84px}
.line .w{display:inline-block;margin:0 .14em;will-change:transform,opacity,filter}

.strikewrap{display:flex;flex-direction:column;gap:18px;align-items:center}
.srow{position:relative;display:inline-block}
.srow span{font-size:84px;font-weight:800;letter-spacing:-.02em;color:#fff}
.srow .strike{position:absolute;left:-6px;right:-6px;top:52%;height:7px;border-radius:4px;background:__RED__;transform-origin:left center;box-shadow:0 0 18px rgba(255,93,108,.7)}

.typed{font-size:84px;font-weight:800;letter-spacing:-.02em;font-family:ui-monospace,monospace;color:#fff;display:flex;align-items:center;gap:.3em}
.typed .brak{color:__PRIMARY__;font-weight:700}
.caret{display:inline-block;width:5px;height:.92em;background:__PRIMARY__;margin-left:4px;animation:blink 1.05s step-end infinite}
@keyframes blink{50%{opacity:0}}
"""
DOC = r"""<!doctype html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=__W__, height=__H__"/><title>Dialfyne — Story</title>
<script src="assets/gsap.min.js"></script><style>__CSS__</style></head><body>
<div id="main" data-composition-id="main" data-width="__W__" data-height="__H__" data-start="0" data-duration="__DUR__">
__BODY__
<script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});
__GSAP__
window.__timelines['main']=tl;</script></div></body></html>"""

if __name__ == "__main__":
    build()
