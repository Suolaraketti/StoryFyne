// ─── Shared Scene Components ────────────────────────────────────────
// OpenAI launch video motion system.
// Stacks: blur + scale + opacity + translateY. Clip-path reveals.
// Layered depth. Nothing just appears.

import React from "react";
import { AbsoluteFill, useVideoConfig, interpolate, spring } from "remotion";
import {
  getCinematicEntrance, getCinematicExit, getCamera, getBgDrift,
  getClipReveal, getCharReveal, getWordReveal,
  TRANSITION_FRAMES, SNAPPY_SPRING, DEFAULT_SPRING,
} from "./animations";
import { getSyncedStagger, getSyncedExitStart, getAudioPulse } from "./audio-sync";

export const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ─── Responsive Size Hook ───────────────────────────────────────────

export function useSceneSizes() {
  const { width, height } = useVideoConfig();
  const isVertical = height > width;
  return {
    width,
    height,
    isVertical,
    headline: Math.round(isVertical ? width * 0.13 : width * 0.09),
    subhead: Math.round(isVertical ? width * 0.055 : width * 0.04),
    body: Math.round(isVertical ? width * 0.042 : width * 0.03),
    small: Math.round(isVertical ? width * 0.032 : width * 0.022),
    padX: isVertical ? "6%" : "8%",
    padY: isVertical ? "10%" : "8%",
  };
}

// ─── Cinematic Headline ─────────────────────────────────────────────
// Word-level reveal. Keeps glyphs stable and prevents mid-word wrapping.

export const CinematicHeadline: React.FC<{
  text: string;
  frame: number;
  fps: number;
  duration: number;
  color: string;
  size: number;
  align?: "center" | "left";
  weight?: number;
  delay?: number;
  audioMarkers?: number[];
}> = ({ text, frame, fps, duration, color, size, align = "center", weight = 800, delay = 0, audioMarkers }) => {
  const words = text.split(/\s+/).filter(Boolean);
  const revealWindow = duration * 0.45;

  return (
    <div style={{ textAlign: align, maxWidth: "92%" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: size * 0.22,
          rowGap: size * 0.12,
          justifyContent: align === "center" ? "center" : "flex-start",
          lineHeight: 1.08,
        }}
      >
        {words.map((word, wordIndex) => {
          const wordDelay = delay + getSyncedStagger(wordIndex, words.length, audioMarkers, 0, revealWindow / Math.max(1, words.length - 1));
          const opacity = interpolate(frame, [wordDelay, wordDelay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <span
              key={`${word}-${wordIndex}`}
              style={{
                fontFamily: FONT,
                fontSize: size,
                fontWeight: weight,
                color,
                letterSpacing: 0,
                display: "inline-block",
                whiteSpace: "nowrap",
                opacity,
                willChange: "opacity",
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

// ─── Clip-Path Headline ─────────────────────────────────────────────
// Wipe reveal with clip-path. The container reveals, then characters pop.
// Most cinematic option for hero statements.

export const ClipHeadline: React.FC<{
  text: string;
  frame: number;
  fps: number;
  duration: number;
  color: string;
  size: number;
  align?: "center" | "left";
  weight?: number;
  delay?: number;
  audioMarkers?: number[];
}> = ({ text, frame, fps, duration, color, size, align = "center", weight = 800, delay = 0, audioMarkers }) => {
  const clip = getClipReveal(frame, delay, 40);
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <div
      style={{
        textAlign: align,
        maxWidth: "92%",
        clipPath: clip,
        willChange: "clip-path",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: size * 0.22,
          justifyContent: align === "center" ? "center" : "flex-start",
          lineHeight: 1.08,
        }}
      >
        {words.map((word, i) => {
          // Audio-driven: words pop at phrase markers
          const wordDelay = delay + 6 + getSyncedStagger(i, words.length, audioMarkers, 0, duration * 0.35 / Math.max(1, words.length - 1));
          const s = spring({ frame: Math.max(0, frame - wordDelay), fps, config: SNAPPY_SPRING });
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontSize: size,
                fontWeight: weight,
                color,
                letterSpacing: 0,
                opacity: interpolate(s, [0, 0.2, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                transform: "none",
                filter: "none",
                display: "inline-block",
                willChange: "opacity",
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

// ─── Cinematic Body Text ────────────────────────────────────────────

export const CinematicBody: React.FC<{
  text: string;
  frame: number;
  fps: number;
  duration: number;
  color: string;
  size: number;
  align?: "center" | "left";
  baseDelay?: number;
  audioMarkers?: number[];
}> = ({ text, frame, fps, duration, color, size, align = "center", baseDelay = 10, audioMarkers }) => {
  const words = text.split(/\s+/).filter(Boolean);
  const revealWindow = duration * 0.5;

  return (
    <div style={{ textAlign: align, maxWidth: "88%", marginTop: size * 0.7 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: size * 0.25,
          justifyContent: align === "center" ? "center" : "flex-start",
          lineHeight: 1.45,
        }}
      >
        {words.map((word, i) => {
          // Audio-driven: body text reveals at phrase markers
          const delay = baseDelay + getSyncedStagger(i, words.length, audioMarkers, 0, revealWindow / Math.max(1, words.length - 1));
          const reveal = getWordReveal(frame, fps, i, words.length, duration);
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontSize: size,
                fontWeight: 500,
                color,
                letterSpacing: 0,
                opacity: reveal.opacity,
                transform: "none",
                filter: "none",
                display: "inline-block",
                willChange: "opacity",
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
// Layered depth: background drifts, content snaps, camera pushes.
// Entrance: blur + scale + opacity + translateY stack.
// Exit: blur INCREASES as it leaves.

export const SceneMotion: React.FC<{
  frame: number;
  duration: number;
  entranceDirection?: "left" | "right" | "up" | "down";
  exitDirection?: "left" | "right" | "up" | "down";
  children: React.ReactNode;
  bgChildren?: React.ReactNode;
  audioMarkers?: number[];
}> = ({ frame, duration, entranceDirection = "up", exitDirection = "down", children, bgChildren, audioMarkers }) => {
  const entrance = getCinematicEntrance(frame, 0, 30);
  // Audio-driven: exit starts at last phrase marker instead of fixed offset
  const exitStart = getSyncedExitStart(duration, audioMarkers, TRANSITION_FRAMES);
  const exitDuration = Math.max(10, duration - exitStart);
  const exit = getCinematicExit(frame, duration, exitDirection, exitDuration);
  const cam = getCamera(frame, duration);
  const bg = getBgDrift(frame, duration);
  // Subtle ambient pulse on beats
  const beatPulse = getAudioPulse(frame, audioMarkers, 14);

  const entranceOffset = 50;
  const entranceMap = {
    left: { x: -entranceOffset, y: 0 },
    right: { x: entranceOffset, y: 0 },
    up: { x: 0, y: entranceOffset },
    down: { x: 0, y: -entranceOffset },
  };
  const eDir = entranceMap[entranceDirection];

  // Combined opacity (entrance fade in + exit fade out)
  const opacity = entrance.opacity * exit.opacity;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Background layer — drifts slower, creates depth */}
      {bgChildren && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${bg.scale}) translateY(${bg.y}px)`,
            opacity: opacity * 0.6,
            willChange: "transform",
          }}
        >
          {bgChildren}
        </div>
      )}

      {/* Content layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity,
          transform: `
            translateX(${Math.round(exit.x + eDir.x * (1 - entrance.opacity))}px)
            translateY(${Math.round(entrance.y + exit.y + eDir.y * (1 - entrance.opacity))}px)
            scale(${entrance.scale * exit.scale * cam.scale})
          `,
          filter: "none",
          willChange: "transform, opacity",
        }}
      >
        <div style={{ transform: `translateY(${cam.y}px)`, width: "100%", height: "100%" }}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Film Grain Overlay ─────────────────────────────────────────────
// Subtle noise at 3-4% opacity. Makes digital motion feel cinematic.

export const FilmGrain: React.FC<{ intensity?: number }> = ({ intensity = 0.035 }) => {
  // Use a data URI for a tiny repeating noise tile
  // This is a 64x64 PNG of random noise, base64 encoded
  const noiseUri =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAARUlEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8G1hwAAE8lTpiAAAAAElFTkSuQmCC";

  return (
    <AbsoluteFill
      style={{
        zIndex: 500,
        pointerEvents: "none",
        opacity: intensity,
        backgroundImage: `url(${noiseUri})`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
        mixBlendMode: "overlay",
      }}
    />
  );
};
