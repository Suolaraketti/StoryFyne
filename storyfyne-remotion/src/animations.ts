// ─── Animation Engine ───────────────────────────────────────────────
// Production-grade frame-based animation utilities for Remotion.
// All functions are pure and memoization-friendly. No DOM access.

import { interpolate, spring, Easing, SpringConfig } from "remotion";

// ─── Constants ──────────────────────────────────────────────────────

export const TRANSITION_FRAMES = 30; // ~1.0s overlap
export const DEFAULT_SPRING: SpringConfig = { damping: 14, stiffness: 90, mass: 1, overshootClamping: false };
export const BOUNCY_SPRING: SpringConfig = { damping: 10, stiffness: 120, mass: 0.8, overshootClamping: false };
export const GENTLE_SPRING: SpringConfig = { damping: 20, stiffness: 70, mass: 1.2, overshootClamping: false };
export const SNAPPY_SPRING: SpringConfig = { damping: 18, stiffness: 180, mass: 0.6, overshootClamping: false };

// ─── Core Interpolation Helpers ─────────────────────────────────────

/** Clamp a value between min and max */
export const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

/** Linear interpolation between a and b by t (0-1) */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smoothstep interpolation (ease in-out) */
export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Remap a value from one range to another with optional clamping */
export const remap = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
  clamped = true
) => {
  const t = (value - fromMin) / (fromMax - fromMin);
  const ct = clamped ? clamp(t, 0, 1) : t;
  return lerp(toMin, toMax, ct);
};

// ─── Spring-Based Entrances ─────────────────────────────────────────

/** Generic spring entrance returning 0→1 progress */
export function getSpringProgress(
  frame: number,
  fps: number,
  delay = 0,
  config: SpringConfig = DEFAULT_SPRING
): number {
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config,
  });
}

/** Fade in with configurable duration and delay */
export function getFadeIn(
  frame: number,
  duration = 15,
  delay = 0
): number {
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Fade out during the last N frames */
export function getFadeOut(
  frame: number,
  duration: number,
  outDuration = TRANSITION_FRAMES,
  delay = 0
): number {
  const start = delay + duration - outDuration;
  return interpolate(frame, [start, start + outDuration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Slide in from a direction with spring physics */
export function getSlideIn(
  frame: number,
  fps: number,
  delay = 0,
  fromY = 60,
  fromX = 0,
  config: SpringConfig = DEFAULT_SPRING
) {
  const s = getSpringProgress(frame, fps, delay, config);
  return {
    y: interpolate(s, [0, 1], [fromY, 0]),
    x: interpolate(s, [0, 1], [fromX, 0]),
    opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
  };
}

/** Scale in with spring overshoot */
export function getScaleIn(
  frame: number,
  fps: number,
  delay = 0,
  config: SpringConfig = BOUNCY_SPRING
) {
  const s = getSpringProgress(frame, fps, delay, config);
  return {
    scale: interpolate(s, [0, 1], [0.85, 1]),
    opacity: interpolate(s, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
  };
}

/** Full entrance combo: opacity + translateY + scale */
export function getEntrance(
  frame: number,
  fps: number,
  delay = 0,
  config: SpringConfig = DEFAULT_SPRING
) {
  const s = getSpringProgress(frame, fps, delay, config);
  return {
    opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
    y: interpolate(s, [0, 1], [50, 0]),
    scale: interpolate(s, [0, 1], [0.92, 1]),
  };
}

/** Exit animation: slide + fade + subtle scale down with spring physics */
export function getExit(
  frame: number,
  duration: number,
  direction: "left" | "right" | "up" | "down" = "left",
  outDuration = TRANSITION_FRAMES,
  fps = 30
) {
  const start = duration - outDuration;
  const s = spring({
    frame: Math.max(0, frame - start),
    fps,
    config: { damping: 14, stiffness: 90, mass: 1, overshootClamping: false },
  });
  const dirMap = {
    left: { x: -120, y: 0 },
    right: { x: 120, y: 0 },
    up: { x: 0, y: -80 },
    down: { x: 0, y: 80 },
  };
  const dir = dirMap[direction];
  return {
    opacity: interpolate(s, [0, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    x: interpolate(s, [0, 1], [0, dir.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    y: interpolate(s, [0, 1], [0, dir.y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    scale: interpolate(s, [0, 1], [1, 0.94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  };
}

// ─── Specialized Animations ─────────────────────────────────────────

/** Counter that animates from 0 to target value */
export function getCounter(
  frame: number,
  fps: number,
  target: number,
  delay = 0,
  duration = 45
): number {
  const t = clamp((frame - delay) / duration, 0, 1);
  const eased = Easing.out(Easing.cubic)(t);
  return Math.round(eased * target);
}

/** Float/bob animation for subtle continuous motion */
export function getFloat(
  frame: number,
  fps: number,
  amplitude = 10,
  speed = 1
): number {
  return Math.sin((frame / fps) * Math.PI * 2 * speed) * amplitude;
}

/** Pulse animation 0→1→0 for glow effects */
export function getPulse(
  frame: number,
  fps: number,
  speed = 1.5
): number {
  return Math.sin((frame / fps) * Math.PI * 2 * speed) * 0.3 + 0.7;
}

/** Typewriter progress: returns number of characters to show */
export function getTypewriterProgress(
  frame: number,
  delay = 0,
  charsPerFrame = 0.4
): number {
  return Math.max(0, Math.floor((frame - delay) * charsPerFrame));
}

/** Draw SVG stroke: returns dashoffset for path drawing */
export function getStrokeDraw(
  frame: number,
  fps: number,
  pathLength: number,
  delay = 0,
  duration = 30
): number {
  const t = clamp((frame - delay) / duration, 0, 1);
  const eased = Easing.out(Easing.quad)(t);
  return pathLength * (1 - eased);
}

/** Rotating element angle */
export function getRotation(
  frame: number,
  fps: number,
  speed = 0.2
): number {
  return (frame / fps) * 360 * speed;
}

/** Stagger delay calculator for arrays */
export function getStaggerDelay(
  index: number,
  baseDelay = 0,
  stagger = 5
): number {
  return baseDelay + index * stagger;
}

/** Parallax scroll effect based on frame position */
export function getParallax(
  frame: number,
  factor = 0.5
): number {
  return frame * factor;
}

/** Ken Burns: slow zoom over scene duration */
export function getKenBurns(
  frame: number,
  duration: number,
  fromScale = 1,
  toScale = 1.08
): number {
  return interpolate(frame, [0, duration], [fromScale, toScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Text scramble effect: returns visible portion with random chars */
export function getScrambleReveal(
  frame: number,
  fps: number,
  text: string,
  delay = 0,
  duration = 40
): string {
  const t = clamp((frame - delay) / duration, 0, 1);
  const eased = Easing.out(Easing.cubic)(t);
  const revealed = Math.floor(eased * text.length);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  return text
    .split("")
    .map((char, i) => {
      if (char === " ") return " ";
      if (i < revealed) return char;
      if (i === revealed) return chars[Math.floor((frame * 7 + i * 13) % chars.length)];
      return "";
    })
    .join("");
}

/** Highlight bar progress: width 0→100% */
export function getHighlightProgress(
  frame: number,
  fps: number,
  delay = 0,
  duration = 20
): number {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  return interpolate(s, [0, 1], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

/** 3D card flip rotation */
export function getFlipRotation(
  frame: number,
  fps: number,
  delay = 0,
  duration = 25
): number {
  const t = clamp((frame - delay) / duration, 0, 1);
  const eased = Easing.out(Easing.back())(t);
  return interpolate(eased, [0, 1], [90, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}
