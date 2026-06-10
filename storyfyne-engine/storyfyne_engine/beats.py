"""The beat library.

Each beat type = one function that returns (html, [gsap lines]) plus CSS fragments.
Authors never write HTML/GSAP — they write JSON beats (see AUTHORING.md).
All motion goes through anim.rev()/anim.out() => seek-safe, no flicker.

Beat builder signature:
    build(i, beat, ctx, last) -> (html_str, [gsap_str])
ctx: dict with W, H, PORTRAIT, theme, and helper color().
"""
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
.typed{font-size:80px;font-weight:800;letter-spacing:-.02em;font-family:ui-monospace,monospace;color:#fff;display:flex;align-items:center;gap:.3em}
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
.srow span{font-size:82px;font-weight:800;letter-spacing:-.02em;color:#fff}
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
