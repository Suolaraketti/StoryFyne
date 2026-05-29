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

export { FONT } from "./theme";
import { FONT } from "./theme";

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
// Character-by-character reveal with spring + blur clearing.
// Each letter has weight. Feels expensive.

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
  // Split into words, but animate per-character. Each word is an unbreakable
  // unit so the headline wraps between words \u2014 never mid-word.
  const words = text.split(/(\s+)/).filter((w) => w.length > 0);
  const totalChars = text.replace(/\s/g, "").length;
  const revealWindow = duration * 0.45;
  let charCounter = 0;

  return (
    <div style={{ textAlign: align, maxWidth: "94%" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: align === "center" ? "center" : "flex-start",
          lineHeight: 1.08,
        }}
      >
        {words.map((word, wi) => {
          if (/^\s+$/.test(word)) {
            return <span key={`s-${wi}`} style={{ display: "inline-block", width: size * 0.26 }} />;
          }
          return (
            <span key={`w-${wi}`} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
              {word.split("").map((char, ci) => {
                const globalIdx = charCounter++;
                const charDelay = delay + getSyncedStagger(globalIdx, totalChars, audioMarkers, 0, revealWindow / Math.max(1, totalChars - 1));
                const s = spring({ frame: Math.max(0, frame - charDelay), fps, config: SNAPPY_SPRING });
                const reveal = {
                  opacity: interpolate(s, [0, 0.15, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                  y: interpolate(s, [0, 1], [18, 0]),
                  scale: interpolate(s, [0, 1], [0.9, 1]),
                  blur: interpolate(s, [0, 0.5], [3, 0], { extrapolateLeft: "clamp" }),
                };
                return (
                  <span
                    key={ci}
                    style={{
                      fontFamily: FONT,
                      fontSize: size,
                      fontWeight: weight,
                      color,
                      letterSpacing: "-0.035em",
                      opacity: reveal.opacity,
                      transform: `translateY(${reveal.y}px) scale(${reveal.scale})`,
                      filter: `blur(${reveal.blur}px)`,
                      display: "inline-block",
                      willChange: "transform, opacity, filter",
                    }}
                  >
                    {char}
                  </span>
                );
              })}
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
  highlight?: string;
  highlightColor?: string;
}> = ({ text, frame, fps, duration, color, size, align = "center", weight = 800, delay = 0, audioMarkers, highlight = "", highlightColor }) => {
  const clip = getClipReveal(frame, delay, 40);
  const words = text.split(/\s+/).filter(Boolean);
  const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hiSet = new Set(highlight.split(/\s+/).map(norm).filter(Boolean));

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
          const isHi = hiSet.size > 0 && hiSet.has(norm(word));
          const hiCol = highlightColor || color;
          // Marker sweeps in just after the highlighted word settles.
          const markerS = spring({ frame: Math.max(0, frame - wordDelay - 6), fps, config: SNAPPY_SPRING });
          const markerW = interpolate(markerS, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <span
              key={i}
              style={{
                position: "relative",
                fontFamily: FONT,
                fontSize: size,
                fontWeight: weight,
                color: isHi ? hiCol : color,
                letterSpacing: "-0.035em",
                opacity: interpolate(s, [0, 0.2, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                transform: `translateY(${interpolate(s, [0, 1], [14, 0])}px) scale(${interpolate(s, [0, 1], [0.95, 1])})`,
                filter: `blur(${interpolate(s, [0, 0.4], [2, 0], { extrapolateLeft: "clamp" })}px)`,
                display: "inline-block",
                willChange: "transform, opacity, filter",
              }}
            >
              {word}
              {isHi && (
                <span style={{
                  position: "absolute", left: 0, right: 0, bottom: -size * 0.06, height: size * 0.1,
                  background: hiCol, borderRadius: 99, transformOrigin: "left center",
                  transform: `scaleX(${markerW})`, opacity: 0.9,
                }} />
              )}
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
                letterSpacing: "-0.01em",
                opacity: reveal.opacity,
                transform: `translateY(${reveal.y}px) scale(${reveal.scale})`,
                filter: `blur(${reveal.blur}px)`,
                display: "inline-block",
                willChange: "transform, opacity, filter",
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

export type EntranceStyle = "rise" | "zoom" | "slide" | "tilt" | "drift";

export const SceneMotion: React.FC<{
  frame: number;
  duration: number;
  entranceDirection?: "left" | "right" | "up" | "down";
  exitDirection?: "left" | "right" | "up" | "down";
  entranceStyle?: EntranceStyle;
  children: React.ReactNode;
  bgChildren?: React.ReactNode;
  audioMarkers?: number[];
}> = ({ frame, duration, entranceDirection = "up", exitDirection = "down", entranceStyle = "rise", children, bgChildren, audioMarkers }) => {
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

  // ── Entrance flavor ──────────────────────────────────────────────
  // Per-scene variety so consecutive beats don't all arrive identically.
  // `p` is the eased entrance progress (0→1); each style remaps the start.
  const p = entrance.opacity;
  const inv = 1 - p;
  const styleMap: Record<EntranceStyle, { scale: number; rot: number; xMul: number; yMul: number }> = {
    rise:  { scale: 0.94, rot: 0,    xMul: 1,   yMul: 1 },
    zoom:  { scale: 0.82, rot: 0,    xMul: 0.3, yMul: 0.3 },
    slide: { scale: 0.97, rot: 0,    xMul: 2.4, yMul: 2.4 },
    tilt:  { scale: 0.9,  rot: -3.5, xMul: 1,   yMul: 1.2 },
    drift: { scale: 1.05, rot: 1.5,  xMul: 0.6, yMul: 0.6 },
  };
  const st = styleMap[entranceStyle] || styleMap.rise;
  const entScale = st.scale + (1 - st.scale) * p;
  const entRot = st.rot * inv;
  const exX = exit.x + eDir.x * inv * st.xMul;
  const exY = entrance.y * (st.yMul) + exit.y + eDir.y * inv * st.yMul;

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

      {/* Content layer — stacks blur + scale + translate */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity,
          transform: `
            translateX(${exX}px)
            translateY(${exY}px)
            rotate(${entRot}deg)
            scale(${entScale * exit.scale * cam.scale * (1 + beatPulse * 0.008)})
          `,
          filter: `blur(${entrance.blur + exit.blur}px)`,
          willChange: "transform, opacity, filter",
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
