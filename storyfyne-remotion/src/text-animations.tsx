// ─── Kinetic Typography Library ─────────────────────────────────────
// Premium text animation components for explainer videos.
// All GPU-accelerated: only transform + opacity. No blur filters.

import React, { useMemo } from "react";
import { spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSpringProgress, getTypewriterProgress, getScrambleReveal, getHighlightProgress, getStaggerDelay, DEFAULT_SPRING, BOUNCY_SPRING, SNAPPY_SPRING, GENTLE_SPRING } from "./animations";

// ─── Word-by-Word Reveal ────────────────────────────────────────────

export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
  fps?: number;
  config?: Parameters<typeof getSpringProgress>[3];
}> = ({ text, delay = 0, stagger = 3, style, fps: propFps, config = DEFAULT_SPRING }) => {
  const frame = useCurrentFrame();
  const { fps: videoFps } = useVideoConfig();
  const fps = propFps || videoFps;
  const words = useMemo(() => text.split(" "), [text]);

  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "0.25em", ...style }}>
      {words.map((word, i) => {
        const s = getSpringProgress(frame, fps, getStaggerDelay(i, delay, stagger), config);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: interpolate(s, [0, 0.5, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
              transform: `translateY(${interpolate(s, [0, 1], [18, 0])}px)`,
              willChange: "transform, opacity",
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};

// ─── Character-by-Character Reveal ──────────────────────────────────

export const CharReveal: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
  fps?: number;
}> = ({ text, delay = 0, stagger = 2, style, fps: propFps }) => {
  const frame = useCurrentFrame();
  const { fps: videoFps } = useVideoConfig();
  const fps = propFps || videoFps;
  const chars = useMemo(() => text.split(""), [text]);

  return (
    <span style={{ display: "inline", ...style }}>
      {chars.map((char, i) => {
        if (char === " ") return <span key={i}>&nbsp;</span>;
        const s = getSpringProgress(frame, fps, delay + i * stagger, SNAPPY_SPRING);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: interpolate(s, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
              transform: `translateY(${interpolate(s, [0, 1], [14, 0])}px) scale(${interpolate(s, [0, 1], [0.85, 1])})`,
              willChange: "transform, opacity",
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

// ─── Typewriter Effect ──────────────────────────────────────────────

export const Typewriter: React.FC<{
  text: string;
  delay?: number;
  charsPerFrame?: number;
  cursorBlink?: boolean;
  cursorColor?: string;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, charsPerFrame = 0.5, cursorBlink = true, cursorColor = "currentColor", style }) => {
  const frame = useCurrentFrame();
  const visible = getTypewriterProgress(frame, delay, charsPerFrame);
  const showCursor = cursorBlink && Math.floor(frame / 8) % 2 === 0;

  return (
    <span style={{ display: "inline", ...style }}>
      {text.slice(0, visible)}
      {showCursor && (
        <span style={{ color: cursorColor, opacity: 0.7 }}>|</span>
      )}
    </span>
  );
};

// ─── Text with Highlight Bar ────────────────────────────────────────

export const TextHighlight: React.FC<{
  text: string;
  delay?: number;
  highlightColor?: string;
  textStyle?: React.CSSProperties;
  fps?: number;
}> = ({ text, delay = 0, highlightColor = "#4f46e520", textStyle, fps: propFps }) => {
  const frame = useCurrentFrame();
  const { fps: videoFps } = useVideoConfig();
  const fps = propFps || videoFps;
  const progress = getHighlightProgress(frame, fps, delay, 25);

  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span
        style={{
          position: "absolute",
          left: 0,
          top: "10%",
          height: "80%",
          width: `${progress}%`,
          backgroundColor: highlightColor,
          borderRadius: 4,
          zIndex: -1,
          transition: "none",
        }}
      />
      <span style={{ ...textStyle }}>{text}</span>
    </span>
  );
};

// ─── Scramble Text Reveal ───────────────────────────────────────────

export const ScrambleReveal: React.FC<{
  text: string;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  fps?: number;
}> = ({ text, delay = 0, duration = 40, style, fps: propFps }) => {
  const frame = useCurrentFrame();
  const { fps: videoFps } = useVideoConfig();
  const fps = propFps || videoFps;
  const scrambled = getScrambleReveal(frame, fps, text, delay, duration);

  return <span style={{ display: "inline", fontVariantNumeric: "tabular-nums", ...style }}>{scrambled}</span>;
};

// ─── Staggered Line Reveal ──────────────────────────────────────────

export const StaggeredLines: React.FC<{
  lines: string[];
  delay?: number;
  stagger?: number;
  lineStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}> = ({ lines, delay = 0, stagger = 8, lineStyle, containerStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3em", ...containerStyle }}>
      {lines.map((line, i) => {
        const s = getSpringProgress(frame, fps, getStaggerDelay(i, delay, stagger), DEFAULT_SPRING);
        return (
          <div
            key={i}
            style={{
              opacity: interpolate(s, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
              transform: `translateX(${interpolate(s, [0, 1], [-40, 0])}px)`,
              willChange: "transform, opacity",
              ...lineStyle,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

// ─── Big Number Counter ─────────────────────────────────────────────

export const AnimatedNumber: React.FC<{
  value: number;
  suffix?: string;
  prefix?: string;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}> = ({ value, suffix = "", prefix = "", delay = 0, duration = 45, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, Math.min(1, (frame - delay) / duration));
  const eased = 1 - Math.pow(1 - t, 3); // Ease out cubic
  const displayValue = Math.round(eased * value);

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

// ─── Bouncy Scale Text ──────────────────────────────────────────────

export const BouncyText: React.FC<{
  text: string;
  delay?: number;
  style?: React.CSSProperties;
  fps?: number;
}> = ({ text, delay = 0, style, fps: propFps }) => {
  const frame = useCurrentFrame();
  const { fps: videoFps } = useVideoConfig();
  const fps = propFps || videoFps;
  const s = getSpringProgress(frame, fps, delay, BOUNCY_SPRING);

  return (
    <span
      style={{
        display: "inline-block",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `scale(${interpolate(s, [0, 0.6, 1], [0.5, 1.08, 1])})`,
        willChange: "transform, opacity",
        ...style,
      }}
    >
      {text}
    </span>
  );
};

// ─── Text Mask Reveal (clip-path) ───────────────────────────────────

export const MaskReveal: React.FC<{
  text: string;
  delay?: number;
  duration?: number;
  direction?: "left" | "right" | "up" | "down";
  style?: React.CSSProperties;
}> = ({ text, delay = 0, duration = 20, direction = "left", style }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const clipPaths: Record<string, string> = {
    left: `inset(0 ${100 - progress * 100}% 0 0)`,
    right: `inset(0 0 0 ${100 - progress * 100}%)`,
    up: `inset(${100 - progress * 100}% 0 0 0)`,
    down: `inset(0 0 ${100 - progress * 100}% 0)`,
  };

  return (
    <span
      style={{
        display: "inline-block",
        clipPath: clipPaths[direction],
        willChange: "clip-path",
        ...style,
      }}
    >
      {text}
    </span>
  );
};

// ─── Shimmer Text Effect ────────────────────────────────────────────

export const ShimmerText: React.FC<{
  text: string;
  delay?: number;
  duration?: number;
  shimmerColor?: string;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, duration = 60, shimmerColor = "rgba(255,255,255,0.3)", style }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + duration], [-1, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        display: "inline-block",
        backgroundImage: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
        backgroundSize: "200% 100%",
        backgroundPosition: `${progress * 100}% 0`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        ...style,
      }}
    >
      {text}
    </span>
  );
};
