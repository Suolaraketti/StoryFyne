// ─── Simulated User Interactions ────────────────────────────────────
// Finger taps, cursor movements, scroll gestures, swipes, pinches.
// These make UI mockups feel alive — like someone is actually using
// the product on screen. Adds a layer of realism no static mock can match.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSpringProgress, DEFAULT_SPRING, SNAPPY_SPRING } from "./animations";

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ─── 1. Finger Tap ──────────────────────────────────────────────────
// Simulated finger touching the screen. Ripple emanates from touch point.

export const FingerTap: React.FC<{
  x: number;
  y: number;
  frame: number;
  fps: number;
  delay?: number;
  color?: string;
}> = ({ x, y, frame, fps, delay = 0, color = "rgba(255,255,255,0.6)" }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  const rippleSize = interpolate(s, [0, 1], [20, 80]);
  const rippleOpacity = interpolate(s, [0, 0.3, 1], [0.6, 0.3, 0]);

  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 200 }}>
      {/* Finger dot */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: color,
          transform: "translate(-50%, -50%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          opacity: s > 0.9 ? 0.7 : 1,
        }}
      />
      {/* Ripple ring */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: rippleSize,
          height: rippleSize,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          transform: "translate(-50%, -50%)",
          opacity: rippleOpacity,
        }}
      />
    </div>
  );
};

// ─── 2. Cursor Movement ─────────────────────────────────────────────
// Mouse cursor that moves along a path and clicks.
// Perfect for desktop app demos.

export const CursorMovement: React.FC<{
  path: { x: number; y: number; click?: boolean }[];
  frame: number;
  fps: number;
  speed?: number;
}> = ({ path, frame, fps, speed = 8 }) => {
  const currentIndex = Math.floor(frame / speed);
  const progress = (frame % speed) / speed;
  const from = path[Math.min(currentIndex, path.length - 1)];
  const to = path[Math.min(currentIndex + 1, path.length - 1)] || from;

  const x = interpolate(progress, [0, 1], [from.x, to.x]);
  const y = interpolate(progress, [0, 1], [from.y, to.y]);
  const isClicking = from.click && progress > 0.3 && progress < 0.7;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 200,
        transform: "translate(-2px, -2px)",
      }}
    >
      <svg width={24} height={24} viewBox="0 0 24 24" style={{ transform: isClicking ? "scale(0.9)" : "scale(1)", transition: "none" }}>
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z" fill="#111" stroke="#fff" strokeWidth={1.5} />
      </svg>
      {isClicking && (
        <div
          style={{
            position: "absolute",
            left: -8,
            top: -8,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid rgba(14,165,233,0.5)",
            animation: "none",
          }}
        />
      )}
    </div>
  );
};

// ─── 3. Scroll Gesture ──────────────────────────────────────────────
// Simulated finger dragging content up/down with momentum.
// Shows a scrollable list inside a phone frame.

export const ScrollGesture: React.FC<{
  children: React.ReactNode;
  frame: number;
  fps: number;
  scrollY?: number;
  containerHeight?: number;
  contentHeight?: number;
  delay?: number;
}> = ({ children, frame, fps, scrollY = 200, containerHeight = 500, contentHeight = 800, delay = 0 }) => {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(1, adjusted / 60);
  const eased = progress * (2 - progress); // ease-out
  const currentScroll = eased * Math.min(scrollY, contentHeight - containerHeight);

  return (
    <div style={{ position: "relative", height: containerHeight, overflow: "hidden" }}>
      <div style={{ transform: `translateY(-${currentScroll}px)`, willChange: "transform" }}>
        {children}
      </div>
      {/* Scroll thumb */}
      <div
        style={{
          position: "absolute",
          right: 4,
          top: 4,
          width: 4,
          height: (containerHeight / contentHeight) * containerHeight,
          borderRadius: 2,
          background: "rgba(0,0,0,0.2)",
          transform: `translateY(${currentScroll * (containerHeight / contentHeight)}px)`,
        }}
      />
    </div>
  );
};

// ─── 4. Swipe Gesture ───────────────────────────────────────────────
// Card being swiped left/right with rotation and spring physics.
// Dating app style, or dismiss notification.

export const SwipeGesture: React.FC<{
  children: React.ReactNode;
  frame: number;
  fps: number;
  direction?: "left" | "right";
  delay?: number;
}> = ({ children, frame, fps, direction = "right", delay = 0 }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const translateX = interpolate(s, [0, 1], [0, direction === "right" ? 400 : -400]);
  const rotate = interpolate(s, [0, 1], [0, direction === "right" ? 15 : -15]);
  const opacity = interpolate(s, [0.7, 1], [1, 0]);

  return (
    <div
      style={{
        transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
        opacity,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
};

// ─── 5. Pinch Zoom ──────────────────────────────────────────────────
// Two-finger pinch gesture zooming into content.
// Great for maps, images, detail views.

export const PinchZoom: React.FC<{
  children: React.ReactNode;
  frame: number;
  fps: number;
  fromScale?: number;
  toScale?: number;
  delay?: number;
}> = ({ children, frame, fps, fromScale = 1, toScale = 2.5, delay = 0 }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const scale = interpolate(s, [0, 1], [fromScale, toScale]);

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};

// ─── 6. Pull to Refresh ─────────────────────────────────────────────
// iOS-style pull-to-refresh with spinner.

export const PullToRefresh: React.FC<{
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
}> = ({ frame, fps, delay = 0, primaryColor = "#0ea5e9" }) => {
  const adjusted = Math.max(0, frame - delay);
  const pull = Math.min(1, adjusted / 30);
  const rotation = adjusted * 8;
  const isRefreshing = pull >= 1 && adjusted < 60;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: `2px solid ${primaryColor}`,
          borderTopColor: "transparent",
          transform: `rotate(${rotation}deg) translateY(${-pull * 40}px)`,
          opacity: pull,
        }}
      />
      {isRefreshing && (
        <div style={{ fontFamily: FONT, fontSize: 12, color: "#888", marginTop: 8 }}>Updating...</div>
      )}
    </div>
  );
};

// ─── 7. Keyboard Typing ─────────────────────────────────────────────
// Simulated mobile keyboard with keys being pressed.
// Shows which keys are tapped as text types.

export const MobileKeyboard: React.FC<{
  activeKeys?: string[];
  frame: number;
  fps: number;
}> = ({ activeKeys = [], frame, fps }) => {
  const rows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];

  return (
    <div style={{ background: "#d1d5db", padding: "8px 4px", borderRadius: "12px 12px 0 0" }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 6 }}>
          {row.map((key) => {
            const isActive = activeKeys.includes(key);
            return (
              <div
                key={key}
                style={{
                  width: 28,
                  height: 38,
                  background: isActive ? "#a1a1aa" : "#ffffff",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#111",
                  boxShadow: isActive ? "inset 0 2px 4px rgba(0,0,0,0.1)" : "0 1px 2px rgba(0,0,0,0.1)",
                  transform: isActive ? "scale(0.95)" : "scale(1)",
                }}
              >
                {key}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
        <div style={{ width: 80, height: 38, background: "#ffffff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 12, color: "#111" }}>space</div>
      </div>
    </div>
  );
};

// ─── 8. Hover Preview ───────────────────────────────────────────────
// Simulated mouse hover that reveals a tooltip or preview card.
// Desktop app feel.

export const HoverPreview: React.FC<{
  trigger: React.ReactNode;
  preview: React.ReactNode;
  frame: number;
  fps: number;
  delay?: number;
}> = ({ trigger, preview, frame, fps, delay = 0 }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const previewOpacity = interpolate(s, [0, 0.3, 1], [0, 1, 1]);
  const previewY = interpolate(s, [0, 1], [10, 0]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {trigger}
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: `translateX(-50%) translateY(${previewY}px)`,
          opacity: previewOpacity,
          marginBottom: 8,
          zIndex: 100,
          willChange: "transform, opacity",
        }}
      >
        {preview}
      </div>
    </div>
  );
};
