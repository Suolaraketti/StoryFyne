// ─── UI Mockup Library ──────────────────────────────────────────────
// Realistic app UI components rendered as React. No images needed.
// Built for belief-shaping: show the product in action, not as a screenshot.

import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { getSpringProgress, DEFAULT_SPRING, SNAPPY_SPRING } from "./animations";

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ─── Phone Frame ────────────────────────────────────────────────────
// iPhone-style device with dynamic island, status bar, rounded corners.

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
        boxShadow: "0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)",
        padding: "14px 14px 20px",
        position: "relative",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px) scale(${interpolate(s, [0, 1], [0.92, 1])})`,
        willChange: "transform, opacity",
      }}
    >
      {/* Dynamic Island */}
      <div
        style={{
          width: 100,
          height: 28,
          background: "#000000",
          borderRadius: 20,
          margin: "0 auto 12px",
        }}
      />
      {/* Screen */}
      <div
        style={{
          width: "100%",
          height: "calc(100% - 40px)",
          background: "#f8f9fa",
          borderRadius: 36,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ─── Chat Bubble ────────────────────────────────────────────────────
// iMessage-style bubble that springs in. Left = incoming, right = outgoing.

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

// ─── Notification Card ──────────────────────────────────────────────
// Push notification that drops from top of phone screen.

export const NotificationCard: React.FC<{
  title: string;
  body: string;
  frame: number;
  fps: number;
  delay?: number;
  icon?: string;
}> = ({ title, body, frame, fps, delay = 0, icon = "📞" }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
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
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 600,
            color: "#111111",
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 400,
            color: "#666666",
            lineHeight: 1.3,
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
};

// ─── Calendar Block ─────────────────────────────────────────────────
// Calendar event card that lands in a slot. Shows time + title.

export const CalendarBlock: React.FC<{
  time: string;
  title: string;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
}> = ({ time, title, frame, fps, delay = 0, primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
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
      <div
        style={{
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 600,
          color: primaryColor,
          marginBottom: 4,
          letterSpacing: "0.02em",
        }}
      >
        {time}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 600,
          color: "#111111",
        }}
      >
        {title}
      </div>
    </div>
  );
};

// ─── Status Pill ────────────────────────────────────────────────────
// Small rounded badge: "Answered", "Qualified", "Booked", "Revenue recovered"

export const StatusPill: React.FC<{
  label: string;
  frame: number;
  fps: number;
  delay?: number;
  variant?: "success" | "neutral" | "accent";
  primaryColor?: string;
}> = ({ label, frame, fps, delay = 0, variant = "success", primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
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
      <span
        style={{
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 600,
          color: c.text,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
    </div>
  );
};

// ─── List Row ───────────────────────────────────────────────────────
// Settings/Contacts style row with icon + text + chevron.

export const ListRow: React.FC<{
  icon: string;
  label: string;
  frame: number;
  fps: number;
  delay?: number;
  highlight?: boolean;
  primaryColor?: string;
}> = ({ icon, label, frame, fps, delay = 0, highlight = false, primaryColor = "#0ea5e9" }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        margin: "0 14px",
        background: highlight ? `${primaryColor}08` : "transparent",
        borderRadius: 12,
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateX(${interpolate(s, [0, 1], [-16, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>{icon}</span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 500,
          color: "#111111",
          flex: 1,
        }}
      >
        {label}
      </span>
      <span style={{ color: "#c1c1c1", fontSize: 14 }}>›</span>
    </div>
  );
};
