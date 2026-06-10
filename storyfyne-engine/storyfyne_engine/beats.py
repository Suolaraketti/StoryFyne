"""The beat library.

Each beat type = one function that returns (html, [gsap lines]) plus CSS fragments.
Authors never write HTML/GSAP — they write JSON beats (see AUTHORING.md).
All motion goes through anim.rev()/anim.out() => seek-safe, no flicker.

Beat builder signature:
    build(i, beat, ctx, last) -> (html_str, [gsap_str])
ctx: dict with W, H, PORTRAIT, theme, and helper color().
"""
import os
from .anim import rev, out, kw, crop_box, esc, js

REGISTRY = {}          # kind -> dict(build=fn, css=str, pcss=str, required=tuple)

def beat(kind, css="", pcss="", required=()):
    def deco(fn):
        REGISTRY[kind] = dict(build=fn, css=css, pcss=pcss, required=required)
        return fn
    return deco


def _shell(i, t0, win, track, inner):
    return ('<div id="ev-%d" class="ev clip" data-start="%.3f" data-duration="%.3f" '
            'data-track-index="%d">%s</div>' % (i, t0, win, track, inner))


# ── line ─────────────────────────────────────────────────────────────
@beat("line", required=("t",))
def line(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    cls = "line" + (" big" if b.get("size") == "big" else "") + (" sm" if b.get("size") == "sm" else "")
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="%s">%s</div>' % (cls, kw(esc(b["t"]), b.get("acc", ""), ctx["color"](b.get("col")))))
    g = rev("%s .w" % sid, {"opacity": "0", "yPercent": "95", "filter": "'blur(7px)'"},
            t0, t0, "duration:0.42,ease:'back.out(1.5)',stagger:0.05")
    if not last:
        g.append("tl.to('%s .w',{opacity:0,yPercent:-55,filter:'blur(6px)',stagger:0.015,"
                 "duration:0.22,ease:'power3.in'},%.3f);" % (sid, t1 - 0.06))
    return html, g


# ── typewriter ───────────────────────────────────────────────────────
_TYPE_CSS = r"""
.typed{font-size:80px;font-weight:800;letter-spacing:-.02em;font-family:ui-monospace,monospace;color:__TEXT__;display:flex;align-items:center;gap:.3em}
.typed .brak{color:__PRIMARY__;font-weight:700}
"""
_TYPE_PCSS = "body.p .typed{font-size:48px}\n"

@beat("typewriter", css=_TYPE_CSS, pcss=_TYPE_PCSS, required=("t",))
def typewriter(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="typed"><span class="brak">&gt;_</span> <span id="tw-%d"></span>'
                  '<span class="caret"></span></div>' % i)
    txt = b["t"]
    g = rev(sid, {"opacity": "0", "y": "20"}, t0, t0, "duration:0.4,ease:'power3.out'")
    g.append("(function(){var o={n:0};tl.to(o,{n:%d,duration:%.2f,ease:'none',"
             "onUpdate:function(){var e=document.getElementById('tw-%d');"
             "if(e)e.textContent=%s.slice(0,Math.round(o.n));}},%.3f);})();"
             % (len(txt), (t1 - t0) * 0.55, i, js(txt), t0 + 0.3))
    if not last:
        g.append("tl.to('%s',{opacity:0,y:-16,duration:0.25,ease:'power3.in'},%.3f);" % (sid, t1 - 0.04))
    return html, g


# ── strike ───────────────────────────────────────────────────────────
_STRIKE_CSS = r"""
.strikewrap{display:flex;flex-direction:column;gap:16px;align-items:center}
.srow{position:relative;display:inline-block}
.srow span{font-size:82px;font-weight:800;letter-spacing:-.02em;color:__TEXT__}
.srow .strike{position:absolute;left:-6px;right:-6px;top:52%;height:7px;border-radius:4px;background:__RED__;transform-origin:left center;box-shadow:0 0 18px rgba(255,93,108,.7)}
"""
_STRIKE_PCSS = "body.p .srow span{font-size:62px}\n"

@beat("strike", css=_STRIKE_CSS, pcss=_STRIKE_PCSS, required=("names",))
def strike(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    names = b["names"]
    times = b.get("times") or [t0 + 0.2 + j * 0.7 for j in range(len(names))]
    rows = "".join('<div class="srow" id="ev-%d-r%d"><span>%s</span><i class="strike"></i></div>'
                   % (i, j, esc(nm)) for j, nm in enumerate(names))
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i, '<div class="strikewrap">%s</div>' % rows)
    g = []
    for j, nt in enumerate(times[:len(names)]):
        g += rev("#ev-%d-r%d span" % (i, j), {"opacity": "0", "x": "-40", "filter": "'blur(6px)'"},
                 nt, t0, "duration:0.3,ease:'power3.out'")
        g += rev("#ev-%d-r%d .strike" % (i, j), {"scaleX": "0"}, nt + 0.22, t0,
                 "duration:0.22,ease:'power3.out'")
        g.append("tl.to('#ev-%d-r%d span',{opacity:0.4,duration:0.3},%.3f);" % (i, j, nt + 0.34))
    if not last:
        g += out(sid, t1 - 0.02, "shrink")
    return html, g


# ── brand ────────────────────────────────────────────────────────────
_BRAND_CSS = r"""
.brandwrap{display:flex;flex-direction:column;align-items:center;gap:20px}
.b-logo{height:130px;filter:drop-shadow(0 18px 50px rgba(42,147,245,.35))}
.b-sub{font-size:54px;font-weight:850;letter-spacing:-.03em}
"""
_BRAND_PCSS = "body.p .b-logo{height:96px}body.p .b-sub{font-size:44px}\n"

@beat("brand", css=_BRAND_CSS, pcss=_BRAND_PCSS)
def brand(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    sub = ('<div class="b-sub">%s</div>' % esc(b["sub"])) if b.get("sub") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="brandwrap"><img class="b-logo" src="%s"/>%s</div>' % (ctx["logo"], sub))
    g = rev("%s .b-logo" % sid, {"opacity": "0", "scale": "0.6", "filter": "'blur(10px)'"},
            t0, t0, "duration:0.55,ease:'back.out(1.7)'")
    if b.get("sub"):
        g += rev("%s .b-sub" % sid, {"opacity": "0", "y": "18"}, t0 + 0.25, t0,
                 "duration:0.4,ease:'power3.out'")
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── cta ──────────────────────────────────────────────────────────────
_CTA_CSS = r"""
.ctawrap{display:flex;flex-direction:column;align-items:center;gap:24px}
.ctawrap .b-logo{height:100px}
.cta-head{font-size:84px;font-weight:850;letter-spacing:-.03em}.cta-head .w{display:inline-block;margin:0 .12em}
.cta-url{font-size:58px;font-weight:850;letter-spacing:-.02em;color:#fff;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);padding:18px 44px;border-radius:18px;box-shadow:0 22px 60px rgba(42,147,245,.5)}
.cta-sub{font-size:34px;font-weight:600;color:rgba(255,255,255,.72)}
"""
_CTA_PCSS = "body.p .cta-head{font-size:60px}body.p .cta-url{font-size:48px}body.p .cta-sub{font-size:28px}\n"

@beat("cta", css=_CTA_CSS, pcss=_CTA_PCSS, required=("url",))
def cta(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    head = ('<div class="cta-head">%s</div>' % kw(esc(b["headline"]), b.get("acc", ""), ctx["color"](b.get("col")))) if b.get("headline") else ""
    sub = ('<div class="cta-sub">%s</div>' % esc(b["sub"])) if b.get("sub") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="ctawrap"><img class="b-logo" src="%s"/>%s<div class="cta-url">%s</div>%s</div>'
                  % (ctx["logo"], head, esc(b["url"]), sub))
    g = rev("%s .b-logo" % sid, {"opacity": "0", "scale": "0.7", "filter": "'blur(8px)'"},
            t0, t0, "duration:0.5,ease:'back.out(1.7)'")
    if b.get("headline"):
        g += rev("%s .cta-head .w" % sid, {"opacity": "0", "yPercent": "90"}, t0 + 0.2, t0,
                 "duration:0.4,ease:'power3.out',stagger:0.05")
    g += rev("%s .cta-url" % sid, {"opacity": "0", "y": "16", "scale": "0.9"}, t0 + 0.35, t0,
             "duration:0.45,ease:'back.out(1.6)'")
    if b.get("sub"):
        g += rev("%s .cta-sub" % sid, {"opacity": "0", "y": "14"}, t0 + 0.55, t0,
                 "duration:0.4,ease:'power3.out'")
    g.append("tl.to('%s .cta-url',{scale:1.04,duration:0.6,yoyo:true,repeat:4,ease:'sine.inOut'},%.3f);"
             % (sid, t0 + 1.0))
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── grab (cropped real-UI proof shot) ────────────────────────────────
_GRAB_CSS = r"""
.crop{position:relative;overflow:hidden;border-radius:16px;box-shadow:0 50px 120px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08),0 0 80px rgba(42,147,245,.12)}
.crop img{position:absolute;display:block}
.hlbox{position:absolute;inset:8px;border:3px solid __PRIMARY__;border-radius:10px;box-shadow:0 0 34px rgba(42,147,245,.6),inset 0 0 22px rgba(42,147,245,.2);opacity:0}
.pop{position:absolute;top:calc(50% - 150px);background:__GREEN__;color:#04130c;font-size:24px;font-weight:800;padding:10px 20px;border-radius:999px;box-shadow:0 14px 40px rgba(52,211,153,.5);opacity:0}
.gcursor{position:absolute;top:0;left:0;width:36px;height:36px;z-index:6;filter:drop-shadow(0 3px 6px rgba(0,0,0,.55))}
"""

@beat("grab", css=_GRAB_CSS, required=("asset", "img", "crop", "title"))
def grab(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    W = ctx["W"]
    vw = round(W * 0.92) if ctx["PORTRAIT"] else b.get("vw", round(W * 0.78))
    c = crop_box(*b["img"], *b["crop"], vw)
    eyebrow = ('<div class="k-eyebrow">%s</div>' % esc(b["eyebrow"])) if b.get("eyebrow") else ""
    pop = ('<div class="pop">%s</div>' % b["pop"]) if b.get("pop") else ""
    cursor = ('<svg class="gcursor" viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15 L12.5 22 L15 21 '
              'L11.5 14 L18 14 Z" fill="#fff" stroke="#0a0a0a" stroke-width="1.2"/></svg>') if b.get("cursor") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="kicker">%s<div class="k-title">%s</div></div>'
                  '<div class="crop" style="width:%dpx;height:%dpx"><img src="%s" '
                  'style="width:%dpx;left:%dpx;top:%dpx"/><div class="hlbox"></div></div>%s%s'
                  % (eyebrow, kw(esc(b["title"]), b.get("acc", ""), ctx["color"](b.get("col"))),
                     c["VW"], c["VH"], b["asset"], c["imgW"], c["imgL"], c["imgT"], pop, cursor))
    g = rev("%s .crop" % sid, {"opacity": "0", "scale": "0.94", "filter": "'blur(8px)'"},
            t0, t0, "duration:0.4,ease:'back.out(1.3)'")
    g += rev("%s .crop img" % sid, {"clipPath": "'inset(0 100% 0 0)'"}, t0 + 0.05, t0,
             "duration:0.5,ease:'power3.out'")
    if b.get("eyebrow"):
        g += rev("%s .k-eyebrow" % sid, {"opacity": "0", "y": "14"}, t0 + 0.15, t0, "duration:0.3")
    g += rev("%s .k-title .w" % sid, {"opacity": "0", "yPercent": "90", "filter": "'blur(6px)'"},
             t0 + 0.22, t0, "duration:0.4,ease:'power3.out',stagger:0.05")
    mid = t0 + (t1 - t0) * 0.5
    if b.get("cursor"):
        H = ctx["H"]
        g.append("tl.set('%s .gcursor',{x:%d,y:%d},%.3f);" % (sid, W // 2 + 360, H // 2 + 120, t0))
        g.append("tl.to('%s .gcursor',{x:%d,y:%d,duration:0.55,ease:'power3.inOut'},%.3f);"
                 % (sid, round(W // 2 + c["VW"] * 0.34), H // 2, t0 + 0.5))
        g.append("tl.to('%s .gcursor',{scale:0.85,duration:0.08,yoyo:true,repeat:1},%.3f);" % (sid, mid))
    g += rev("%s .hlbox" % sid, {"opacity": "0", "scale": "1.1"}, mid, t0, "duration:0.22,ease:'back.out(2)'")
    if b.get("pop"):
        g += rev("%s .pop" % sid, {"opacity": "0", "y": "14", "scale": "0.8"}, mid + 0.12, t0,
                 "duration:0.3,ease:'back.out(2)'")
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── metric (count-up + drawing sparkline) ────────────────────────────
_METRIC_CSS = r"""
.metcard{background:linear-gradient(180deg,rgba(34,44,66,.9),rgba(16,22,38,.92));border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:44px 60px;box-shadow:0 50px 120px rgba(0,0,0,.55),0 0 80px rgba(42,147,245,.14);text-align:center}
.met-lbl{font-size:20px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)}
.met-v{font-size:140px;font-weight:850;letter-spacing:-.04em;line-height:1.05;color:#fff;font-variant-numeric:tabular-nums}
.met-d{font-size:40px;font-weight:800;color:__GREEN__;vertical-align:super}
.spark{width:340px;height:74px;margin:8px auto 0;display:block}
"""
_METRIC_PCSS = "body.p .metcard{padding:36px 44px}body.p .met-v{font-size:116px}body.p .met-d{font-size:32px}\n"

@beat("metric", css=_METRIC_CSS, pcss=_METRIC_PCSS, required=("value", "label", "title"))
def metric(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    decimals = b.get("decimals", 1)
    eyebrow = ('<div class="k-eyebrow">%s</div>' % esc(b["eyebrow"])) if b.get("eyebrow") else ""
    delta = ('<span class="met-d">%s</span>' % esc(b["delta"])) if b.get("delta") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="kicker">%s<div class="k-title">%s</div></div>'
                  '<div class="metcard"><div class="met-lbl">%s</div>'
                  '<div class="met-v"><span id="mn-%d">0</span>%s %s</div>'
                  '<svg class="spark" viewBox="0 0 320 70" preserveAspectRatio="none">'
                  '<path id="sp-%d" d="M0,58 L40,52 L80,55 L120,40 L160,44 L200,28 L240,30 L280,16 L320,8" '
                  'fill="none" stroke="__PRIMARY__" stroke-width="4" stroke-linecap="round"/></svg></div>'
                  % (eyebrow, kw(esc(b["title"]), b.get("acc", ""), ctx["color"](b.get("col"))),
                     esc(b["label"]), i, esc(b.get("suffix", "")), delta, i))
    g = rev("%s .metcard" % sid, {"opacity": "0", "y": "40", "scale": "0.94", "filter": "'blur(8px)'"},
            t0, t0, "duration:0.45,ease:'back.out(1.3)'")
    if b.get("eyebrow"):
        g += rev("%s .k-eyebrow" % sid, {"opacity": "0", "y": "14"}, t0 + 0.1, t0, "duration:0.3")
    g += rev("%s .k-title .w" % sid, {"opacity": "0", "yPercent": "90", "filter": "'blur(6px)'"},
             t0 + 0.18, t0, "duration:0.4,ease:'power3.out',stagger:0.05")
    g.append("(function(){var o={v:0};tl.to(o,{v:%s,duration:1.0,ease:'power2.out',"
             "onUpdate:function(){var e=document.getElementById('mn-%d');"
             "if(e)e.textContent=o.v.toFixed(%d);}},%.3f);})();" % (b["value"], i, decimals, t0 + 0.4))
    g.append("tl.set('#sp-%d',{strokeDasharray:520,strokeDashoffset:520},%.3f);" % (i, t0))
    g.append("tl.to('#sp-%d',{strokeDashoffset:0,duration:1.1,ease:'power2.out'},%.3f);" % (i, t0 + 0.45))
    if b.get("delta"):
        g += rev("%s .met-d" % sid, {"opacity": "0", "scale": "0.6"}, t0 + 1.1, t0,
                 "duration:0.3,ease:'back.out(2)'")
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── born (custom "AI compiled into being" graphic) ───────────────────
_BORN_CSS = r"""
.bornwrap{display:flex;flex-direction:column;align-items:center}
.born{position:relative;width:360px;height:360px;display:flex;align-items:center;justify-content:center;margin-top:10px}
.dls{position:absolute;inset:0}
.dl{position:absolute;left:50%;top:50%;width:180px;height:2px;background:linear-gradient(90deg,transparent,rgba(42,147,245,.7));transform-origin:left center}
.ring{position:absolute;border-radius:50%;border:2px solid rgba(42,147,245,.5)}
.ring.r1{width:200px;height:200px}.ring.r2{width:280px;height:280px;border-color:rgba(42,147,245,.28)}
.node{width:120px;height:120px;border-radius:30px;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:850;color:#fff;box-shadow:0 0 60px rgba(42,147,245,.6);z-index:2}
"""
_BORN_PCSS = ("body.p .born{width:320px;height:320px}body.p .node{width:104px;height:104px}"
              "body.p .ring.r1{width:180px;height:180px}body.p .ring.r2{width:250px;height:250px}\n")

@beat("born", css=_BORN_CSS, pcss=_BORN_PCSS, required=("title",))
def born(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    lines = "".join('<i class="dl" style="transform:rotate(%ddeg)"></i>' % a for a in range(0, 360, 30))
    eyebrow = ('<div class="k-eyebrow">%s</div>' % esc(b["eyebrow"])) if b.get("eyebrow") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="bornwrap"><div class="kicker">%s<div class="k-title">%s</div></div>'
                  '<div class="born"><div class="dls">%s</div><div class="ring r1"></div>'
                  '<div class="ring r2"></div><div class="node">%s</div></div></div>'
                  % (eyebrow, kw(esc(b["title"]), b.get("acc", ""), ctx["color"](b.get("col"))),
                     lines, esc(b.get("node", "AI"))))
    g = rev("%s .dl" % sid, {"opacity": "0", "scaleX": "0"}, t0 + 0.1, t0,
            "duration:0.5,ease:'power3.out',stagger:0.03")
    g += rev("%s .node" % sid, {"opacity": "0", "scale": "0"}, t0 + 0.55, t0,
             "duration:0.5,ease:'back.out(1.8)'")
    g += rev("%s .ring" % sid, {"opacity": "0", "scale": "0"}, t0 + 0.7, t0,
             "duration:0.5,ease:'back.out(1.6)',stagger:0.12")
    if b.get("eyebrow"):
        g += rev("%s .k-eyebrow" % sid, {"opacity": "0", "y": "14"}, t0 + 0.2, t0, "duration:0.3")
    g += rev("%s .k-title .w" % sid, {"opacity": "0", "yPercent": "90", "filter": "'blur(6px)'"},
             t0 + 0.3, t0, "duration:0.4,ease:'power3.out',stagger:0.05")
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── dash (dashboard-chaos collage) ───────────────────────────────────
_DASH_CSS = r"""
.dashwrap{display:flex;flex-direction:column;align-items:center;gap:40px}
.dscatter{position:relative;width:820px;height:560px}
.dwin{position:absolute;width:300px;height:200px;background:#11151f;border:1px solid rgba(255,255,255,.1);border-radius:12px;box-shadow:0 30px 70px rgba(0,0,0,.5);padding:14px;will-change:transform}
.dwin .dchrome{display:flex;gap:6px;margin-bottom:12px}.dchrome i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.2)}
.dbar{height:12px;border-radius:6px;background:rgba(255,255,255,.08);margin-bottom:9px}.b1{width:80%}.b2{width:95%}.b3{width:65%}
.dlabel{position:absolute;bottom:12px;left:14px;font-size:18px;font-weight:800;color:__PRIMARY__}
.d0{left:20px;top:30px;transform:rotate(-6deg)}.d1{left:300px;top:0;transform:rotate(4deg)}.d2{left:520px;top:60px;transform:rotate(-3deg)}
.d3{left:120px;top:300px;transform:rotate(5deg)}.d4{left:430px;top:330px;transform:rotate(-7deg)}
.dcap{font-size:80px;font-weight:850;letter-spacing:-.03em}.dcap .w{display:inline-block;margin:0 .12em}
"""
_DASH_PCSS = r"""
body.p .dscatter{width:880px;height:1000px;transform:scale(.92)}
body.p .dwin{width:340px;height:220px}
body.p .d0{left:10px;top:40px}body.p .d1{left:430px;top:0}body.p .d2{left:160px;top:300px}
body.p .d3{left:520px;top:340px}body.p .d4{left:60px;top:640px}
body.p .dcap{font-size:64px}
"""

@beat("dash", css=_DASH_CSS, pcss=_DASH_PCSS, required=("items", "cap"))
def dash(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    wins = "".join('<div class="dwin d%d"><div class="dchrome"><i></i><i></i><i></i></div>'
                   '<div class="dbar b1"></div><div class="dbar b2"></div><div class="dbar b3"></div>'
                   '<div class="dlabel">%s</div></div>' % (j, esc(lab))
                   for j, lab in enumerate(b["items"][:5]))
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="dashwrap"><div class="dscatter">%s</div><div class="dcap">%s</div></div>'
                  % (wins, kw(esc(b["cap"]), b.get("acc", ""), ctx["color"](b.get("col", "red")))))
    g = []
    for j in range(min(len(b["items"]), 5)):
        g += rev("%s .d%d" % (sid, j), {"opacity": "0", "scale": "0.6", "y": "40"},
                 t0 + 0.15 + j * 0.18, t0, "duration:0.4,ease:'back.out(1.6)'")
    g.append("tl.to('%s .dwin',{x:'+=4',y:'+=3',rotation:'+=0.6',duration:0.12,repeat:7,yoyo:true,ease:'none'},%.3f);"
             % (sid, t0 + 1.6))
    g += rev("%s .dcap .w" % sid, {"opacity": "0", "yPercent": "90"}, t0 + 2.0, t0,
             "duration:0.4,ease:'power3.out',stagger:0.05")
    if not last:
        g += out(sid, t1 - 0.02, "shrink")
    return html, g


# ── ask (chat panel: typed questions -> data answers) ────────────────
_ASK_CSS = r"""
.askpanel{width:760px;border-radius:30px;background:linear-gradient(180deg,rgba(22,30,48,.96),rgba(12,18,30,.97));border:1px solid rgba(255,255,255,.13);box-shadow:0 60px 140px rgba(0,0,0,.6),0 0 90px rgba(42,147,245,.16);overflow:hidden}
.askhdr{display:flex;align-items:center;gap:16px;padding:24px 28px;border-bottom:1px solid rgba(255,255,255,.08)}
.askav{width:54px;height:54px;border-radius:15px;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-weight:850;font-size:24px}
.askname{font-size:24px;font-weight:800}.asksub{font-size:16px;color:__PRIMARY__;font-weight:600;margin-top:2px}
.livedot{margin-left:auto;width:12px;height:12px;border-radius:50%;background:__GREEN__;box-shadow:0 0 12px __GREEN__;animation:blink 1.4s step-end infinite}
.askbody{padding:26px 28px;display:flex;flex-direction:column;gap:16px;min-height:520px}
.qrow{display:flex;justify-content:flex-end}
.qbub{max-width:80%;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);color:#fff;font-size:26px;font-weight:600;padding:16px 22px;border-radius:20px 20px 6px 20px;line-height:1.35}
.arow{display:flex;justify-content:flex-start}
.abub{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:20px 20px 20px 6px;padding:18px 26px;text-align:left}
.anum{font-size:74px;font-weight:850;line-height:1;letter-spacing:-.03em}
.asub{font-size:22px;color:rgba(255,255,255,.7);font-weight:600;margin-top:6px}
"""
_ASK_PCSS = ("body.p .askpanel{width:92%}body.p .askbody{min-height:0;gap:14px;padding:24px}"
             "body.p .qbub{font-size:24px}body.p .anum{font-size:64px}body.p .asub{font-size:20px}\n")

@beat("ask", css=_ASK_CSS, pcss=_ASK_PCSS, required=("qas",))
def ask(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    bubbles = ""
    for j, qa in enumerate(b["qas"]):
        bubbles += ('<div class="qrow q%d"><div class="qbub"><span id="q-%d-%d"></span>'
                    '<span class="caret"></span></div></div>'
                    '<div class="arow a%d"><div class="abub"><div class="anum" style="color:%s">%s</div>'
                    '<div class="asub">%s</div></div></div>'
                    % (j, i, j, j, ctx["color"](qa.get("color")), esc(qa["n"]), esc(qa["sub"])))
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="askpanel"><div class="askhdr"><div class="askav">%s</div>'
                  '<div><div class="askname">%s</div><div class="asksub">%s</div></div>'
                  '<span class="livedot"></span></div><div class="askbody">%s</div></div>'
                  % (esc(b.get("avatar", "D")), esc(b.get("name", "Ask Dialfyne")),
                     esc(b.get("subtitle", "Connected to Claude & ChatGPT")), bubbles))
    g = rev("%s .askpanel" % sid, {"opacity": "0", "y": "60", "scale": "0.95", "filter": "'blur(10px)'"},
            t0, t0, "duration:0.5,ease:'back.out(1.3)'")
    g += rev("%s .askhdr" % sid, {"opacity": "0", "y": "-8"}, t0 + 0.2, t0, "duration:0.4,ease:'power3.out'")
    for j, qa in enumerate(b["qas"]):
        qs, as_ = qa["ask"], qa["answer"]
        g += rev("%s .q%d" % (sid, j), {"opacity": "0", "y": "18"}, qs, t0, "duration:0.3,ease:'power3.out'")
        g.append("(function(){var o={n:0};tl.to(o,{n:%d,duration:%.2f,ease:'none',"
                 "onUpdate:function(){var e=document.getElementById('q-%d-%d');"
                 "if(e)e.textContent=%s.slice(0,Math.round(o.n));}},%.3f);})();"
                 % (len(qa["q"]), max(0.3, (as_ - qs) * 0.62), i, j, js(qa["q"]), qs + 0.15))
        g += rev("%s .a%d" % (sid, j), {"opacity": "0", "y": "22", "scale": "0.9"}, as_, t0,
                 "duration:0.4,ease:'back.out(1.8)'")
    if b.get("boom"):
        g.append("tl.to('%s .askpanel',{scale:1.02,duration:0.12,yoyo:true,repeat:1,ease:'power2.out'},%.3f);"
                 % (sid, b["boom"]))
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── pillars (icon cards row/stack) ───────────────────────────────────
_PILLARS_CSS = r"""
.pillwrap{display:flex;flex-direction:column;align-items:center;gap:48px}
.pillrow{display:flex;gap:28px}
.pcol{width:300px;padding:44px 28px;border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px rgba(0,0,0,.4);display:flex;flex-direction:column;align-items:center;gap:22px}
.picon{width:96px;height:96px;border-radius:24px;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;font-size:48px;box-shadow:0 16px 44px rgba(42,147,245,.4)}
.plabel{font-size:30px;font-weight:800;letter-spacing:-.02em;text-align:center;line-height:1.2}
.pillcap{font-size:80px;font-weight:850;letter-spacing:-.03em}.pillcap .w{display:inline-block;margin:0 .12em}
"""
_PILLARS_PCSS = ("body.p .pillrow{flex-direction:column;gap:18px}"
                 "body.p .pcol{width:560px;flex-direction:row;justify-content:flex-start;padding:26px 30px;gap:26px}"
                 "body.p .picon{width:72px;height:72px;font-size:38px}body.p .plabel{font-size:30px;text-align:left}"
                 "body.p .pillcap{font-size:60px}\n")

@beat("pillars", css=_PILLARS_CSS, pcss=_PILLARS_PCSS, required=("items",))
def pillars(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    cols = "".join('<div class="pcol pc%d"><div class="picon">%s</div><div class="plabel">%s</div></div>'
                   % (j, it.get("icon", "&#9679;"), esc(it["label"])) for j, it in enumerate(b["items"]))
    cap = ('<div class="pillcap">%s</div>' % kw(esc(b["cap"]), b.get("acc", ""), ctx["color"](b.get("col")))) if b.get("cap") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="pillwrap"><div class="pillrow">%s</div>%s</div>' % (cols, cap))
    g = []
    for j in range(len(b["items"])):
        g += rev("%s .pc%d" % (sid, j), {"opacity": "0", "y": "50", "scale": "0.9"},
                 t0 + 0.2 + j * 0.22, t0, "duration:0.45,ease:'back.out(1.5)'")
    if b.get("cap"):
        g += rev("%s .pillcap .w" % sid, {"opacity": "0", "yPercent": "90"}, t0 + 1.4, t0,
                 "duration:0.4,ease:'power3.out',stagger:0.05")
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── hero (glow statement type: stretch-echo entrance, gradient accents) ──
_HERO_CSS = r"""
.hero{font-size:118px;font-weight:850;letter-spacing:-.025em;line-height:1.06;max-width:94%}
.hero.big{font-size:158px}
.hero .w{display:inline-block;position:relative;margin:0 .13em;will-change:transform,opacity,filter}
.hero .w .t{position:relative;display:inline-block;z-index:2;
  text-shadow:0 0 16px rgba(120,170,255,.55),0 0 56px rgba(60,130,255,.30)}
.hero .w.grad .t{background:linear-gradient(95deg,__PRIMARY__,#9b7bff 90%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;
  filter:drop-shadow(0 0 20px rgba(110,120,255,.55))}
.hero .w .e{position:absolute;left:0;top:0.06em;display:inline-block;z-index:1;color:transparent;
  background:linear-gradient(180deg,rgba(130,160,255,.75),transparent 85%);-webkit-background-clip:text;background-clip:text;
  transform-origin:top center;opacity:0;pointer-events:none}
"""
_HERO_PCSS = "body.p .hero{font-size:84px}body.p .hero.big{font-size:106px}\n"

@beat("hero", css=_HERO_CSS, pcss=_HERO_PCSS, required=("t",))
def hero(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    aset = set((b.get("acc") or "").split())
    words = []
    for w in str(b["t"]).split(" "):
        cls = "w grad" if w.strip(".,!?—") in aset else "w"
        words.append('<span class="%s"><span class="t">%s</span><span class="e">%s</span></span>'
                     % (cls, esc(w), esc(w)))
    cls = "hero" + (" big" if b.get("size") == "big" else "")
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i, '<div class="%s">%s</div>' % (cls, "".join(words)))
    # body lands, echo trail stretches out beneath then evaporates, glow tightens
    g = rev("%s .w .t" % sid, {"opacity": "0", "yPercent": "55", "filter": "'blur(8px) brightness(1.9)'"},
            t0, t0, "duration:0.5,ease:'power4.out',stagger:0.07")
    g.append("tl.set('%s .w .e',{opacity:0.85,scaleY:2.6},%.3f);" % (sid, t0))
    g.append("tl.to('%s .w .e',{opacity:0,scaleY:1,duration:0.55,ease:'power3.out',stagger:0.07},%.3f);" % (sid, t0 + 0.05))
    g.append("tl.to('%s .w .t',{filter:'blur(0px) brightness(1)',duration:0.5,ease:'power2.out',stagger:0.07},%.3f);" % (sid, t0 + 0.4))
    if not last:
        g.append("tl.to('%s .w',{opacity:0,yPercent:-45,filter:'blur(7px)',stagger:0.02,duration:0.24,ease:'power3.in'},%.3f);" % (sid, t1 - 0.06))
    return html, g


# ── sting (logo moment: spark streaks in, bloom spike, logo + wordmark) ──
_STING_CSS = r"""
.stingwrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.sting-core{display:flex;flex-direction:column;align-items:center;gap:26px}
.spark{position:absolute;left:0;top:0;width:13px;height:13px;border-radius:50%;background:#fff;z-index:5;
  box-shadow:0 0 18px 5px rgba(150,190,255,.95),0 0 70px 26px rgba(60,130,255,.5)}
.bloom{position:absolute;width:380px;height:380px;border-radius:50%;z-index:1;opacity:0;
  background:radial-gradient(circle,rgba(170,200,255,.9),rgba(60,130,255,.30) 45%,transparent 70%);filter:blur(8px)}
.sting-logo{height:120px;filter:drop-shadow(0 0 28px rgba(80,140,255,.75));z-index:3}
.sting-word{font-size:30px;font-weight:700;letter-spacing:.42em;text-transform:uppercase;color:__TEXT__;opacity:.92}
.sting-tag{font-size:26px;font-weight:600;color:__MUTED__}
.star4{position:absolute;width:24px;height:24px;background:#fff;z-index:4;opacity:0;
  clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);
  filter:drop-shadow(0 0 12px rgba(190,210,255,.95))}
"""
_STING_PCSS = "body.p .sting-logo{height:96px}body.p .sting-word{font-size:24px}\n"

@beat("sting", css=_STING_CSS, pcss=_STING_PCSS)
def sting(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    W, H = ctx["W"], ctx["H"]
    word = ('<div class="sting-word">%s</div>' % esc(b["wordmark"])) if b.get("wordmark") else ""
    tag = ('<div class="sting-tag">%s</div>' % esc(b["tagline"])) if b.get("tagline") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="stingwrap"><div class="bloom"></div><div class="spark"></div>'
                  '<div class="star4"></div><div class="sting-core">'
                  '<img class="sting-logo" src="%s"/>%s%s</div></div>' % (ctx["logo"], word, tag))
    cx, cy = W // 2, H // 2 - (40 if b.get("wordmark") else 0)
    arrive = t0 + 0.75
    g = []
    # spark streaks in on a bent two-segment path and dies into the bloom
    g.append("tl.set('%s .spark',{x:%d,y:%d,opacity:1},%.3f);" % (sid, -80, cy - 260, t0))
    g.append("tl.to('%s .spark',{x:%d,y:%d,duration:0.45,ease:'power2.in'},%.3f);" % (sid, cx - 160, cy + 60, t0))
    g.append("tl.to('%s .spark',{x:%d,y:%d,duration:0.3,ease:'power2.out'},%.3f);" % (sid, cx, cy, t0 + 0.45))
    g.append("tl.to('%s .spark',{opacity:0,scale:0.4,duration:0.2},%.3f);" % (sid, arrive))
    # bloom spikes at arrival then decays (B's climax-decay curve)
    g.append("tl.set('%s .bloom',{left:%d,top:%d,xPercent:-50,yPercent:-50},%.3f);" % (sid, cx, cy, t0))
    g.append("tl.to('%s .bloom',{opacity:1,scale:1.25,duration:0.22,ease:'power2.out'},%.3f);" % (sid, arrive - 0.08))
    g.append("tl.to('%s .bloom',{opacity:0.22,scale:1.0,duration:0.9,ease:'power2.out'},%.3f);" % (sid, arrive + 0.18))
    # logo + wordmark born out of the bloom
    g += rev("%s .sting-logo" % sid, {"opacity": "0", "scale": "0.55", "filter": "'blur(12px) brightness(2)'"},
             arrive, t0, "duration:0.6,ease:'back.out(1.5)'")
    g.append("tl.to('%s .sting-logo',{filter:'blur(0px) brightness(1)',duration:0.6,ease:'power2.out'},%.3f);" % (sid, arrive + 0.35))
    if b.get("wordmark"):
        g += rev("%s .sting-word" % sid, {"opacity": "0", "y": "16", "filter": "'blur(6px)'"},
                 arrive + 0.25, t0, "duration:0.5,ease:'power3.out'")
        g.append("tl.fromTo('%s .sting-word',{letterSpacing:'0.62em'},{letterSpacing:'0.42em',duration:0.7,ease:'power2.out'},%.3f);" % (sid, arrive + 0.25))
    if b.get("tagline"):
        g += rev("%s .sting-tag" % sid, {"opacity": "0", "y": "12"}, arrive + 0.55, t0, "duration:0.4,ease:'power2.out'")
    # companion star drifts off (continuity garnish)
    g.append("tl.set('%s .star4',{x:%d,y:%d},%.3f);" % (sid, cx + 130, cy - 90, t0))
    g.append("tl.to('%s .star4',{opacity:1,duration:0.2},%.3f);" % (sid, arrive + 0.1))
    g.append("tl.to('%s .star4',{x:%d,y:%d,rotation:140,opacity:0,duration:1.4,ease:'power1.out'},%.3f);" % (sid, cx + 330, cy - 230, arrive + 0.3))
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── orbit (constellation of nodes spinning around a core; "your whole stack, one brain") ──
_ORBIT_CSS = r"""
.orbitwrap{display:flex;flex-direction:column;align-items:center}
.orbit{position:relative;width:520px;height:520px}
.orbit .core{position:absolute;left:50%;top:50%;width:128px;height:128px;margin:-64px 0 0 -64px;border-radius:34px;
  background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;
  font-weight:850;font-size:46px;color:#fff;box-shadow:0 0 70px rgba(42,147,245,.7),inset 0 2px 0 rgba(255,255,255,.3);z-index:3}
.orbit .ringline{position:absolute;left:50%;top:50%;border:1px solid rgba(120,170,255,.22);border-radius:50%;transform:translate(-50%,-50%)}
.orbit .spoke{position:absolute;left:50%;top:50%;height:2px;transform-origin:left center;
  background:linear-gradient(90deg,rgba(120,170,255,.55),transparent);z-index:1}
.orbit .sat{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:16px;
  background:rgba(20,28,46,.92);border:1px solid rgba(130,170,255,.35);display:flex;align-items:center;justify-content:center;
  font-size:26px;color:#cfe0ff;box-shadow:0 10px 30px rgba(0,0,0,.45);z-index:2}
"""
_ORBIT_PCSS = "body.p .orbit{width:440px;height:440px}body.p .orbit .core{width:108px;height:108px;margin:-54px 0 0 -54px}\n"

@beat("orbit", css=_ORBIT_CSS, pcss=_ORBIT_PCSS)
def orbit(i, b, ctx, last):
    import math
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    sats = b.get("items", ["&#9742;", "&#9993;", "&#9203;", "&#9873;", "&#9678;"])[:6]
    R = 200
    n = len(sats)
    parts = ['<div class="ringline" style="width:%dpx;height:%dpx"></div>' % (R * 2, R * 2),
             '<div class="ringline" style="width:%dpx;height:%dpx"></div>' % (R * 2 + 64, R * 2 + 64)]
    spokes, satdivs = [], []
    for j, ic in enumerate(sats):
        ang = -90 + j * (360.0 / n)
        rad = math.radians(ang)
        dx, dy = math.cos(rad) * R, math.sin(rad) * R
        spokes.append('<div class="spoke sp%d" style="width:%dpx;transform:rotate(%.1fdeg)"></div>' % (j, R, ang))
        satdivs.append('<div class="sat st%d" style="transform:translate(%.0fpx,%.0fpx)">%s</div>' % (j, dx, dy, ic))
    eyebrow = ('<div class="k-eyebrow">%s</div>' % esc(b["eyebrow"])) if b.get("eyebrow") else ""
    title = ('<div class="k-title">%s</div>' % kw(esc(b["title"]), b.get("acc", ""), ctx["color"](b.get("col")))) if b.get("title") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="orbitwrap"><div class="kicker">%s%s</div><div class="orbit">%s%s%s'
                  '<div class="core">%s</div></div></div>'
                  % (eyebrow, title, "".join(parts), "".join(spokes), "".join(satdivs), esc(b.get("node", "AI"))))
    g = rev("%s .core" % sid, {"opacity": "0", "scale": "0"}, t0 + 0.2, t0, "duration:0.55,ease:'back.out(1.8)'")
    g += rev("%s .ringline" % sid, {"opacity": "0", "scale": "0.6"}, t0 + 0.35, t0, "duration:0.6,ease:'power3.out',stagger:0.08")
    for j in range(n):
        st = t0 + 0.55 + j * 0.12
        g += rev("%s .sp%d" % (sid, j), {"opacity": "0", "scaleX": "0"}, st, t0, "duration:0.4,ease:'power3.out'")
        g += rev("%s .st%d" % (sid, j), {"opacity": "0", "scale": "0.2"}, st + 0.1, t0, "duration:0.45,ease:'back.out(2)'")
    # slow continuous orbit drift on the whole field (deterministic, seek-safe)
    spin = (t1 - t0) + 0.3
    g.append("tl.fromTo('%s .orbit',{rotation:0},{rotation:18,duration:%.2f,ease:'none'},%.3f);" % (sid, spin, t0))
    g.append("tl.fromTo('%s .sat',{rotation:0},{rotation:-18,duration:%.2f,ease:'none'},%.3f);" % (sid, spin, t0))
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── stream (data flowing through pipes into a target; "your data, connected") ──
_STREAM_CSS = r"""
.streamwrap{display:flex;flex-direction:column;align-items:center;gap:46px}
.stream{position:relative;width:900px;height:300px}
.snode{position:absolute;top:50%;transform:translateY(-50%);padding:16px 22px;border-radius:14px;font-size:24px;font-weight:700;
  background:rgba(20,28,46,.92);border:1px solid rgba(130,170,255,.3);color:#dce8ff;box-shadow:0 14px 40px rgba(0,0,0,.4)}
.starget{position:absolute;right:0;top:50%;transform:translateY(-50%);width:120px;height:120px;border-radius:30px;
  background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);display:flex;align-items:center;justify-content:center;
  font-weight:850;font-size:30px;color:#fff;box-shadow:0 0 60px rgba(42,147,245,.6);z-index:3}
.pipe{position:absolute;left:0;top:50%;height:3px;background:rgba(120,170,255,.18);transform-origin:left center}
.pulse{position:absolute;top:50%;width:16px;height:16px;margin-top:-8px;border-radius:50%;background:#fff;
  box-shadow:0 0 16px 5px rgba(120,170,255,.9);z-index:2}
"""
_STREAM_PCSS = "body.p .stream{width:92vw;height:520px}\n"

@beat("stream", css=_STREAM_CSS, pcss=_STREAM_PCSS, required=("sources",))
def stream(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    srcs = b["sources"][:5]
    n = len(srcs)
    portrait = ctx["PORTRAIT"]
    # vertical layout in portrait, horizontal in landscape — express via inline coords
    nodes, pipes, pulses = [], [], []
    for j, s in enumerate(srcs):
        top = 8 + j * (84.0 / max(1, n - 1)) if n > 1 else 50
        nodes.append('<div class="snode sn%d" style="left:0;top:%.0f%%">%s</div>' % (j, top, esc(s)))
        pipes.append('<div class="pipe pp%d" style="left:170px;top:%.0f%%;width:560px;transform:translateY(-50%%) rotate(%.1fdeg)"></div>'
                     % (j, top, (50 - top) * 0.32))
        pulses.append('<div class="pulse pl%d"></div>' % j)
    eyebrow = ('<div class="k-eyebrow">%s</div>' % esc(b["eyebrow"])) if b.get("eyebrow") else ""
    title = ('<div class="k-title">%s</div>' % kw(esc(b["title"]), b.get("acc", ""), ctx["color"](b.get("col")))) if b.get("title") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="streamwrap"><div class="kicker">%s%s</div><div class="stream">%s%s%s'
                  '<div class="starget">%s</div></div></div>'
                  % (eyebrow, title, "".join(nodes), "".join(pipes), "".join(pulses), esc(b.get("target", "AI"))))
    g = rev("%s .starget" % sid, {"opacity": "0", "scale": "0.4"}, t0 + 0.2, t0, "duration:0.5,ease:'back.out(1.7)'")
    for j in range(n):
        st = t0 + 0.3 + j * 0.14
        g += rev("%s .sn%d" % (sid, j), {"opacity": "0", "x": "-30"}, st, t0, "duration:0.35,ease:'power3.out'")
        g += rev("%s .pp%d" % (sid, j), {"opacity": "0", "scaleX": "0"}, st + 0.1, t0, "duration:0.4,ease:'power2.out'")
        # a light pulse travels the pipe, repeating through the beat
        reps = max(1, int((t1 - t0) / 1.1))
        g.append("tl.set('%s .pl%d',{left:180,opacity:0},%.3f);" % (sid, j, t0))
        g.append("tl.fromTo('%s .pl%d',{left:180,opacity:1},{left:740,opacity:1,duration:0.9,ease:'power1.in',repeat:%d,repeatDelay:0.2},%.3f);"
                 % (sid, j, reps, st + 0.3))
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── wave (reactive voice waveform; for the voice-agent product) ──
_WAVE_CSS = r"""
.wavewrap{display:flex;flex-direction:column;align-items:center;gap:44px}
.wave{display:flex;align-items:center;gap:7px;height:220px}
.wave i{width:12px;border-radius:99px;background:linear-gradient(180deg,__PRIMARY__,__SECONDARY__);box-shadow:0 0 14px rgba(42,147,245,.5)}
"""
_WAVE_PCSS = "body.p .wave{height:180px;gap:6px}body.p .wave i{width:10px}\n"

@beat("wave", css=_WAVE_CSS, pcss=_WAVE_PCSS)
def wave(i, b, ctx, last):
    import math
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    nbar = b.get("bars", 36)
    bars = "".join('<i class="wb%d"></i>' % j for j in range(nbar))
    eyebrow = ('<div class="k-eyebrow">%s</div>' % esc(b["eyebrow"])) if b.get("eyebrow") else ""
    title = ('<div class="k-title">%s</div>' % kw(esc(b["title"]), b.get("acc", ""), ctx["color"](b.get("col")))) if b.get("title") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="wavewrap"><div class="wave">%s</div><div class="kicker" style="margin:0">%s%s</div></div>'
                  % (bars, eyebrow, title))
    g = []
    dur = (t1 - t0) + 0.3
    for j in range(nbar):
        center = 1 - abs(j - (nbar - 1) / 2) / ((nbar - 1) / 2)   # tall in the middle
        base = 18 + center * 150
        g.append("tl.set('%s .wb%d',{height:6,opacity:0},%.3f);" % (sid, j, t0))
        g.append("tl.to('%s .wb%d',{height:%d,opacity:1,duration:0.4,ease:'back.out(2)'},%.3f);"
                 % (sid, j, int(base * 0.5), t0 + 0.1 + j * 0.012))
        # breathe: deterministic sine, phase-offset per bar
        lo = max(8, int(base * 0.35)); hi = int(base)
        g.append("tl.to('%s .wb%d',{height:%d,duration:%.2f,yoyo:true,repeat:%d,ease:'sine.inOut'},%.3f);"
                 % (sid, j, hi, 0.5 + (j % 4) * 0.06, max(1, int(dur / 0.7)), t0 + 0.5))
    if title or eyebrow:
        g += rev("%s .kicker" % sid, {"opacity": "0", "y": "16"}, t0 + 0.6, t0, "duration:0.4,ease:'power3.out'")
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── isogrid (perspective floor sweep — Flash-Motion energy bed under a title) ──
_ISO_CSS = r"""
.isowrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.isofloor{position:absolute;left:50%;bottom:-10%;width:240%;height:120%;margin-left:-120%;
  background-image:linear-gradient(rgba(42,147,245,.55) 2px,transparent 2px),linear-gradient(90deg,rgba(42,147,245,.55) 2px,transparent 2px);
  background-size:90px 90px;transform:perspective(620px) rotateX(70deg);transform-origin:50% 100%;
  -webkit-mask-image:linear-gradient(to top,#000 6%,transparent 70%);mask-image:linear-gradient(to top,#000 6%,transparent 70%);animation:isoscroll 5s linear infinite}
@keyframes isoscroll{0%{background-position:0 0}100%{background-position:0 90px}}
.isoroof{position:absolute;left:50%;top:-10%;width:240%;height:120%;margin-left:-120%;
  background-image:linear-gradient(rgba(155,123,255,.4) 2px,transparent 2px),linear-gradient(90deg,rgba(155,123,255,.4) 2px,transparent 2px);
  background-size:90px 90px;transform:perspective(620px) rotateX(-70deg);transform-origin:50% 0;
  -webkit-mask-image:linear-gradient(to bottom,#000 6%,transparent 70%);mask-image:linear-gradient(to bottom,#000 6%,transparent 70%);animation:isoscroll 5s linear infinite}
.isotitle{position:relative;z-index:2;font-size:120px;font-weight:850;letter-spacing:-.03em;text-align:center;
  text-shadow:0 0 30px rgba(42,147,245,.6)}
.isotitle .w{display:inline-block;margin:0 .12em}
"""
_ISO_PCSS = "body.p .isotitle{font-size:78px}\n"

@beat("isogrid", css=_ISO_CSS, pcss=_ISO_PCSS, required=("t",))
def isogrid(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="isowrap"><div class="isofloor"></div><div class="isoroof"></div>'
                  '<div class="isotitle">%s</div></div>'
                  % kw(esc(b["t"]), b.get("acc", ""), ctx["color"](b.get("col"))))
    g = rev("%s .isofloor" % sid, {"opacity": "0"}, t0, t0, "duration:0.6,ease:'power2.out'")
    g += rev("%s .isoroof" % sid, {"opacity": "0"}, t0 + 0.1, t0, "duration:0.6,ease:'power2.out'")
    g += rev("%s .isotitle .w" % sid, {"opacity": "0", "yPercent": "120", "filter": "'blur(8px)'"},
             t0 + 0.25, t0, "duration:0.5,ease:'back.out(1.5)',stagger:0.06")
    if not last:
        g += out(sid, t1 - 0.02, "rise")
    return html, g


# ── logoreveal — real Dialfyne lockup (PNG) or an inlined SVG (per-piece anim) ──
# PNG: 3D tilt + left->right build-on wipe (mark -> bars -> wordmark) + sweep + bloom.
# SVG: inlined so each piece animates by id when present (#mark-dot, #mark-tube,
#      #bar-1/2/3, #wordmark); otherwise the whole SVG does the same build-on wipe.
_LOGOR_CSS = r"""
.logostage{display:flex;flex-direction:column;align-items:center;gap:32px}
.logo3dwrap{perspective:1300px}
.logo3d{transform-style:preserve-3d;will-change:transform;position:relative;display:inline-block}
.logo-img{display:block;height:auto;filter:drop-shadow(0 16px 46px rgba(40,110,230,.42))}
.logosvgbox{position:relative}
.logosvgbox svg{display:block;width:100%;height:auto;filter:drop-shadow(0 16px 46px rgba(40,110,230,.42))}
.logosvgbox [id^=bar-],.logosvgbox #mark-stem,.logosvgbox #mark-fork{transform-box:fill-box}
.logosweep{position:absolute;top:-14%;left:0;width:20%;height:128%;pointer-events:none;opacity:0;mix-blend-mode:screen;
  transform:translateX(-230%) skewX(-12deg);
  background:linear-gradient(90deg,transparent,rgba(180,210,255,0) 22%,rgba(205,228,255,.9) 50%,rgba(180,210,255,0) 78%,transparent)}
.logobloom{position:absolute;left:50%;top:50%;width:74%;height:170%;transform:translate(-50%,-50%);
  background:radial-gradient(ellipse,rgba(80,150,255,.5),transparent 66%);filter:blur(36px);opacity:0;z-index:-1;pointer-events:none}
.ltag{font-size:32px;font-weight:600;color:__MUTED__;letter-spacing:.06em}
"""
_LOGOR_PCSS = "body.p .ltag{font-size:25px}\n"

def _inline_svg(path):
    try:
        txt = open(path, encoding="utf-8").read()
    except Exception:
        return None
    i = txt.find("<svg")
    return txt[i:] if i >= 0 else None  # strip <?xml?>/doctype prefix

@beat("logoreveal", css=_LOGOR_CSS, pcss=_LOGOR_PCSS)
def logoreveal(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    W = ctx["W"]
    iw = round(W * (0.80 if ctx["PORTRAIT"] else 0.60))
    logo = ctx["logo"]
    svg = _inline_svg(os.path.join(ctx.get("project_dir", ""), logo)) if str(logo).lower().endswith(".svg") else None
    tag = ('<div class="ltag">%s</div>' % esc(b["tagline"])) if b.get("tagline") else ""

    g = []
    # shared: 3D tilt-in, sweep, bloom
    g.append("tl.set('%s .logo3d',{rotationY:-26,scale:0.92,opacity:0},%.3f);" % (sid, t0))
    g.append("tl.to('%s .logo3d',{rotationY:0,scale:1,opacity:1,duration:0.9,ease:'power3.out'},%.3f);" % (sid, t0))
    g.append("tl.set('%s .logosweep',{xPercent:-230,opacity:0},%.3f);" % (sid, t0))
    g.append("tl.to('%s .logosweep',{opacity:1,duration:0.15},%.3f);" % (sid, t0 + 0.4))
    g.append("tl.to('%s .logosweep',{xPercent:520,opacity:0,duration:1.05,ease:'power1.inOut'},%.3f);" % (sid, t0 + 0.45))
    g.append("tl.set('%s .logobloom',{opacity:0,scale:0.8},%.3f);" % (sid, t0))
    g.append("tl.to('%s .logobloom',{opacity:1,scale:1.12,duration:0.4,ease:'power2.out'},%.3f);" % (sid, t0 + 0.4))
    g.append("tl.to('%s .logobloom',{opacity:0.42,scale:1,duration:1.0,ease:'power2.out'},%.3f);" % (sid, t0 + 0.95))

    if svg:
        inner = ('<div class="logobloom"></div><div class="logosvgbox" style="width:%dpx">%s</div>'
                 '<div class="logosweep"></div>' % (iw, svg))
        pieces = [p for p in ("mark-stem", "mark-fork", "bar-1", "bar-2", "bar-3", "wordmark") if ('id="%s"' % p) in svg]
        if pieces:
            # The mark is a signal tree: stem flows in, fork springs out of it,
            # bars fire one at a time. transformOrigin is a static set (never
            # tweened) so it lives outside rev().
            if "mark-stem" in pieces:
                g.append("tl.set('%s #mark-stem',{transformOrigin:'0%% 50%%'},%.3f);" % (sid, t0))
                g += rev("%s #mark-stem" % sid, {"opacity": "0", "scaleX": "0"}, t0 + 0.25, t0, "duration:0.4,ease:'power3.out'")
            if "mark-fork" in pieces:
                g.append("tl.set('%s #mark-fork',{transformOrigin:'0%% 50%%'},%.3f);" % (sid, t0))
                g += rev("%s #mark-fork" % sid, {"opacity": "0", "scale": "0"}, t0 + 0.45, t0, "duration:0.55,ease:'back.out(1.8)'")
            for k in range(1, 4):
                if ("bar-%d" % k) in pieces:
                    g.append("tl.set('%s #bar-%d',{transformOrigin:'0%% 50%%'},%.3f);" % (sid, k, t0))
                    g += rev("%s #bar-%d" % (sid, k), {"opacity": "0", "scaleX": "0"}, t0 + 0.85 + (k - 1) * 0.13, t0, "duration:0.5,ease:'power3.out'")
            if "wordmark" in pieces:
                g += rev("%s #wordmark" % sid, {"clipPath": "'inset(0% 100% 0% 0%)'"}, t0 + 1.35, t0, "duration:0.7,ease:'power2.out'")
        else:
            g += rev("%s .logosvgbox svg" % sid, {"clipPath": "'inset(0% 100% 0% 0%)'", "filter": "'blur(7px)'"}, t0 + 0.3, t0, "duration:1.25,ease:'power2.out'")
    else:
        inner = ('<div class="logobloom"></div><img class="logo-img" src="%s" style="width:%dpx"/>'
                 '<div class="logosweep"></div>' % (logo, iw))
        g.append("tl.set('%s .logo-img',{clipPath:'inset(0%% 100%% 0%% 0%%)',filter:'blur(7px)'},%.3f);" % (sid, t0))
        g.append("tl.to('%s .logo-img',{clipPath:'inset(0%% 0%% 0%% 0%%)',duration:1.25,ease:'power2.out'},%.3f);" % (sid, t0 + 0.3))
        g.append("tl.to('%s .logo-img',{filter:'blur(0px)',duration:0.6,ease:'power2.out'},%.3f);" % (sid, t0 + 0.95))

    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="logostage"><div class="logo3dwrap"><div class="logo3d">%s</div></div>%s</div>' % (inner, tag))
    if b.get("tagline"):
        g += rev("%s .ltag" % sid, {"opacity": "0", "y": "14"}, t0 + 1.7, t0, "duration:0.5,ease:'power3.out'")
    if not last:
        g += out(sid, t1 - 0.02, "blur")
    return html, g


# ── flythrough — real product cards suspended in 3D space, parallax drift ──
_FLY_CSS = r"""
.flywrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;perspective:1400px}
.flyworld{position:relative;width:0;height:0;transform-style:preserve-3d;will-change:transform}
.flycard{position:absolute;border-radius:14px;overflow:hidden;border:1px solid rgba(150,180,255,.22);
  box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 50px rgba(42,147,245,.12);background:#0b0f18;transform-style:preserve-3d}
.flycard img{display:block;width:100%;height:auto}
.flytitle{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) translateZ(80px);z-index:6;text-align:center;width:90%}
.flytitle .k-title{text-shadow:0 0 34px rgba(42,147,245,.65)}
"""
_FLY_PCSS = "body.p .flytitle{width:94%}\n"

@beat("flythrough", css=_FLY_CSS, pcss=_FLY_PCSS, required=("cards",))
def flythrough(i, b, ctx, last):
    t0, t1 = b["start"], b["end"]
    sid = "#ev-%d" % i
    P = ctx["PORTRAIT"]
    # placements: (x, y, z, rotateY, width)
    if P:
        slots = [(-300, -560, -260, 16, 340), (320, -300, -180, -16, 360), (-340, 120, -120, 14, 340),
                 (330, 360, -300, -18, 320), (-150, 560, -420, 8, 320), (200, -560, -360, -10, 300)]
    else:
        slots = [(-620, -180, -240, 20, 400), (600, -150, -180, -18, 420), (-680, 210, -120, 16, 380),
                 (640, 230, -300, -22, 360), (-230, -320, -440, 10, 340), (300, 320, -380, -12, 340)]
    cards = b["cards"][:6]
    cdivs = []
    for j, c in enumerate(cards):
        x, y, z, ry, w = slots[j % len(slots)]
        cdivs.append('<div class="flycard fc%d" style="width:%dpx;transform:translate3d(%dpx,%dpx,%dpx) rotateY(%ddeg)">'
                     '<img src="%s"/></div>' % (j, w, x, y, z, ry, esc(c)))
    eyebrow = ('<div class="k-eyebrow">%s</div>' % esc(b["eyebrow"])) if b.get("eyebrow") else ""
    title = ('<div class="k-title">%s</div>' % kw(esc(b["title"]), b.get("acc", ""), ctx["color"](b.get("col")))) if b.get("title") else ""
    html = _shell(i, t0, (t1 - t0) + 0.35, 10 + i,
                  '<div class="flywrap"><div class="flyworld">%s</div>'
                  '<div class="flytitle"><div class="kicker" style="margin:0">%s%s</div></div></div>'
                  % ("".join(cdivs), eyebrow, title))
    g = []
    # world slow parallax turn + bob (the "camera" life)
    spin = (t1 - t0) + 0.3
    g.append("tl.fromTo('%s .flyworld',{rotationY:7,y:18},{rotationY:-7,y:-18,duration:%.2f,ease:'sine.inOut'},%.3f);" % (sid, spin, t0))
    # cards fly in from deeper space (z back -> rest), staggered
    for j in range(len(cards)):
        g.append("tl.set('%s .fc%d',{z:-560,opacity:0},%.3f);" % (sid, j, t0))
        g.append("tl.to('%s .fc%d',{z:0,opacity:1,duration:0.7,ease:'power3.out'},%.3f);" % (sid, j, t0 + 0.1 + j * 0.1))
    if title or eyebrow:
        g += rev("%s .kicker" % sid, {"opacity": "0", "y": "22", "filter": "'blur(6px)'"}, t0 + 0.5, t0, "duration:0.5,ease:'power3.out'")
    if not last:
        g.append("tl.to('%s .flycard',{z:340,opacity:0,duration:0.4,stagger:0.03,ease:'power3.in'},%.3f);" % (sid, t1 - 0.06))
        g += out("%s .flytitle" % sid, t1 - 0.02, "blur")
    return html, g
