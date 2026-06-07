// ─── Animation Engine ───────────────────────────────────────────────
// OpenAI launch video motion system.
// Rule: nothing just appears. It arrives, disturbs the air, keeps breathing.

import { interpolate, spring, Easing, SpringConfig } from "remotion";

// ─── Constants ──────────────────────────────────────────────────────

export const TRANSITION_FRAMES = 25;

// ─── Easing Curves ──────────────────────────────────────────────────
// These are the curves that make motion feel expensive.

/** Butter-smooth ease-out-expo for entrances. The gold standard. */
export const EASE_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);

/** Slightly more aggressive ease-out for dramatic reveals. */
export const EASE_OUT_QUART = Easing.bezier(0.22, 1, 0.36, 1);

/** Gentle ease-in-out for camera movements. Never use linear. */
export const EASE_IN_OUT_SMOOTH = Easing.bezier(0.65, 0, 0.35, 1);

// Spring configs
export const DEFAULT_SPRING: SpringConfig = { damping: 14, stiffness: 90, mass: 1, overshootClamping: false };
export const BOUNCY_SPRING: SpringConfig = { damping: 10, stiffness: 120, mass: 0.8, overshootClamping: false };
export const SNAPPY_SPRING: SpringConfig = { damping: 18, stiffness: 180, mass: 0.6, overshootClamping: false };
export const GENTLE_SPRING: SpringConfig = { damping: 20, stiffness: 70, mass: 1.2, overshootClamping: false };

// ─── Core ───────────────────────────────────────────────────────────

export const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Spring progress 0→1 */
export function getSpringProgress(frame: number, fps: number, delay = 0, config: SpringConfig = DEFAULT_SPRING): number {
  return spring({ frame: Math.max(0, frame - delay), fps, config });
}

// ─── Cinematic Entrance ─────────────────────────────────────────────
// Stacks: scale + opacity + translateY + BLUR. All with expo easing.
// This is what makes things feel like they ARRIVE instead of just appearing.

export function getCinematicEntrance(frame: number, delay = 0, duration = 30) {
  const t = clamp((frame - delay) / duration, 0, 1);
  const eased = EASE_OUT_EXPO(t);
  return {
    opacity: eased,
    y: lerp(40, 0, eased),
    scale: 1,
    blur: 0,
  };
}

/** Exit with blur INCREASING as it leaves. Feels like it's dissolving into the air. */
export function getCinematicExit(frame: number, duration: number, direction: "left" | "right" | "up" | "down" = "left", outDuration = TRANSITION_FRAMES) {
  const start = duration - outDuration;
  const t = clamp((frame - start) / outDuration, 0, 1);
  const eased = Easing.out(Easing.cubic)(t);
  const dirMap = { left: { x: -18, y: 0 }, right: { x: 18, y: 0 }, up: { x: 0, y: -16 }, down: { x: 0, y: 16 } };
  const dir = dirMap[direction];
  return {
    opacity: lerp(1, 0.92, eased),
    x: lerp(0, dir.x, eased),
    y: lerp(0, dir.y, eased),
    scale: 1,
    blur: 0,
  };
}

// ─── Clip-Path Text Reveal ──────────────────────────────────────────
// Wipes text in from left to right. More cinematic than fade.

export function getClipReveal(frame: number, delay = 0, duration = 35) {
  const t = clamp((frame - delay) / duration, 0, 1);
  const eased = EASE_OUT_EXPO(t);
  const visiblePercent = eased * 100;
  return `inset(0 ${100 - visiblePercent}% 0 0)`;
}

// ─── Character Reveal ───────────────────────────────────────────────
// Per-character spring with stagger. Each letter has weight.

export function getCharReveal(frame: number, fps: number, charIndex: number, totalChars: number, sceneDuration: number) {
  const revealWindow = sceneDuration * 0.5;
  const delay = totalChars <= 1 ? 0 : (charIndex / (totalChars - 1)) * revealWindow;
  const s = spring({ frame: Math.max(0, frame - delay), fps, config: SNAPPY_SPRING });
  return {
    opacity: interpolate(s, [0, 0.2, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
    y: interpolate(s, [0, 1], [16, 0]),
    scale: 1,
    blur: 0,
  };
}

// ─── Word Reveal ────────────────────────────────────────────────────
// Per-word spring. Use for body text.

export function getWordReveal(frame: number, fps: number, wordIndex: number, totalWords: number, sceneDuration: number) {
  const revealWindow = sceneDuration * 0.55;
  const delay = totalWords <= 1 ? 0 : (wordIndex / (totalWords - 1)) * revealWindow;
  const s = spring({ frame: Math.max(0, frame - delay), fps, config: DEFAULT_SPRING });
  return {
    opacity: interpolate(s, [0, 0.25, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
    y: interpolate(s, [0, 1], [14, 0]),
    scale: 1,
    blur: 0,
  };
}

// ─── Camera Movement ────────────────────────────────────────────────
// Slow, deliberate, bezier-based. Never spring-based.

export function getCamera(frame: number, duration: number) {
  return {
    scale: 1,
    y: 0,
  };
}

/** Background drift — slower than foreground. Creates depth. */
export function getBgDrift(frame: number, duration: number) {
  const t = clamp(frame / Math.max(1, duration), 0, 1);
  return {
    scale: lerp(1, 1.06, Easing.out(Easing.cubic)(t)),
    y: lerp(0, -6, Easing.out(Easing.cubic)(t)),
  };
}

/** Ambient float for isolated elements */
export function getFloat(frame: number, fps: number, amplitude = 6, speed = 0.5): number {
  return Math.sin((frame / fps) * Math.PI * 2 * speed) * amplitude;
}

// ─── Counter / Number Animation ─────────────────────────────────────

export function getCounter(frame: number, target: number, delay = 0, duration = 45) {
  const t = clamp((frame - delay) / duration, 0, 1);
  const eased = Easing.out(Easing.cubic)(t);
  return Math.round(eased * target);
}

// ─── Typewriter Progress ────────────────────────────────────────────

export function getTypewriterProgress(frame: number, delay = 0, speed = 0.35): number {
  return Math.max(0, Math.floor((frame - delay) * speed));
}

// ─── Legacy compatibility ───────────────────────────────────────────

export function getStaggerDelay(index: number, baseDelay = 6, gap = 8): number {
  return baseDelay + index * gap;
}

export function getScrambleReveal(frame: number, fps: number, text: string, delay = 0, duration = 40) {
  const progress = Math.min(1, Math.max(0, (frame - delay) / duration));
  const revealedCount = Math.floor(progress * text.length);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " ") result += " ";
    else if (i < revealedCount) result += text[i];
    else result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function getHighlightProgress(frame: number, fps: number, delay = 0, duration = 25) {
  return interpolate(frame, [delay, delay + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

export function getFadeIn(frame: number, duration = 15, delay = 0) {
  return interpolate(frame, [delay, delay + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

export function getFadeOut(frame: number, duration: number, outDuration = TRANSITION_FRAMES, delay = 0) {
  const start = delay + duration - outDuration;
  return interpolate(frame, [start, start + outDuration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}
