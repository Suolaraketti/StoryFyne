// ─── Shared Scene Components ────────────────────────────────────────
// Kinetic typography, camera motion, responsive sizing.
// Used by both scenes.tsx and templates.tsx.

import React from "react";
import { AbsoluteFill, useVideoConfig, interpolate, spring } from "remotion";
import { getEntrance, getExit, getCamera, TRANSITION_FRAMES, SNAPPY_SPRING, DEFAULT_SPRING } from "./animations";

export const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ─── Responsive Size Hook ───────────────────────────────────────────

export function useSceneSizes() {
  const { width, height } = useVideoConfig();
  const isVertical = height > width;
  return {
    width,
    height,
    isVertical,
    headline: Math.round(isVertical ? width * 0.12 : width * 0.085),
    subhead: Math.round(isVertical ? width * 0.055 : width * 0.04),
    body: Math.round(isVertical ? width * 0.042 : width * 0.03),
    small: Math.round(isVertical ? width * 0.032 : width * 0.022),
    padX: isVertical ? "6%" : "8%",
    padY: isVertical ? "10%" : "8%",
  };
}

// ─── Kinetic Headline ───────────────────────────────────────────────
// Word-by-word reveal with spring physics.

export const KineticHeadline: React.FC<{
  text: string;
  frame: number;
  fps: number;
  duration: number;
  color: string;
  size: number;
  align?: "center" | "left";
  weight?: number;
}> = ({ text, frame, fps, duration, color, size, align = "center", weight = 800 }) => {
  const words = text.split(/\s+/).filter(Boolean);
  const revealWindow = duration * 0.6;
  return (
    <div style={{ textAlign: align, maxWidth: "92%" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: size * 0.2,
          justifyContent: align === "center" ? "center" : "flex-start",
          lineHeight: 1.08,
        }}
      >
        {words.map((word, i) => {
          const delay = words.length === 1 ? 0 : (i / (words.length - 1)) * revealWindow;
          const s = spring({ frame: Math.max(0, frame - delay), fps, config: SNAPPY_SPRING });
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontSize: size,
                fontWeight: weight,
                color,
                letterSpacing: "-0.035em",
                opacity: interpolate(s, [0, 0.25, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                transform: `translateY(${interpolate(s, [0, 1], [22, 0])}px)`,
                display: "inline-block",
                willChange: "transform, opacity",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ─── Kinetic Body Text ──────────────────────────────────────────────

export const KineticBody: React.FC<{
  text: string;
  frame: number;
  fps: number;
  duration: number;
  color: string;
  size: number;
  align?: "center" | "left";
  baseDelay?: number;
}> = ({ text, frame, fps, duration, color, size, align = "center", baseDelay = 8 }) => {
  const words = text.split(/\s+/).filter(Boolean);
  const revealWindow = duration * 0.55;
  return (
    <div style={{ textAlign: align, maxWidth: "85%", marginTop: size * 0.8 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: size * 0.25,
          justifyContent: align === "center" ? "center" : "flex-start",
          lineHeight: 1.4,
        }}
      >
        {words.map((word, i) => {
          const delay = baseDelay + (words.length === 1 ? 0 : (i / (words.length - 1)) * revealWindow);
          const s = spring({ frame: Math.max(0, frame - delay), fps, config: DEFAULT_SPRING });
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontSize: size,
                fontWeight: 500,
                color,
                letterSpacing: "-0.01em",
                opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                transform: `translateY(${interpolate(s, [0, 1], [14, 0])}px)`,
                display: "inline-block",
                willChange: "transform, opacity",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ─── Scene Motion Wrapper ───────────────────────────────────────────
// Entrance + exit + camera push-in.

export const SceneMotion: React.FC<{
  frame: number;
  fps: number;
  duration: number;
  entranceDirection?: "left" | "right" | "up" | "down";
  exitDirection?: "left" | "right" | "up" | "down";
  children: React.ReactNode;
}> = ({ frame, fps, duration, entranceDirection = "up", exitDirection = "down", children }) => {
  const entrance = getEntrance(frame, fps, 0, DEFAULT_SPRING);
  const exit = getExit(frame, duration, exitDirection, TRANSITION_FRAMES, fps);
  const cam = getCamera(frame, duration);

  const entranceOffset = 60;
  const entranceMap = {
    left: { x: -entranceOffset, y: 0 },
    right: { x: entranceOffset, y: 0 },
    up: { x: 0, y: entranceOffset },
    down: { x: 0, y: -entranceOffset },
  };
  const eDir = entranceMap[entranceDirection];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: entrance.opacity * exit.opacity,
        transform: `
          translateX(${exit.x + eDir.x * (1 - entrance.opacity)}px)
          translateY(${entrance.y + exit.y + eDir.y * (1 - entrance.opacity)}px)
          scale(${entrance.scale * exit.scale * cam.scale})
        `,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ transform: `translateY(${cam.y}px)`, width: "100%", height: "100%" }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
