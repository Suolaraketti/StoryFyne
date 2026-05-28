// ─── Advanced Typography System ─────────────────────────────────────
// Kinetic type, 3D text, path animations, variable font interpolation,
// text scramble/decode, gradient text, per-character physics.
// Typography as art — not just readable, but emotionally expressive.

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getSpringProgress, SNAPPY_SPRING, DEFAULT_SPRING } from "./animations";

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ─── 1. Kinetic Typography ──────────────────────────────────────────
// Each letter animates independently with staggered spring physics.
// Letters can: slide, scale, rotate, or fade in with unique timing.

export const KineticText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  stagger?: number;
  mode?: "slideUp" | "slideDown" | "scale" | "rotate" | "blur";
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  letterSpacing?: string;
}> = ({ text, frame, fps, delay = 0, stagger = 3, mode = "slideUp", fontSize = 80, fontWeight = 800, color = "#111", letterSpacing = "-0.03em" }) => {
  const chars = text.split("");
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center" }}>
      {chars.map((char, i) => {
        const s = getSpringProgress(frame, fps, delay + i * stagger, SNAPPY_SPRING);
        let transform = "";
        let opacity = interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" });
        let filter = "none";

        switch (mode) {
          case "slideUp":
            transform = `translateY(${interpolate(s, [0, 1], [40, 0])}px)`;
            break;
          case "slideDown":
            transform = `translateY(${interpolate(s, [0, 1], [-40, 0])}px)`;
            break;
          case "scale":
            transform = `scale(${interpolate(s, [0, 1], [0.5, 1])})`;
            break;
          case "rotate":
            transform = `rotate(${interpolate(s, [0, 1], [15, 0])}deg) translateY(${interpolate(s, [0, 1], [20, 0])}px)`;
            break;
          case "blur":
            filter = `blur(${interpolate(s, [0, 1], [8, 0])}px)`;
            break;
        }

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: FONT,
              fontSize,
              fontWeight,
              color,
              letterSpacing,
              lineHeight: 1.1,
              opacity,
              transform,
              filter,
              willChange: "transform, opacity, filter",
              whiteSpace: char === " " ? "pre" : undefined,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </div>
  );
};

// ─── 2. Text Scramble Decode ────────────────────────────────────────
// Text appears through a matrix-style scramble before resolving.
// Perfect for tech/cyber scenes.

export const ScrambleDecode: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  duration?: number;
  fontSize?: number;
  color?: string;
}> = ({ text, frame, fps, delay = 0, duration = 40, fontSize = 60, color = "#111" }) => {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(1, adjusted / duration);
  const revealed = Math.floor(progress * text.length);
  const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

  return (
    <div style={{ fontFamily: FONT, fontSize, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
      {text.split("").map((char, i) => {
        if (char === " ") return <span key={i}>&nbsp;</span>;
        if (i < revealed) return <span key={i}>{char}</span>;
        const scrambleIndex = (frame * 3 + i * 7) % scrambleChars.length;
        return (
          <span key={i} style={{ opacity: 0.5 }}>
            {scrambleChars[Math.floor(scrambleIndex)]}
          </span>
        );
      })}
    </div>
  );
};

// ─── 3. 3D Perspective Text ─────────────────────────────────────────
// Text with CSS 3D perspective rotation. Feels like it's emerging from depth.

export const PerspectiveText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  fontSize?: number;
  color?: string;
  rotateX?: number;
}> = ({ text, frame, fps, delay = 0, fontSize = 100, color = "#111", rotateX = 45 }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const currentRotateX = interpolate(s, [0, 1], [rotateX, 0]);
  const currentZ = interpolate(s, [0, 1], [-200, 0]);
  const opacity = interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" });

  return (
    <div
      style={{
        perspective: 800,
        perspectiveOrigin: "center center",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize,
          fontWeight: 800,
          color,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          textAlign: "center",
          transform: `rotateX(${currentRotateX}deg) translateZ(${currentZ}px)`,
          opacity,
          willChange: "transform, opacity",
          transformStyle: "preserve-3d",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ─── 4. Gradient Text Shift ─────────────────────────────────────────
// Text with animated gradient color that shifts over time.

export const GradientText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  fontSize?: number;
  gradient?: string;
}> = ({ text, frame, fps, delay = 0, fontSize = 80, gradient }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  const hue = (frame * 0.5) % 360;
  const defaultGradient = `linear-gradient(${135 + frame * 0.3}deg, hsl(${hue},80%,50%) 0%, hsl(${(hue + 60) % 360},80%,50%) 50%, hsl(${(hue + 120) % 360},80%,50%) 100%)`;

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize,
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        background: gradient || defaultGradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
        willChange: "transform, opacity",
      }}
    >
      {text}
    </div>
  );
};

// ─── 5. Text Mask Reveal ────────────────────────────────────────────
// Text revealed by a geometric shape (circle, line, wipe) expanding over it.

export const MaskRevealText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  fontSize?: number;
  color?: string;
  maskShape?: "circle" | "line" | "wipe";
}> = ({ text, frame, fps, delay = 0, fontSize = 80, color = "#111", maskShape = "circle" }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const progress = interpolate(s, [0, 1], [0, 100]);

  let clipPath = "";
  switch (maskShape) {
    case "circle":
      clipPath = `circle(${progress}% at 50% 50%)`;
      break;
    case "line":
      clipPath = `inset(0 ${100 - progress}% 0 0)`;
      break;
    case "wipe":
      clipPath = `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)`;
      break;
  }

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize,
        fontWeight: 800,
        color,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        clipPath,
        willChange: "clip-path",
      }}
    >
      {text}
    </div>
  );
};

// ─── 6. Wave Text ───────────────────────────────────────────────────
// Text that flows in a sine wave pattern. Organic, fluid motion.

export const WaveText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  amplitude?: number;
  frequency?: number;
  fontSize?: number;
  color?: string;
}> = ({ text, frame, fps, delay = 0, amplitude = 15, frequency = 0.3, fontSize = 60, color = "#111" }) => {
  const chars = text.split("");
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center" }}>
      {chars.map((char, i) => {
        const s = getSpringProgress(frame, fps, delay + i * 2, DEFAULT_SPRING);
        const y = Math.sin((frame + i * 10) * frequency * 0.1) * amplitude * s;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: FONT,
              fontSize,
              fontWeight: 700,
              color,
              letterSpacing: "-0.02em",
              transform: `translateY(${y}px)`,
              opacity: s,
              willChange: "transform, opacity",
              whiteSpace: char === " " ? "pre" : undefined,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </div>
  );
};

// ─── 7. Text Strike Reveal ──────────────────────────────────────────
// A line strikes through the text, then the text appears.
// Dramatic, editorial feel.

export const StrikeReveal: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  fontSize?: number;
  color?: string;
  lineColor?: string;
}> = ({ text, frame, fps, delay = 0, fontSize = 80, color = "#111", lineColor = "#111" }) => {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  const lineWidth = interpolate(s, [0, 0.5, 1], [0, 100, 100]);
  const textOpacity = interpolate(s, [0.3, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize,
          fontWeight: 800,
          color,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          opacity: textOpacity,
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          height: 4,
          width: `${lineWidth}%`,
          background: lineColor,
          borderRadius: 2,
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
};

// ─── 8. Counter Text ────────────────────────────────────────────────
// Numbers that count up with spring physics. Can be prefixed/suffixed.

export const CounterText: React.FC<{
  target: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  frame: number;
  fps: number;
  delay?: number;
  duration?: number;
  fontSize?: number;
  color?: string;
  primaryColor?: string;
}> = ({ target, prefix = "", suffix = "", label, frame, fps, delay = 0, duration = 60, fontSize = 120, color = "#111", primaryColor = "#0ea5e9" }) => {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(1, adjusted / duration);
  const eased = spring({ frame: adjusted, fps, config: { damping: 12, stiffness: 80, mass: 1 } });
  const current = Math.round(eased * target);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: FONT, fontSize, fontWeight: 800, color, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {prefix}{current.toLocaleString()}{suffix}
      </div>
      {label && (
        <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 500, color: primaryColor, marginTop: 12, letterSpacing: "0.02em", textTransform: "uppercase" }}>
          {label}
        </div>
      )}
    </div>
  );
};

// ─── 9. Typewriter Cursor ───────────────────────────────────────────
// Classic typewriter with blinking cursor and realistic pacing.

export const TypewriterCursor: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  speed?: number;
  fontSize?: number;
  color?: string;
  cursorColor?: string;
}> = ({ text, frame, fps, delay = 0, speed = 0.25, fontSize = 48, color = "#111", cursorColor = "#0ea5e9" }) => {
  const adjusted = Math.max(0, frame - delay);
  const charsToShow = Math.floor(adjusted * speed);
  const visibleText = text.slice(0, charsToShow);
  const cursorOn = Math.floor(frame / 12) % 2 === 0;

  return (
    <div style={{ fontFamily: FONT, fontSize, fontWeight: 600, color, lineHeight: 1.4 }}>
      {visibleText}
      <span
        style={{
          display: "inline-block",
          width: 3,
          height: fontSize * 0.9,
          background: cursorColor,
          marginLeft: 4,
          verticalAlign: "text-bottom",
          opacity: cursorOn ? 1 : 0,
        }}
      />
    </div>
  );
};

// ─── 10. Breathing Text ─────────────────────────────────────────────
// Text that subtly scales and fades in a breathing rhythm.
// Hypnotic, meditative feel.

export const BreathingText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  fontSize?: number;
  color?: string;
  speed?: number;
}> = ({ text, frame, fps, fontSize = 80, color = "#111", speed = 0.5 }) => {
  const breath = Math.sin((frame / fps) * Math.PI * speed) * 0.02 + 1;
  const opacity = Math.sin((frame / fps) * Math.PI * speed) * 0.05 + 0.95;

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize,
        fontWeight: 800,
        color,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        textAlign: "center",
        transform: `scale(${breath})`,
        opacity,
        willChange: "transform, opacity",
      }}
    >
      {text}
    </div>
  );
};
