#!/usr/bin/env python3
"""
Dialfyne "Why Dialfyne for Roleplay" — HyperFrames explainer composition builder.

Emits a single self-contained index.html (HyperFrames contract: class="clip" +
data-start/duration/track-index, GSAP timeline registered on window.__timelines).

Renders fully offline:
  - GSAP vendored locally   -> assets/gsap.min.js  (network policy blocks jsdelivr)
  - Inter fonts self-hosted -> assets/fonts/*.woff2
  - Logos inlined as SVG    (CDN/logo hosts blocked) + brand PNG
  - Audio: pre-mixed VO + ducked music -> assets/soundtrack.mp3

Timings are locked to the supplied SRT so captions + visuals stay in sync with the VO.
"""
import html as _html

# ── Canvas / brand ──────────────────────────────────────────────────
W, H, FPS, TOTAL = 1920, 1080, 30, 72.0
OVERLAP = 0.55          # crossfade tail between scenes (seconds)

PRIMARY   = "#2a93f5"
SECONDARY = "#6cbef9"
ACCENT    = "#1f86f0"
BG        = "#060912"
TEXT      = "#ffffff"
MUTED     = "#9aa3b8"
RED       = "#ff5d6c"
GREEN     = "#34d399"
GONG      = "#7C5CFC"
HUBSPOT   = "#ff7a59"
SF        = "#00a1e0"

def esc(s): return _html.escape(str(s), quote=True)

# ── Inline logo SVGs (stylized brand marks; official files unavailable offline) ──
def svg_gong():
    return ('<svg viewBox="0 0 158 48" class="logo-svg">'
            '<circle cx="20" cy="24" r="14" fill="none" stroke="%s" stroke-width="4"/>'
            '<circle cx="20" cy="24" r="4.5" fill="%s"/>'
            '<text x="44" y="34" class="lw" font-size="30" fill="#fff">Gong</text></svg>' % (GONG, GONG))

def svg_hubspot():
    return ('<svg viewBox="0 0 210 48" class="logo-svg">'
            '<g stroke="%s" stroke-width="2.2">'
            '<line x1="26" y1="24" x2="26" y2="10"/><line x1="26" y1="24" x2="13.5" y2="31"/>'
            '<line x1="26" y1="24" x2="38.5" y2="31"/></g>'
            '<g fill="%s" stroke="%s" stroke-width="2.5">'
            '<circle cx="26" cy="24" r="12.5" fill="none"/></g>'
            '<g fill="%s"><circle cx="26" cy="9.5" r="3.6"/><circle cx="13" cy="31.5" r="3.6"/>'
            '<circle cx="39" cy="31.5" r="3.6"/><circle cx="26" cy="24" r="3.4"/></g>'
            '<text x="54" y="33" class="lw" font-size="27" fill="#fff">HubSpot</text></svg>'
            % (HUBSPOT, HUBSPOT, HUBSPOT, HUBSPOT))

def svg_salesforce():
    return ('<svg viewBox="0 0 232 48" class="logo-svg">'
            '<g fill="%s"><ellipse cx="36" cy="31" rx="28" ry="12"/>'
            '<circle cx="22" cy="25" r="11"/><circle cx="37" cy="18" r="14"/><circle cx="52" cy="26" r="11"/></g>'
            '<text x="76" y="33" class="lw" font-size="25" font-style="italic" font-weight="700" fill="#fff">salesforce</text></svg>'
            % SF)

def svg_comp(glyph, name):
    return ('<svg viewBox="0 0 %d 48" class="logo-svg">%s'
            '<text x="46" y="32" class="lw" font-size="25" font-weight="700" fill="#c4cbd9">%s</text></svg>'
            % (60 + len(name) * 15, glyph, esc(name)))

def svg_hyperbound():
    g = '<polygon points="20,6 33,14 33,30 20,38 7,30 7,14" fill="none" stroke="%s" stroke-width="3"/>' % MUTED
    return svg_comp(g, "Hyperbound")
def svg_mindtickle():
    g = ('<rect x="8" y="10" width="26" height="26" rx="7" fill="none" stroke="%s" stroke-width="3"/>'
         '<circle cx="21" cy="23" r="4.5" fill="%s"/>' % (MUTED, MUTED))
    return svg_comp(g, "Mindtickle")
def svg_secondnature():
    g = '<path d="M9 33 Q19 6 34 31 Q22 31 9 33 Z" fill="%s"/>' % MUTED
    return svg_comp(g, "Second Nature")

# ── Scene timeline (locked to SRT) ──────────────────────────────────
# (start, end) seconds. 14 scenes spanning 0 -> 72.0
BOUNDS = [0.0, 7.76, 13.96, 20.28, 23.48, 29.16, 34.48, 40.28,
          44.92, 49.60, 53.44, 55.20, 58.92, 65.20, 72.0]

def chip(inner, cls="chip anim"):
    return '<div class="%s">%s</div>' % (cls, inner)

# Each scene builder returns (inner_html, extra_gsap_lines[]).  `sid` = "#scene-N".
def scene1(sid, t0):  # PROBLEM
    ghosts = "".join(
        '<div class="ghost anim"><div class="ghost-av"></div><div class="ghost-l1"></div>'
        '<div class="ghost-l2"></div><div class="ghost-tag">Scripted persona</div></div>'
        for _ in range(3))
    inner = (
        '<div class="eyebrow anim">THE STATE OF AI ROLEPLAY</div>'
        '<div class="headline anim">Generic buyers.<br><span class="hl-red">Generic scenarios.</span></div>'
        '<div class="ghost-row">%s</div>' % ghosts)
    return inner, []

def scene2(sid, t0):  # COMPETITORS
    chips = "".join(chip(s + '<div class="chip-sub">AI roleplay</div>')
                    for s in (svg_hyperbound(), svg_mindtickle(), svg_secondnature()))
    inner = (
        '<div class="eyebrow anim">THE STATUS QUO</div>'
        '<div class="headline mid anim">They\'re all the same playbook.</div>'
        '<div class="chip-row">%s</div>'
        '<div class="stamp anim">IDENTICAL SCRIPTS</div>' % chips)
    g = ["tl.from('%s .stamp',{opacity:0,scale:1.6,rotation:-8,duration:0.5,ease:'back.out(2)'},%.2f);" % (sid, t0 + 0.9)]
    return inner, g

def scene3(sid, t0):  # SCRIPTED PROBLEM
    inner = (
        '<div class="split">'
        '  <div class="split-l">'
        '    <div class="eyebrow anim">WHAT THEY CALL "PRACTICE"</div>'
        '    <div class="headline sm anim">A scripted objection<br>with zero relevance.</div>'
        '  </div>'
        '  <div class="card script-card anim">'
        '    <div class="card-top"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>'
        '      <span class="card-title">objection_script.txt</span></div>'
        '    <div class="script-row"><span class="spk gen">BUYER</span>'
        '      <span class="line">"I have a standard objection here."</span></div>'
        '    <div class="script-row"><span class="spk gen">BUYER</span>'
        '      <span class="line">"Insert generic pushback &lt;A/B/C&gt;."</span></div>'
        '    <div class="redtag anim">Nothing to do with your business</div>'
        '  </div>'
        '</div>')
    g = ["tl.from('%s .redtag',{opacity:0,y:14,scale:0.8,duration:0.45,ease:'back.out(2)'},%.2f);" % (sid, t0 + 0.9)]
    return inner, g

def scene4(sid, t0):  # BRAND PIVOT
    inner = (
        '<div class="brand-wrap">'
        '  <img class="brand-logo anim" src="assets/logos/dialfyne.png"/>'
        '  <div class="subhead anim">Here\'s what we do differently.</div>'
        '</div>')
    return inner, []

def scene5(sid, t0):  # INTEGRATIONS
    chips = "".join(chip(s) for s in (svg_salesforce(), svg_gong(), svg_hubspot()))
    sub = ['Your CRM', 'Your Gong calls', 'Your HubSpot data']
    chips = "".join(chip(s + '<div class="chip-sub">%s</div>' % sub[i])
                    for i, s in enumerate((svg_salesforce(), svg_gong(), svg_hubspot())))
    inner = (
        '<div class="eyebrow anim">CONNECTED TO YOUR STACK</div>'
        '<div class="headline mid anim">Pulled straight from your data.</div>'
        '<div class="chip-row">%s</div>'
        '<div class="flow-row anim"><div class="flow-line"></div>'
        '<div class="flow-hub">Dialfyne</div><div class="flow-line"></div></div>' % chips)
    return inner, []

def scene6(sid, t0):  # AI BUYER
    attrs = ['Knows your product', 'Trained on your ICP', 'Real pain points', 'Your exact pricing']
    a = "".join('<div class="attr anim">%s</div>' % a for a in attrs)
    inner = (
        '<div class="split">'
        '  <div class="split-l">'
        '    <div class="eyebrow anim">AI BUYERS, BUILT FROM YOUR REALITY</div>'
        '    <div class="headline sm anim">AI buyers that actually<br>know your world.</div>'
        '  </div>'
        '  <div class="card persona anim">'
        '    <div class="persona-head"><div class="persona-av">VP</div>'
        '      <div><div class="persona-name">VP of Sales · Mid-Market</div>'
        '      <div class="persona-role">AI Buyer · live</div></div>'
        '      <span class="live-dot"></span></div>'
        '    <div class="attr-grid">%s</div>'
        '  </div>'
        '</div>' % a)
    return inner, []

def scene7(sid, t0):  # OBJECTIONS — the big one
    objs = [
        '"You\'re pricier than the tool we already use."',
        '"We don\'t have budget until next quarter."',
        '"Your team can\'t integrate with our stack."',
    ]
    cards = "".join(
        '<div class="obj-card anim"><div class="obj-q">%s</div>'
        '<div class="lost"><span class="x">&#10005;</span> Lost deal</div></div>' % esc(o) for o in objs)
    inner = (
        '<div class="eyebrow anim red">THIS IS THE BIG ONE</div>'
        '<div class="headline mid anim">The exact objections that killed<br>your last <span class="hl">10 deals.</span></div>'
        '<div class="obj-row">%s</div>' % cards)
    g = ["tl.from('%s .lost',{opacity:0,scale:1.5,duration:0.4,stagger:0.12,ease:'back.out(2)'},%.2f);" % (sid, t0 + 0.7)]
    return inner, g

def scene8(sid, t0):  # PRACTICE before/after
    inner = (
        '<div class="eyebrow anim">SO PRACTICE FEELS REAL</div>'
        '<div class="ba-row">'
        '  <div class="ba ghostbox anim"><div class="ba-cap">A made-up persona</div>'
        '    <div class="ba-face dim">?</div><div class="ba-note">Generic. Forgettable.</div></div>'
        '  <div class="ba-arrow anim">&#8594;</div>'
        '  <div class="ba realbox anim"><div class="ba-cap on">A real buyer</div>'
        '    <div class="ba-face live">VP</div><div class="ba-note on">From your pipeline.</div></div>'
        '</div>')
    return inner, []

def scene9(sid, t0):  # ROLEPLAY call
    bars = "".join('<span style="--i:%d"></span>' % i for i in range(34))
    inner = (
        '<div class="split">'
        '  <div class="split-l">'
        '    <div class="eyebrow anim">LIVE ROLEPLAY</div>'
        '    <div class="headline sm anim">The real conversations<br>you\'ll have tomorrow.</div>'
        '  </div>'
        '  <div class="card callpanel anim">'
        '    <div class="call-head"><div class="call-av">AI</div>'
        '      <div><div class="persona-name">AI Buyer · VP Sales</div>'
        '      <div class="persona-role">Roleplay in progress</div></div>'
        '      <div class="timer"><span class="live-dot"></span> 00:42</div></div>'
        '    <div class="wave">%s</div>'
        '    <div class="bubbles">'
        '      <div class="bub in anim">"Honestly — you cost more than what we run today. Why switch?"</div>'
        '      <div class="bub out anim">"Fair. Here\'s the ROI in your own numbers&hellip;"</div>'
        '    </div>'
        '    <div class="pills"><span class="pill anim">Objection handled</span>'
        '      <span class="pill ok anim">Confidence &#8593;</span></div>'
        '  </div>'
        '</div>' % bars)
    return inner, []

def scene10(sid, t0):  # OUTCOME stats
    inner = (
        '<div class="eyebrow anim">THE OUTCOME</div>'
        '<div class="headline mid anim">Reps get better, faster.<br>Close rates climb.</div>'
        '<div class="stat-row">'
        '  <div class="stat anim"><div class="stat-v"><span id="ct-a">0</span>&#215;</div><div class="stat-l">faster ramp</div></div>'
        '  <div class="stat anim"><div class="stat-v">+<span id="ct-b">0</span>%</div><div class="stat-l">win rate</div></div>'
        '  <div class="stat anim"><div class="stat-v">&#8722;<span id="ct-c">0</span>%</div><div class="stat-l">slipped deals</div></div>'
        '</div>')
    def ctr(eid, target, t):
        return ("(function(){var o={v:0};tl.to(o,{v:%d,duration:1.1,ease:'power1.out',"
                "onUpdate:function(){var e=document.getElementById('%s');if(e)e.textContent=Math.round(o.v);}},%.2f);})();"
                % (target, eid, t))
    g = [ctr('ct-a', 2, t0 + 0.4), ctr('ct-b', 18, t0 + 0.5), ctr('ct-c', 27, t0 + 0.6)]
    return inner, g

def scene11(sid, t0):  # It's that simple
    inner = '<div class="headline big center anim">It\'s that simple.</div>'
    return inner, []

def scene12(sid, t0):  # PRICING
    ticks = ['Unlimited roleplays', 'Built from your CRM &amp; calls', 'Team-level analytics']
    tk = "".join('<div class="tick anim"><span class="ck">&#10003;</span> %s</div>' % t for t in ticks)
    inner = (
        '<div class="eyebrow anim">SIMPLE PRICING</div>'
        '<div class="card price anim">'
        '  <div class="price-v"><span class="cur">$</span><span id="ct-price">0</span>'
        '    <span class="per">/ seat / month</span></div>'
        '  <div class="tick-list">%s</div>'
        '</div>' % tk)
    g = [("(function(){var o={v:0};tl.to(o,{v:60,duration:1.0,ease:'power2.out',"
          "onUpdate:function(){var e=document.getElementById('ct-price');if(e)e.textContent=Math.round(o.v);}},%.2f);})();"
          % (t0 + 0.35))]
    return inner, g

def scene13(sid, t0):  # CTA
    inner = (
        '<div class="cta-wrap">'
        '  <img class="brand-logo sm anim" src="assets/logos/dialfyne.png"/>'
        '  <div class="headline mid anim">Turn your team into closers.</div>'
        '  <div class="cta-btn anim">dialfyne.com/roleplay</div>'
        '</div>')
    g = ["tl.to('%s .cta-btn',{scale:1.04,duration:0.7,yoyo:true,repeat:6,ease:'sine.inOut'},%.2f);" % (sid, t0 + 1.2)]
    return inner, g

def scene14(sid, t0):  # CLOSE
    inner = (
        '<div class="close-wrap">'
        '  <div class="eyebrow anim">NO HARD SELL</div>'
        '  <div class="headline sm center anim">An honest breakdown of<br>exactly how it works.</div>'
        '  <div class="subhead anim">See if it makes sense for your business.</div>'
        '  <div class="close-foot anim"><img class="brand-logo xs" src="assets/logos/dialfyne.png"/>'
        '    <span class="close-url">dialfyne.com/roleplay</span></div>'
        '</div>')
    return inner, []

SCENES = [scene1, scene2, scene3, scene4, scene5, scene6, scene7,
          scene8, scene9, scene10, scene11, scene12, scene13, scene14]

# Background gradient tint per scene (subtle)
BG_TINT = [PRIMARY, MUTED, RED, PRIMARY, PRIMARY, PRIMARY, RED,
           PRIMARY, PRIMARY, GREEN, PRIMARY, PRIMARY, PRIMARY, PRIMARY]

# Entrance/exit flavor cycle
def enter_exit(sid, t0, t1, idx):
    flavors = ["rise", "zoom", "slideR", "blur", "slideL", "drift"]
    f = flavors[idx % len(flavors)]
    IN = {
        "rise":  "{opacity:0,y:70,scale:0.97}", "zoom": "{opacity:0,scale:0.82}",
        "slideR":"{opacity:0,x:160}", "slideL":"{opacity:0,x:-160}",
        "blur":  "{opacity:0,filter:'blur(18px)',scale:1.05}", "drift":"{opacity:0,y:-44,scale:1.06}",
    }[f]
    OUT = {  # transform-only (opacity added in the tween)
        "rise": "y:-54,scale:1.03", "zoom": "scale:1.14", "slideR": "x:-130",
        "blur": "filter:'blur(16px)'", "slideL": "x:130", "drift": "y:46",
    }[f]
    lines = [
        "tl.fromTo('%s',%s,{opacity:1,x:0,y:0,scale:1,filter:'blur(0px)',duration:0.6,ease:'power3.out'},%.2f);" % (sid, IN, t0),
        "tl.from('%s .anim',{opacity:0,y:36,duration:0.55,stagger:0.07,ease:'power3.out'},%.2f);" % (sid, t0 + 0.16),
    ]
    if idx < len(SCENES) - 1:
        lines.append("tl.to('%s',{opacity:0,%s,duration:0.45,ease:'power2.in'},%.2f);" % (sid, OUT, t1))
    return lines

# ── CSS ─────────────────────────────────────────────────────────────
CSS = r"""
__FONTFACE__
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:__BG__;
  font-family:'Inter',sans-serif;color:__TEXT__;-webkit-font-smoothing:antialiased}
#main{position:relative;width:1920px;height:1080px;overflow:hidden}

/* base background */
.bg-base{position:absolute;inset:0;background:
  radial-gradient(ellipse 70% 55% at 50% 38%, rgba(42,147,245,0.10), transparent 60%),
  radial-gradient(circle at 18% 20%, rgba(42,147,245,0.06), transparent 45%),
  radial-gradient(circle at 84% 82%, rgba(108,190,249,0.05), transparent 45%), __BG__;}
.grid{position:absolute;inset:0;opacity:0.05;background-image:
  linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),
  linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:64px 64px;
  -webkit-mask-image:radial-gradient(ellipse 75% 65% at 50% 45%,#000,transparent 75%);
          mask-image:radial-gradient(ellipse 75% 65% at 50% 45%,#000,transparent 75%);}
.orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.16;}
.orb.a{width:760px;height:760px;left:-160px;top:-200px;background:__PRIMARY__;animation:drift1 26s ease-in-out infinite}
.orb.b{width:680px;height:680px;right:-160px;bottom:-220px;background:__SECONDARY__;animation:drift2 30s ease-in-out infinite}
@keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(80px,60px)}}
@keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-70px,-50px)}}
.vignette{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 320px rgba(0,0,0,.55)}

/* scene shell */
.scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;padding:60px 120px;will-change:transform,opacity,filter}

.eyebrow{font-size:21px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:__PRIMARY__;margin-bottom:26px}
.eyebrow.red{color:__RED__}
.headline{font-size:104px;font-weight:850;line-height:1.04;letter-spacing:-.03em}
.headline.mid{font-size:82px}
.headline.sm{font-size:64px;text-align:left}
.headline.big{font-size:140px}
.headline.center{text-align:center}
.hl{color:__PRIMARY__}
.hl-red{color:__RED__}
.subhead{font-size:34px;font-weight:500;color:rgba(255,255,255,.72);margin-top:26px;letter-spacing:-.01em}

.split{display:flex;align-items:center;justify-content:center;gap:90px;width:100%;max-width:1560px}
.split-l{flex:1;text-align:left}

/* glass card */
.card{background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.03));
  border:1px solid rgba(255,255,255,.12);border-radius:26px;
  box-shadow:0 40px 110px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.14);backdrop-filter:blur(16px)}
.card-top{display:flex;align-items:center;gap:9px;padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.08)}
.dot{width:12px;height:12px;border-radius:50%}.dot.r{background:#ff5f56}.dot.y{background:#ffbd2e}.dot.g{background:#27c93f}
.card-title{margin-left:10px;font-size:16px;color:rgba(255,255,255,.5);font-weight:600}

/* logo chips */
.chip-row{display:flex;gap:30px;justify-content:center;margin-top:48px;flex-wrap:wrap}
.chip{display:flex;flex-direction:column;align-items:center;gap:14px;min-width:300px;padding:34px 30px;border-radius:22px;
  background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.028));
  border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 60px rgba(0,0,0,.34)}
.logo-svg{height:46px;width:auto;display:block}
.lw{font-family:Inter,sans-serif;font-weight:800;letter-spacing:-.01em}
.chip-sub{font-size:18px;color:rgba(255,255,255,.5);font-weight:600}
.stamp{margin-top:42px;font-size:24px;font-weight:800;letter-spacing:.16em;color:__MUTED__;
  border:2px dashed rgba(154,163,184,.5);padding:12px 26px;border-radius:14px;transform:rotate(-3deg)}

/* scene1 ghosts */
.ghost-row{display:flex;gap:34px;margin-top:60px}
.ghost{width:250px;padding:26px;border:2px dashed rgba(154,163,184,.4);border-radius:20px;opacity:.5;
  display:flex;flex-direction:column;align-items:center;gap:14px}
.ghost-av{width:62px;height:62px;border-radius:50%;background:rgba(154,163,184,.25)}
.ghost-l1{width:70%;height:12px;border-radius:6px;background:rgba(154,163,184,.22)}
.ghost-l2{width:50%;height:12px;border-radius:6px;background:rgba(154,163,184,.16)}
.ghost-tag{margin-top:6px;font-size:15px;color:__MUTED__;font-weight:600}

/* scene3 script card */
.script-card{width:620px}
.script-row{display:flex;gap:16px;align-items:flex-start;padding:20px 26px}
.spk{font-size:14px;font-weight:800;letter-spacing:.05em;color:__MUTED__;min-width:70px;padding-top:3px}
.script-row .line{font-size:24px;color:rgba(255,255,255,.78);font-family:ui-monospace,monospace;text-align:left}
.redtag{margin:8px 26px 26px;display:inline-block;align-self:flex-start;background:rgba(255,93,108,.14);
  color:__RED__;border:1px solid rgba(255,93,108,.45);font-weight:700;font-size:19px;padding:10px 18px;border-radius:12px}

/* brand pivot */
.brand-wrap{display:flex;flex-direction:column;align-items:center;gap:8px}
.brand-logo{height:150px;width:auto;filter:drop-shadow(0 18px 50px rgba(42,147,245,.35))}
.brand-logo.sm{height:74px}.brand-logo.xs{height:40px}

/* integrations flow */
.flow-row{display:flex;align-items:center;gap:22px;margin-top:44px}
.flow-line{width:120px;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,__PRIMARY__)}
.flow-line:last-child{background:linear-gradient(90deg,__PRIMARY__,transparent)}
.flow-hub{font-size:30px;font-weight:850;letter-spacing:-.02em;color:#fff;padding:14px 30px;border-radius:16px;
  background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);box-shadow:0 16px 44px rgba(42,147,245,.45)}

/* persona / ai buyer */
.persona{width:560px;padding:0}
.persona-head{display:flex;align-items:center;gap:18px;padding:26px 30px;border-bottom:1px solid rgba(255,255,255,.08)}
.persona-av,.call-av{width:62px;height:62px;border-radius:16px;display:flex;align-items:center;justify-content:center;
  font-weight:850;font-size:24px;color:#fff;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__)}
.persona-name{font-size:24px;font-weight:800}.persona-role{font-size:17px;color:__PRIMARY__;font-weight:600;margin-top:2px}
.live-dot{width:12px;height:12px;border-radius:50%;background:__GREEN__;box-shadow:0 0 12px __GREEN__;margin-left:auto;
  animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.attr-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:28px 30px}
.attr{background:rgba(42,147,245,.12);border:1px solid rgba(42,147,245,.32);border-radius:14px;padding:18px 20px;
  font-size:20px;font-weight:600;text-align:left;color:#eaf2ff}

/* objections */
.obj-row{display:flex;gap:26px;margin-top:52px}
.obj-card{width:380px;padding:34px 30px;border-radius:22px;text-align:left;
  background:linear-gradient(180deg,rgba(255,93,108,.10),rgba(255,255,255,.025));
  border:1px solid rgba(255,93,108,.30);box-shadow:0 28px 70px rgba(0,0,0,.4)}
.obj-q{font-size:27px;font-weight:600;line-height:1.32;color:#fff;min-height:140px}
.lost{display:inline-flex;align-items:center;gap:9px;font-size:19px;font-weight:800;color:__RED__;
  background:rgba(255,93,108,.16);border:1px solid rgba(255,93,108,.5);padding:9px 16px;border-radius:11px}
.lost .x{font-size:15px}

/* before/after */
.ba-row{display:flex;align-items:center;gap:40px;margin-top:54px}
.ba{width:380px;padding:40px 30px;border-radius:24px;display:flex;flex-direction:column;align-items:center;gap:18px}
.ghostbox{border:2px dashed rgba(154,163,184,.45);opacity:.62}
.realbox{background:linear-gradient(180deg,rgba(42,147,245,.16),rgba(255,255,255,.03));border:1px solid rgba(42,147,245,.4);
  box-shadow:0 30px 80px rgba(42,147,245,.22)}
.ba-cap{font-size:24px;font-weight:800;color:__MUTED__}.ba-cap.on{color:__PRIMARY__}
.ba-face{width:108px;height:108px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:850}
.ba-face.dim{background:rgba(154,163,184,.2);color:__MUTED__}
.ba-face.live{background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);color:#fff}
.ba-note{font-size:19px;color:__MUTED__}.ba-note.on{color:rgba(255,255,255,.8)}
.ba-arrow{font-size:54px;color:__PRIMARY__;font-weight:300}

/* roleplay call */
.callpanel{width:600px;padding:0}
.call-head{display:flex;align-items:center;gap:18px;padding:24px 30px;border-bottom:1px solid rgba(255,255,255,.08)}
.timer{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:rgba(255,255,255,.75)}
.wave{display:flex;align-items:center;justify-content:center;gap:5px;height:84px;padding:18px 30px 6px}
.wave span{width:6px;border-radius:99px;background:linear-gradient(180deg,__PRIMARY__,__SECONDARY__);
  height:calc(16px + 44px*(0.5 + 0.5*1));animation:bar 1.1s ease-in-out infinite;animation-delay:calc(var(--i)*-0.06s);opacity:.85}
@keyframes bar{0%,100%{height:18px}50%{height:64px}}
.bubbles{padding:6px 30px;display:flex;flex-direction:column;gap:14px}
.bub{max-width:84%;padding:16px 20px;border-radius:18px;font-size:21px;line-height:1.4}
.bub.in{align-self:flex-start;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-bottom-left-radius:5px}
.bub.out{align-self:flex-end;background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);color:#fff;border-bottom-right-radius:5px}
.pills{display:flex;gap:12px;padding:14px 30px 28px}
.pill{font-size:18px;font-weight:700;color:__PRIMARY__;background:rgba(42,147,245,.14);border:1px solid rgba(42,147,245,.45);
  padding:9px 16px;border-radius:999px}
.pill.ok{color:__GREEN__;background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.45)}

/* stats */
.stat-row{display:flex;gap:60px;margin-top:54px}
.stat{display:flex;flex-direction:column;align-items:center;gap:12px}
.stat-v{font-size:96px;font-weight:850;letter-spacing:-.04em;color:__PRIMARY__;line-height:1;font-variant-numeric:tabular-nums}
.stat-l{font-size:22px;color:rgba(255,255,255,.62);font-weight:600}

/* pricing */
.price{padding:48px 60px;text-align:center;border:1px solid rgba(42,147,245,.4);
  background:linear-gradient(180deg,rgba(42,147,245,.12),rgba(255,255,255,.03))}
.price-v{font-size:120px;font-weight:850;letter-spacing:-.04em;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.price-v .cur{font-size:64px;vertical-align:super;color:__PRIMARY__}
.price-v .per{display:block;font-size:26px;font-weight:600;color:rgba(255,255,255,.6);letter-spacing:0;margin-top:10px}
.tick-list{display:flex;flex-direction:column;gap:14px;margin-top:34px;text-align:left}
.tick{font-size:23px;font-weight:600;color:rgba(255,255,255,.86)}
.tick .ck{color:__GREEN__;font-weight:900;margin-right:10px}

/* cta */
.cta-wrap,.close-wrap{display:flex;flex-direction:column;align-items:center;gap:30px}
.cta-btn{font-size:34px;font-weight:800;letter-spacing:-.01em;color:#fff;padding:22px 46px;border-radius:16px;
  background:linear-gradient(135deg,__PRIMARY__,__ACCENT__);box-shadow:0 22px 60px rgba(42,147,245,.5)}
.close-wrap{gap:22px}
.close-foot{display:flex;align-items:center;gap:16px;margin-top:18px}
.close-url{font-size:24px;font-weight:700;color:__PRIMARY__}

/* watermark */
.wm{position:absolute;top:44px;left:54px;height:38px;opacity:.9;filter:drop-shadow(0 2px 8px rgba(0,0,0,.4))}
.wm img{height:38px;width:auto}

/* captions */
.cap{position:absolute;left:0;right:0;bottom:78px;display:flex;justify-content:center;pointer-events:none}
.cap-inner{display:inline-flex;flex-wrap:wrap;justify-content:center;gap:0 14px;max-width:1400px;padding:16px 34px;border-radius:18px;
  background:rgba(8,12,22,.62);border:1px solid rgba(255,255,255,.10);backdrop-filter:blur(10px);
  box-shadow:0 18px 50px rgba(0,0,0,.45)}
.cap .w{font-size:38px;font-weight:700;letter-spacing:-.01em;color:#fff;display:inline-block;will-change:transform,opacity}
.cap .w.key{color:__SECONDARY__}
"""

def fontface():
    out = []
    for wt, fn in [(400, "400"), (500, "500"), (600, "600"), (700, "700"), (800, "800"), (900, "900")]:
        out.append("@font-face{font-family:'Inter';font-style:normal;font-weight:%d;font-display:block;"
                   "src:url('assets/fonts/inter-latin-%s-normal.woff2') format('woff2')}" % (wt, fn))
    return "\n".join(out)

def css():
    c = CSS.replace("__FONTFACE__", fontface())
    for k, v in [("__BG__", BG), ("__TEXT__", TEXT), ("__PRIMARY__", PRIMARY), ("__SECONDARY__", SECONDARY),
                 ("__ACCENT__", ACCENT), ("__MUTED__", MUTED), ("__RED__", RED), ("__GREEN__", GREEN)]:
        c = c.replace(k, v)
    return c

# ── Captions (karaoke-ish word reveal, synced to SRT) ───────────────
KEYWORDS = {"dialfyne", "dialfyne.com/roleplay", "gong", "hubspot", "crm", "hyperbound",
            "mindtickle", "second", "nature", "60", "closers", "objections", "10", "deals"}
SEGMENTS = [
    (0.00, 7.76, "Look, most AI roleplay platforms out there are selling you generic buyers in generic scenarios."),
    (7.76, 13.96, "Hyperbound, Mindtickle, Second Nature — all basically the same playbook."),
    (13.96, 20.28, "Your reps practice against a scripted objection that has nothing to do with your business."),
    (20.28, 23.48, "Here's what we do differently at Dialfyne."),
    (23.48, 29.16, "We pull directly from your CRM, your Gong calls, your HubSpot data."),
    (29.16, 34.48, "We build AI buyers that actually know your product and your ideal customer."),
    (34.48, 40.28, "And this is the big one — the exact objections that killed your last 10 deals."),
    (40.28, 44.92, "When your team sits down to practice, they're not fighting a made-up persona."),
    (44.92, 49.60, "They're training against the real conversations they'll have tomorrow."),
    (49.60, 53.44, "Your reps get better faster. Your close rates go up."),
    (53.44, 55.20, "It's that simple."),
    (55.20, 58.92, "And it starts at just 60 bucks per seat, per month."),
    (58.92, 65.20, "If you're serious about turning your team into closers, head to dialfyne.com/roleplay."),
    (65.20, 71.80, "We'll give you an honest breakdown — and see if it makes sense for your business."),
]

def caption_lines(max_words=7):
    lines = []
    for s, e, text in SEGMENTS:
        words = text.split()
        # chunk into <= max_words
        chunks = [words[i:i + max_words] for i in range(0, len(words), max_words)]
        # avoid a tiny dangling last chunk
        if len(chunks) >= 2 and len(chunks[-1]) <= 2:
            chunks[-2] += chunks[-1]; chunks.pop()
        total = sum(len(c) for c in chunks)
        t = s
        for c in chunks:
            frac = len(c) / total
            dur = (e - s) * frac
            lines.append((t, t + dur, c))
            t += dur
    return lines

def is_key(w):
    return w.strip(",.;:—\"'!?").lower() in KEYWORDS

# ── Assemble ────────────────────────────────────────────────────────
def build():
    body, gsap = [], []

    # base background (persistent)
    body.append('<div class="bg-base clip" data-start="0" data-duration="%.1f" data-track-index="1">'
                '<div class="grid"></div><div class="orb a"></div><div class="orb b"></div></div>' % TOTAL)

    # scenes
    for i, fn in enumerate(SCENES):
        t0, t1 = BOUNDS[i], BOUNDS[i + 1]
        sid = "#scene-%d" % i
        dur = (t1 - t0) + (OVERLAP if i < len(SCENES) - 1 else 0.2)
        inner, extra = fn(sid, t0)
        body.append('<div id="scene-%d" class="scene clip" data-start="%.2f" data-duration="%.2f" '
                    'data-track-index="%d">%s</div>' % (i, t0, dur, 10 + i, inner))
        gsap += enter_exit(sid, t0, t1, i)
        gsap += extra

    # watermark (hidden during brand pivot scene)
    body.append('<div class="wm clip" data-start="8.0" data-duration="12.0" data-track-index="80">'
                '<img src="assets/logos/dialfyne.png"/></div>')
    body.append('<div class="wm clip" data-start="29.4" data-duration="29.0" data-track-index="80">'
                '<img src="assets/logos/dialfyne.png"/></div>')
    gsap.append("tl.fromTo('.wm',{opacity:0},{opacity:0.9,duration:0.6},8.0);")

    # captions
    for k, (cs, ce, words) in enumerate(caption_lines()):
        spans = "".join('<span class="w%s">%s</span>' % (" key" if is_key(w) else "", esc(w)) for w in words)
        cdur = (ce - cs) + 0.12
        body.append('<div id="cap-%d" class="cap clip" data-start="%.2f" data-duration="%.2f" data-track-index="%d">'
                    '<div class="cap-inner">%s</div></div>' % (k, cs, cdur, 90 + (k % 2), spans))
        gsap.append("tl.from('#cap-%d .w',{opacity:0,yPercent:55,scale:0.9,duration:0.26,stagger:0.035,ease:'power2.out'},%.2f);" % (k, cs))
        gsap.append("tl.to('#cap-%d',{opacity:0,duration:0.18,ease:'power1.in'},%.2f);" % (k, ce))

    # audio (pre-mixed VO + ducked music)
    body.append('<audio id="soundtrack" src="assets/soundtrack.mp3" data-start="0" data-duration="%.2f" data-track-index="100"></audio>' % TOTAL)

    html_doc = """<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=1920, height=1080"/>
<title>Dialfyne — Why Dialfyne for Roleplay</title>
<script src="assets/gsap.min.js"></script>
<style>
%s
</style>
</head>
<body>
<div id="main" data-composition-id="main" data-width="1920" data-height="1080" data-start="0" data-duration="%.1f">
%s
<script>
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
%s
window.__timelines["main"] = tl;
</script>
</div>
</body>
</html>""" % (css(), TOTAL, "\n".join(body), "\n".join(gsap))

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html_doc)
    print("wrote index.html  (%d scenes, %d caption lines, %.1fs)" %
          (len(SCENES), len(caption_lines()), TOTAL))

if __name__ == "__main__":
    build()
