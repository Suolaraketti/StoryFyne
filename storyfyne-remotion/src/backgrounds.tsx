// ─── Minimal Background Library ─────────────────────────────────────
// Restraint reads as confidence. One subtle background system.

import React from "react";
import { AbsoluteFill } from "remotion";

// ─── 1. Clean Light ─────────────────────────────────────────────────
// Solid light background. Used for most statement and metric scenes.

export const CleanLight: React.FC<{
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

// ─── 2. Soft Gradient ───────────────────────────────────────────────
// Very subtle gradient for evidence/flow scenes. Barely noticeable.

export const SoftGradient: React.FC<{
  bgColor: string;
  primaryColor: string;
}> = ({ bgColor, primaryColor }) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${bgColor} 0%, ${bgColor} 60%, ${primaryColor}08 100%)`,
      }}
    />
  );
};

// ─── Background Registry ────────────────────────────────────────────

export const Backgrounds: Record<string, React.FC<any>> = {
  cleanLight: CleanLight,
  softGradient: SoftGradient,
};

export const getBackgroundForSceneType = (type: string): string => {
  switch (type) {
    case "statement":
    case "title":
    case "problem":
    case "solution":
      return "cleanLight";
    case "evidence":
    case "feature":
    case "benefit":
    case "flow":
    case "process":
      return "softGradient";
    case "metric":
    case "stats":
    case "lockup":
    case "cta":
      return "cleanLight";
    default:
      return "cleanLight";
  }
};
