// ─── Audio-Driven Pacing Engine ─────────────────────────────────────
// OpenAI launch video motion system — Principle #8:
// "Pacing is audio-driven, not frame-driven."
//
// Instead of hardcoded delays like "delay={10}" or "i * 12",
// every visual event snaps to an audio marker (phrase boundary or beat).
// This makes motion feel intentional — like the visuals are listening.

import { interpolate, Easing } from "remotion";

// ─── Core Sync Utilities ────────────────────────────────────────────

/**
 * Get the delay for element `index` by mapping it to audio marker `index`.
 * Falls back to `fallback` frames if no marker exists.
 *
 * Usage: replace hardcoded `delay={10 + i * 8}` with `delay={getSyncedDelay(i, markers, 10 + i * 8)}`
 */
export function getSyncedDelay(markerIndex: number, markers: number[] | undefined, fallback: number): number {
  if (!markers || markers.length === 0) return fallback;
  return markers[Math.min(markerIndex, markers.length - 1)] ?? fallback;
}

/**
 * Distribute `totalItems` across available markers evenly.
 * If 5 items and 3 markers: items map to markers [0, 0, 1, 1, 2] with slight spread.
 * If no markers, returns `fallbackBase + index * fallbackGap`.
 */
export function getSyncedStagger(
  index: number,
  totalItems: number,
  markers: number[] | undefined,
  fallbackBase: number = 6,
  fallbackGap: number = 8,
): number {
  if (!markers || markers.length === 0 || totalItems <= 0) {
    return fallbackBase + index * fallbackGap;
  }
  if (markers.length >= totalItems) {
    // One marker per item
    return markers[index] ?? fallbackBase + index * fallbackGap;
  }
  // Spread items across available markers
  const ratio = index / (totalItems - 1);
  const markerIdx = Math.round(ratio * (markers.length - 1));
  return markers[markerIdx] ?? fallbackBase + index * fallbackGap;
}

/**
 * Returns 0→1 progress based on proximity to a specific marker.
 * Peaks at 1 exactly on the marker, ramps up/down over `spread` frames.
 * Use for micro-animations that should pulse on a beat.
 */
export function getMarkerPulse(
  frame: number,
  markers: number[] | undefined,
  markerIndex: number,
  spread: number = 10,
): number {
  if (!markers || markers.length === 0) return 0;
  const center = markers[markerIndex];
  if (center === undefined) return 0;
  const dist = Math.abs(frame - center);
  if (dist > spread) return 0;
  const t = dist / spread;
  // Ease-out curve: sharp peak, soft tail
  return 1 - Easing.out(Easing.cubic)(t);
}

/**
 * Returns the maximum pulse from ANY marker near the current frame.
 * Use for ambient elements that should react to any beat.
 */
export function getAudioPulse(
  frame: number,
  markers: number[] | undefined,
  decayFrames: number = 12,
): number {
  if (!markers || markers.length === 0) return 0;
  let maxPulse = 0;
  for (const marker of markers) {
    const dist = frame - marker;
    if (dist >= -2 && dist < decayFrames) {
      const t = Math.max(0, dist / decayFrames);
      const pulse = 1 - Easing.out(Easing.quad)(t);
      maxPulse = Math.max(maxPulse, pulse);
    }
  }
  return maxPulse;
}

/**
 * Returns 0→1 progress through the current phrase.
 * Finds which marker interval `frame` is in, returns progress within that interval.
 * Use for progress bars, line draws, or wipe reveals tied to speech.
 */
export function getPhraseProgress(
  frame: number,
  markers: number[] | undefined,
  duration: number,
): number {
  if (!markers || markers.length === 0) {
    return Math.min(1, Math.max(0, frame / Math.max(1, duration * 0.7)));
  }
  // Find which interval we're in
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i];
    const end = markers[i + 1] ?? duration;
    if (frame >= start && frame < end) {
      const intervalLen = end - start;
      if (intervalLen <= 0) return 1;
      return Math.min(1, Math.max(0, (frame - start) / intervalLen));
    }
  }
  // Before first marker
  if (frame < markers[0]) {
    return Math.min(1, Math.max(0, frame / Math.max(1, markers[0])));
  }
  // After last marker
  return 1;
}

/**
 * Returns the index of the phrase (marker interval) that `frame` is currently in.
 * Use to trigger events exactly when a new phrase starts.
 */
export function getCurrentPhraseIndex(frame: number, markers: number[] | undefined): number {
  if (!markers || markers.length === 0) return 0;
  for (let i = markers.length - 1; i >= 0; i--) {
    if (frame >= markers[i]) return i;
  }
  return 0;
}

/**
 * Get the frame of the nearest upcoming marker.
 * Use to anticipate beats — e.g., preload an animation so it peaks ON the beat.
 */
export function getNextMarkerFrame(frame: number, markers: number[] | undefined): number | null {
  if (!markers || markers.length === 0) return null;
  for (const m of markers) {
    if (m > frame) return m;
  }
  return null;
}

/**
 * Get the frame of the nearest past marker.
 */
export function getPrevMarkerFrame(frame: number, markers: number[] | undefined): number | null {
  if (!markers || markers.length === 0) return null;
  for (let i = markers.length - 1; i >= 0; i--) {
    if (markers[i] <= frame) return markers[i];
  }
  return null;
}

// ─── Audio-Reactive Transforms ──────────────────────────────────────

/**
 * Returns a scale multiplier that pulses on beats.
 * Base scale + subtle bounce on each marker.
 */
export function getBeatScale(
  frame: number,
  markers: number[] | undefined,
  baseScale: number = 1,
  pulseAmount: number = 0.015,
  decayFrames: number = 10,
): number {
  const pulse = getAudioPulse(frame, markers, decayFrames);
  return baseScale + pulse * pulseAmount;
}

/**
 * Returns an opacity value that fades in at the start of each phrase,
 * creating a breathing effect tied to speech rhythm.
 */
export function getBreathingOpacity(
  frame: number,
  markers: number[] | undefined,
  baseOpacity: number = 1,
  breathAmount: number = 0.08,
  breathSpeed: number = 0.3,
): number {
  const phraseIdx = getCurrentPhraseIndex(frame, markers);
  const phraseStart = markers?.[phraseIdx] ?? 0;
  const timeInPhrase = frame - phraseStart;
  // Slow sine wave within each phrase
  const breath = Math.sin(timeInPhrase * breathSpeed) * 0.5 + 0.5;
  return baseOpacity - breath * breathAmount;
}

// ─── Transition Sync ────────────────────────────────────────────────

/**
 * When should this scene begin its exit animation?
 * Default: `duration - TRANSITION_FRAMES`.
 * Audio-driven: start exit at the last marker (phrase completion).
 * Ensures the scene doesn't cut out mid-word.
 */
export function getSyncedExitStart(
  duration: number,
  markers: number[] | undefined,
  transitionFrames: number = 25,
): number {
  if (!markers || markers.length === 0) {
    return Math.max(0, duration - transitionFrames);
  }
  const lastMarker = markers[markers.length - 1];
  // Start exit shortly after the last phrase ends
  return Math.min(duration - 5, lastMarker + 8);
}

/**
 * Should we trigger a visual accent event right now?
 * Returns true for a single frame on each marker (with small window).
 * Use to flash highlights, scale bumps, or particle triggers.
 */
export function isAccentFrame(frame: number, markers: number[] | undefined, windowFrames: number = 2): boolean {
  if (!markers || markers.length === 0) return false;
  return markers.some((m) => Math.abs(frame - m) <= windowFrames);
}

/**
 * Music beat pulse from a known tempo (no audio analysis needed).
 * Returns 0..1 that spikes on each beat and decays — downbeats hit harder.
 * Drives global beat-reactive accents synced to the background track.
 */
export function getMusicBeatPulse(
  frame: number,
  fps: number,
  bpm: number,
  offsetFrames: number = 0,
  decay: number = 5.5,
  beatsPerBar: number = 4,
): number {
  if (!bpm || bpm <= 0) return 0;
  const beatLen = (fps * 60) / bpm;
  const rel = frame - offsetFrames;
  const phase = ((rel % beatLen) + beatLen) % beatLen / beatLen;
  const beatIndex = Math.floor(rel / beatLen);
  const strength = beatIndex % beatsPerBar === 0 ? 1 : 0.6;
  return Math.exp(-phase * decay) * strength;
}
