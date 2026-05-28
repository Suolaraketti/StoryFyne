// ─── Minimal Background Library ─────────────────────────────────────
// OpenAI aesthetic: pure dark, no noise, no gradients. Restraint is confidence.

import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

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

// ─── Background Registry ────────────────────────────────────────────

export const Backgrounds: Record<string, React.FC<any>> = {
  cleanDark: CleanDark,
  subtleGlow: SubtleGlow,
  centerSpotlight: CenterSpotlight,
};

export const getBackgroundForSceneType = (type: string): string => {
  switch (type) {
    case "statement":
    case "title":
    case "problem":
    case "solution":
      return "subtleGlow";
    case "evidence":
    case "feature":
    case "benefit":
    case "flow":
    case "process":
      return "cleanDark";
    case "metric":
    case "stats":
      return "subtleGlow";
    case "lockup":
    case "cta":
      return "centerSpotlight";
    default:
      return "cleanDark";
  }
};
