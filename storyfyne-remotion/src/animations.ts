// ─── Animation Engine ───────────────────────────────────────────────
// Production-grade frame-based animation utilities for Remotion.

import { interpolate, spring, Easing, SpringConfig } from "remotion";

// ─── Constants ──────────────────────────────────────────────────────

export const TRANSITION_FRAMES = 25; // ~0.8s
export const DEFAULT_SPRING: SpringConfig = { damping: 14, stiffness: 90, mass: 1, overshootClamping: false };
export const BOUNCY_SPRING: SpringConfig = { damping: 10, stiffness: 120, mass: 0.8, overshootClamping: false };
export const GENTLE_SPRING: SpringConfig = { damping: 20, stiffness: 70, mass: 1.2, overshootClamping: false };
export const SNAPPY_SPRING: SpringConfig = { damping: 18, stiffness: 180, mass: 0.6, overshootClamping: false };
export const DRAMATIC_SPRING: SpringConfig = { damping: 12, stiffness: 60, mass: 1.5, overshootClamping: false };

// ─── Core ───────────────────────────────────────────────────────────

export const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Generic spring entrance returning 0→1 progress */
export function getSpringProgress(frame: number, fps: number, delay = 0, config: SpringConfig = DEFAULT_SPRING): number {
  return spring({ frame: Math.max(0, frame - delay), fps, config });
}

/** Fade in */
export function getFadeIn(frame: number, duration = 15, delay = 0): number {
  return interpolate(frame, [delay, delay + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

/** Full entrance: opacity + translateY + scale */
export function getEntrance(frame: number, fps: number, delay = 0, config: SpringConfig = DEFAULT_SPRING) {
  const s = getSpringProgress(frame, fps, delay, config);
  return {
    opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
    y: interpolate(s, [0, 1], [50, 0]),
    scale: interpolate(s, [0, 1], [0.92, 1]),
  };
}

/** Exit: slide + fade with spring */
export function getExit(frame: number, duration: number, direction: "left" | "right" | "up" | "down" = "left", outDuration = TRANSITION_FRAMES, fps = 30) {
  const start = duration - outDuration;
  const s = spring({ frame: Math.max(0, frame - start), fps, config: { damping: 14, stiffness: 90, mass: 1, overshootClamping: false } });
  const dirMap = { left: { x: -200, y: 0 }, right: { x: 200, y: 0 }, up: { x: 0, y: -150 }, down: { x: 0, y: 150 } };
  const dir = dirMap[direction];
  return {
    opacity: interpolate(s, [0, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    x: interpolate(s, [0, 1], [0, dir.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    y: interpolate(s, [0, 1], [0, dir.y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    scale: interpolate(s, [0, 1], [1, 0.94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  };
}

// ─── Kinetic Typography ─────────────────────────────────────────────

/** Word-by-word reveal. Returns per-word opacity, y-offset, scale for a given word index */
export function getWordReveal(frame: number, fps: number, wordIndex: number, totalWords: number, sceneDuration: number, staggerDelay = 4) {
  // All words revealed by 65% of scene duration
  const revealWindow = sceneDuration * 0.65;
  const delay = (wordIndex / Math.max(1, totalWords - 1)) * revealWindow;
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  return {
    opacity: interpolate(s, [0, 0.25, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
    y: interpolate(s, [0, 1], [18, 0]),
    scale: interpolate(s, [0, 1], [0.96, 1]),
  };
}

/** Character-by-character typewriter reveal */
export function getTypewriterProgress(frame: number, delay = 0, speed = 0.35): number {
  return Math.max(0, Math.floor((frame - delay) * speed));
}

// ─── Camera Movement ────────────────────────────────────────────────

/** Slow cinematic push-in + drift. Apply to scene wrapper. */
export function getCamera(frame: number, duration: number) {
  const t = clamp(frame / Math.max(1, duration), 0, 1);
  const eased = Easing.out(Easing.cubic)(t);
  return {
    scale: lerp(1, 1.05, eased),
    y: lerp(0, -20, eased),
  };
}

/** Subtle ambient float — use on isolated elements */
export function getFloat(frame: number, fps: number, amplitude = 8, speed = 0.6): number {
  return Math.sin((frame / fps) * Math.PI * 2 * speed) * amplitude;
}

/** Number counter that animates 0 → target */
export function getCounter(frame: number, fps: number, target: number, delay = 0, duration = 45): number {
  const t = clamp((frame - delay) / duration, 0, 1);
  const eased = Easing.out(Easing.cubic)(t);
  return Math.round(eased * target);
}

// ─── Staggered Element Reveal ───────────────────────────────────────

/** Get entrance values for element at index in a staggered list */
export function getStaggeredEntrance(frame: number, fps: number, index: number, baseDelay = 6, gap = 8) {
  const s = getSpringProgress(frame, fps, baseDelay + index * gap, DEFAULT_SPRING);
  return {
    opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
    y: interpolate(s, [0, 1], [40, 0]),
    scale: interpolate(s, [0, 1], [0.9, 1]),
  };
}

// ─── Legacy compatibility exports ───────────────────────────────────

export function getStaggerDelay(index: number, baseDelay = 6, gap = 8): number {
  return baseDelay + index * gap;
}

export function getHighlightProgress(frame: number, fps: number, delay = 0, duration = 25) {
  return interpolate(frame, [delay, delay + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

export function getScrambleReveal(frame: number, fps: number, text: string, delay = 0, duration = 40) {
  const progress = Math.min(1, Math.max(0, (frame - delay) / duration));
  const revealedCount = Math.floor(progress * text.length);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " ") {
      result += " ";
    } else if (i < revealedCount) {
      result += text[i];
    } else {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}
