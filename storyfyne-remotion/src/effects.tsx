// ─── Cinematic Post-Processing Effects ──────────────────────────────
// Lens flares, chromatic aberration, light leaks, film dust, scanlines,
// glitch, holographic shimmer, neon bloom. These overlay on top of scenes
// to give each video a unique cinematic signature.

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";

// ─── 1. Lens Flare ──────────────────────────────────────────────────
// Simulated anamorphic lens flare that sweeps across the frame.
// Use on hero statements and lockups for cinematic punch.

export const LensFlare: React.FC<{
  intensity?: number;
  color?: string;
  sweepDuration?: number;
  delay?: number;
}> = ({ intensity = 0.6, color = "#ffffff", sweepDuration = 60, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const progress = interpolate(frame - delay, [0, sweepDuration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = progress * width * 1.5 - width * 0.25;
  const y = height * 0.5 + Math.sin(progress * Math.PI * 2) * height * 0.1;
  const size = 200 + Math.sin(progress * Math.PI) * 100;
  const opacity = Math.sin(progress * Math.PI) * intensity;

  return (
    <AbsoluteFill style={{ zIndex: 150, pointerEvents: "none", opacity }}>
      {/* Main flare orb */}
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}88 0%, ${color}22 40%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />
      {/* Horizontal streak */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: y - 2,
          width: width,
          height: 4,
          background: `linear-gradient(90deg, transparent 0%, ${color}44 30%, ${color}88 50%, ${color}44 70%, transparent 100%)`,
          filter: "blur(8px)",
        }}
      />
      {/* Secondary orb */}
      <div
        style={{
          position: "absolute",
          left: x - size * 0.3 - 60,
          top: y + 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
          filter: "blur(10px)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 2. Chromatic Aberration ────────────────────────────────────────
// RGB channel split that intensifies during transitions and impact moments.
// Creates a subtle "expensive camera" distortion feel.

export const ChromaticAberration: React.FC<{
  intensity?: number;
  frame: number;
  duration?: number;
}> = ({ intensity = 3, frame, duration = 30 }) => {
  const progress = interpolate(frame, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const currentIntensity = Math.sin(progress * Math.PI) * intensity;
  return (
    <AbsoluteFill style={{ zIndex: 150, pointerEvents: "none", mixBlendMode: "screen" }}>
      <div
        style={{
          position: "absolute",
          inset: -currentIntensity * 2,
          background: "transparent",
          boxShadow: `inset ${currentIntensity}px 0 ${currentIntensity * 2}px rgba(255,0,0,0.15), inset -${currentIntensity}px 0 ${currentIntensity * 2}px rgba(0,255,255,0.15)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 3. Light Leak ──────────────────────────────────────────────────
// Organic light leak that drifts across corners like real film stock.
// Different color temperatures per leak.

export const LightLeak: React.FC<{
  color?: string;
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  intensity?: number;
  driftSpeed?: number;
}> = ({ color = "#ff6b35", corner = "top-left", intensity = 0.25, driftSpeed = 0.3 }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * driftSpeed * 0.05) * 30;
  const pulse = Math.sin(frame * 0.02) * 0.1 + 0.9;

  const positions = {
    "top-left": { top: -100 + drift, left: -100 + drift },
    "top-right": { top: -100 + drift, right: -100 + drift },
    "bottom-left": { bottom: -100 + drift, left: -100 + drift },
    "bottom-right": { bottom: -100 + drift, right: -100 + drift },
  };

  return (
    <AbsoluteFill style={{ zIndex: 140, pointerEvents: "none", mixBlendMode: "screen" }}>
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, ${color}88 20%, transparent 60%)`,
          filter: "blur(80px)",
          opacity: intensity * pulse,
          ...positions[corner],
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 4. Film Dust & Scratches ───────────────────────────────────────
// Procedural dust particles and occasional scratch lines.
// Seeds from frame number so it's deterministic but organic.

export const FilmDust: React.FC<{
  density?: number;
  scratchChance?: number;
}> = ({ density = 30, scratchChance = 0.02 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const dustParticles = React.useMemo(() => {
    return Array.from({ length: density }, (_, i) => ({
      x: random(`dust-x-${i}`) * width,
      y: random(`dust-y-${i}`) * height,
      size: 1 + random(`dust-s-${i}`) * 3,
      opacity: 0.1 + random(`dust-o-${i}`) * 0.3,
      seed: i,
    }));
  }, [density, width, height]);

  const hasScratch = random(`scratch-${frame}`) < scratchChance;
  const scratchX = random(`scratch-x-${frame}`) * width;

  return (
    <AbsoluteFill style={{ zIndex: 145, pointerEvents: "none" }}>
      {dustParticles.map((p, i) => {
        const flicker = random(`flicker-${frame}-${p.seed}`) > 0.7 ? 0 : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "#ffffff",
              opacity: p.opacity * flicker,
            }}
          />
        );
      })}
      {hasScratch && (
        <div
          style={{
            position: "absolute",
            left: scratchX,
            top: 0,
            width: 1,
            height: "100%",
            background: "rgba(255,255,255,0.15)",
            transform: `rotate(${random(`scratch-angle-${frame}`) * 4 - 2}deg)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// ─── 5. Scanlines ───────────────────────────────────────────────────
// CRT-style horizontal scanlines with subtle flicker.

export const Scanlines: React.FC<{
  intensity?: number;
}> = ({ intensity = 0.08 }) => {
  const frame = useCurrentFrame();
  const flicker = 1 + Math.sin(frame * 0.5) * 0.02;
  return (
    <AbsoluteFill
      style={{
        zIndex: 130,
        pointerEvents: "none",
        backgroundImage: "linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)",
        backgroundSize: "100% 4px",
        opacity: intensity * flicker,
      }}
    />
  );
};

// ─── 6. Digital Glitch ──────────────────────────────────────────────
// RGB block-shift glitch. Use sparingly on impact transitions.

export const GlitchEffect: React.FC<{
  frame: number;
  intensity?: number;
  triggerFrame?: number;
  duration?: number;
}> = ({ frame, intensity = 8, triggerFrame = 0, duration = 10 }) => {
  const progress = interpolate(frame - triggerFrame, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const active = progress > 0 && progress < 1;
  const currentIntensity = Math.sin(progress * Math.PI) * intensity;

  if (!active) return null;

  return (
    <AbsoluteFill style={{ zIndex: 160, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "transparent",
          boxShadow: `inset ${currentIntensity}px 0 ${currentIntensity}px rgba(255,0,0,0.2), inset -${currentIntensity}px 0 ${currentIntensity}px rgba(0,255,255,0.2)`,
        }}
      />
      {Array.from({ length: 5 }).map((_, i) => {
        const y = random(`glitch-y-${frame}-${i}`) * 100;
        const h = 2 + random(`glitch-h-${frame}-${i}`) * 20;
        const offset = (random(`glitch-o-${frame}-${i}`) - 0.5) * currentIntensity * 4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: `${y}%`,
              width: "100%",
              height: h,
              background: "rgba(255,255,255,0.1)",
              transform: `translateX(${offset}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 7. Holographic Shimmer ─────────────────────────────────────────
// Iridescent rainbow shimmer effect for futuristic/cyberpunk scenes.

export const HolographicShimmer: React.FC<{
  intensity?: number;
  speed?: number;
}> = ({ intensity = 0.3, speed = 1 }) => {
  const frame = useCurrentFrame();
  const hue = (frame * speed) % 360;
  return (
    <AbsoluteFill
      style={{
        zIndex: 125,
        pointerEvents: "none",
        mixBlendMode: "overlay",
        background: `linear-gradient(${135 + frame}deg, hsla(${hue},100%,50%,${intensity * 0.3}) 0%, hsla(${(hue + 120) % 360},100%,50%,${intensity * 0.2}) 50%, hsla(${(hue + 240) % 360},100%,50%,${intensity * 0.3}) 100%)`,
      }}
    />
  );
};

// ─── 8. Neon Bloom ──────────────────────────────────────────────────
// Glowing neon outline effect for text and cards.

export const NeonBloom: React.FC<{
  children: React.ReactNode;
  color?: string;
  intensity?: number;
}> = ({ children, color = "#0ea5e9", intensity = 0.5 }) => {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", inset: -4, filter: `blur(12px)`, opacity: intensity }}>
        {children}
      </div>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};

// ─── 9. Speed Lines ─────────────────────────────────────────────────
// Anime-style speed lines radiating from center. For fast transitions.

export const SpeedLines: React.FC<{
  frame: number;
  intensity?: number;
  count?: number;
}> = ({ frame, intensity = 0.3, count = 40 }) => {
  const lines = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * 360 + random(`speed-angle-${i}`) * 10,
      length: 100 + random(`speed-len-${i}`) * 300,
      width: 1 + random(`speed-w-${i}`) * 3,
      delay: random(`speed-d-${i}`) * 20,
    }));
  }, [count]);

  return (
    <AbsoluteFill style={{ zIndex: 120, pointerEvents: "none" }}>
      {lines.map((line, i) => {
        const s = interpolate(frame - line.delay, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const currentLength = line.length * s;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: currentLength,
              height: line.width,
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,${intensity * s}))`,
              transformOrigin: "left center",
              transform: `rotate(${line.angle}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 10. Vignette Pulse ─────────────────────────────────────────────
// Animated vignette that breathes with scene intensity.

export const VignettePulse: React.FC<{
  intensity?: number;
  pulseSpeed?: number;
}> = ({ intensity = 0.4, pulseSpeed = 0.03 }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * pulseSpeed) * 0.15 + 0.85;
  return (
    <AbsoluteFill
      style={{
        zIndex: 135,
        pointerEvents: "none",
        background: `radial-gradient(ellipse at center, transparent ${45 * pulse}%, rgba(0,0,0,${intensity * pulse}) 100%)`,
      }}
    />
  );
};

// ─── 11. Cinematic Master Effect ────────────────────────────────────
// Combines multiple effects based on scene mood. The AI picks a mood,
// and this component renders the right combination.

export type CinematicMood = "clean" | "dramatic" | "retro" | "cyber" | "warm" | "cold" | "minimal";

export const CinematicMaster: React.FC<{
  mood: CinematicMood;
  frame: number;
  intensity?: number;
}> = ({ mood, frame, intensity = 1 }) => {
  const configs: Record<CinematicMood, React.ReactNode> = {
    clean: (
      <>
        <VignettePulse intensity={0.25 * intensity} pulseSpeed={0.02} />
        <FilmDust density={15} scratchChance={0.005} />
      </>
    ),
    dramatic: (
      <>
        <VignettePulse intensity={0.55 * intensity} pulseSpeed={0.04} />
        <LensFlare intensity={0.5 * intensity} sweepDuration={90} />
        <LightLeak color="#ff6b35" corner="top-left" intensity={0.2 * intensity} />
        <FilmDust density={25} scratchChance={0.015} />
      </>
    ),
    retro: (
      <>
        <Scanlines intensity={0.12 * intensity} />
        <VignettePulse intensity={0.45 * intensity} pulseSpeed={0.03} />
        <LightLeak color="#ffaa00" corner="top-right" intensity={0.3 * intensity} />
        <FilmDust density={40} scratchChance={0.025} />
      </>
    ),
    cyber: (
      <>
        <Scanlines intensity={0.06 * intensity} />
        <HolographicShimmer intensity={0.25 * intensity} speed={1.5} />
        <GlitchEffect frame={frame} intensity={4 * intensity} triggerFrame={0} duration={8} />
        <VignettePulse intensity={0.35 * intensity} pulseSpeed={0.05} />
      </>
    ),
    warm: (
      <>
        <LightLeak color="#ff8c42" corner="top-left" intensity={0.35 * intensity} driftSpeed={0.2} />
        <LightLeak color="#ffcc00" corner="bottom-right" intensity={0.2 * intensity} driftSpeed={0.15} />
        <VignettePulse intensity={0.3 * intensity} pulseSpeed={0.025} />
        <FilmDust density={20} scratchChance={0.01} />
      </>
    ),
    cold: (
      <>
        <LightLeak color="#00d4ff" corner="top-right" intensity={0.25 * intensity} driftSpeed={0.25} />
        <VignettePulse intensity={0.35 * intensity} pulseSpeed={0.03} />
        <FilmDust density={20} scratchChance={0.008} />
      </>
    ),
    minimal: (
      <>
        <VignettePulse intensity={0.15 * intensity} pulseSpeed={0.015} />
      </>
    ),
  };

  return <>{configs[mood] || configs.clean}</>;
};
