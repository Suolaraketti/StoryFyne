// ─── Minimal Background Library ─────────────────────────────────────
// OpenAI aesthetic: pure dark, no noise, no gradients. Restraint is confidence.

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// ─── 1. Clean Dark ──────────────────────────────────────────────────
// Solid near-black. The default for OpenAI-style explainers.

export const CleanDark: React.FC<{
  bgColor: string;
}> = ({ bgColor }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
      }}
    />
  );
};

// ─── 2. Subtle Radial Glow ──────────────────────────────────────────
// Very faint accent glow in the corner. Barely visible. Adds depth without noise.

export const SubtleGlow: React.FC<{
  bgColor: string;
  primaryColor: string;
}> = ({ bgColor, primaryColor }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -width * 0.2,
          top: -height * 0.2,
          width: width * 0.8,
          height: height * 0.8,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}08 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 3. Center Spotlight ────────────────────────────────────────────
// Faint center glow for lockup/hero moments.

export const CenterSpotlight: React.FC<{
  bgColor: string;
  primaryColor: string;
}> = ({ bgColor, primaryColor }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
          width: width * 0.6,
          height: height * 0.5,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}06 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export const DialfyneSignal: React.FC<{
  bgColor: string;
  primaryColor: string;
}> = ({ bgColor, primaryColor }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const drift = interpolate(Math.sin(frame / 90), [-1, 1], [-28, 28]);
  const sweep = ((frame * 3) % (width + 420)) - 420;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "96px 96px",
          opacity: 0.18,
          transform: `translate(${Math.round(drift)}px, ${Math.round(drift * 0.4)}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.5 - 520,
          top: height * 0.5 - 330,
          width: 1040,
          height: 660,
          borderRadius: 520,
          background: `radial-gradient(ellipse at center, ${primaryColor}18 0%, ${primaryColor}08 32%, transparent 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: -height * 0.2,
          width: 220,
          height: height * 1.4,
          transform: "rotate(18deg)",
          background: `linear-gradient(90deg, transparent, ${primaryColor}24, transparent)`,
          opacity: 0.55,
        }}
      />
      {Array.from({ length: 5 }).map((_, i) => {
        const y = height * (0.2 + i * 0.14);
        const x = width * 0.08 + ((frame * (0.55 + i * 0.08) + i * 160) % (width * 0.84));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.round(x),
              top: Math.round(y),
              width: 180 - i * 12,
              height: 4,
              borderRadius: 99,
              background: i % 2 === 0 ? primaryColor : "#8bcdf3",
              opacity: 0.1 + i * 0.025,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.56) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Background Registry ────────────────────────────────────────────

export const Backgrounds: Record<string, React.FC<any>> = {
  cleanDark: CleanDark,
  subtleGlow: SubtleGlow,
  centerSpotlight: CenterSpotlight,
  dialfyneSignal: DialfyneSignal,
};

export const getBackgroundForSceneType = (type: string): string => {
  switch (type) {
    case "statement":
    case "title":
    case "problem":
    case "solution":
      return "dialfyneSignal";
    case "evidence":
    case "feature":
    case "benefit":
    case "flow":
    case "process":
      return "dialfyneSignal";
    case "metric":
    case "stats":
      return "subtleGlow";
    case "lockup":
    case "cta":
      return "dialfyneSignal";
    default:
      return "cleanDark";
  }
};
