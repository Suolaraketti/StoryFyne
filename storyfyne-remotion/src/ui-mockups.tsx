// ─── UI Mockup Library ──────────────────────────────────────────────
// Production-grade UI components rendered as React. No images.
// Designed to feel like OpenAI, Apple, Google, Linear, Notion.

import React from "react";
import { interpolate, spring } from "remotion";
import { getSpringProgress, DEFAULT_SPRING, SNAPPY_SPRING, clamp } from "./animations";
import { getSyncedDelay, getSyncedStagger } from "./audio-sync";

// ─── Animated Number ────────────────────────────────────────────────
// Counts a metric up from 0 to its target on entrance, preserving the
// prefix/suffix and decimal precision. Non-numeric values (e.g. "24/7")
// render static.
export const AnimatedNumber: React.FC<{
  value: string;
  frame: number;
  fps: number;
  delay?: number;
}> = ({ value, frame, fps, delay = 0 }) => {
  const m = String(value).match(/^([^0-9-]*)(-?[0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/);
  // Bail on multi-number / non-countable strings (24/7, 9-5, etc.)
  if (!m || /[0-9]/.test(m[3])) return <>{value}</>;
  const [, prefix, numStr, suffix] = m;
  const hadComma = numStr.includes(",");
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  const target = parseFloat(numStr.replace(/,/g, ""));
  const p = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  const current = target * p;
  const formatted = current.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: hadComma,
  });
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{prefix}{formatted}{suffix}</span>;
};

import { FONT } from "./theme";
const MONO = '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace';

// ═══════════════════════════════════════════════════════════════════
//  DEVICE FRAMES
// ═══════════════════════════════════════════════════════════════════

export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  frame: number;
  fps: number;
  primaryColor?: string;
}> = ({ children, frame, fps, primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, 0, DEFAULT_SPRING);
  return (
    <div
      style={{
        width: 340,
        height: 680,
        background: "#ffffff",
        borderRadius: 48,
        boxShadow: "0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
        padding: "14px 14px 20px",
        position: "relative",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px) scale(${interpolate(s, [0, 1], [0.92, 1])})`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ width: 100, height: 28, background: "#000", borderRadius: 20, margin: "0 auto 12px" }} />
      <div style={{ width: "100%", height: "calc(100% - 40px)", background: "#f8f9fa", borderRadius: 36, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
};

export const BrowserFrame: React.FC<{
  children: React.ReactNode;
  frame: number;
  fps: number;
  url?: string;
  primaryColor?: string;
}> = ({ children, frame, fps, url = "app.example.com", primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, 0, DEFAULT_SPRING);
  return (
    <div
      style={{
        width: 900,
        maxWidth: "90vw",
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 24px 64px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
        overflow: "hidden",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) scale(${interpolate(s, [0, 1], [0.95, 1])})`,
        willChange: "transform, opacity",
      }}
    >
      {/* Chrome bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f5f5f5", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
        </div>
        <div style={{ flex: 1, background: "#ffffff", borderRadius: 6, padding: "5px 14px", fontFamily: FONT, fontSize: 12, color: "#666", textAlign: "center", border: "1px solid #e5e5e5" }}>
          {url}
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: 24, background: "#fafafa", minHeight: 400 }}>
        {children}
      </div>
    </div>
  );
};

export const TabletFrame: React.FC<{
  children: React.ReactNode;
  frame: number;
  fps: number;
  primaryColor?: string;
}> = ({ children, frame, fps, primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, 0, DEFAULT_SPRING);
  return (
    <div
      style={{
        width: 720,
        maxWidth: "90vw",
        background: "#ffffff",
        borderRadius: 28,
        boxShadow: "0 24px 64px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
        padding: 16,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ width: "100%", height: 480, background: "#f8f9fa", borderRadius: 20, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MESSAGING
// ═══════════════════════════════════════════════════════════════════

export const ChatBubble: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  direction?: "left" | "right";
  primaryColor?: string;
}> = ({ text, frame, fps, delay = 0, direction = "left", primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  const isRight = direction === "right";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isRight ? "flex-end" : "flex-start",
        marginBottom: 8,
        padding: "0 14px",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "12px 16px",
          borderRadius: isRight ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isRight ? primaryColor : "#e9ecef",
          color: isRight ? "#ffffff" : "#111111",
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const ChatThread: React.FC<{
  messages: { text: string; direction: "left" | "right" }[];
  frame: number;
  fps: number;
  baseDelay?: number;
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ messages, frame, fps, baseDelay = 0, primaryColor = "#0ea5e9", audioMarkers }) => {
  return (
    <div style={{ padding: "16px 0" }}>
      {messages.map((m, i) => (
        <ChatBubble
          key={i}
          text={m.text}
          frame={frame}
          fps={fps}
          delay={baseDelay + getSyncedStagger(i, messages.length, audioMarkers, 0, 12)}
          direction={m.direction}
          primaryColor={primaryColor}
        />
      ))}
    </div>
  );
};

export const EmailPreview: React.FC<{
  sender: string;
  subject: string;
  snippet: string;
  frame: number;
  fps: number;
  delay?: number;
  unread?: boolean;
}> = ({ sender, subject, snippet, frame, fps, delay = 0, unread = true }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        background: "#ffffff",
        borderRadius: 12,
        margin: "0 14px 8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateX(${interpolate(s, [0, 1], [-20, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: unread ? "#0ea5e9" : "transparent", marginTop: 6, flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 2 }}>{sender}</div>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "#333", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subject}</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{snippet}</div>
      </div>
    </div>
  );
};

export const NotificationCard: React.FC<{
  title: string;
  body: string;
  frame: number;
  fps: number;
  delay?: number;
  icon?: string;
  audioMarkers?: number[];
}> = ({ title, body, frame, fps, delay = 0, icon = "📞", audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        background: "rgba(255,255,255,0.94)",
        borderRadius: 18,
        padding: "14px 16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [-30, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 2 }}>{title}</div>
        <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 400, color: "#666", lineHeight: 1.3 }}>{body}</div>
      </div>
    </div>
  );
};

export const VoiceWaveform: React.FC<{
  frame: number;
  fps: number;
  active?: boolean;
  color?: string;
  delay?: number;
}> = ({ frame, fps, active = true, color = "#0ea5e9", delay = 0 }) => {
  const barCount = 20;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 40 }}>
      {Array.from({ length: barCount }).map((_, i) => {
        const s = getSpringProgress(frame, fps, delay + i * 2, SNAPPY_SPRING);
        const h = active
          ? 8 + Math.abs(Math.sin((frame + i * 30) * 0.15)) * 24
          : 8;
        return (
          <div
            key={i}
            style={{
              width: 3,
              height: h,
              background: color,
              borderRadius: 2,
              opacity: interpolate(s, [0, 0.5, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
              transform: `scaleY(${interpolate(s, [0, 1], [0.3, 1])})`,
              willChange: "transform, opacity",
            }}
          />
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  CARDS & DATA
// ═══════════════════════════════════════════════════════════════════

export const DashboardCard: React.FC<{
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  frame: number;
  fps: number;
  delay?: number;
  audioMarkers?: number[];
}> = ({ label, value, trend, trendLabel, frame, fps, delay = 0, audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  const isUp = (trend || 0) >= 0;
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "24px 28px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        minWidth: 180,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 700, color: "#111", letterSpacing: "-0.02em", marginBottom: 8 }}>{value}</div>
      {trend !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: isUp ? "#22c55e" : "#ef4444", fontSize: 13, fontWeight: 600 }}>{isUp ? "↑" : "↓"} {Math.abs(trend)}%</span>
          {trendLabel && <span style={{ fontFamily: FONT, fontSize: 12, color: "#aaa" }}>{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};

export const StatCard: React.FC<{
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  frame: number;
  fps: number;
  delay?: number;
  audioMarkers?: number[];
}> = ({ value, label, prefix = "", suffix = "", frame, fps, delay = 0, audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), SNAPPY_SPRING);
  return (
    <div style={{ textAlign: "center", opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }), transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`, willChange: "transform, opacity" }}>
      <div style={{ fontFamily: FONT, fontSize: "72px", fontWeight: 800, color: "#111", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {prefix}<AnimatedNumber value={value} frame={frame} fps={fps} delay={delay} />{suffix}
      </div>
      <div style={{ fontFamily: FONT, fontSize: "18px", fontWeight: 500, color: "#888", marginTop: 8 }}>{label}</div>
    </div>
  );
};

export const TestimonialCard: React.FC<{
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  rating?: number;
  frame: number;
  fps: number;
  delay?: number;
  audioMarkers?: number[];
}> = ({ quote, name, role, avatar, rating, frame, fps, delay = 0, audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: "36px 40px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        maxWidth: 600,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 48, color: "#ddd", lineHeight: 1, marginBottom: 8 }}>"</div>
      <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 500, color: "#222", lineHeight: 1.5, marginBottom: 24 }}>{quote}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 16, fontWeight: 600, color: "#666" }}>
          {avatar || name.charAt(0)}
        </div>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#111" }}>{name}</div>
          <div style={{ fontFamily: FONT, fontSize: 13, color: "#888" }}>{role}</div>
        </div>
        {rating !== undefined && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ fontSize: 16, color: i < rating ? "#f59e0b" : "#e5e5e5" }}>★</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const PricingCard: React.FC<{
  plan: string;
  price: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ plan, price, period = "/mo", features, highlighted = false, frame, fps, delay = 0, primaryColor = "#0ea5e9", audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: "32px 28px",
        boxShadow: highlighted ? `0 8px 32px ${primaryColor}20` : "0 2px 12px rgba(0,0,0,0.04)",
        border: highlighted ? `2px solid ${primaryColor}` : "2px solid transparent",
        minWidth: 240,
        flex: 1,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{plan}</div>
      <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>{price}<span style={{ fontSize: 16, fontWeight: 500, color: "#888" }}>{period}</span></div>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 14, color: "#444" }}>
            <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span> {f}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FeatureCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ icon, title, description, frame, fps, delay = 0, primaryColor = "#0ea5e9", audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${primaryColor}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 6 }}>{title}</div>
      <div style={{ fontFamily: FONT, fontSize: 13, color: "#666", lineHeight: 1.5 }}>{description}</div>
    </div>
  );
};

export const ComparisonCard: React.FC<{
  beforeLabel: string;
  beforeText: string;
  afterLabel: string;
  afterText: string;
  frame: number;
  fps: number;
  delay?: number;
  audioMarkers?: number[];
}> = ({ beforeLabel, beforeText, afterLabel, afterText, frame, fps, delay = 0, audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  return (
    <div style={{ display: "flex", gap: 16, maxWidth: 700, opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }), transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`, willChange: "transform, opacity" }}>
      <div style={{ flex: 1, background: "#fef2f2", borderRadius: 16, padding: "28px 24px", border: "1px solid #fecaca" }}>
        <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{beforeLabel}</div>
        <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, color: "#7f1d1d" }}>{beforeText}</div>
      </div>
      <div style={{ flex: 1, background: "#f0fdf4", borderRadius: 16, padding: "28px 24px", border: "1px solid #bbf7d0" }}>
        <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{afterLabel}</div>
        <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, color: "#14532d" }}>{afterText}</div>
      </div>
    </div>
  );
};

export const CalendarBlock: React.FC<{
  time: string;
  title: string;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ time, title, frame, fps, delay = 0, primaryColor = "#0ea5e9", audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  return (
    <div
      style={{
        margin: "0 14px 10px",
        padding: "14px 16px",
        background: "#ffffff",
        borderRadius: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        borderLeft: `4px solid ${primaryColor}`,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateX(${interpolate(s, [0, 1], [-20, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: primaryColor, marginBottom: 4, letterSpacing: "0.02em" }}>{time}</div>
      <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#111" }}>{title}</div>
    </div>
  );
};

export const CalendarMonth: React.FC<{
  month: string;
  highlightedDays?: number[];
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ month, highlightedDays = [], frame, fps, delay = 0, primaryColor = "#0ea5e9", audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `scale(${interpolate(s, [0, 1], [0.95, 1])})`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 12 }}>{month}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={`h-${i}`} style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: "#aaa", textAlign: "center", padding: "4px 0" }}>{d}</div>
        ))}
        {days.map((d) => {
          const isHighlighted = highlightedDays.includes(d);
          const ds = getSpringProgress(frame, fps, delay + d * 1, SNAPPY_SPRING);
          return (
            <div
              key={d}
              style={{
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: isHighlighted ? 700 : 400,
                color: isHighlighted ? "#fff" : "#444",
                textAlign: "center",
                padding: "6px 0",
                borderRadius: 6,
                background: isHighlighted ? primaryColor : "transparent",
                opacity: d > 28 ? 0.3 : interpolate(ds, [0, 0.5, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const InvoiceRow: React.FC<{
  service: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  frame: number;
  fps: number;
  delay?: number;
}> = ({ service, amount, status, frame, fps, delay = 0 }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const statusColors = { paid: "#22c55e", pending: "#f59e0b", failed: "#ef4444" };
  const statusLabels = { paid: "Paid", pending: "Pending", failed: "Failed" };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        background: "#ffffff",
        borderRadius: 12,
        margin: "0 14px 8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateX(${interpolate(s, [0, 1], [-16, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#111" }}>{service}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#111" }}>{amount}</div>
        <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: statusColors[status], background: `${statusColors[status]}12`, padding: "3px 10px", borderRadius: 100, textTransform: "uppercase" }}>
          {statusLabels[status]}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  DATA VISUALIZATION
// ═══════════════════════════════════════════════════════════════════

export const BarChart: React.FC<{
  data: { label: string; value: number }[];
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ data, frame, fps, delay = 0, primaryColor = "#0ea5e9", audioMarkers }) => {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 160, padding: "0 8px" }}>
      {data.map((d, i) => {
        const s = getSpringProgress(frame, fps, getSyncedStagger(i, data.length, audioMarkers, delay, 4), DEFAULT_SPRING);
        const h = (d.value / max) * 120;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: "100%",
                height: h,
                background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor}80 100%)`,
                borderRadius: "6px 6px 0 0",
                opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                transform: `scaleY(${interpolate(s, [0, 1], [0, 1])})`,
                transformOrigin: "bottom",
                willChange: "transform, opacity",
              }}
            />
            <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, color: "#888" }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const LineChart: React.FC<{
  data: number[];
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ data, frame, fps, delay = 0, primaryColor = "#0ea5e9", audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  const width = 300;
  const height = 100;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const pathProgress = interpolate(s, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: pathProgress, willChange: "opacity" }}>
      <svg width={width} height={height + 20} viewBox={`0 0 ${width} ${height + 20}`}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0,${height} L${points} L${width},${height} Z`} fill="url(#lineGrad)" />
        <path d={`M${points}`} fill="none" stroke={primaryColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={1000} strokeDashoffset={1000 * (1 - pathProgress)} />
      </svg>
    </div>
  );
};

export const PieChart: React.FC<{
  segments: { label: string; value: number; color: string }[];
  frame: number;
  fps: number;
  delay?: number;
}> = ({ segments, frame, fps, delay = 0 }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  let startAngle = 0;
  const radius = 60;
  const cx = 80;
  const cy = 80;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }) }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {segments.map((seg, i) => {
          const angle = (seg.value / total) * 360;
          const endAngle = startAngle + angle;
          const x1 = cx + radius * Math.cos((Math.PI * startAngle) / 180);
          const y1 = cy + radius * Math.sin((Math.PI * startAngle) / 180);
          const x2 = cx + radius * Math.cos((Math.PI * endAngle) / 180);
          const y2 = cy + radius * Math.sin((Math.PI * endAngle) / 180);
          const largeArc = angle > 180 ? 1 : 0;
          const ds = getSpringProgress(frame, fps, delay + i * 6, SNAPPY_SPRING);
          startAngle = endAngle;
          return (
            <path
              key={i}
              d={`M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`}
              fill={seg.color}
              opacity={interpolate(ds, [0, 1], [0, 1], { extrapolateLeft: "clamp" })}
            />
          );
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color }} />
            <div style={{ fontFamily: FONT, fontSize: 12, color: "#444" }}>{seg.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProgressRing: React.FC<{
  percent: number;
  label?: string;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ percent, label, frame, fps, delay = 0, primaryColor = "#0ea5e9", audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), SNAPPY_SPRING);
  const currentPercent = interpolate(s, [0, 1], [0, percent], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentPercent / 100) * circumference;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle cx={60} cy={60} r={radius} fill="none" stroke="#e5e5e5" strokeWidth={8} />
        <circle cx={60} cy={60} r={radius} fill="none" stroke={primaryColor} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: "#111" }}>{Math.round(currentPercent)}%</div>
      {label && <div style={{ fontFamily: FONT, fontSize: 12, color: "#888" }}>{label}</div>}
    </div>
  );
};

export const Sparkline: React.FC<{
  data: number[];
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
}> = ({ data, frame, fps, delay = 0, primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const width = 80;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} style={{ opacity: interpolate(s, [0, 0.5, 1], [0, 1, 1], { extrapolateLeft: "clamp" }) }}>
      <path d={`M${points}`} fill="none" stroke={primaryColor} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  INPUTS & CONTROLS
// ═══════════════════════════════════════════════════════════════════

export const TypewriterInput: React.FC<{
  text: string;
  placeholder?: string;
  frame: number;
  fps: number;
  delay?: number;
  speed?: number;
  audioMarkers?: number[];
}> = ({ text, placeholder = "Type something...", frame, fps, delay = 0, speed = 0.3, audioMarkers }) => {
  const adjustedFrame = Math.max(0, frame - getSyncedDelay(0, audioMarkers, delay));
  const charsToShow = Math.floor(adjustedFrame * speed);
  const visibleText = text.slice(0, charsToShow);
  const cursorOn = Math.floor(frame / 15) % 2 === 0;
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        padding: "16px 20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 320,
      }}
    >
      <span style={{ color: "#aaa", fontSize: 16 }}>⌘</span>
      <span style={{ fontFamily: FONT, fontSize: 16, color: visibleText ? "#111" : "#bbb", fontWeight: 400 }}>
        {visibleText || placeholder}
      </span>
      {cursorOn && visibleText.length < text.length && (
        <span style={{ display: "inline-block", width: 2, height: 20, background: "#0ea5e9", marginLeft: 2 }} />
      )}
    </div>
  );
};

export const SearchBar: React.FC<{
  query: string;
  frame: number;
  fps: number;
  delay?: number;
}> = ({ query, frame, fps, delay = 0 }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        padding: "14px 18px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 300,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [10, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <span style={{ color: "#aaa", fontSize: 16 }}>🔍</span>
      <span style={{ fontFamily: FONT, fontSize: 15, color: "#444" }}>{query}</span>
    </div>
  );
};

export const ToggleSwitch: React.FC<{
  on: boolean;
  label?: string;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
}> = ({ on, label, frame, fps, delay = 0, primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  const isOn = interpolate(s, [0, 1], [0, on ? 1 : 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) > 0.5;
  const thumbX = interpolate(s, [0, 1], [2, on ? 26 : 2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 50,
          height: 28,
          borderRadius: 14,
          background: isOn ? primaryColor : "#d1d5db",
          position: "relative",
          transition: "none",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#ffffff",
            position: "absolute",
            top: 2,
            left: thumbX,
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      </div>
      {label && <span style={{ fontFamily: FONT, fontSize: 14, color: "#444" }}>{label}</span>}
    </div>
  );
};

export const Button: React.FC<{
  label: string;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
}> = ({ label, frame, fps, delay = 0, primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 32px",
        background: primaryColor,
        borderRadius: 100,
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 600,
        color: "#ffffff",
        letterSpacing: "0.01em",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
        willChange: "transform, opacity",
      }}
    >
      {label}
    </div>
  );
};

export const Slider: React.FC<{
  value: number;
  min?: number;
  max?: number;
  label?: string;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
}> = ({ value, min = 0, max = 100, label, frame, fps, delay = 0, primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const current = interpolate(s, [0, 1], [min, value], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const percent = ((current - min) / (max - min)) * 100;
  return (
    <div style={{ width: 240 }}>
      {label && <div style={{ fontFamily: FONT, fontSize: 13, color: "#666", marginBottom: 8 }}>{label}</div>}
      <div style={{ height: 6, background: "#e5e5e5", borderRadius: 3, position: "relative" }}>
        <div style={{ height: "100%", width: `${percent}%`, background: primaryColor, borderRadius: 3 }} />
        <div style={{ position: "absolute", top: -5, left: `calc(${percent}% - 8px)`, width: 16, height: 16, borderRadius: "50%", background: "#ffffff", border: `2px solid ${primaryColor}`, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  NAVIGATION & FLOW
// ═══════════════════════════════════════════════════════════════════

export const Stepper: React.FC<{
  steps: string[];
  activeStep: number;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ steps, activeStep, frame, fps, delay = 0, primaryColor = "#0ea5e9", audioMarkers }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {steps.map((step, i) => {
        const isActive = i <= activeStep;
        const s = getSpringProgress(frame, fps, getSyncedStagger(i, steps.length, audioMarkers, delay, 8), DEFAULT_SPRING);
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isActive ? primaryColor : "#e5e5e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 700,
                  color: isActive ? "#fff" : "#888",
                  opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                  transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})`,
                  willChange: "transform, opacity",
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: isActive ? "#111" : "#aaa" }}>{step}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 40, height: 2, background: i < activeStep ? primaryColor : "#e5e5e5", margin: "0 8px", marginBottom: 22 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Timeline: React.FC<{
  events: { time: string; title: string; description?: string }[];
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
}> = ({ events, frame, fps, delay = 0, primaryColor = "#0ea5e9" }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: "0 14px" }}>
      {events.map((ev, i) => {
        const s = getSpringProgress(frame, fps, delay + i * 10, DEFAULT_SPRING);
        return (
          <div key={i} style={{ display: "flex", gap: 14, opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }), transform: `translateX(${interpolate(s, [0, 1], [-16, 0])}px)`, willChange: "transform, opacity" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: primaryColor }} />
              {i < events.length - 1 && <div style={{ width: 2, flex: 1, background: "#e5e5e5" }} />}
            </div>
            <div style={{ paddingBottom: 18 }}>
              <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: primaryColor, marginBottom: 2 }}>{ev.time}</div>
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#111" }}>{ev.title}</div>
              {ev.description && <div style={{ fontFamily: FONT, fontSize: 12, color: "#888", marginTop: 2 }}>{ev.description}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Breadcrumb: React.FC<{
  items: string[];
  frame: number;
  fps: number;
  delay?: number;
}> = ({ items, frame, fps, delay = 0 }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
      {items.map((item, i) => {
        const s = getSpringProgress(frame, fps, delay + i * 6, DEFAULT_SPRING);
        return (
          <React.Fragment key={i}>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: i === items.length - 1 ? 600 : 400,
                color: i === items.length - 1 ? "#111" : "#888",
                opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
              }}
            >
              {item}
            </span>
            {i < items.length - 1 && <span style={{ color: "#ccc" }}>/</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const TabBar: React.FC<{
  tabs: string[];
  activeTab: number;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
}> = ({ tabs, activeTab, frame, fps, delay = 0, primaryColor = "#0ea5e9" }) => {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e5e5e5", padding: "0 14px" }}>
      {tabs.map((tab, i) => {
        const s = getSpringProgress(frame, fps, delay + i * 4, DEFAULT_SPRING);
        const isActive = i === activeTab;
        return (
          <div
            key={i}
            style={{
              padding: "12px 18px",
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? primaryColor : "#666",
              borderBottom: isActive ? `2px solid ${primaryColor}` : "2px solid transparent",
              marginBottom: -1,
              opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
            }}
          >
            {tab}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  SOCIAL & IDENTITY
// ═══════════════════════════════════════════════════════════════════

export const Avatar: React.FC<{
  name: string;
  image?: string;
  online?: boolean;
  size?: number;
  frame: number;
  fps: number;
  delay?: number;
}> = ({ name, image, online = false, size = 40, frame, fps, delay = 0 }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: image ? undefined : "#e5e5e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        fontSize: size * 0.35,
        fontWeight: 600,
        color: "#666",
        position: "relative",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})`,
        willChange: "transform, opacity",
      }}
    >
      {image ? <img src={image} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : initials}
      {online && (
        <div style={{ position: "absolute", bottom: 1, right: 1, width: size * 0.28, height: size * 0.28, borderRadius: "50%", background: "#22c55e", border: "2px solid #fff" }} />
      )}
    </div>
  );
};

export const RatingStars: React.FC<{
  rating: number;
  frame: number;
  fps: number;
  delay?: number;
}> = ({ rating, frame, fps, delay = 0 }) => {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const s = getSpringProgress(frame, fps, delay + i * 4, SNAPPY_SPRING);
        const filled = i < rating;
        return (
          <div
            key={i}
            style={{
              fontSize: 18,
              color: filled ? "#f59e0b" : "#e5e5e5",
              opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
              transform: `scale(${interpolate(s, [0, 1], [0.3, 1])})`,
              willChange: "transform, opacity",
            }}
          >
            ★
          </div>
        );
      })}
    </div>
  );
};

export const SocialProofRow: React.FC<{
  avatars: string[];
  count: string;
  label: string;
  frame: number;
  fps: number;
  delay?: number;
  audioMarkers?: number[];
}> = ({ avatars, count, label, frame, fps, delay = 0, audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), DEFAULT_SPRING);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [10, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ display: "flex" }}>
        {avatars.slice(0, 4).map((a, i) => (
          <div key={i} style={{ marginLeft: i > 0 ? -10 : 0, zIndex: 4 - i }}>
            <Avatar name={a} size={32} frame={frame} fps={fps} delay={getSyncedStagger(i, avatars.slice(0, 4).length, audioMarkers, delay, 4)} />
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#111" }}>{count}</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: "#888" }}>{label}</div>
      </div>
    </div>
  );
};

export const StatusPill: React.FC<{
  label: string;
  frame: number;
  fps: number;
  delay?: number;
  variant?: "success" | "neutral" | "accent";
  primaryColor?: string;
  audioMarkers?: number[];
}> = ({ label, frame, fps, delay = 0, variant = "success", primaryColor = "#0ea5e9", audioMarkers }) => {
  const s = getSpringProgress(frame, fps, getSyncedDelay(0, audioMarkers, delay), SNAPPY_SPRING);
  const colors = {
    success: { bg: "#dcfce7", text: "#166534", dot: "#22c55e" },
    neutral: { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af" },
    accent: { bg: `${primaryColor}15`, text: primaryColor, dot: primaryColor },
  };
  const c = colors[variant];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        background: c.bg,
        borderRadius: 100,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot }} />
      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: c.text, letterSpacing: "0.01em" }}>{label}</span>
    </div>
  );
};

export const Tag: React.FC<{
  label: string;
  frame: number;
  fps: number;
  delay?: number;
}> = ({ label, frame, fps, delay = 0 }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "4px 10px",
        background: "#f3f4f6",
        borderRadius: 6,
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 500,
        color: "#666",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
      }}
    >
      {label}
    </span>
  );
};
