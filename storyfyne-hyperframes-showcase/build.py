#!/usr/bin/env python3
"""
Dialfyne — Product Showcase (~35s, music bed, no VO).
A camera-driven tour of the real product: command center, integrations, AI roleplay
kits, results, and the free CTA. Real portal screenshots framed on the dark stage,
with push-in zooms, highlight callouts, and dynamic transitions.

Each shot animates its own framed window (local "camera": scale + translate toward a
focus point) so there are no global tween conflicts. Labels are screen-fixed lower-thirds.
"""
import json

W, H, FPS, DUR = 1920, 1080, 30, 35.0
PRIMARY, ACCENT, BG = "#2a93f5", "#1f86f0", "#060912"
SECONDARY, GREEN = "#6cbef9", "#34d399"
FONT = "Inter,-apple-system,sans-serif"

def fit(nw, nh, maxw=0.62, maxh=0.80):
    s = min(W * maxw / nw, H * maxh / nh)
    return round(nw * s), round(nh * s)

# focus -> translate that centers focus point (fx,fy of frame) under scale s
def focus_xy(fx, fy, dw, dh):
    return round(-(fx - 0.5) * dw, 1), round(-(fy - 0.5) * dh, 1)

# ── Shot list ───────────────────────────────────────────────────────
# kind: brand | browser | bare | dark   |  cam: [scale_from, scale_to, fx, fy]
SHOTS = [
    dict(id="open", kind="brand", start=0.0, dur=3.4,
         eyebrow="The revenue command center", title="Dialfyne"),
    dict(id="cc", kind="browser", start=3.4, dur=5.6, asset="revenue-command-center.png",
         nat=(1184, 1296), url="app.dialfyne.com", cam=[1.04, 1.34, 0.12, 0.17],
         hl=(0.205, 0.165, 0.40, 0.12),
         eyebrow="See what's at risk", title="Revenue, in one command center."),
    dict(id="apps", kind="browser", start=9.0, dur=5.0, asset="connected-apps.png",
         nat=(1320, 1509), url="app.dialfyne.com/settings/integrations", cam=[1.02, 1.5, 0.5, 0.245],
         hl=(0.5, 0.245, 0.96, 0.085),
         eyebrow="Connected to your stack", title="Pulled straight from HubSpot."),
    dict(id="kits", kind="browser", start=14.0, dur=5.4, asset="roleplay-kit-card.png",
         nat=(902, 985), url="app.dialfyne.com/roleplay", cam=[1.03, 1.42, 0.5, 0.72],
         hl=(0.5, 0.72, 0.94, 0.26),
         eyebrow="AI buyers, built from your CRM", title="They know the exact deal."),
    dict(id="metrics", kind="bare", start=19.4, dur=4.6, asset="metrics-row.png",
         nat=(2104, 344), url="", cam=[1.05, 1.55, 0.875, 0.5],
         hl=(0.875, 0.5, 0.21, 0.92),
         eyebrow="The outcome", title="Reps get better, faster."),
    dict(id="email", kind="browser", start=24.0, dur=4.2, asset="email-assist.png",
         nat=(901, 852), url="app.dialfyne.com", cam=[1.04, 1.32, 0.5, 0.42],
         hl=(0.5, 0.42, 0.9, 0.5),
         eyebrow="It writes the follow-up", title="Every lead, answered."),
    dict(id="cta", kind="dark", start=28.2, dur=4.6, asset="free-custom-demo.png",
         nat=(754, 1549), url="", cam=[1.0, 1.18, 0.5, 0.88],
         hl=(0.5, 0.9, 0.92, 0.085),
         eyebrow="Free custom demo", title="Build your own AI buyer."),
    dict(id="close", kind="brand", start=32.8, dur=2.2,
         eyebrow="dialfyne.com/roleplay", title="Turn your team into closers."),
]
OVERLAP = 0.55

FONTFACE = "\n".join(
    "@font-face{font-family:'Inter';font-weight:%s;font-style:normal;font-display:block;"
    "src:url('assets/fonts/inter-latin-%s-normal.woff2') format('woff2')}" % (w, w)
    for w in (400, 500, 600, 700, 800, 900))

def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;")

def build():
    body, gsap, labels = [], [], []
    body.append('<div class="bg clip" data-start="0" data-duration="%.1f" data-track-index="1"><div class="grid"></div>'
                '<div class="orb a"></div><div class="orb b"></div></div>' % DUR)

    for i, s in enumerate(SHOTS):
        t0, t1 = s["start"], s["start"] + s["dur"]
        win = t1 - t0 + (OVERLAP if i < len(SHOTS) - 1 else 0.2)
        sid = "#shot-%d" % i
        last = i == len(SHOTS) - 1

        if s["kind"] == "brand":
            big = i == 0
            inner = ('<div class="brand">%s<div class="b-eyebrow">%s</div>'
                     '<div class="b-title %s">%s</div>%s</div>') % (
                ('<img class="b-logo" src="assets/logos/dialfyne.png"/>' if big else ''),
                esc(s["eyebrow"]), ("big" if big else ""), esc(s["title"]),
                ('' if big else '<img class="b-logo sm" src="assets/logos/dialfyne.png"/>'))
            body.append('<div id="shot-%d" class="shot clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">%s</div>'
                        % (i, t0, win, 10 + i, inner))
            gsap.append("tl.fromTo('%s',{opacity:0,scale:%s},{opacity:1,scale:1,duration:0.7,ease:'power3.out'},%.2f);"
                        % (sid, (0.9 if big else 1.04), t0))
            gsap.append("tl.from('%s .b-eyebrow,%s .b-title,%s .b-logo',{opacity:0,y:24,stagger:0.12,duration:0.6,ease:'power3.out'},%.2f);"
                        % (sid, sid, sid, t0 + 0.15))
            if not last:
                gsap.append("tl.to('%s',{opacity:0,scale:1.06,filter:'blur(8px)',duration:0.5,ease:'power2.in'},%.2f);" % (sid, t1))
            continue

        dw, dh = fit(*s["nat"])
        chrome = 44 if s["kind"] == "browser" else 0
        scl_from, scl_to, fx, fy = s["cam"]
        tx, ty = focus_xy(fx, fy, dw, dh + chrome)
        hl = s.get("hl")
        hl_html = ""
        if hl:
            hx, hy, hw, hh = hl
            hl_html = ('<div class="hl" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx"></div>'
                       % (round((hx - hw/2) * dw), round(chrome + (hy - hh/2) * dh), round(hw * dw), round(hh * dh)))
        chrome_html = ''
        if s["kind"] == "browser":
            chrome_html = ('<div class="chrome"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>'
                           '<span class="url">%s</span></div>' % esc(s["url"]))
        frame_cls = "frame " + s["kind"]
        inner = ('<div class="%s" style="width:%dpx" data-org="%s%% %s%%">%s<img src="assets/shots/%s"/>%s</div>'
                 % (frame_cls, dw, round(fx*100, 1), round(fy*100, 1), chrome_html, s["asset"], hl_html))
        body.append('<div id="shot-%d" class="shot clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">%s</div>'
                    % (i, t0, win, 10 + i, inner))

        # enter (rise+scale+blur) — alternate direction for variety
        ein = ["{opacity:0,y:60,scale:0.95,filter:'blur(10px)'}",
               "{opacity:0,x:120,scale:0.96,filter:'blur(8px)'}",
               "{opacity:0,scale:0.86,filter:'blur(12px)'}",
               "{opacity:0,x:-120,scale:0.96,filter:'blur(8px)'}"][i % 4]
        gsap.append("tl.set('%s .frame',{transformOrigin:'%s%% %s%%'},%.2f);" % (sid, round(fx*100,1), round(fy*100,1), max(0, t0-0.1)))
        gsap.append("tl.fromTo('%s',%s,{opacity:1,x:0,y:0,scale:1,filter:'blur(0px)',duration:0.7,ease:'power3.out'},%.2f);" % (sid, ein, t0))
        # local camera: slow push-in toward focus across the whole shot
        gsap.append("tl.fromTo('%s .frame',{scale:%s,x:0,y:0},{scale:%s,x:%.1f,y:%.1f,duration:%.2f,ease:'sine.inOut'},%.2f);"
                    % (sid, scl_from, scl_to, tx, ty, s["dur"]+0.3, t0+0.05))
        if hl:
            gsap.append("tl.fromTo('%s .hl',{opacity:0,scale:0.96},{opacity:1,scale:1,duration:0.4,ease:'power3.out'},%.2f);" % (sid, t0 + s["dur"]*0.42))
        if not last:
            eout = ["{opacity:0,y:-50,scale:1.05,filter:'blur(10px)'}",
                    "{opacity:0,x:-120,scale:1.04,filter:'blur(8px)'}",
                    "{opacity:0,scale:1.12,filter:'blur(12px)'}",
                    "{opacity:0,x:120,scale:1.04,filter:'blur(8px)'}"][i % 4]
            gsap.append("tl.to('%s',%s,%.2f);" % (sid, eout[:-1] + ",duration:0.5,ease:'power2.in'}", t1))

        # label (screen-fixed lower third)
        labels.append('<div id="lbl-%d" class="lbl clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">'
                      '<div class="l-eyebrow">%s</div><div class="l-title">%s</div></div>'
                      % (i, t0 + s["dur"]*0.32, s["dur"]*0.68 + 0.3, 60, esc(s["eyebrow"]), esc(s["title"])))
        gsap.append("tl.from('#lbl-%d .l-eyebrow,#lbl-%d .l-title',{opacity:0,y:22,stagger:0.1,duration:0.5,ease:'power3.out'},%.2f);" % (i, i, t0 + s["dur"]*0.32))
        gsap.append("tl.to('#lbl-%d',{opacity:0,duration:0.35,ease:'power1.in'},%.2f);" % (i, t1 - 0.1))

    body.append('<audio id="music" preload="none" src="assets/music.mp3" data-start="0" data-duration="%.1f" data-track-index="100"></audio>' % DUR)

    css = CSS
    for k, v in [("__BG__",BG),("__PRIMARY__",PRIMARY),("__ACCENT__",ACCENT),("__SECONDARY__",SECONDARY),
                 ("__GREEN__",GREEN),("__FONT__",FONT),("__FONTFACE__",FONTFACE),("__W__",str(W)),("__H__",str(H))]:
        css = css.replace(k, v)

    doc = DOC.replace("__CSS__", css).replace("__W__", str(W)).replace("__H__", str(H)).replace("__DUR__", str(DUR)) \
             .replace("__BODY__", "\n".join(body + labels)).replace("__GSAP__", "\n".join(gsap))
    open("index.html", "w", encoding="utf-8").write(doc)
    print("wrote showcase index.html (%d shots, %.1fs)" % (len(SHOTS), DUR))

CSS = r"""
__FONTFACE__
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:__W__px;height:__H__px;overflow:hidden;background:__BG__;font-family:__FONT__;color:#fff;-webkit-font-smoothing:antialiased}
#main{position:relative;width:__W__px;height:__H__px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 64% 54% at 50% 40%,rgba(42,147,245,.13),transparent 60%),__BG__}
.grid{position:absolute;inset:0;opacity:.05;background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),
  linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:62px 62px;
  -webkit-mask-image:radial-gradient(ellipse 72% 62% at 50% 45%,#000,transparent 75%)}
.orb{position:absolute;border-radius:50%;opacity:.5}
.orb.a{width:1100px;height:1100px;left:-300px;top:-340px;background:radial-gradient(circle,rgba(42,147,245,.18),transparent 68%);animation:d1 26s ease-in-out infinite}
.orb.b{width:980px;height:980px;right:-280px;bottom:-340px;background:radial-gradient(circle,rgba(108,190,249,.13),transparent 68%);animation:d2 30s ease-in-out infinite}
@keyframes d1{0%,100%{transform:translate(0,0)}50%{transform:translate(70px,50px)}}
@keyframes d2{0%,100%{transform:translate(0,0)}50%{transform:translate(-60px,-44px)}}

.shot{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;will-change:transform,opacity,filter}
.frame{position:relative;border-radius:16px;overflow:hidden;will-change:transform;
  box-shadow:0 60px 150px rgba(0,0,0,.72),0 0 0 1px rgba(255,255,255,.06),0 0 100px rgba(42,147,245,.10)}
.frame.bare{box-shadow:0 50px 130px rgba(0,0,0,.6),0 0 90px rgba(42,147,245,.10)}
.frame.dark{box-shadow:0 60px 150px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.07),0 0 110px rgba(42,147,245,.16)}
.frame img{display:block;width:100%;height:auto}
.chrome{display:flex;align-items:center;gap:9px;height:44px;padding:0 16px;background:#1a1d26;border-bottom:1px solid rgba(255,255,255,.05)}
.dot{width:11px;height:11px;border-radius:50%}.r{background:#ff5f56}.y{background:#ffbd2e}.g{background:#27c93f}
.url{flex:1;max-width:58%;margin:0 auto;background:#0c0e14;border:1px solid rgba(255,255,255,.05);border-radius:7px;padding:5px 14px;font-size:13px;color:#8a90a0;text-align:center}
.hl{position:absolute;border-radius:11px;border:2.5px solid __PRIMARY__;box-shadow:0 0 30px rgba(42,147,245,.6),inset 0 0 22px rgba(42,147,245,.22);z-index:3}

.brand{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.b-logo{height:150px;filter:drop-shadow(0 18px 50px rgba(42,147,245,.35));margin-bottom:14px}
.b-logo.sm{height:60px;margin-top:30px;margin-bottom:0}
.b-eyebrow{font-size:21px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:__PRIMARY__;margin-bottom:18px}
.b-title{font-size:72px;font-weight:850;letter-spacing:-.03em}.b-title.big{font-size:150px}

.lbl{position:absolute;left:0;right:0;bottom:84px;text-align:center;padding-top:80px;
  background:linear-gradient(180deg,transparent,rgba(6,9,18,.0) 30%,rgba(6,9,18,.66))}
.l-eyebrow{font-size:18px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:__PRIMARY__;margin-bottom:12px}
.l-title{font-size:50px;font-weight:850;letter-spacing:-.025em}
"""

DOC = r"""<!doctype html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=__W__, height=__H__"/>
<title>Dialfyne — Product Showcase</title>
<script src="assets/gsap.min.js"></script>
<style>__CSS__</style></head><body>
<div id="main" data-composition-id="main" data-width="__W__" data-height="__H__" data-start="0" data-duration="__DUR__">
__BODY__
<script>
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
__GSAP__
window.__timelines['main'] = tl;
</script>
</div></body></html>"""

if __name__ == "__main__":
    build()
