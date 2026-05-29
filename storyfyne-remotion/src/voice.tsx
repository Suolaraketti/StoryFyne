// ─── Voice-AI Scene Kit ─────────────────────────────────────────────
// Purpose-built visuals for a voice-AI product: a live AI call panel with a
// reactive waveform + streaming transcript, and a call-transcript card.
// The call IS the product, so these don't need any uploaded screenshots.

import React from "react";
import { interpolate, spring } from "remotion";
import { getSpringProgress, getFloat, DEFAULT_SPRING, SNAPPY_SPRING, clamp } from "./animations";
import { getSyncedDelay, getSyncedStagger, getAudioPulse } from "./audio-sync";
import { useStage } from "./media";
import { FONT } from "./theme";

// ─── Reactive Waveform ──────────────────────────────────────────────
// A live voice waveform. Bars breathe continuously and punch on audio beats.
export const WaveBars: React.FC<{
  frame: number;
  fps: number;
  color: string;
  delay?: number;
  bars?: number;
  height?: number;
  audioMarkers?: number[];
}> = ({ frame, fps, color, delay = 0, bars = 28, height = 90, audioMarkers }) => {
  const beat = getAudioPulse(frame, audioMarkers, 12); // 0..1 punch on beats
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: Math.max(2, height * 0.045), height }}>
      {Array.from({ length: bars }).map((_, i) => {
        const appear = getSpringProgress(frame, fps, delay + i * 1.2, SNAPPY_SPRING);
        // Smooth standing-wave envelope (taller in the middle) + motion + beat.
        const center = 1 - Math.abs(i - (bars - 1) / 2) / ((bars - 1) / 2);
        const wobble = (Math.sin((frame / fps) * 7 + i * 0.6) + 1) / 2;
        const h = height * (0.14 + center * 0.5 * wobble + beat * 0.35 * center);
        return (
          <div
            key={i}
            style={{
              width: Math.max(3, height * 0.05),
              height: Math.max(3, h * appear),
              borderRadius: 99,
              background: `linear-gradient(180deg, ${color}, ${color}aa)`,
              opacity: 0.55 + center * 0.45,
              willChange: "height",
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Pulsing Call Avatar ────────────────────────────────────────────
const CallAvatar: React.FC<{ frame: number; fps: number; color: string; size: number; label?: string }> = ({ frame, fps, color, size, label }) => {
  const rings = [0, 1, 2];
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {rings.map((r) => {
        const t = ((frame / fps) * 0.8 + r / rings.length) % 1;
        return (
          <div key={r} style={{
            position: "absolute", width: size, height: size, borderRadius: "50%",
            border: `2px solid ${color}`, opacity: (1 - t) * 0.5,
            transform: `scale(${1 + t * 1.1})`,
          }} />
        );
      })}
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(140deg, ${color}, ${color}99)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT, fontWeight: 800, color: "#fff", fontSize: size * 0.4,
        boxShadow: `0 8px 30px ${color}55`,
      }}>
        {label || "AI"}
      </div>
    </div>
  );
};

// ─── Transcript Bubble (dark UI) ────────────────────────────────────
const Bubble: React.FC<{ text: string; ai?: boolean; frame: number; fps: number; delay: number; color: string; size: number }> = ({ text, ai = false, frame, fps, delay, color, size }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  return (
    <div style={{ display: "flex", justifyContent: ai ? "flex-end" : "flex-start", marginBottom: size * 0.5 }}>
      <div style={{
        maxWidth: "82%",
        padding: `${size * 0.62}px ${size * 0.85}px`,
        borderRadius: ai ? `${size}px ${size}px ${size * 0.3}px ${size}px` : `${size}px ${size}px ${size}px ${size * 0.3}px`,
        background: ai ? `linear-gradient(135deg, ${color}, ${color}cc)` : "rgba(255,255,255,0.08)",
        border: ai ? "none" : "1px solid rgba(255,255,255,0.1)",
        color: ai ? "#fff" : "rgba(255,255,255,0.92)",
        fontFamily: FONT, fontSize: size, fontWeight: 500, lineHeight: 1.4,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [16, 0])}px)`,
        boxShadow: ai ? `0 8px 24px ${color}33` : "none",
        willChange: "transform, opacity",
      }}>
        {text}
      </div>
    </div>
  );
};

const OutcomePill: React.FC<{ label: string; frame: number; fps: number; delay: number; color: string; size: number; done?: boolean }> = ({ label, frame, fps, delay, color, size, done = true }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: size * 0.45,
      padding: `${size * 0.5}px ${size * 0.9}px`, borderRadius: 999,
      background: done ? `${color}1f` : "rgba(255,255,255,0.06)",
      border: `1px solid ${done ? color + "55" : "rgba(255,255,255,0.12)"}`,
      opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
      transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
      willChange: "transform, opacity",
    }}>
      <div style={{ width: size * 0.5, height: size * 0.5, borderRadius: "50%", background: color }} />
      <span style={{ fontFamily: FONT, fontSize: size * 0.92, fontWeight: 700, color: done ? color : "rgba(255,255,255,0.7)", letterSpacing: "0.01em" }}>{label}</span>
    </div>
  );
};

// ─── AI Call Panel ──────────────────────────────────────────────────
// The hero visual for a voice-AI product: a live, glassy call card.
export const AICallPanel: React.FC<{
  frame: number;
  fps: number;
  primaryColor: string;
  delay?: number;
  caller?: string;       // e.g. business or "Incoming call"
  callerSub?: string;    // e.g. "+1 (971) 375-4740"
  messages?: string[];   // alternating caller / AI lines
  pills?: string[];      // outcome chips
  audioMarkers?: number[];
}> = ({ frame, fps, primaryColor, delay = 0, caller = "Incoming call", callerSub = "AI Assistant • Live", messages = [], pills = [], audioMarkers }) => {
  const { width: stageW, isVertical, unit } = useStage();
  const reveal = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const floatY = getFloat(frame, fps, 5 * unit, 0.3);
  const panelW = clamp(stageW * (isVertical ? 0.9 : 0.46), 360, 720 * unit);
  const s = unit; // local scale
  const seconds = Math.floor(Math.max(0, frame - delay) / fps);
  const timer = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const turns = messages.slice(0, 3);

  return (
    <div style={{
      width: panelW,
      padding: 34 * s,
      borderRadius: 30 * s,
      background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: `0 ${40 * s}px ${110 * s}px rgba(0,0,0,0.5), 0 0 ${80 * s}px ${primaryColor}18, inset 0 1px 0 rgba(255,255,255,0.14)`,
      backdropFilter: "blur(20px)",
      opacity: interpolate(reveal, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
      transform: `translateY(${interpolate(reveal, [0, 1], [50, 0]) + floatY}px) scale(${interpolate(reveal, [0, 1], [0.94, 1])})`,
      willChange: "transform, opacity",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 * s, marginBottom: 26 * s }}>
        <CallAvatar frame={frame} fps={fps} color={primaryColor} size={64 * s} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 22 * s, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{caller}</div>
          <div style={{ fontFamily: FONT, fontSize: 15 * s, fontWeight: 600, color: primaryColor, marginTop: 2 * s }}>{callerSub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 * s, fontFamily: FONT, fontSize: 16 * s, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
          <div style={{ width: 8 * s, height: 8 * s, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
          {timer}
        </div>
      </div>

      {/* Waveform */}
      <div style={{ padding: `${10 * s}px 0 ${20 * s}px` }}>
        <WaveBars frame={frame} fps={fps} color={primaryColor} delay={delay + 6} bars={isVertical ? 22 : 30} height={84 * s} audioMarkers={audioMarkers} />
      </div>

      {/* Transcript */}
      {turns.length > 0 && (
        <div style={{ marginTop: 6 * s }}>
          {turns.map((m, i) => (
            <Bubble key={i} text={m} ai={i % 2 === 1} frame={frame} fps={fps} delay={delay + 18 + i * 14} color={primaryColor} size={16 * s} />
          ))}
        </div>
      )}

      {/* Outcome pills */}
      {pills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 * s, marginTop: 18 * s }}>
          {pills.slice(0, 3).map((p, i) => (
            <OutcomePill key={p} label={p} frame={frame} fps={fps} delay={delay + 40 + i * 10} color={primaryColor} size={15 * s} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Call Transcript Card ───────────────────────────────────────────
// A clean transcript panel — speaker turns streaming in, latest with a caret.
export const CallTranscriptPanel: React.FC<{
  frame: number;
  fps: number;
  primaryColor: string;
  delay?: number;
  title?: string;
  turns?: { speaker: string; text: string }[];
  audioMarkers?: number[];
}> = ({ frame, fps, primaryColor, delay = 0, title = "Live transcript", turns = [], audioMarkers }) => {
  const { width: stageW, isVertical, unit } = useStage();
  const s = unit;
  const panelW = clamp(stageW * (isVertical ? 0.92 : 0.56), 380, 880 * unit);
  const reveal = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const rows = turns.slice(0, 5);
  return (
    <div style={{
      width: panelW, padding: 30 * s, borderRadius: 26 * s,
      background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: `0 ${36 * s}px ${100 * s}px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.12)`,
      backdropFilter: "blur(18px)",
      opacity: interpolate(reveal, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
      transform: `translateY(${interpolate(reveal, [0, 1], [44, 0])}px) scale(${interpolate(reveal, [0, 1], [0.96, 1])})`,
      willChange: "transform, opacity",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 * s, marginBottom: 22 * s }}>
        <div style={{ width: 9 * s, height: 9 * s, borderRadius: "50%", background: primaryColor, boxShadow: `0 0 10px ${primaryColor}` }} />
        <div style={{ fontFamily: FONT, fontSize: 15 * s, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{title}</div>
      </div>
      {rows.map((t, i) => {
        const rs = getSpringProgress(frame, fps, delay + 12 + i * 16, DEFAULT_SPRING);
        const isAI = /ai|assistant|agent/i.test(t.speaker);
        const last = i === rows.length - 1;
        const caretOn = Math.floor(frame / 15) % 2 === 0;
        return (
          <div key={i} style={{
            display: "flex", gap: 14 * s, marginBottom: 16 * s,
            opacity: interpolate(rs, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
            transform: `translateX(${interpolate(rs, [0, 1], [-16, 0])}px)`,
          }}>
            <div style={{ fontFamily: FONT, fontSize: 14 * s, fontWeight: 800, color: isAI ? primaryColor : "rgba(255,255,255,0.5)", minWidth: 86 * s, textTransform: "uppercase", letterSpacing: "0.04em", paddingTop: 2 * s }}>{t.speaker}</div>
            <div style={{ fontFamily: FONT, fontSize: 18 * s, fontWeight: 500, color: "rgba(255,255,255,0.92)", lineHeight: 1.5, flex: 1 }}>
              {t.text}
              {last && caretOn && <span style={{ display: "inline-block", width: 2 * s, height: 18 * s, background: primaryColor, marginLeft: 3 * s, verticalAlign: "middle" }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};
