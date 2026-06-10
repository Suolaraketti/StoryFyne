#!/usr/bin/env python3
"""
Real-UI showcase: a product screenshot framed in browser chrome on the dark stage,
brought to life with a camera push-in + a highlight callout. This is the treatment
for wiring real Dialfyne portal screenshots into the explainer.
"""
W, H, FPS, DUR = 1920, 1080, 30, 5.4
PRIMARY, ACCENT, BG = "#2a93f5", "#1f86f0", "#060912"
FONT = "Inter,-apple-system,sans-serif"

# connected-apps.png is 1320x1509 (after trim). Frame it in a browser window.
IMG_W, IMG_H = 1320, 1509
SCREEN_H = 1000
SCREEN_W = round(SCREEN_H * IMG_W / IMG_H)      # 875
CHROME = 46
WIN_W, WIN_H = SCREEN_W, SCREEN_H + CHROME
WIN_L = (W - WIN_W) // 2
WIN_T = (H - WIN_H) // 2
SCREEN_T = WIN_T + CHROME
# HubSpot is the 2nd row (~24.5% down the screenshot)
HS_Y = SCREEN_T + round(0.245 * SCREEN_H)
HS_CX = W // 2

def cam_to(cx, cy, s):
    return (round(W/2 - s*cx, 1), round(H/2 - s*cy, 1), s)

CAM_WIDE = cam_to(W/2, H/2, 1.0)
CAM_HS = cam_to(HS_CX, HS_Y, 1.55)

FONTFACE = "\n".join(
    "@font-face{font-family:'Inter';font-weight:%s;font-style:normal;font-display:block;"
    "src:url('assets/fonts/inter-latin-%s-normal.woff2') format('woff2')}" % (w, w)
    for w in (400, 600, 700, 800))

HTML = r"""<!doctype html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=__W__, height=__H__"/>
<script src="assets/gsap.min.js"></script>
<style>
__FONTFACE__
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:__W__px;height:__H__px;overflow:hidden;background:__BG__;font-family:__FONT__;color:#fff}
#main{position:relative;width:__W__px;height:__H__px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 62% 52% at 50% 40%,rgba(42,147,245,.13),transparent 60%),
  radial-gradient(circle at 84% 86%,rgba(108,190,249,.06),transparent 45%),__BG__}
.grid{position:absolute;inset:0;opacity:.05;background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),
  linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:60px 60px;
  -webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 45%,#000,transparent 75%)}
#cam{position:absolute;inset:0;transform-origin:0 0}#amb{position:absolute;inset:0;transform-origin:50% 50%}#world{position:absolute;inset:0}
.win{position:absolute;left:__WIN_L__px;top:__WIN_T__px;width:__WIN_W__px;border-radius:16px;overflow:hidden;background:#11141b;
  box-shadow:0 60px 150px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.06),0 0 90px rgba(42,147,245,.10)}
.chrome{display:flex;align-items:center;gap:9px;height:__CHROME__px;padding:0 16px;background:#1a1d26;border-bottom:1px solid rgba(255,255,255,.05)}
.dot{width:11px;height:11px;border-radius:50%}.r{background:#ff5f56}.y{background:#ffbd2e}.g{background:#27c93f}
.url{flex:1;max-width:60%;margin:0 auto;background:#0c0e14;border:1px solid rgba(255,255,255,.05);border-radius:7px;
  padding:5px 14px;font-size:13px;color:#8a90a0;text-align:center}
.win img{display:block;width:100%;height:auto}
.hl{position:absolute;left:__HL_L__px;top:__HL_T__px;width:__HL_W__px;height:__HL_H__px;border-radius:12px;
  border:2.5px solid __PRIMARY__;box-shadow:0 0 0 2000px rgba(6,9,18,.0),0 0 34px rgba(42,147,245,.6),inset 0 0 24px rgba(42,147,245,.25);
  opacity:0;transform-origin:left center}
.label{position:absolute;left:0;right:0;bottom:90px;text-align:center;opacity:0}
.eyebrow{font-size:19px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:__PRIMARY__;margin-bottom:12px}
.cap{font-size:46px;font-weight:800;letter-spacing:-.02em}
.cap b{color:__PRIMARY__}
.wm{position:absolute;top:44px;left:54px;height:30px;opacity:.0}
</style></head><body>
<div id="main" data-composition-id="main" data-width="__W__" data-height="__H__" data-start="0" data-duration="__DUR__">
  <div class="bg clip" data-start="0" data-duration="__DUR__" data-track-index="1"><div class="grid"></div></div>
  <div id="cam" class="clip" data-start="0" data-duration="__DUR__" data-track-index="2"><div id="amb"><div id="world">
    <div class="win" id="win">
      <div class="chrome"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <span class="url">app.dialfyne.com/settings/integrations</span></div>
      <img src="assets/shots/connected-apps.png"/>
    </div>
    <div class="hl" id="hl"></div>
  </div></div></div>
  <img class="wm" id="wm" src="assets/logos/dialfyne.png"/>
  <div class="label" id="label"><div class="eyebrow">Connected to your stack</div>
    <div class="cap">Pulled straight from <b>HubSpot</b>.</div></div>
<script>
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
gsap.set('#cam', { transformOrigin:'0 0', x:__CWX__, y:__CWY__, scale:__CWS__ });
gsap.set('#hl', { scaleX:0, opacity:0 });
// 1. window builds in
tl.from('#win', { opacity:0, y:34, scale:0.97, filter:'blur(10px)', duration:0.8, ease:'power3.out' }, 0);
tl.to('#amb', { scale:1.03, duration:__DUR__, ease:'sine.inOut' }, 0);
tl.to('#wm', { opacity:0.85, duration:0.5 }, 0.4);
// 2. camera push-in to the HubSpot row
tl.to('#cam', { x:__CHX__, y:__CHY__, scale:__CHS__, duration:1.2, ease:'power2.inOut', overwrite:'auto' }, 1.0);
// 3. highlight sweeps over HubSpot — connected
tl.to('#hl', { opacity:1, duration:0.2 }, 2.0);
tl.fromTo('#hl', { scaleX:0 }, { scaleX:1, duration:0.45, ease:'power3.out' }, 2.0);
// 4. label
tl.to('#label', { opacity:1, y:0, duration:0.5, ease:'power2.out' }, 2.4);
tl.from('#label', { y:18, duration:0.5 }, 2.4);
// 5. slow continued drift
tl.to('#cam', { scale:__CHS2__, duration:2.4, ease:'sine.inOut', overwrite:'auto' }, 2.6);
window.__timelines['main'] = tl;
</script></div></body></html>"""

def build():
    HL_L, HL_T, HL_W, HL_H = WIN_L+12, HS_Y-42, WIN_W-24, 88
    repl = {
        "__W__":W,"__H__":H,"__DUR__":DUR,"__BG__":BG,"__PRIMARY__":PRIMARY,"__FONT__":FONT,
        "__FONTFACE__":FONTFACE,"__WIN_L__":WIN_L,"__WIN_T__":WIN_T,"__WIN_W__":WIN_W,"__CHROME__":CHROME,
        "__HL_L__":HL_L,"__HL_T__":HL_T,"__HL_W__":HL_W,"__HL_H__":HL_H,
        "__CWX__":CAM_WIDE[0],"__CWY__":CAM_WIDE[1],"__CWS__":CAM_WIDE[2],
        "__CHX__":CAM_HS[0],"__CHY__":CAM_HS[1],"__CHS__":CAM_HS[2],"__CHS2__":round(CAM_HS[2]*1.06,3),
    }
    doc = HTML
    for k,v in repl.items(): doc = doc.replace(k, str(v))
    open("index.html","w",encoding="utf-8").write(doc)
    print("wrote uidemo index.html (%.1fs)" % DUR)

if __name__ == "__main__":
    build()
