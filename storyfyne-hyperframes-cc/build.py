#!/usr/bin/env python3
"""
Dialfyne — Command Center ("just ask your data"). VO-driven, ~80s, 9:16 (default).
`python build.py landscape` for 16:9.

Beat script + reusable library (line/strike/brand/cta/grab) + custom components built
for this story (dashboards chaos, ask-your-data chat, 3 pillars). Animation = set()+to()
only (no from()) so the seek renderer never flickers. Kinetic beats timed to the SRT.
"""
import sys, json as _j
LANDSCAPE = any(a in ("landscape","16:9","wide","--landscape") for a in sys.argv[1:])
PORTRAIT = not LANDSCAPE
W, H = (1920,1080) if LANDSCAPE else (1080,1920)
FPS, DUR = 30, 80.6
PRIMARY, ACCENT, BG = "#2a93f5", "#1f86f0", "#060912"
RED, GREEN, AMBER, MUTED = "#ff5d6c", "#34d399", "#ffb454", "#9aa3b8"
FONT = "Inter,-apple-system,sans-serif"
def js(s): return _j.dumps(s)
NAT={"opacity":"1","x":"0","y":"0","yPercent":"0","xPercent":"0","scale":"1","scaleX":"1","rotation":"0","filter":"'blur(0px)'","clipPath":"'inset(0 0% 0 0)'","width":"'100%'"}
def rev(sel,init,at,t0,tail=""):
    ij="{"+",".join("%s:%s"%(k,init[k]) for k in init)+"}"
    tj="{"+",".join("%s:%s"%(k,NAT[k]) for k in init)+(("," +tail) if tail else "")+"}"
    return ["tl.set('%s',%s,%.2f);"%(sel,ij,max(0,t0)),"tl.to('%s',%s,%.2f);"%(sel,tj,at)]
def kw(text,accent="",color=PRIMARY):
    aset=set(accent.split()) if accent else set()
    return "".join('<span class="w"%s>%s</span>'%((' style="color:%s"'%color) if w.strip(".,!?") in aset else "",w) for w in text.split(" "))
def crop(IW,IH,fx0,fy0,fw,fh,VW):
    iw=VW/fw; ih=iw*IH/IW
    return dict(VW=round(VW),VH=round(fh*ih),imgW=round(iw),imgL=round(-fx0*iw),imgT=round(-fy0*ih))

# ── Beat script (start, end, type, payload) — times from the SRT ─────
S=[
 (0.3, 2.5,  "line", dict(t="Every morning,")),
 (2.5, 4.6,  "line", dict(t="your team plays detective.", acc="detective.")),
 (4.6, 7.5,  "line", dict(t="Reconstructing yesterday.")),
 (7.6, 13.4, "dash", dict(items=["CRM","Calendar","Reports","Phone logs","Inbox"], cap="Five dashboards. Every morning.")),
 (13.6,17.3, "line", dict(t="We killed that.", big=True)),
 (17.4,19.7, "line", dict(t="Your data,")),
 (19.7,21.7, "line", dict(t="connected to your AI.", acc="AI.")),
 (21.8,26.6, "line", dict(t="No more clicking through screens.")),
 (26.6,28.4, "line", dict(t="You just ask.", big=True)),
 (28.4,36.4, "ask", dict(qas=[
     ("How many leads did we miss this week?", "12", "missed · 3 high-value", AMBER, 28.5, 30.7),
     ("Which deals are stalling?", "4", "deals idle 7+ days", RED, 30.8, 32.5),
     ("Who needs more sales practice?", "2", "reps below benchmark", PRIMARY, 32.6, 34.6)], boom=34.9)),
 (36.5,41.0, "grab", dict(asset="revenue-command-center.png", img=(1184,1296), crop=(0.02,0.105,0.96,0.135),
                          eyebrow="Pulled from your live pipeline", title="Answers in seconds.")),
 (41.2,45.4, "strike", dict(names=["No exports","No spreadsheets","No guessing"])),
 (45.8,49.0, "line", dict(t="Just talk to your data.", acc="data.")),
 (49.2,52.1, "line", dict(t="Stop wasting time.")),
 (52.1,55.6, "line", dict(t="Start closing deals.", acc="closing", big=True)),
 (55.8,58.1, "brand", dict(sub="That's Dialfyne.")),
 (58.1,62.9, "pillars", dict(items=[("AI voice agents","&#9742;"),("Sales training","&#9678;"),("Automations","&#9889;")], cap="All of it.")),
 (63.1,66.5, "line", dict(t="No more five dashboards.")),
 (66.5,68.4, "line", dict(t="Just ask.")),
 (68.4,72.0, "line", dict(t="Get answers.", acc="answers.", big=True)),
 (72.8,77.3, "cta", dict(title="dialfyne.com", sub="See if it fits your team.")),
 (77.4,80.5, "line", dict(t="Let's simplify how you run things.", acc="simplify")),
]
FONTFACE="\n".join("@font-face{font-family:'Inter';font-weight:%s;font-style:normal;font-display:block;src:url('assets/fonts/inter-latin-%s-normal.woff2') format('woff2')}"%(w,w) for w in (400,500,600,700,800,900))

def build():
    body,gsap=[],[]
    body.append('<div class="bg clip" data-start="0" data-duration="%.1f" data-track-index="1"><div class="grid"></div><div class="orb a"></div><div class="orb b"></div></div>'%DUR)

    for i,(t0,t1,kind,p) in enumerate(S):
        sid="#ev-%d"%i; win=(t1-t0)+0.35; tk=10+i; xt=t1-0.04

        if kind=="line":
            cls="line"+(" big" if p.get("big") else "")
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="%s">%s</div></div>'%(i,t0,win,tk,cls,kw(p["t"],p.get("acc",""))))
            gsap+=rev("%s .w"%sid,{"opacity":"0","yPercent":"95","filter":"'blur(7px)'"},t0,t0,"duration:0.42,ease:'back.out(1.5)',stagger:0.05")
            gsap.append("tl.to('%s .w',{opacity:0,yPercent:-55,filter:'blur(6px)',stagger:0.02,duration:0.26,ease:'power3.in'},%.2f);"%(sid,t1-0.02))

        elif kind=="dash":
            wins="".join('<div class="dwin d%d"><div class="dchrome"><i></i><i></i><i></i></div><div class="dbar b1"></div><div class="dbar b2"></div><div class="dbar b3"></div><div class="dlabel">%s</div></div>'%(j,lab) for j,lab in enumerate(p["items"]))
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="dashwrap"><div class="dscatter">%s</div><div class="dcap">%s</div></div></div>'%(i,t0,win,tk,wins,kw(p["cap"],"dashboards. dashboards",RED)))
            for j in range(len(p["items"])):
                gsap+=rev("%s .d%d"%(sid,j),{"opacity":"0","scale":"0.6","y":"40"},t0+0.15+j*0.18,t0,"duration:0.4,ease:'back.out(1.6)'")
            gsap.append("tl.to('%s .dwin',{x:'+=4',y:'+=3',rotation:'+=0.6',duration:0.12,repeat:7,yoyo:true,ease:'none'},%.2f);"%(sid,t0+1.6))
            gsap+=rev("%s .dcap .w"%sid,{"opacity":"0","yPercent":"90"},t0+2.0,t0,"duration:0.4,ease:'power3.out',stagger:0.05")
            gsap.append("tl.to('%s',{opacity:0,scale:0.95,filter:'blur(8px)',duration:0.3,ease:'power3.in'},%.2f);"%(sid,xt))

        elif kind=="ask":
            qas=p["qas"]
            bubbles=""
            for j,(q,big,sub,col,qs,as_) in enumerate(qas):
                bubbles+=('<div class="qrow q%d"><div class="qbub"><span id="q-%d-%d"></span><span class="caret"></span></div></div>'
                          '<div class="arow a%d"><div class="abub"><div class="anum" style="color:%s">%s</div><div class="asub">%s</div></div></div>'%(j,i,j,j,col,big,sub))
            body.append(('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="askpanel">'
                '<div class="askhdr"><div class="askav">D</div><div><div class="askname">Ask Dialfyne</div><div class="asksub">Connected to Claude &amp; ChatGPT</div></div><span class="livedot"></span></div>'
                '<div class="askbody">%s</div></div></div>')%(i,t0,win,tk,bubbles))
            gsap+=rev("%s .askpanel"%sid,{"opacity":"0","y":"60","scale":"0.95","filter":"'blur(10px)'"},t0,t0,"duration:0.5,ease:'back.out(1.3)'")
            gsap+=rev("%s .askhdr"%sid,{"opacity":"0","y":"-8"},t0+0.2,t0,"duration:0.4,ease:'power3.out'")
            for j,(q,big,sub,col,qs,as_) in enumerate(qas):
                gsap+=rev("%s .q%d"%(sid,j),{"opacity":"0","y":"18"},qs,t0,"duration:0.3,ease:'power3.out'")
                gsap.append("(function(){var o={n:0};tl.to(o,{n:%d,duration:%.2f,ease:'none',onUpdate:function(){var e=document.getElementById('q-%d-%d');if(e)e.textContent=%s.slice(0,Math.round(o.n));}},%.2f);})();"%(len(q),(as_-qs)*0.62,i,j,js(q),qs+0.15))
                gsap+=rev("%s .a%d"%(sid,j),{"opacity":"0","y":"22","scale":"0.9"},as_,t0,"duration:0.4,ease:'back.out(1.8)'")
            gsap.append("tl.to('%s .askpanel',{scale:1.02,duration:0.12,yoyo:true,repeat:1,ease:'power2.out'},%.2f);"%(sid,p["boom"]))
            gsap.append("tl.to('%s',{opacity:0,scale:1.04,filter:'blur(9px)',duration:0.32,ease:'power3.in'},%.2f);"%(sid,xt))

        elif kind=="grab":
            vw=round(W*0.92) if PORTRAIT else round(W*0.78)
            c=crop(*p["img"],*p["crop"],vw)
            body.append(('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">'
                '<div class="kicker"><div class="k-eyebrow">%s</div><div class="k-title">%s</div></div>'
                '<div class="crop" style="width:%dpx;height:%dpx"><img src="assets/shots/%s" style="width:%dpx;left:%dpx;top:%dpx"/><div class="hlbox"></div></div></div>')
                %(i,t0,win,tk,p["eyebrow"],kw(p["title"],"",PRIMARY),c["VW"],c["VH"],p["asset"],c["imgW"],c["imgL"],c["imgT"]))
            gsap+=rev("%s .crop"%sid,{"opacity":"0","scale":"0.94","filter":"'blur(8px)'"},t0,t0,"duration:0.4,ease:'back.out(1.3)'")
            gsap+=rev("%s .crop img"%sid,{"clipPath":"'inset(0 100% 0 0)'"},t0+0.05,t0,"duration:0.5,ease:'power3.out'")
            gsap+=rev("%s .k-eyebrow"%sid,{"opacity":"0","y":"14"},t0+0.15,t0,"duration:0.3")
            gsap+=rev("%s .k-title .w"%sid,{"opacity":"0","yPercent":"90","filter":"'blur(6px)'"},t0+0.22,t0,"duration:0.4,ease:'power3.out',stagger:0.05")
            gsap+=rev("%s .hlbox"%sid,{"opacity":"0","scale":"1.1"},t0+(t1-t0)*0.5,t0,"duration:0.22,ease:'back.out(2)'")
            gsap.append("tl.to('%s',{opacity:0,scale:1.05,filter:'blur(9px)',duration:0.3,ease:'power3.in'},%.2f);"%(sid,xt))

        elif kind=="strike":
            rows="".join('<div class="srow" id="ev-%d-r%d"><span>%s</span><i class="strike"></i></div>'%(i,j,nm) for j,nm in enumerate(p["names"]))
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="strikewrap">%s</div></div>'%(i,t0,win,tk,rows))
            for j in range(len(p["names"])):
                nt=t0+0.2+j*0.7
                gsap+=rev("#ev-%d-r%d span"%(i,j),{"opacity":"0","x":"-40","filter":"'blur(6px)'"},nt,t0,"duration:0.3,ease:'power3.out'")
                gsap+=rev("#ev-%d-r%d .strike"%(i,j),{"scaleX":"0"},nt+0.22,t0,"duration:0.22,ease:'power3.out'")
                gsap.append("tl.to('#ev-%d-r%d span',{opacity:0.4,duration:0.3},%.2f);"%(i,j,nt+0.34))
            gsap.append("tl.to('%s',{opacity:0,scale:0.95,filter:'blur(8px)',duration:0.28,ease:'power3.in'},%.2f);"%(sid,xt))

        elif kind=="brand":
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="brandwrap"><img class="b-logo" src="assets/logos/dialfyne.png"/><div class="b-sub">%s</div></div></div>'%(i,t0,win,tk,p["sub"]))
            gsap+=rev("%s .b-logo"%sid,{"opacity":"0","scale":"0.6","filter":"'blur(10px)'"},t0,t0,"duration:0.55,ease:'back.out(1.7)'")
            gsap+=rev("%s .b-sub"%sid,{"opacity":"0","y":"18"},t0+0.25,t0,"duration:0.4,ease:'power3.out'")
            gsap.append("tl.to('%s',{opacity:0,scale:1.08,filter:'blur(8px)',duration:0.28,ease:'power3.in'},%.2f);"%(sid,xt))

        elif kind=="pillars":
            cols="".join('<div class="pcol pc%d"><div class="picon">%s</div><div class="plabel">%s</div></div>'%(j,ic,lab) for j,(lab,ic) in enumerate(p["items"]))
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="pillwrap"><div class="pillrow">%s</div><div class="dcap">%s</div></div></div>'%(i,t0,win,tk,cols,kw(p["cap"],"")))
            for j in range(len(p["items"])):
                gsap+=rev("%s .pc%d"%(sid,j),{"opacity":"0","y":"50","scale":"0.9"},t0+0.2+j*0.22,t0,"duration:0.45,ease:'back.out(1.5)'")
            gsap+=rev("%s .dcap .w"%sid,{"opacity":"0","yPercent":"90"},t0+1.4,t0,"duration:0.4,ease:'power3.out',stagger:0.05")
            gsap.append("tl.to('%s',{opacity:0,scale:1.05,filter:'blur(8px)',duration:0.3,ease:'power3.in'},%.2f);"%(sid,xt))

        elif kind=="cta":
            body.append('<div id="ev-%d" class="ev clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="ctawrap"><img class="b-logo" src="assets/logos/dialfyne.png"/><div class="cta-url">%s</div><div class="cta-sub">%s</div></div></div>'%(i,t0,win,tk,p["title"],p["sub"]))
            gsap+=rev("%s .b-logo"%sid,{"opacity":"0","scale":"0.7","filter":"'blur(8px)'"},t0,t0,"duration:0.5,ease:'back.out(1.7)'")
            gsap+=rev("%s .cta-url"%sid,{"opacity":"0","y":"16","scale":"0.9"},t0+0.25,t0,"duration:0.45,ease:'back.out(1.6)'")
            gsap+=rev("%s .cta-sub"%sid,{"opacity":"0","y":"14"},t0+0.5,t0,"duration:0.4,ease:'power3.out'")
            gsap.append("tl.to('%s',{opacity:0,scale:1.05,filter:'blur(8px)',duration:0.3,ease:'power3.in'},%.2f);"%(sid,xt))

    body.append('<audio id="snd" preload="none" src="assets/soundtrack.mp3" data-start="0" data-duration="%.1f" data-track-index="100"></audio>'%DUR)
    css=CSS+(PORTRAIT_CSS if PORTRAIT else "")
    for k,v in [("__BG__",BG),("__PRIMARY__",PRIMARY),("__ACCENT__",ACCENT),("__RED__",RED),("__GREEN__",GREEN),("__AMBER__",AMBER),("__MUTED__",MUTED),("__FONT__",FONT),("__FONTFACE__",FONTFACE),("__W__",str(W)),("__H__",str(H))]:
        css=css.replace(k,v)
    doc=DOC.replace("__CSS__",css).replace("__W__",str(W)).replace("__H__",str(H)).replace("__DUR__",str(DUR)).replace("__BODY__","\n".join(body)).replace("__GSAP__","\n".join(gsap)).replace("__BODYCLASS__","p" if PORTRAIT else "")
    open("index.html","w",encoding="utf-8").write(doc)
    print("wrote CC story (%s %dx%d, %d beats, %.1fs)"%("PORTRAIT" if PORTRAIT else "landscape",W,H,len(S),DUR))

CSS=r"""
__FONTFACE__
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:__W__px;height:__H__px;overflow:hidden;background:__BG__;font-family:__FONT__;color:#fff;-webkit-font-smoothing:antialiased}
#main{position:relative;width:__W__px;height:__H__px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 62% 46% at 50% 42%,rgba(42,147,245,.11),transparent 62%),__BG__}
.grid{position:absolute;inset:0;opacity:.045;background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse 78% 60% at 50% 48%,#000,transparent 80%)}
.orb{position:absolute;border-radius:50%;opacity:.5}
.orb.a{width:900px;height:900px;left:-240px;top:-220px;background:radial-gradient(circle,rgba(42,147,245,.16),transparent 68%);animation:d1 22s ease-in-out infinite}
.orb.b{width:820px;height:820px;right:-220px;bottom:-240px;background:radial-gradient(circle,rgba(108,190,249,.12),transparent 68%);animation:d2 26s ease-in-out infinite}
@keyframes d1{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,40px)}}@keyframes d2{0%,100%{transform:translate(0,0)}50%{transform:translate(-44px,-34px)}}
.ev{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 7%}
.line{font-size:108px;font-weight:850;letter-spacing:-.03em;line-height:1.04;max-width:92%}.line.big{font-size:150px}
.line .w{display:inline-block;margin:0 .14em;will-change:transform,opacity,filter}
.kicker{margin-bottom:38px}
.k-eyebrow{font-size:19px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:__PRIMARY__;margin-bottom:14px}
.k-title{font-size:74px;font-weight:850;letter-spacing:-.03em}.k-title .w{display:inline-block;margin:0 .12em}
.crop{position:relative;overflow:hidden;border-radius:16px;box-shadow:0 50px 120px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08),0 0 80px rgba(42,147,245,.12)}
.crop img{position:absolute;display:block}
.hlbox{position:absolute;inset:8px;border:3px solid __PRIMARY__;border-radius:10px;box-shadow:0 0 34px rgba(42,147,245,.6),inset 0 0 22px rgba(42,147,245,.2);opacity:0}
/* dashboards chaos */
.dashwrap{display:flex;flex-direction:column;align-items:center;gap:40px}
.dscatter{position:relative;width:820px;height:560px}
.dwin{position:absolute;width:300px;height:200px;background:#11151f;border:1px solid rgba(255,255,255,.1);border-radius:12px;box-shadow:0 30px 70px rgba(0,0,0,.5);padding:14px;will-change:transform}
.dwin .dchrome{display:flex;gap:6px;margin-bottom:12px}.dchrome i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.2)}
.dbar{height:12px;border-radius:6px;background:rgba(255,255,255,.08);margin-bottom:9px}.b1{width:80%}.b2{width:95%}.b3{width:65%}
.dlabel{position:absolute;bottom:12px;left:14px;font-size:18px;font-weight:800;color:__PRIMARY__}
.d0{left:20px;top:30px;transform:rotate(-6deg)}.d1{left:300px;top:0;transform:rotate(4deg)}.d2{left:520px;top:60px;transform:rotate(-3deg)}
.d3{left:120px;top:300px;transform:rotate(5deg)}.d4{left:430px;top:330px;transform:rotate(-7deg)}
.dcap{font-size:80px;font-weight:850;letter-spacing:-.03em}.dcap .w{display:inline-block;margin:0 .12em}
/* ask chat */
.askpanel{width:760px;border-radius:30px;background:linear-gradient(180deg,rgba(22,30,48,.96),rgba(12,18,30,.97));border:1px solid rgba(255,255,255,.13);box-shadow:0 60px 140px rgba(0,0,0,.6),0 0 90px rgba(42,147,245,.16);overflow:hidden}
.askhdr{display:flex;align-items:center;gap:16px;padding:24px 28px;border-bottom:1px solid rgba(255,255,255,.08)}
.askav{width:54px;height:54px;border-radius:15px;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-weight:850;font-size:24px}
.askname{font-size:24px;font-weight:800}.asksub{font-size:16px;color:__PRIMARY__;font-weight:600;margin-top:2px}
.livedot{margin-left:auto;width:12px;height:12px;border-radius:50%;background:__GREEN__;box-shadow:0 0 12px __GREEN__;animation:blink 1.4s step-end infinite}
.askbody{padding:26px 28px;display:flex;flex-direction:column;gap:16px;min-height:520px}
.qrow{display:flex;justify-content:flex-end}.qbub{max-width:80%;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);color:#fff;font-size:26px;font-weight:600;padding:16px 22px;border-radius:20px 20px 6px 20px;line-height:1.35}
.arow{display:flex;justify-content:flex-start}.abub{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:20px 20px 20px 6px;padding:18px 26px;text-align:left}
.anum{font-size:74px;font-weight:850;line-height:1;letter-spacing:-.03em}.asub{font-size:22px;color:rgba(255,255,255,.7);font-weight:600;margin-top:6px}
.caret{display:inline-block;width:3px;height:1em;background:#fff;margin-left:3px;vertical-align:middle;animation:blink 1.05s step-end infinite}
@keyframes blink{50%{opacity:0}}
/* pillars */
.pillwrap{display:flex;flex-direction:column;align-items:center;gap:48px}
.pillrow{display:flex;gap:28px}
.pcol{width:300px;padding:44px 28px;border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px rgba(0,0,0,.4);display:flex;flex-direction:column;align-items:center;gap:22px}
.picon{width:96px;height:96px;border-radius:24px;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-size:48px;box-shadow:0 16px 44px rgba(42,147,245,.4)}
.plabel{font-size:30px;font-weight:800;letter-spacing:-.02em;text-align:center;line-height:1.2}
/* brand / cta */
.brandwrap,.ctawrap{display:flex;flex-direction:column;align-items:center;gap:22px}
.b-logo{height:130px;filter:drop-shadow(0 18px 50px rgba(42,147,245,.35))}
.b-sub{font-size:54px;font-weight:850;letter-spacing:-.03em}
.cta-url{font-size:64px;font-weight:850;letter-spacing:-.03em;color:#fff;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);padding:18px 44px;border-radius:18px;box-shadow:0 22px 60px rgba(42,147,245,.5)}
.cta-sub{font-size:34px;font-weight:600;color:rgba(255,255,255,.72)}
.srow{position:relative;display:inline-block}.strikewrap{display:flex;flex-direction:column;gap:16px;align-items:center}
.srow span{font-size:82px;font-weight:800;letter-spacing:-.02em;color:#fff}
.srow .strike{position:absolute;left:-6px;right:-6px;top:52%;height:7px;border-radius:4px;background:__RED__;transform-origin:left center;box-shadow:0 0 18px rgba(255,93,108,.7)}
"""
PORTRAIT_CSS=r"""
body.p .ev{padding:0 6%}
body.p .line{font-size:84px}body.p .line.big{font-size:112px}
body.p .k-title{font-size:60px}
body.p .dscatter{width:880px;height:1000px;transform:scale(.92)}
body.p .dwin{width:340px;height:220px}
body.p .d0{left:10px;top:40px}.d1{left:430px;top:0}body.p .d1{left:430px;top:0}body.p .d2{left:160px;top:300px}
body.p .d3{left:520px;top:340px}body.p .d4{left:60px;top:640px}
body.p .dcap{font-size:64px}
body.p .askpanel{width:92%}body.p .askbody{min-height:0;gap:14px;padding:24px}
body.p .qbub{font-size:24px}body.p .anum{font-size:64px}body.p .asub{font-size:20px}
body.p .pillrow{flex-direction:column;gap:18px}body.p .pcol{width:560px;flex-direction:row;justify-content:flex-start;padding:26px 30px;gap:26px}
body.p .picon{width:72px;height:72px;font-size:38px}body.p .plabel{font-size:30px;text-align:left}
body.p .b-sub{font-size:46px}body.p .cta-url{font-size:54px}body.p .cta-sub{font-size:30px}
body.p .srow span{font-size:64px}
"""
DOC=r"""<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=__W__, height=__H__"/>
<title>Dialfyne — Command Center</title><script src="assets/gsap.min.js"></script><style>__CSS__</style></head><body class="__BODYCLASS__">
<div id="main" data-composition-id="main" data-width="__W__" data-height="__H__" data-start="0" data-duration="__DUR__">
__BODY__
<script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});
__GSAP__
window.__timelines['main']=tl;</script></div></body></html>"""
if __name__=="__main__": build()
