"""Generate original, royalty-free background-music beds for SaaS launches.

These are synthesized from scratch (numpy) so StoryFyne fully owns them — no
licensing, no attribution. They're tasteful, low-key beds meant to sit UNDER
narration at ~20% volume, not standalone bangers.

Usage:
    python tools/generate_music.py            # writes WAVs to assets/music/
Then convert to mp3 (no system ffmpeg needed) with Remotion's bundled ffmpeg:
    for f in assets/music/*.wav; do npx remotion ffmpeg -y -i "$f" -b:a 160k "${f%.wav}.mp3"; done

Each recipe matches an entry in music_library.py (id, bpm, energy, moods).
"""

import os
import wave
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "music")

rng = np.random.default_rng(7)


# ─── Primitives ─────────────────────────────────────────────────────
def midi(n):  # MIDI note -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def adsr(n, a, d, s, r, sus_level=0.7):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    a, d, r = max(1, a), max(1, d), max(1, r)
    sus = max(0, n - a - d - r)
    env = np.concatenate([
        np.linspace(0, 1, a),
        np.linspace(1, sus_level, d),
        np.full(sus, sus_level),
        np.linspace(sus_level, 0, r),
    ])
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n]


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    # additive band-limited-ish saw (few harmonics) keeps it smooth, not harsh
    out = np.zeros(n)
    f = freq * (1 + detune)
    for h in range(1, 9):
        out += (1.0 / h) * np.sin(2 * np.pi * f * h * t)
    return out / 2.2


def sine(freq, n):
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t)


def tri(freq, n):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, h in enumerate(range(1, 15, 2)):
        out += ((-1) ** k) * (1.0 / h ** 2) * np.sin(2 * np.pi * freq * h * t)
    return out * (8 / np.pi ** 2)


def one_pole_lp(x, cutoff):
    # simple one-pole lowpass
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def lp_fast(x, cutoff):
    # vectorized 2-pass smoothing approximation of a lowpass (fast)
    a = np.exp(-2 * np.pi * cutoff / SR)
    # forward IIR via lfilter-like using cumulative trick is hard; use FFT brickwall
    n = len(x)
    X = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    H = 1.0 / (1.0 + (freqs / max(1.0, cutoff)) ** 2)  # 1-pole magnitude
    return np.fft.irfft(X * H, n)


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive)


# ─── Drums ──────────────────────────────────────────────────────────
def kick(n):
    L = min(n, int(0.22 * SR))
    t = np.arange(L) / SR
    f = np.linspace(150, 48, L)
    ph = np.cumsum(2 * np.pi * f / SR)
    env = np.exp(-t * 16)
    body = np.sin(ph) * env
    click = np.exp(-t * 200) * 0.3
    out = np.zeros(n)
    out[:L] = (body + click) * 0.9
    return out


def hat(n, open_=False):
    L = min(n, int((0.08 if open_ else 0.03) * SR))
    noise = rng.standard_normal(L)
    noise = noise - lp_fast(noise, 7000)  # highpass-ish
    env = np.exp(-np.arange(L) / SR * (40 if not open_ else 14))
    out = np.zeros(n)
    out[:L] = noise * env * 0.25
    return out


def clap(n):
    L = min(n, int(0.18 * SR))
    noise = rng.standard_normal(L)
    noise = lp_fast(noise, 3500) - lp_fast(noise, 1200)
    env = np.zeros(L)
    for off in (0, int(0.012 * SR), int(0.024 * SR)):
        seg = np.exp(-np.arange(L - off) / SR * 60)
        env[off:] += seg
    env *= np.exp(-np.arange(L) / SR * 9)
    out = np.zeros(n)
    out[:L] = noise * env * 0.4
    return out


# ─── Chords ─────────────────────────────────────────────────────────
TRIAD = [0, 4, 7]
MIN = [0, 3, 7]
MAJ7 = [0, 4, 7, 11]
MIN7 = [0, 3, 7, 10]
DOM7 = [0, 4, 7, 10]


def chord_notes(root, shape, octave=0):
    return [root + s + 12 * octave for s in shape]


# ─── Render helpers ─────────────────────────────────────────────────
def place(buf, sig, at):
    end = min(len(buf), at + len(sig))
    if at < len(buf):
        buf[at:end] += sig[:end - at]


def sidechain(env_len, kick_frames, depth=0.7, rel=0.16):
    """A pumping gain envelope that dips on each kick and recovers."""
    g = np.ones(env_len)
    reln = int(rel * SR)
    for kf in kick_frames:
        if kf >= env_len:
            continue
        seg = 1 - depth * np.exp(-np.arange(min(reln, env_len - kf)) / SR / (rel / 4))
        g[kf:kf + len(seg)] = np.minimum(g[kf:kf + len(seg)], seg)
    return g


def normalize(x, peak=0.89):
    m = np.max(np.abs(x)) or 1.0
    return x * (peak / m)


def loop_wrap(stereo, ms=40):
    """Equal-power crossfade the tail into the head for a seamless loop."""
    k = int(ms / 1000 * SR)
    if k * 2 >= len(stereo):
        return stereo
    fade_out = np.linspace(1, 0, k)[:, None]
    fade_in = np.linspace(0, 1, k)[:, None]
    head = stereo[:k].copy()
    tail = stereo[-k:].copy()
    stereo[:k] = head * fade_in + tail * fade_out
    return stereo[:-k]


def to_stereo(mono_l, mono_r):
    n = min(len(mono_l), len(mono_r))
    return np.stack([mono_l[:n], mono_r[:n]], axis=1)


def write_wav(path, stereo):
    stereo = np.clip(stereo, -1, 1)
    pcm = (stereo * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ─── Track builder ──────────────────────────────────────────────────
def build(bpm, bars, progression, *, drums="soft", pad=True, arp=None, bass=True,
          pad_cut=900, key=60, swing_pump=0.7, brightness=1.0):
    beat = 60.0 / bpm
    bar = beat * 4
    total = int(bar * bars * SR)
    L = np.zeros(total)
    R = np.zeros(total)

    # Kick pattern (four-on-floor for house/high; soft pulse otherwise)
    kick_frames = []
    if drums in ("four", "soft", "punch"):
        per_bar = 4 if drums in ("four", "punch") else 2
        for b in range(bars):
            for k in range(per_bar):
                kf = int((b * bar + k * (bar / per_bar)) * SR)
                kick_frames.append(kf)

    # ── Pads (chords) ──
    chords_per = bar  # one chord per bar
    pad_buf = np.zeros(total)
    for i in range(bars):
        root, shape = progression[i % len(progression)]
        at = int(i * bar * SR)
        n = int(bar * SR)
        for note in chord_notes(key + root, shape, octave=0):
            f = midi(note)
            v = (saw(f, n, detune=0.006) + saw(f, n, detune=-0.006)) * 0.5
            v *= adsr(n, 0.18, 0.3, 0.85, 0.6, 0.8)
            pad_buf[at:at + len(v)] += v[:total - at] if at + len(v) > total else v
    if pad:
        pad_buf = lp_fast(pad_buf, pad_cut)
        pad_buf = normalize(pad_buf, 0.5)

    # ── Bass (root) ──
    bass_buf = np.zeros(total)
    if bass:
        for i in range(bars):
            root, _ = progression[i % len(progression)]
            at = int(i * bar * SR)
            steps = 4 if drums == "four" else 2
            for s in range(steps):
                nn = int((bar / steps) * SR)
                f = midi(key + root - 24)
                v = sine(f, nn) * adsr(nn, 0.005, 0.08, 0.6, 0.12, 0.6)
                place(bass_buf, v * 0.6, at + int(s * (bar / steps) * SR))
        bass_buf = lp_fast(bass_buf, 320)

    # ── Arp / pluck ──
    arp_buf = np.zeros(total)
    if arp:
        div = arp.get("div", 8)  # notes per bar
        wave_fn = {"tri": tri, "sine": sine, "saw": lambda f, n: saw(f, n, 0.004)}[arp.get("wave", "tri")]
        oct = arp.get("oct", 1)
        gain = arp.get("gain", 0.32)
        for i in range(bars):
            root, shape = progression[i % len(progression)]
            notes = chord_notes(key + root, shape, octave=oct)
            for s in range(div):
                note = notes[s % len(notes)]
                nn = int((bar / div) * SR)
                f = midi(note)
                v = wave_fn(f, nn) * adsr(nn, 0.004, 0.10, 0.25, 0.10, 0.4)
                place(arp_buf, v * gain, int((i * bar + s * (bar / div)) * SR))
        arp_buf = lp_fast(arp_buf, 4200 * brightness)

    # ── Drums render ──
    drum_buf = np.zeros(total)
    if drums != "none":
        for kf in kick_frames:
            place(drum_buf, kick(int(0.25 * SR)), kf)
        # hats on offbeats / 8ths
        if drums in ("four", "soft", "punch"):
            for b in range(bars):
                for k in range(8):
                    hf = int((b * bar + k * (bar / 8)) * SR)
                    place(drum_buf, hat(int(0.1 * SR), open_=(k % 4 == 2)), hf)
        # clap on 2 & 4 for energetic styles
        if drums in ("four", "punch"):
            for b in range(bars):
                for k in (1, 3):
                    cf = int((b * bar + k * beat) * SR)
                    place(drum_buf, clap(int(0.2 * SR)), cf)

    # ── Sidechain pump on pad+bass+arp ──
    if kick_frames:
        g = sidechain(total, kick_frames, depth=swing_pump)
        pad_buf *= g
        bass_buf *= g
        arp_buf *= 0.5 + 0.5 * g

    mono = pad_buf + bass_buf + arp_buf + drum_buf
    mono = soft_clip(mono, 1.1)
    mono = normalize(mono, 0.92)

    # subtle stereo: pad/arp widened, drums/bass center
    width = 0.012
    Lc = mono + width * np.roll(arp_buf, 60)
    Rc = mono - width * np.roll(arp_buf, 60)
    stereo = to_stereo(normalize(Lc, 0.95), normalize(Rc, 0.95))
    stereo = loop_wrap(stereo, ms=45)
    return stereo


# ─── Recipes (match music_library.py) ───────────────────────────────
# Keys: C=60. Progressions are (rootOffset, chordShape) per bar.
def main():
    os.makedirs(OUT, exist_ok=True)
    recipes = {
        # clean, minimal tech — gentle pluck, soft pulse
        "clean-tech-110": dict(bpm=110, bars=8, key=60, drums="soft", pad_cut=850,
            progression=[(0, MAJ7), (7, TRIAD), (9, MIN7), (5, MAJ7)],
            arp={"div": 8, "wave": "tri", "oct": 1, "gain": 0.28}, swing_pump=0.5),
        # uplifting tech — bright, claps, build
        "uplift-tech-120": dict(bpm=120, bars=8, key=60, drums="punch", pad_cut=1100, brightness=1.2,
            progression=[(0, TRIAD), (7, TRIAD), (9, MIN), (5, TRIAD)],
            arp={"div": 16, "wave": "saw", "oct": 1, "gain": 0.26}, swing_pump=0.75),
        # cinematic — slow swelling pads, sub, no drums
        "cinematic-90": dict(bpm=90, bars=8, key=57, drums="none", pad=True, pad_cut=700,
            progression=[(0, MIN), (8, TRIAD), (3, TRIAD), (10, TRIAD)],
            arp=None, swing_pump=0.0),
        # synthwave — saw arp, snare-ish, retro minor
        "synthwave-118": dict(bpm=118, bars=8, key=57, drums="punch", pad_cut=1300, brightness=1.3,
            progression=[(0, MIN), (8, TRIAD), (3, TRIAD), (10, TRIAD)],
            arp={"div": 16, "wave": "saw", "oct": 1, "gain": 0.3}, swing_pump=0.7),
        # warm ambient — mellow, calm, minimal drums
        "warm-ambient-92": dict(bpm=92, bars=8, key=60, drums="soft", pad_cut=750, brightness=0.8,
            progression=[(2, MIN7), (7, DOM7), (0, MAJ7), (0, MAJ7)],
            arp={"div": 8, "wave": "sine", "oct": 1, "gain": 0.2}, swing_pump=0.4),
        # drive house — four-on-floor, energetic
        "drive-house-124": dict(bpm=124, bars=8, key=57, drums="four", pad_cut=1000, brightness=1.1,
            progression=[(0, MIN7), (5, MAJ7)],
            arp={"div": 16, "wave": "saw", "oct": 1, "gain": 0.27}, swing_pump=0.85),
    }
    for name, r in recipes.items():
        print(f"rendering {name} ...")
        stereo = build(**r)
        write_wav(os.path.join(OUT, name + ".wav"), stereo)
    print("done ->", OUT)


if __name__ == "__main__":
    main()
