// ─── Premium Background Stages ──────────────────────────────────────
// Color-aware, gently animated backdrops. Subtle by design so product
// screenshots and typography stay the hero — but never a flat void.

import React from "react";
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate } from "remotion";

type BgProps = {
  bgColor: string;
  primaryColor: string;
  secondaryColor?: string;
};

// Slow sinusoidal drift helper (seconds-based so it's fps-independent).
const drift = (frame: number, fps: number, speed: number, amp: number, phase = 0) =>
  Math.sin((frame / fps) * speed + phase) * amp;

// ─── 1. Clean Dark ──────────────────────────────────────────────────
export const CleanDark: React.FC<BgProps> = ({ bgColor }) => (
  <AbsoluteFill style={{ backgroundColor: bgColor }} />
);

// ─── 2. Subtle Glow ─────────────────────────────────────────────────
export const SubtleGlow: React.FC<BgProps> = ({ bgColor, primaryColor }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const x = drift(frame, fps, 0.18, width * 0.04);
  const y = drift(frame, fps, 0.14, height * 0.04, 1.5);
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      <div style={{
        position: "absolute", right: -width * 0.2 + x, top: -height * 0.2 + y,
        width: width * 0.85, height: height * 0.85, borderRadius: "50%",
        background: `radial-gradient(circle, ${primaryColor}14 0%, transparent 68%)`,
        pointerEvents: "none",
      }} />
    </AbsoluteFill>
  );
};

// ─── 3. Center Spotlight ────────────────────────────────────────────
export const CenterSpotlight: React.FC<BgProps> = ({ bgColor, primaryColor }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 1 + drift(frame, fps, 0.3, 0.04);
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      <div style={{
        position: "absolute", left: "50%", top: "42%", transform: `translate(-50%, -50%) scale(${pulse})`,
        width: width * 0.7, height: height * 0.6, borderRadius: "50%",
        background: `radial-gradient(circle, ${primaryColor}12 0%, transparent 66%)`,
        pointerEvents: "none",
      }} />
      <Vignette strength={0.4} />
    </AbsoluteFill>
  );
};

// ─── 4. Aurora Mesh ─────────────────────────────────────────────────
// Several big, soft color blobs drifting behind the scene. The colorful,
// premium "launch film" backdrop — kept low-opacity so it reads as mood.
export const AuroraMesh: React.FC<BgProps> = ({ bgColor, primaryColor, secondaryColor }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = secondaryColor || primaryColor;
  const blobs = [
    { c: primaryColor, op: "40", bx: 0.2, by: 0.25, s: 0.72, sp: 0.16, ph: 0 },
    { c: sec, op: "38", bx: 0.78, by: 0.7, s: 0.64, sp: 0.13, ph: 2 },
    { c: primaryColor, op: "2c", bx: 0.62, by: 0.2, s: 0.52, sp: 0.2, ph: 4 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      {blobs.map((b, i) => {
        const x = b.bx * width + drift(frame, fps, b.sp, width * 0.05, b.ph);
        const y = b.by * height + drift(frame, fps, b.sp * 0.8, height * 0.05, b.ph + 1);
        const d = Math.min(width, height) * b.s;
        return (
          <div key={i} style={{
            position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d,
            borderRadius: "50%", background: `radial-gradient(circle, ${b.c}${b.op} 0%, transparent 70%)`,
            filter: `blur(${d * 0.06}px)`, pointerEvents: "none",
          }} />
        );
      })}
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};

// ─── 5. Perspective Grid Stage ──────────────────────────────────────
// A glowing grid floor receding to a horizon. SaaS / tech feel.
export const GridStage: React.FC<BgProps> = ({ bgColor, primaryColor }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scroll = (frame / fps) * 18 % 80;
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      {/* Horizon glow */}
      <div style={{
        position: "absolute", left: "50%", top: "58%", transform: "translate(-50%, -50%)",
        width: width * 1.1, height: height * 0.5, borderRadius: "50%",
        background: `radial-gradient(ellipse, ${primaryColor}18 0%, transparent 60%)`,
      }} />
      {/* Receding grid */}
      <div style={{
        position: "absolute", left: "-25%", right: "-25%", bottom: 0, height: "55%",
        transform: "perspective(640px) rotateX(62deg)", transformOrigin: "bottom center",
        backgroundImage: `linear-gradient(${primaryColor}22 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}22 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
        backgroundPositionY: `${scroll}px`,
        maskImage: "linear-gradient(to top, black 10%, transparent 85%)",
        WebkitMaskImage: "linear-gradient(to top, black 10%, transparent 85%)",
      }} />
      <Vignette strength={0.4} />
    </AbsoluteFill>
  );
};

// ─── 6. Gradient Wash ───────────────────────────────────────────────
// A diagonal wash from bg into a hint of brand color. Clean, modern.
export const GradientWash: React.FC<BgProps> = ({ bgColor, primaryColor, secondaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = 120 + drift(frame, fps, 0.12, 14);
  const sec = secondaryColor || primaryColor;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${a}deg, ${bgColor} 0%, ${bgColor} 45%, ${primaryColor}14 78%, ${sec}1c 100%)` }}>
      <Vignette strength={0.35} />
    </AbsoluteFill>
  );
};

// ─── 7. Dot Grid Spotlight ──────────────────────────────────────────
export const DotGrid: React.FC<BgProps> = ({ bgColor, primaryColor }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(${primaryColor}33 1.4px, transparent 1.4px)`,
        backgroundSize: "46px 46px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 72%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 72%)",
        opacity: 0.6,
      }} />
      <div style={{
        position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)",
        width: width * 0.6, height: height * 0.5, borderRadius: "50%",
        background: `radial-gradient(circle, ${primaryColor}10 0%, transparent 65%)`,
      }} />
    </AbsoluteFill>
  );
};

// ─── Vignette helper ────────────────────────────────────────────────
const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.4 }) => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none",
    background: `radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,${strength}) 100%)`,
  }} />
);

// ─── Registry ───────────────────────────────────────────────────────
export const Backgrounds: Record<string, React.FC<BgProps>> = {
  cleanDark: CleanDark,
  subtleGlow: SubtleGlow,
  centerSpotlight: CenterSpotlight,
  auroraMesh: AuroraMesh,
  gridStage: GridStage,
  gradientWash: GradientWash,
  dotGrid: DotGrid,
};

export const getBackgroundForSceneType = (type: string): string => {
  switch (type) {
    case "statement":
    case "title":
    case "problem":
    case "solution":
      return "auroraMesh";
    case "evidence":
    case "feature":
    case "benefit":
      return "gradientWash";
    case "flow":
    case "process":
      return "dotGrid";
    case "metric":
    case "stats":
      return "gridStage";
    case "lockup":
    case "cta":
      return "centerSpotlight";
    default:
      return "gradientWash";
  }
};
