"""Animation helpers — the flicker-safe motion core.

RULE (enforced here, learned the hard way): the HyperFrames renderer SEEKS to
arbitrary frames, so a GSAP `from()` tween with a delayed start flashes the
element at its final state for a frame before animating. Every reveal therefore
must be authored as set(hidden)@clip-start + to(natural)@reveal-time.
Beat builders only ever call rev()/out() — never raw from().
"""
import json as _json

# Natural (resting) values for every property we animate.
NAT = {
    "opacity": "1", "x": "0", "y": "0", "yPercent": "0", "xPercent": "0",
    "scale": "1", "scaleX": "1", "rotation": "0", "filter": "'blur(0px)'",
    "clipPath": "'inset(0 0% 0 0)'",
}


def js(s):
    """JSON-encode a string for safe embedding in generated JS."""
    return _json.dumps(s)


def rev(sel, init, at, clip_start, tail=""):
    """set(hidden)@clip_start + to(natural)@at. Returns the two timeline lines."""
    ij = "{" + ",".join("%s:%s" % (k, init[k]) for k in init) + "}"
    tj = "{" + ",".join("%s:%s" % (k, NAT[k]) for k in init) + ((", " + tail) if tail else "") + "}"
    return [
        "tl.set('%s',%s,%.3f);" % (sel, ij, max(0.0, clip_start)),
        "tl.to('%s',%s,%.3f);" % (sel, tj, at),
    ]


def out(sel, at, style="blur"):
    """Standard beat exit. Styles: blur | rise | shrink | fade."""
    styles = {
        "blur":   "{opacity:0,scale:1.05,filter:'blur(9px)',duration:0.3,ease:'power3.in'}",
        "rise":   "{opacity:0,y:-50,scale:1.03,filter:'blur(7px)',duration:0.3,ease:'power3.in'}",
        "shrink": "{opacity:0,scale:0.95,filter:'blur(8px)',duration:0.28,ease:'power3.in'}",
        "fade":   "{opacity:0,duration:0.3,ease:'power2.in'}",
    }
    return ["tl.to('%s',%s,%.3f);" % (sel, styles.get(style, styles["blur"]), at)]


def kw(text, accent="", color="__PRIMARY__"):
    """Wrap each word in a kinetic <span class='w'>; accent words get a color."""
    aset = set(accent.split()) if accent else set()
    outp = []
    for w in text.split(" "):
        c = (' style="color:%s"' % color) if w.strip(".,!?—") in aset else ""
        outp.append('<span class="w"%s>%s</span>' % (c, w))
    return "".join(outp)


def crop_box(img_w, img_h, fx0, fy0, fw, fh, view_w):
    """Geometry for showing a fractional crop of a screenshot at view_w wide."""
    iw = view_w / fw
    ih = iw * img_h / img_w
    return dict(VW=round(view_w), VH=round(fh * ih),
                imgW=round(iw), imgL=round(-fx0 * iw), imgT=round(-fy0 * ih))


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
