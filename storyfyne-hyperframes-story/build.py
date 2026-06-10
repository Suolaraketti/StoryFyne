#!/usr/bin/env python3
"""
Dialfyne — STORY (full arc, ~20s, 16:9). Kinetic-text spine with product grabs and
custom graphics woven in WHERE THEY SERVE THE STORY:
  problem (kinetic type + strike-out) -> typewriter pivot -> brand -> ANIMATED product
  grab (connected-apps cropped center, cursor click + "Synced" pop) -> custom count-up
  metric -> custom "AI buyer born" graphic -> CTA.
Center-anchored, cut to 95.7 BPM, constant secondary motion. Screenshots are PROOF, not the show.
"""
import json as _j
W, H, FPS, DUR = 1920, 1080, 30, 20.4
PRIMARY, ACCENT, BG = "#2a93f5", "#1f86f0", "#060912"
RED, GREEN, MUTED = "#ff5d6c", "#34d399", "#9aa3b8"
FONT = "Inter,-apple-system,sans-serif"
B0, BEAT = 0.19, 0.644
def b(i): return round(B0 + BEAT * i, 3)
def js(s): return _j.dumps(s)

def kw(text, accent="", color=PRIMARY):
    aset = set(accent.split()) if accent else set()
    return "".join('<span class="w"%s>%s</span>' % ((' style="color:%s"' % color) if w.strip(".,!?") in aset else "", w)
                   for w in text.split(" "))

# Connected-apps crop -> HubSpot row band (image 1320x1509)
def crop(IMG_W, IMG_H, fx0, fy0, fw, fh, VW):
    imgW = VW / fw; imgH = imgW * IMG_H / IMG_W
    return dict(VW=round(VW), VH=round(fh*imgH), imgW=round(imgW), imgL=round(-fx0*imgW), imgT=round(-fy0*imgH))

EVENTS = [
    (b(0),  b(2),  "line", dict(t="Every call is practice.")),
    (b(2),  b(4),  "line", dict(t="On a real customer.", acc="real customer.", col=RED)),
    (b(4),  b(5),  "line", dict(t="That's expensive.", big=True)),
    (b(5),  b(7),  "line", dict(t="So teams try AI roleplay.")),
    (b(7),  b(10), "strike", dict(names=[("Hyperbound", b(7)), ("Mindtickle", b(8)), ("Second Nature", b(9))])),
    (b(10), b(11), "line", dict(t="Same generic scripts.", sm=True)),
    (b(11), b(12), "line", dict(t="Fake buyers.", acc="Fake", col=RED)),
    (b(12), b(15), "type", dict(t="What if it knew YOUR deals?")),
    (b(15), b(17), "brand", dict(t="It does.", sub="Meet Dialfyne.")),
    (b(17), b(21), "grab", dict(asset="connected-apps.png", img=(1320,1509),
                                crop=(0.015,0.185,0.97,0.105), vw=1480,
                                eyebrow="Connected to your stack", title="Pulled from your CRM.")),
    (b(21), b(25), "metric", dict(value=9.0, suffix="/10", label="Team avg score", delta="+29%",
                                  eyebrow="The outcome", title="Reps get sharper.")),
    (b(25), b(28), "born", dict(eyebrow="Built from your reality", title="An AI buyer that knows the deal.")),
    (b(28), b(31), "cta", dict(title="Build yours — free.", url="dialfyne.com/roleplay")),
]
DUR = round(b(31) + 0.4, 1)

FONTFACE = "\n".join("@font-face{font-family:'Inter';font-weight:%s;font-style:normal;font-display:block;"
    "src:url('assets/fonts/inter-latin-%s-normal.woff2') format('woff2')}" % (w,w) for w in (400,500,600,700,800,900))
FLOATS = ["Too expensive","We already use one","No budget","Call me next quarter","Not interested","Send me an email"]

def build():
    body, gsap = [], []
    body.append('<div class="bg clip" data-start="0" data-duration="%.1f" data-track-index="1"><div class="grid"></div>'
        '<div class="orb a"></div><div class="orb b"></div>' % DUR
        + "".join('<span class="flt" style="left:%d%%;top:%d%%;animation-delay:%.1fs">%s</span>'
                  % ([8,72,15,78,40,60][i],[18,24,70,66,12,82][i],-i*1.7,f) for i,f in enumerate(FLOATS)) + '</div>')

    for i,(t0,t1,kind,p) in enumerate(EVENTS):
        sid="#ev-%d"%i; win=(t1-t0)+0.35; tk=10+i

        if kind=="line":
            cls="line"+(" big" if p.get("big") else "")+(" sm" if p.get("sm") else "")
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="%s">%s</div></div>'%(i,t0,win,tk,cls,kw(p["t"],p.get("acc",""),p.get("col",PRIMARY))))
            gsap.append("tl.from('%s .w',{opacity:0,yPercent:95,filter:'blur(7px)',stagger:0.045,duration:0.42,ease:'back.out(1.5)'},%.2f);"%(sid,t0))
            gsap.append("tl.to('%s .w',{opacity:0,yPercent:-60,filter:'blur(6px)',stagger:0.02,duration:0.26,ease:'power3.in'},%.2f);"%(sid,t1-0.04))

        elif kind=="strike":
            rows="".join('<div class="srow" id="ev-%d-r%d"><span>%s</span><i class="strike"></i></div>'%(i,j,nm) for j,(nm,_) in enumerate(p["names"]))
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="strikewrap">%s</div></div>'%(i,t0,win,tk,rows))
            for j,(nm,nt) in enumerate(p["names"]):
                gsap.append("tl.from('#ev-%d-r%d span',{opacity:0,x:-40,filter:'blur(6px)',duration:0.3,ease:'power3.out'},%.2f);"%(i,j,nt))
                gsap.append("tl.fromTo('#ev-%d-r%d .strike',{scaleX:0},{scaleX:1,duration:0.22,ease:'power3.out'},%.2f);"%(i,j,nt+0.22))
                gsap.append("tl.to('#ev-%d-r%d span',{opacity:0.4,duration:0.3},%.2f);"%(i,j,nt+0.34))
            gsap.append("tl.to('%s',{opacity:0,scale:0.95,filter:'blur(8px)',duration:0.28,ease:'power3.in'},%.2f);"%(sid,t1-0.02))

        elif kind=="type":
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="typed"><span class="brak">&gt;_</span> <span id="tw-%d"></span><span class="caret"></span></div></div>'%(i,t0,win,tk,i))
            txt=p["t"]
            gsap.append("(function(){var o={n:0};tl.fromTo('%s',{opacity:0,y:20},{opacity:1,y:0,duration:0.4,ease:'power3.out'},%.2f);tl.to(o,{n:%d,duration:%.2f,ease:'none',onUpdate:function(){var e=document.getElementById('tw-%d');if(e)e.textContent=%s.slice(0,Math.round(o.n));}},%.2f);tl.to('%s',{opacity:0,y:-16,duration:0.25,ease:'power3.in'},%.2f);})();"%(sid,t0,len(txt),(t1-t0)*0.55,i,js(txt),t0+0.25,sid,t1-0.04))

        elif kind=="brand":
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="brandwrap"><img class="b-logo" src="assets/logos/dialfyne.png"/><div class="b-sub">%s</div></div></div>'%(i,t0,win,tk,p["sub"]))
            gsap.append("tl.from('%s .b-logo',{opacity:0,scale:0.6,filter:'blur(10px)',duration:0.55,ease:'back.out(1.7)'},%.2f);"%(sid,t0))
            gsap.append("tl.from('%s .b-sub',{opacity:0,y:18,duration:0.4,ease:'power3.out'},%.2f);"%(sid,t0+0.25))
            gsap.append("tl.to('%s',{opacity:0,scale:1.08,filter:'blur(8px)',duration:0.28,ease:'power3.in'},%.2f);"%(sid,t1-0.02))

        elif kind=="grab":
            c=crop(*p["img"],*p["crop"],p["vw"])
            body.append(('<div id="ev-%d" class="ev clip grabwrap" data-start="%.2f" data-duration="%.2f" data-track-index="%d">'
                '<div class="kicker"><div class="k-eyebrow">%s</div><div class="k-title">%s</div></div>'
                '<div class="crop" style="width:%dpx;height:%dpx"><img src="assets/shots/%s" style="width:%dpx;left:%dpx;top:%dpx"/>'
                '<div class="hlbox"></div></div>'
                '<div class="pop">&#10003; Synced</div><svg class="cursor" viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15 L12.5 22 L15 21 L11.5 14 L18 14 Z" fill="#fff" stroke="#0a0a0a" stroke-width="1.2"/></svg>'
                '</div>')%(i,t0,win,tk,p["eyebrow"],kw(p["title"],"",PRIMARY),c["VW"],c["VH"],p["asset"],c["imgW"],c["imgL"],c["imgT"]))
            gsap.append("tl.from('%s .crop',{opacity:0,scale:0.94,filter:'blur(8px)',duration:0.4,ease:'back.out(1.3)'},%.2f);"%(sid,t0))
            gsap.append("tl.fromTo('%s .crop img',{clipPath:'inset(0 100%% 0 0)'},{clipPath:'inset(0 0%% 0 0)',duration:0.5,ease:'power3.out'},%.2f);"%(sid,t0+0.05))
            gsap.append("tl.from('%s .k-eyebrow',{opacity:0,y:14,duration:0.3},%.2f);"%(sid,t0+0.15))
            gsap.append("tl.from('%s .k-title .w',{opacity:0,yPercent:90,filter:'blur(6px)',stagger:0.05,duration:0.4,ease:'power3.out'},%.2f);"%(sid,t0+0.22))
            gsap.append("tl.set('%s .cursor',{x:%d,y:%d},%.2f);"%(sid,W//2+360,H//2+120,t0))
            gsap.append("tl.to('%s .cursor',{x:%d,y:%d,duration:0.55,ease:'power3.inOut'},%.2f);"%(sid,W//2+c["VW"]*0.34,H//2,t0+0.5))
            cb=t0+(t1-t0)*0.5
            gsap.append("tl.to('%s .cursor',{scale:0.85,duration:0.08,yoyo:true,repeat:1},%.2f);"%(sid,cb))
            gsap.append("tl.fromTo('%s .hlbox',{opacity:0,scale:1.12},{opacity:1,scale:1,duration:0.22,ease:'back.out(2)'},%.2f);"%(sid,cb))
            gsap.append("tl.fromTo('%s .pop',{opacity:0,y:14,scale:0.8},{opacity:1,y:0,scale:1,duration:0.3,ease:'back.out(2)'},%.2f);"%(sid,cb+0.12))
            gsap.append("tl.to('%s',{opacity:0,scale:1.05,filter:'blur(9px)',duration:0.3,ease:'power3.in'},%.2f);"%(sid,t1-0.02))

        elif kind=="metric":
            body.append(('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">'
                '<div class="kicker"><div class="k-eyebrow">%s</div><div class="k-title">%s</div></div>'
                '<div class="metcard"><div class="met-lbl">%s</div>'
                '<div class="met-v"><span id="mn-%d">0.0</span>%s <span class="met-d">%s</span></div>'
                '<svg class="spark" viewBox="0 0 320 70" preserveAspectRatio="none"><path id="sp-%d" d="M0,58 L40,52 L80,55 L120,40 L160,44 L200,28 L240,30 L280,16 L320,8" fill="none" stroke="%s" stroke-width="4" stroke-linecap="round"/></svg></div></div>')
                %(i,t0,win,tk,p["eyebrow"],kw(p["title"],"",PRIMARY),p["label"],i,p["suffix"],p["delta"],i,PRIMARY))
            gsap.append("tl.from('%s .metcard',{opacity:0,y:40,scale:0.94,filter:'blur(8px)',duration:0.45,ease:'back.out(1.3)'},%.2f);"%(sid,t0))
            gsap.append("tl.from('%s .k-eyebrow',{opacity:0,y:14,duration:0.3},%.2f);"%(sid,t0+0.1))
            gsap.append("tl.from('%s .k-title .w',{opacity:0,yPercent:90,filter:'blur(6px)',stagger:0.05,duration:0.4,ease:'power3.out'},%.2f);"%(sid,t0+0.18))
            gsap.append("(function(){var o={v:0};tl.to(o,{v:%s,duration:1.0,ease:'power2.out',onUpdate:function(){var e=document.getElementById('mn-%d');if(e)e.textContent=o.v.toFixed(1);}},%.2f);})();"%(p["value"],i,t0+0.4))
            gsap.append("tl.fromTo('#sp-%d',{strokeDasharray:520,strokeDashoffset:520},{strokeDashoffset:0,duration:1.1,ease:'power2.out'},%.2f);"%(i,t0+0.45))
            gsap.append("tl.from('%s .met-d',{opacity:0,scale:0.6,duration:0.3,ease:'back.out(2)'},%.2f);"%(sid,t0+1.1))
            gsap.append("tl.to('%s',{opacity:0,scale:1.05,filter:'blur(9px)',duration:0.3,ease:'power3.in'},%.2f);"%(sid,t1-0.02))

        elif kind=="born":
            lines="".join('<i class="dl" style="transform:rotate(%ddeg)"></i>'%(a) for a in range(0,360,30))
            body.append(('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">'
                '<div class="bornwrap"><div class="kicker"><div class="k-eyebrow">%s</div><div class="k-title">%s</div></div>'
                '<div class="born"><div class="dls">%s</div><div class="ring r1"></div><div class="ring r2"></div><div class="node">AI</div></div></div></div>')
                %(i,t0,win,tk,p["eyebrow"],kw(p["title"],"deal.",PRIMARY),lines))
            gsap.append("tl.from('%s .dl',{scaleX:0,opacity:0,stagger:0.03,duration:0.5,ease:'power3.out'},%.2f);"%(sid,t0+0.1))
            gsap.append("tl.from('%s .node',{scale:0,opacity:0,duration:0.5,ease:'back.out(1.8)'},%.2f);"%(sid,t0+0.55))
            gsap.append("tl.from('%s .ring',{scale:0,opacity:0,stagger:0.12,duration:0.5,ease:'back.out(1.6)'},%.2f);"%(sid,t0+0.7))
            gsap.append("tl.from('%s .k-eyebrow',{opacity:0,y:14,duration:0.3},%.2f);"%(sid,t0+0.2))
            gsap.append("tl.from('%s .k-title .w',{opacity:0,yPercent:90,filter:'blur(6px)',stagger:0.05,duration:0.4,ease:'power3.out'},%.2f);"%(sid,t0+0.3))
            gsap.append("tl.to('%s',{opacity:0,scale:1.06,filter:'blur(9px)',duration:0.3,ease:'power3.in'},%.2f);"%(sid,t1-0.02))

        elif kind=="cta":
            body.append(('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="ctawrap">'
                '<img class="b-logo" src="assets/logos/dialfyne.png"/><div class="cta-title">%s</div>'
                '<div class="cta-url">%s</div></div></div>')%(i,t0,win,tk,kw(p["title"],"free.",PRIMARY),p["url"]))
            gsap.append("tl.from('%s .b-logo',{opacity:0,scale:0.7,filter:'blur(8px)',duration:0.5,ease:'back.out(1.7)'},%.2f);"%(sid,t0))
            gsap.append("tl.from('%s .cta-title .w',{opacity:0,yPercent:90,stagger:0.05,duration:0.4,ease:'power3.out'},%.2f);"%(sid,t0+0.2))
            gsap.append("tl.fromTo('%s .cta-url',{opacity:0,y:16},{opacity:1,y:0,duration:0.4,ease:'power3.out'},%.2f);"%(sid,t0+0.5))
            gsap.append("tl.to('%s .cta-url',{scale:1.04,duration:0.6,yoyo:true,repeat:6,ease:'sine.inOut'},%.2f);"%(sid,t0+0.9))

    body.append('<audio id="music" preload="none" src="assets/music.mp3" data-start="0" data-duration="%.1f" data-track-index="100"></audio>'%DUR)
    css=CSS
    for k,v in [("__BG__",BG),("__PRIMARY__",PRIMARY),("__ACCENT__",ACCENT),("__RED__",RED),("__GREEN__",GREEN),
                ("__MUTED__",MUTED),("__FONT__",FONT),("__FONTFACE__",FONTFACE),("__W__",str(W)),("__H__",str(H))]:
        css=css.replace(k,v)
    doc=DOC.replace("__CSS__",css).replace("__W__",str(W)).replace("__H__",str(H)).replace("__DUR__",str(DUR)).replace("__BODY__","\n".join(body)).replace("__GSAP__","\n".join(gsap))
    open("index.html","w",encoding="utf-8").write(doc)
    print("wrote full story (%d events, %.1fs)"%(len(EVENTS),DUR))

CSS=r"""
__FONTFACE__
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:__W__px;height:__H__px;overflow:hidden;background:__BG__;font-family:__FONT__;color:#fff;-webkit-font-smoothing:antialiased}
#main{position:relative;width:__W__px;height:__H__px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 45%,rgba(42,147,245,.10),transparent 62%),__BG__}
.grid{position:absolute;inset:0;opacity:.045;background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:64px 64px;-webkit-mask-image:radial-gradient(ellipse 75% 65% at 50% 50%,#000,transparent 78%)}
.orb{position:absolute;border-radius:50%;opacity:.5}
.orb.a{width:1000px;height:1000px;left:-280px;top:-300px;background:radial-gradient(circle,rgba(42,147,245,.16),transparent 68%);animation:d1 22s ease-in-out infinite}
.orb.b{width:900px;height:900px;right:-260px;bottom:-300px;background:radial-gradient(circle,rgba(108,190,249,.12),transparent 68%);animation:d2 26s ease-in-out infinite}
@keyframes d1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,44px)}}@keyframes d2{0%,100%{transform:translate(0,0)}50%{transform:translate(-54px,-40px)}}
.flt{position:absolute;font-size:26px;font-weight:600;color:rgba(154,163,184,.16);white-space:nowrap;animation:flt 14s ease-in-out infinite}
@keyframes flt{0%,100%{transform:translate(0,0)}50%{transform:translate(0,-26px)}}
.ev{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 7%}
.line{font-size:104px;font-weight:850;letter-spacing:-.03em;line-height:1.05;max-width:90%}
.line.big{font-size:150px}.line.sm{font-size:84px}
.line .w{display:inline-block;margin:0 .14em;will-change:transform,opacity,filter}
.strikewrap{display:flex;flex-direction:column;gap:16px;align-items:center}
.srow{position:relative;display:inline-block}
.srow span{font-size:82px;font-weight:800;letter-spacing:-.02em;color:#fff}
.srow .strike{position:absolute;left:-6px;right:-6px;top:52%;height:7px;border-radius:4px;background:__RED__;transform-origin:left center;box-shadow:0 0 18px rgba(255,93,108,.7)}
.typed{font-size:80px;font-weight:800;letter-spacing:-.02em;font-family:ui-monospace,monospace;color:#fff;display:flex;align-items:center;gap:.3em}
.typed .brak{color:__PRIMARY__;font-weight:700}
.caret{display:inline-block;width:5px;height:.9em;background:__PRIMARY__;margin-left:4px;animation:blink 1.05s step-end infinite}
@keyframes blink{50%{opacity:0}}
.brandwrap{display:flex;flex-direction:column;align-items:center;gap:18px}
.b-logo{height:120px;filter:drop-shadow(0 18px 50px rgba(42,147,245,.35))}
.b-sub{font-size:42px;font-weight:800;letter-spacing:-.02em;color:rgba(255,255,255,.85)}
.kicker{margin-bottom:40px}
.k-eyebrow{font-size:19px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:__PRIMARY__;margin-bottom:14px}
.k-title{font-size:72px;font-weight:850;letter-spacing:-.03em}.k-title .w{display:inline-block;margin:0 .12em}
.crop{position:relative;overflow:hidden;border-radius:16px;box-shadow:0 50px 120px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08),0 0 80px rgba(42,147,245,.12)}
.crop img{position:absolute;display:block}
.hlbox{position:absolute;inset:8px;border:3px solid __PRIMARY__;border-radius:10px;box-shadow:0 0 34px rgba(42,147,245,.65),inset 0 0 22px rgba(42,147,245,.2);opacity:0}
.pop{position:absolute;top:calc(50% - 150px);background:__GREEN__;color:#04130c;font-size:24px;font-weight:800;padding:10px 20px;border-radius:999px;box-shadow:0 14px 40px rgba(52,211,153,.5);opacity:0}
.cursor{position:absolute;top:0;left:0;width:36px;height:36px;z-index:6;filter:drop-shadow(0 3px 6px rgba(0,0,0,.55))}
.metcard{background:linear-gradient(180deg,rgba(34,44,66,.9),rgba(16,22,38,.92));border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:44px 60px;box-shadow:0 50px 120px rgba(0,0,0,.55),0 0 80px rgba(42,147,245,.14);text-align:center}
.met-lbl{font-size:20px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)}
.met-v{font-size:140px;font-weight:850;letter-spacing:-.04em;line-height:1.05;color:#fff;font-variant-numeric:tabular-nums}
.met-d{font-size:40px;font-weight:800;color:__GREEN__;vertical-align:super}
.spark{width:340px;height:74px;margin:8px auto 0;display:block}
.bornwrap{display:flex;flex-direction:column;align-items:center}
.born{position:relative;width:360px;height:360px;display:flex;align-items:center;justify-content:center;margin-top:10px}
.dls{position:absolute;inset:0}
.dl{position:absolute;left:50%;top:50%;width:180px;height:2px;background:linear-gradient(90deg,transparent,rgba(42,147,245,.7));transform-origin:left center}
.ring{position:absolute;border-radius:50%;border:2px solid rgba(42,147,245,.5)}
.ring.r1{width:200px;height:200px}.ring.r2{width:280px;height:280px;border-color:rgba(42,147,245,.28)}
.node{width:120px;height:120px;border-radius:30px;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:850;color:#fff;box-shadow:0 0 60px rgba(42,147,245,.6);z-index:2}
.ctawrap{display:flex;flex-direction:column;align-items:center;gap:26px}
.cta-title{font-size:84px;font-weight:850;letter-spacing:-.03em}.cta-title .w{display:inline-block;margin:0 .12em}
.cta-url{font-size:34px;font-weight:800;color:#fff;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);padding:18px 40px;border-radius:14px;box-shadow:0 22px 60px rgba(42,147,245,.5)}
"""
DOC=r"""<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=__W__, height=__H__"/>
<title>Dialfyne — Story</title><script src="assets/gsap.min.js"></script><style>__CSS__</style></head><body>
<div id="main" data-composition-id="main" data-width="__W__" data-height="__H__" data-start="0" data-duration="__DUR__">
__BODY__
<script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});
__GSAP__
window.__timelines['main']=tl;</script></div></body></html>"""
if __name__=="__main__": build()
