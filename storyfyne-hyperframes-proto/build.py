#!/usr/bin/env python3
"""
LOOK-TEST: camera motion + working UI mockup for Dialfyne.

Demonstrates the craft the brand wants:
  - a virtual camera that pushes in / pulls back (not static cards)
  - a live UI: animated cursor that moves + clicks, a prompt box that TYPES
  - state changes (focus ring, button press) and a panel that builds in
  - logo + chrome behaving like a real product

Renders with HyperFrames (HTML/GSAP). No audio — this is a motion/craft test.
"""
import json

W, H, FPS, DUR = 1920, 1080, 30, 8.6
PRIMARY, ACCENT, SECONDARY = "#2a93f5", "#1f86f0", "#6cbef9"
BG, PANEL = "#060912", "#0d1320"
GREEN = "#34d399"

# camera target: push in on the prompt box + start button
CENTER = (1090, 666)
PUSH_S = 1.55
PUSH_TX = 960 - PUSH_S * CENTER[0]
PUSH_TY = 540 - PUSH_S * CENTER[1]
BOX = (560, 600)       # cursor target inside prompt box (left-ish, where caret sits)
START = (1010, 772)    # start button center
PROMPT = "Practice the pricing objection that lost us the Acme deal."
LINE = "Honestly, you're pricier than the tool we run today."

CFG = ("const CFG=%s;" % json.dumps({
    "pushS": PUSH_S, "pushTx": round(PUSH_TX, 1), "pushTy": round(PUSH_TY, 1),
    "box": list(BOX), "start": list(START), "prompt": PROMPT, "line": LINE,
}))

FONT = "Inter,-apple-system,sans-serif"

FONTFACE = "\n".join(
    "@font-face{font-family:'Inter';font-weight:%s;font-style:normal;font-display:block;"
    "src:url('assets/fonts/inter-latin-%s-normal.woff2') format('woff2')}" % (w, w)
    for w in (400, 500, 600, 700, 800, 900))

WAVE = "".join('<span style="--i:%d"></span>' % i for i in range(26))

HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=__W__, height=__H__"/>
<title>Dialfyne — motion look-test</title>
<script src="assets/gsap.min.js"></script>
<style>
__FONTFACE__
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:__W__px;height:__H__px;overflow:hidden;background:__BG__;font-family:__FONT__;color:#fff;-webkit-font-smoothing:antialiased}
#main{position:relative;width:__W__px;height:__H__px;overflow:hidden}
.bg{position:absolute;inset:0;background:
  radial-gradient(ellipse 60% 50% at 50% 32%, rgba(42,147,245,.12), transparent 60%),
  radial-gradient(circle at 85% 90%, rgba(108,190,249,.06), transparent 45%), __BG__}
.grid{position:absolute;inset:0;opacity:.05;background-image:
  linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);
  background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 45%,#000,transparent 75%)}
#cam{position:absolute;inset:0;transform-origin:0 0;will-change:transform}
#world{position:absolute;inset:0;width:__W__px;height:__H__px}

/* app window */
.appwin{position:absolute;left:90px;top:96px;width:1740px;height:888px;border-radius:22px;
  background:linear-gradient(180deg,#0e1524,#0a0f1b);border:1px solid rgba(255,255,255,.10);
  box-shadow:0 50px 130px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}
.apphdr{display:flex;align-items:center;gap:30px;height:74px;padding:0 30px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.applogo{height:30px;width:auto}
.tabs{display:flex;gap:26px;margin-left:14px}
.tab{font-size:18px;font-weight:600;color:rgba(255,255,255,.45)}
.tab.active{color:#fff}
.tab.active::after{content:'';display:block;height:2px;border-radius:2px;background:__PRIMARY__;margin-top:8px}
.hdr-right{margin-left:auto;display:flex;align-items:center;gap:16px}
.avatar2{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}
.appbody{display:flex;height:814px}
.sidebar{width:320px;border-right:1px solid rgba(255,255,255,.07);padding:24px 18px;display:flex;flex-direction:column;gap:10px;background:rgba(255,255,255,.015)}
.side-new{font-size:18px;font-weight:700;color:#fff;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);padding:14px 18px;border-radius:12px;box-shadow:0 10px 28px rgba(42,147,245,.4)}
.side-item{font-size:17px;font-weight:500;color:rgba(255,255,255,.8);padding:13px 16px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05)}
.side-item.sel{background:rgba(42,147,245,.16);border-color:rgba(42,147,245,.4);color:#fff}
.side-item.muted{color:rgba(255,255,255,.4)}
.canvas{flex:1;padding:70px 80px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.canvas-eyebrow{font-size:16px;font-weight:700;letter-spacing:.18em;color:__PRIMARY__;text-transform:uppercase;margin-bottom:20px}
.canvas-title{font-size:44px;font-weight:800;letter-spacing:-.02em;margin-bottom:42px}
.prompt{width:1040px;min-height:120px;border-radius:18px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.12);
  padding:30px 34px;font-size:30px;font-weight:500;color:#fff;text-align:left;line-height:1.4;display:flex;align-items:center}
.ph{color:rgba(255,255,255,.32)}
.caret{display:inline-block;width:3px;height:34px;background:__PRIMARY__;margin-left:2px;vertical-align:middle;animation:blink 1.05s step-end infinite}
@keyframes blink{50%{opacity:0}}
.startbtn{margin-top:34px;font-size:24px;font-weight:700;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);
  padding:18px 40px;border-radius:14px}

/* AI buyer panel (builds in) */
.panel{position:absolute;left:1180px;top:300px;width:560px;border-radius:24px;background:linear-gradient(180deg,rgba(22,30,48,.96),rgba(12,18,30,.96));
  border:1px solid rgba(255,255,255,.14);box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 70px rgba(42,147,245,.18);overflow:hidden}
.phead{display:flex;align-items:center;gap:16px;padding:24px 26px;border-bottom:1px solid rgba(255,255,255,.08)}
.pav{width:56px;height:56px;border-radius:15px;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-weight:850;font-size:22px}
.pname{font-size:22px;font-weight:800}.prole{font-size:15px;color:__PRIMARY__;font-weight:600;margin-top:2px}
.live{margin-left:auto;width:11px;height:11px;border-radius:50%;background:__GREEN__;box-shadow:0 0 10px __GREEN__;animation:blink 1.4s step-end infinite}
.wave{display:flex;align-items:center;justify-content:center;gap:5px;height:70px;padding:18px 26px 6px}
.wave span{width:6px;border-radius:99px;background:linear-gradient(180deg,__PRIMARY__,__SECONDARY__);height:24px;animation:bar 1.05s ease-in-out infinite;animation-delay:calc(var(--i)*-.05s)}
@keyframes bar{0%,100%{height:16px}50%{height:54px}}
.bub{margin:6px 26px;padding:16px 20px;border-radius:16px 16px 16px 5px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);font-size:20px;line-height:1.4;color:rgba(255,255,255,.92)}
.pill{display:inline-block;margin:14px 26px 26px;font-size:16px;font-weight:700;color:__PRIMARY__;background:rgba(42,147,245,.14);border:1px solid rgba(42,147,245,.45);padding:9px 16px;border-radius:999px}

/* cursor */
.cursor{position:absolute;top:0;left:0;width:38px;height:38px;z-index:50;filter:drop-shadow(0 3px 6px rgba(0,0,0,.5))}
</style>
</head>
<body>
<div id="main" data-composition-id="main" data-width="__W__" data-height="__H__" data-start="0" data-duration="__DUR__">
  <div class="bg clip" data-start="0" data-duration="__DUR__" data-track-index="1"><div class="grid"></div></div>
  <div id="cam" class="clip" data-start="0" data-duration="__DUR__" data-track-index="2">
   <div id="world">
    <div class="appwin">
      <div class="apphdr">
        <img class="applogo" src="assets/logos/dialfyne.png"/>
        <div class="tabs"><span class="tab active">Roleplay</span><span class="tab">Library</span><span class="tab">Analytics</span></div>
        <div class="hdr-right"><span class="avatar2">DK</span></div>
      </div>
      <div class="appbody">
        <div class="sidebar">
          <div class="side-new">+ New roleplay</div>
          <div class="side-item sel">Pricing objection · Acme</div>
          <div class="side-item">Discovery · Northwind</div>
          <div class="side-item">Champion test · Initech</div>
          <div class="side-item muted">Cold open · Globex</div>
        </div>
        <div class="canvas">
          <div class="canvas-eyebrow">New roleplay</div>
          <div class="canvas-title">What should the AI buyer push back on?</div>
          <div class="prompt"><span id="typed"></span><span id="ph" class="ph">Describe the deal, the buyer, the objection&hellip;</span><span class="caret" id="caret" style="opacity:0"></span></div>
          <div class="startbtn" id="startbtn">Start roleplay &#8594;</div>
        </div>
      </div>
    </div>

    <div class="panel" id="panel">
      <div class="phead pbuild"><div class="pav">AI</div><div><div class="pname">AI Buyer · VP Sales</div><div class="prole">Acme · pricing objection</div></div><span class="live"></span></div>
      <div class="wave pbuild">__WAVE__</div>
      <div class="bub pbuild"><span id="line"></span><span class="caret"></span></div>
      <div class="pill pbuild">Objection loaded</div>
    </div>

    <svg class="cursor" id="cursor" viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15 L12.5 22 L15 21 L11.5 14 L18 14 Z" fill="#fff" stroke="#0a0a0a" stroke-width="1.2" stroke-linejoin="round"/></svg>
   </div>
  </div>
<script>
window.__timelines = window.__timelines || {};
__CFG__
const tl = gsap.timeline({ paused: true });
const $ = s => document.querySelector(s);

gsap.set('#cam', { transformOrigin: '0 0', x: 0, y: 0, scale: 1 });
gsap.set('#cursor', { x: 1640, y: 920 });
gsap.set('#panel', { xPercent: 10, opacity: 0 });
gsap.set('.pbuild', { opacity: 0, y: 16 });
gsap.set('#caret', { opacity: 0 });

// 1. App builds in + slow ambient push
tl.from('.appwin', { opacity: 0, scale: 0.985, y: 24, duration: 0.7, ease: 'power3.out' }, 0);
tl.from('.apphdr > *', { opacity: 0, y: -12, stagger: 0.07, duration: 0.45, ease: 'power2.out' }, 0.2);
tl.from('.sidebar > *', { opacity: 0, x: -22, stagger: 0.06, duration: 0.4, ease: 'power2.out' }, 0.3);
tl.from('.canvas > *', { opacity: 0, y: 18, stagger: 0.1, duration: 0.5, ease: 'power2.out' }, 0.45);
tl.fromTo('#cam', { scale: 1 }, { scale: 1.05, duration: 2.0, ease: 'sine.inOut' }, 0.5);

// 2. cursor flies to the prompt box, clicks to focus
tl.to('#cursor', { x: CFG.box[0], y: CFG.box[1], duration: 0.85, ease: 'power3.inOut' }, 1.25);
tl.to('#cursor', { scale: 0.88, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 2.05);
tl.to('.prompt', { borderColor: '__PRIMARY__', boxShadow: '0 0 0 2px __PRIMARY__, 0 0 46px rgba(42,147,245,.42)', duration: 0.3 }, 2.05);
tl.to('#ph', { opacity: 0, duration: 0.2 }, 2.05);
tl.set('#caret', { opacity: 1 }, 2.2);

// 3. camera PUSHES IN on the box + start button
tl.to('#cam', { x: CFG.pushTx, y: CFG.pushTy, scale: CFG.pushS, duration: 0.95, ease: 'power2.inOut' }, 2.2);

// 4. typewriter into the box
const o = { n: 0 };
tl.to(o, { n: CFG.prompt.length, duration: 2.5, ease: 'none',
  onUpdate: () => { $('#typed').textContent = CFG.prompt.slice(0, Math.round(o.n)); } }, 2.7);

// 5. cursor to Start, press
tl.to('#cursor', { x: CFG.start[0], y: CFG.start[1], duration: 0.7, ease: 'power3.inOut' }, 5.35);
tl.to('#startbtn', { backgroundColor: '__PRIMARY__', borderColor: '__PRIMARY__', scale: 1.04, duration: 0.3 }, 5.75);
tl.to('#cursor', { scale: 0.88, duration: 0.08, yoyo: true, repeat: 1 }, 5.95);

// 6. camera PULLS BACK + AI buyer panel builds in
tl.to('#cam', { x: 0, y: 0, scale: 1.02, duration: 0.95, ease: 'power3.inOut' }, 6.05);
tl.to('#panel', { xPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 6.25);
tl.to('.pbuild', { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' }, 6.5);
const o2 = { n: 0 };
tl.to(o2, { n: CFG.line.length, duration: 1.5, ease: 'none',
  onUpdate: () => { $('#line').textContent = CFG.line.slice(0, Math.round(o2.n)); } }, 6.9);

window.__timelines['main'] = tl;
</script>
</div>
</body>
</html>"""

def build():
    doc = (HTML.replace("__FONTFACE__", FONTFACE).replace("__CFG__", CFG).replace("__WAVE__", WAVE)
           .replace("__W__", str(W)).replace("__H__", str(H)).replace("__DUR__", str(DUR))
           .replace("__BG__", BG).replace("__PRIMARY__", PRIMARY).replace("__ACCENT__", ACCENT)
           .replace("__SECONDARY__", SECONDARY).replace("__GREEN__", GREEN).replace("__FONT__", FONT))
    open("index.html", "w", encoding="utf-8").write(doc)
    print("wrote proto index.html (%.1fs, camera + live UI + typing)" % DUR)

if __name__ == "__main__":
    build()
