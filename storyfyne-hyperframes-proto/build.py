#!/usr/bin/env python3
"""
LOOK-TEST v2 — camera motion + working UI, now with a phone UI and a dynamic
desktop->phone transition. Works in landscape and vertical.

  python build.py            -> 1920x1080
  python build.py portrait   -> 1080x1920

Craft demonstrated:
  - layered virtual camera (ambient drift + discrete push/pull, no tween conflict)
  - live desktop UI: cursor moves+clicks, full-width prompt box TYPES with a caret
  - dynamic device handoff: desktop recedes (scale+blur) while a phone rises in
  - phone UI: Dialfyne mobile roleplay chat with a typed reply
"""
import sys, json

PORTRAIT = any(a in ("portrait", "--portrait", "9:16", "vertical") for a in sys.argv[1:])
W, H = (1080, 1920) if PORTRAIT else (1920, 1080)
FPS, DUR = 30, 9.8
PRIMARY, ACCENT, SECONDARY = "#2a93f5", "#1f86f0", "#6cbef9"
BG, GREEN = "#060912", "#34d399"
FONT = "Inter,-apple-system,sans-serif"
PROMPT = "Practice the pricing objection that lost us the Acme deal."
REPLY = "Totally fair — let me show the ROI in your own numbers."
AILINE = "Honestly, you're pricier than the tool we run today."


def cam_to(cx, cy, s):
    """translate so world point (cx,cy) lands at screen center, at scale s (origin 0,0)."""
    return [round(W / 2 - s * cx, 1), round(H / 2 - s * cy, 1), s]


def layout():
    if not PORTRAIT:
        app = [90, 96, 1740, 888]; hdr, side = 74, 320
        cl = app[0] + side; cw = app[2] - side; bodyTop = app[1] + hdr
        box = [cl + 70, bodyTop + 330, cw - 140, 150]
        title_y = bodyTop + 250
        start = [cl + cw / 2, box[1] + box[3] + 74]
        phone = [W / 2 - 202, H / 2 - 424, 404, 848]
        cam_estab = [0, 0, 1]
        cam_box = cam_to(box[0] + box[2] / 2, box[1] + box[3] / 2 + 30, 1.5)
        cam_phone = cam_to(W / 2, H / 2, 1.12)
    else:
        app = [50, 300, 980, 740]; hdr, side = 70, 210
        cl = app[0] + side; cw = app[2] - side; bodyTop = app[1] + hdr
        box = [cl + 40, bodyTop + 250, cw - 80, 210]
        title_y = bodyTop + 150
        start = [cl + cw / 2, box[1] + box[3] + 78]
        phone = [W / 2 - 312, H / 2 - 660, 624, 1320]
        bcx, bcy = box[0] + box[2] / 2, box[1] + box[3] / 2
        cam_estab = cam_to(bcx, bcy - 20, 1.16)
        cam_box = cam_to(bcx, bcy + 10, 1.45)
        cam_phone = cam_to(W / 2, H / 2, 1.12)
    return dict(app=app, hdr=hdr, side=side, box=box, title_y=title_y, start=start, phone=phone,
                cam_estab=cam_estab, cam_box=cam_box, cam_phone=cam_phone,
                cursor_box=[box[0] + 44, box[1] + box[3] / 2], cursor_start=list(start))


L = layout()
CFG = "const CFG=%s;" % json.dumps({
    "portrait": PORTRAIT, "W": W, "H": H, **{k: L[k] for k in
        ("app", "hdr", "side", "box", "title_y", "start", "phone",
         "cam_estab", "cam_box", "cam_phone", "cursor_box", "cursor_start")},
    "prompt": PROMPT, "reply": REPLY, "ailine": AILINE,
})

FONTFACE = "\n".join(
    "@font-face{font-family:'Inter';font-weight:%s;font-style:normal;font-display:block;"
    "src:url('assets/fonts/inter-latin-%s-normal.woff2') format('woff2')}" % (w, w)
    for w in (400, 500, 600, 700, 800, 900))
WAVE = "".join('<span style="--i:%d"></span>' % i for i in range(22))

HTML = r"""<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=__W__, height=__H__"/>
<title>Dialfyne — motion look-test v2</title>
<script src="assets/gsap.min.js"></script>
<style>
__FONTFACE__
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:__W__px;height:__H__px;overflow:hidden;background:__BG__;font-family:__FONT__;color:#fff;-webkit-font-smoothing:antialiased}
#main{position:relative;width:__W__px;height:__H__px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 34%,rgba(42,147,245,.12),transparent 60%),
  radial-gradient(circle at 84% 88%,rgba(108,190,249,.06),transparent 45%),__BG__}
.grid{position:absolute;inset:0;opacity:.05;background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),
  linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:60px 60px;
  -webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 45%,#000,transparent 75%)}
#cam{position:absolute;inset:0;transform-origin:0 0;will-change:transform}
#amb{position:absolute;inset:0;transform-origin:50% 50%;will-change:transform}
#world{position:absolute;inset:0}
#world>*{position:absolute}

/* desktop chrome */
.appwin{border-radius:22px;background:linear-gradient(180deg,#0e1524,#0a0f1b);border:1px solid rgba(255,255,255,.10);
  box-shadow:0 50px 130px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}
.apphdr{display:flex;align-items:center;gap:26px;padding:0 28px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.applogo{height:28px}.tabs{display:flex;gap:24px;margin-left:10px}
.tab{font-size:17px;font-weight:600;color:rgba(255,255,255,.45)}.tab.active{color:#fff}
.avatar2{margin-left:auto;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px}
.sidebar{position:absolute;top:0;left:0;height:100%;padding:22px 16px;display:flex;flex-direction:column;gap:9px;border-right:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.015)}
.side-new{font-size:16px;font-weight:700;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);padding:12px 15px;border-radius:11px;box-shadow:0 10px 26px rgba(42,147,245,.4)}
.side-item{font-size:15px;font-weight:500;color:rgba(255,255,255,.8);padding:11px 14px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05)}
.side-item.sel{background:rgba(42,147,245,.16);border-color:rgba(42,147,245,.4);color:#fff}
.side-item.muted{color:rgba(255,255,255,.4)}
.canvas-eyebrow{font-size:15px;font-weight:700;letter-spacing:.18em;color:__PRIMARY__;text-transform:uppercase;text-align:center;transform:translateX(-50%)}
.canvas-title{font-size:40px;font-weight:800;letter-spacing:-.02em;text-align:center;transform:translateX(-50%);width:max-content;max-width:90vw}
.prompt{border-radius:18px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.12);padding:28px 32px;
  font-size:30px;font-weight:500;line-height:1.42;display:flex;align-items:flex-start}
.ph{color:rgba(255,255,255,.32)}
.caret{display:inline-block;width:3px;height:32px;background:__PRIMARY__;margin-left:2px;vertical-align:middle;animation:blink 1.05s step-end infinite}
@keyframes blink{50%{opacity:0}}
.startbtn{font-size:22px;font-weight:700;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);
  padding:16px 36px;border-radius:13px;transform:translateX(-50%);white-space:nowrap}

/* phone */
.phone{border-radius:54px;background:#05070d;padding:13px;box-shadow:0 60px 150px rgba(0,0,0,.7),0 0 80px rgba(42,147,245,.12),inset 0 0 0 2px rgba(255,255,255,.06);opacity:0}
.pscreen{position:relative;width:100%;height:100%;border-radius:42px;overflow:hidden;background:linear-gradient(180deg,#0b1120,#080d18);display:flex;flex-direction:column}
.pnotch{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:34%;height:26px;background:#05070d;border-radius:0 0 16px 16px;z-index:5}
.pstatus{display:flex;justify-content:space-between;padding:16px 30px 6px;font-size:15px;font-weight:700;color:rgba(255,255,255,.8)}
.phdr{display:flex;align-items:center;gap:12px;padding:10px 22px 14px;border-bottom:1px solid rgba(255,255,255,.07)}
.pback{font-size:26px;color:__PRIMARY__}.ptitle{font-size:19px;font-weight:800}.psub{font-size:13px;color:__PRIMARY__;font-weight:600}
.plive{margin-left:auto;width:10px;height:10px;border-radius:50%;background:__GREEN__;box-shadow:0 0 10px __GREEN__;animation:blink 1.4s step-end infinite}
.pchat{flex:1;padding:20px 18px;display:flex;flex-direction:column;gap:14px}
.pmsg{max-width:84%;padding:14px 17px;font-size:18px;line-height:1.4}
.pmsg.ai{align-self:flex-start;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:18px 18px 18px 5px}
.pmsg.me{align-self:flex-end;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);border-radius:18px 18px 5px 18px;min-height:30px}
.pwave{display:flex;align-items:center;justify-content:center;gap:4px;height:52px;padding:6px 22px}
.pwave span{width:5px;border-radius:99px;background:linear-gradient(180deg,__PRIMARY__,__SECONDARY__);height:18px;animation:bar 1.05s ease-in-out infinite;animation-delay:calc(var(--i)*-.05s)}
@keyframes bar{0%,100%{height:14px}50%{height:42px}}
.pbar{display:flex;align-items:center;gap:14px;padding:14px 20px 26px}
.pmic{width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 8px 24px rgba(42,147,245,.45)}
.pinput{flex:1;font-size:16px;color:rgba(255,255,255,.5);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:14px 20px}

.cursor{width:38px;height:38px;z-index:60;filter:drop-shadow(0 3px 6px rgba(0,0,0,.55))}
/* portrait: wrap the headline + tighten type so the desktop shot fits 9:16 */
body.p .canvas-title{width:700px;max-width:700px;white-space:normal;font-size:34px;line-height:1.18}
body.p .prompt{font-size:28px}
</style></head>
<body class="__BODYCLASS__">
<div id="main" data-composition-id="main" data-width="__W__" data-height="__H__" data-start="0" data-duration="__DUR__">
  <div class="bg clip" data-start="0" data-duration="__DUR__" data-track-index="1"><div class="grid"></div></div>
  <div id="cam" class="clip" data-start="0" data-duration="__DUR__" data-track-index="2"><div id="amb"><div id="world">
    <div class="appwin" id="appwin">
      <div class="apphdr" id="apphdr"><img class="applogo" src="assets/logos/dialfyne.png"/>
        <div class="tabs"><span class="tab active">Roleplay</span><span class="tab">Library</span><span class="tab">Analytics</span></div>
        <div class="avatar2">DK</div></div>
      <div class="sidebar" id="sidebar">
        <div class="side-new">+ New roleplay</div>
        <div class="side-item sel">Pricing objection · Acme</div>
        <div class="side-item">Discovery · Northwind</div>
        <div class="side-item">Champion test · Initech</div>
        <div class="side-item muted">Cold open · Globex</div>
      </div>
    </div>
    <div class="canvas-eyebrow" id="eyebrow">New roleplay</div>
    <div class="canvas-title" id="title">What should the AI buyer push back on?</div>
    <div class="prompt" id="prompt"><span id="typed"></span><span id="ph" class="ph">Describe the deal, the buyer, the objection&hellip;</span><span class="caret" id="caret" style="opacity:0"></span></div>
    <div class="startbtn" id="startbtn">Start roleplay &#8594;</div>

    <div class="phone" id="phone"><div class="pscreen"><div class="pnotch"></div>
      <div class="pstatus"><span>9:41</span><span>5G &#9679;&#9679;&#9679;&#9679;</span></div>
      <div class="phdr"><span class="pback">&#8249;</span><div><div class="ptitle">Acme · Pricing</div><div class="psub">AI Buyer · VP Sales</div></div><span class="plive"></span></div>
      <div class="pchat"><div class="pmsg ai" id="pm1" style="opacity:0">__AILINE__</div>
        <div class="pmsg me" id="pm2" style="opacity:0"><span id="preply"></span></div></div>
      <div class="pwave">__WAVE__</div>
      <div class="pbar"><div class="pmic">&#127908;</div><div class="pinput">Hold to speak</div></div>
    </div></div>

    <svg class="cursor" id="cursor" viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15 L12.5 22 L15 21 L11.5 14 L18 14 Z" fill="#fff" stroke="#0a0a0a" stroke-width="1.2" stroke-linejoin="round"/></svg>
  </div></div></div>
<script>
window.__timelines = window.__timelines || {};
__CFG__
const $ = s => document.querySelector(s);
function place(el, l, t, w, h){ el.style.left=l+'px'; el.style.top=t+'px'; if(w!=null)el.style.width=w+'px'; if(h!=null)el.style.height=h+'px'; }

// ---- geometry from CFG (orientation-aware) ----
place($('#appwin'), CFG.app[0], CFG.app[1], CFG.app[2], CFG.app[3]);
$('#apphdr').style.height = CFG.hdr+'px';
$('#sidebar').style.width = CFG.side+'px';
const cl = CFG.app[0]+CFG.side, cw = CFG.app[2]-CFG.side, ccx = cl + cw/2;
$('#eyebrow').style.left = ccx+'px'; $('#eyebrow').style.top = (CFG.title_y-46)+'px';
$('#title').style.left = ccx+'px';   $('#title').style.top = CFG.title_y+'px';
place($('#prompt'), CFG.box[0], CFG.box[1], CFG.box[2], CFG.box[3]);
$('#startbtn').style.left = CFG.start[0]+'px'; $('#startbtn').style.top = CFG.start[1]+'px';
place($('#phone'), CFG.phone[0], CFG.phone[1], CFG.phone[2], CFG.phone[3]);

const tl = gsap.timeline({ paused: true });
gsap.set('#cam', { transformOrigin:'0 0', x:CFG.cam_estab[0], y:CFG.cam_estab[1], scale:CFG.cam_estab[2] });
gsap.set('#amb', { scale:1 });
gsap.set('#cursor', { x:CFG.W*0.84, y:CFG.H*0.9 });
gsap.set('#phone', { x:0, y:CFG.H*0.5, scale:0.9, rotation:4, opacity:0 });

// ambient drift on a SEPARATE layer so it never fights the discrete camera moves
tl.to('#amb', { scale:1.03, duration:DURf(), ease:'sine.inOut' }, 0);
function DURf(){ return __DUR__; }

// 1. desktop builds in
tl.from('#appwin', { opacity:0, scale:0.985, y:24, duration:0.7, ease:'power3.out' }, 0);
tl.from('#apphdr > *', { opacity:0, y:-12, stagger:0.06, duration:0.4 }, 0.2);
tl.from('#sidebar > *', { opacity:0, x:-20, stagger:0.06, duration:0.4 }, 0.3);
tl.from(['#eyebrow','#title','#prompt','#startbtn'], { opacity:0, y:18, stagger:0.1, duration:0.5 }, 0.45);

// 2. cursor -> prompt, click, focus
tl.to('#cursor', { x:CFG.cursor_box[0], y:CFG.cursor_box[1], duration:0.85, ease:'power3.inOut' }, 1.25);
tl.to('#cursor', { scale:0.88, duration:0.08, yoyo:true, repeat:1 }, 2.05);
tl.to('#prompt', { borderColor:'__PRIMARY__', boxShadow:'0 0 0 2px __PRIMARY__,0 0 46px rgba(42,147,245,.42)', duration:0.3 }, 2.05);
tl.to('#ph', { opacity:0, duration:0.2 }, 2.05);
tl.set('#caret', { opacity:1 }, 2.2);

// 3. camera PUSH IN (discrete) — own layer, overwrite-safe
tl.to('#cam', { x:CFG.cam_box[0], y:CFG.cam_box[1], scale:CFG.cam_box[2], duration:0.9, ease:'power2.inOut', overwrite:'auto' }, 2.2);

// 4. typewriter
const o={n:0};
tl.to(o, { n:CFG.prompt.length, duration:2.5, ease:'none', onUpdate:()=>{ $('#typed').textContent=CFG.prompt.slice(0,Math.round(o.n)); } }, 2.7);

// 5. cursor -> Start, press
tl.to('#cursor', { x:CFG.cursor_start[0], y:CFG.cursor_start[1], duration:0.7, ease:'power3.inOut' }, 5.35);
tl.to('#startbtn', { backgroundColor:'__PRIMARY__', borderColor:'__PRIMARY__', scale:1.05, duration:0.3 }, 5.75);
tl.to('#cursor', { scale:0.88, duration:0.08, yoyo:true, repeat:1 }, 5.95);

// 6. DYNAMIC HANDOFF: desktop recedes (scale+blur+up), phone rises in; camera to phone
tl.to('#cam', { x:CFG.cam_phone[0], y:CFG.cam_phone[1], scale:CFG.cam_phone[2], duration:0.95, ease:'power3.inOut', overwrite:'auto' }, 6.0);
tl.to(['#appwin','#eyebrow','#title','#prompt','#startbtn'], { y:'-=70', scale:0.92, opacity:0, filter:'blur(10px)', duration:0.6, ease:'power2.in' }, 6.0);
tl.to('#cursor', { opacity:0, duration:0.3 }, 6.0);
tl.to('#phone', { y:0, scale:1, rotation:0, opacity:1, duration:0.8, ease:'power3.out' }, 6.2);

// 7. phone roleplay: AI line, then user reply types; slow camera push for life
tl.to('#pm1', { opacity:1, y:0, duration:0.4, ease:'power2.out' }, 6.95);
tl.fromTo('#pm1', { y:14 }, { y:0, duration:0.4 }, 6.95);
tl.to('#pm2', { opacity:1, duration:0.3 }, 7.5);
const o2={n:0};
tl.to(o2, { n:CFG.reply.length, duration:1.6, ease:'none', onUpdate:()=>{ $('#preply').textContent=CFG.reply.slice(0,Math.round(o2.n)); } }, 7.6);
tl.to('#cam', { scale:CFG.cam_phone[2]*1.06, x:'+=0', duration:2.6, ease:'sine.inOut', overwrite:'auto' }, 7.0);

window.__timelines['main'] = tl;
</script>
</div></body></html>"""

def build():
    doc = (HTML.replace("__FONTFACE__", FONTFACE).replace("__CFG__", CFG).replace("__WAVE__", WAVE)
           .replace("__AILINE__", AILINE).replace("__BODYCLASS__", "p" if PORTRAIT else "")
           .replace("__W__", str(W)).replace("__H__", str(H)).replace("__DUR__", str(DUR))
           .replace("__BG__", BG).replace("__PRIMARY__", PRIMARY).replace("__ACCENT__", ACCENT)
           .replace("__SECONDARY__", SECONDARY).replace("__GREEN__", GREEN).replace("__FONT__", FONT))
    open("index.html", "w", encoding="utf-8").write(doc)
    print("wrote proto index.html (%s %dx%d, %.1fs)" % ("PORTRAIT" if PORTRAIT else "landscape", W, H, DUR))

if __name__ == "__main__":
    build()
