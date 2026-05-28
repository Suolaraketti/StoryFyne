// ─── Overlay System ─────────────────────────────────────────────────
// Persistent UI elements that appear across scenes.
// Logo, progress bar, scene counter, lower thirds, chapter markers.

import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSpringProgress, getFadeIn, getStaggerDelay, DEFAULT_SPRING, GENTLE_SPRING } from "./animations";

// ─── Logo Overlay ───────────────────────────────────────────────────

export const LogoOverlay: React.FC<{
  logoUrl: string;
  primaryColor: string;
  delay?: number;
  position?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "center";
  size?: number;
}> = ({ logoUrl, primaryColor, delay = 0, position = "topLeft", size = 52 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!logoUrl || logoUrl.trim().length === 0) return null;

  const s = getSpringProgress(frame, fps, delay, { damping: 16, stiffness: 110, mass: 1, overshootClamping: false });
  const opacity = interpolate(s, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" });
  const y = interpolate(s, [0, 1], [-20, 0]);

  const positions: Record<string, React.CSSProperties> = {
    topLeft: { top: 32, left: 40 },
    topRight: { top: 32, right: 40 },
    bottomLeft: { bottom: 32, left: 40 },
    bottomRight: { bottom: 32, right: 40 },
    center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  };

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity,
        transform: `translateY(${y}px)`,
        willChange: "transform, opacity",
        ...positions[position],
      }}
    >
      <div
        style={{
          position: "absolute",
          width: size + 16,
          height: size + 16,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}25 0%, transparent 65%)`,
          filter: "blur(16px)",
          left: -8,
          top: -8,
        }}
      />
      <Img
        src={logoUrl}
        style={{
          height: size,
          width: "auto",
          objectFit: "contain",
          position: "relative",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
        }}
      />
    </div>
  );
};

// ─── Progress Bar ───────────────────────────────────────────────────

export const ProgressBar: React.FC<{
  progress: number;
  primaryColor: string;
  secondaryColor: string;
  thickness?: number;
}> = ({ progress, primaryColor, secondaryColor, thickness = 3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = getSpringProgress(frame, fps, 0, GENTLE_SPRING);
  const fillWidth = interpolate(s, [0, 1], [0, progress * 100]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: thickness,
        backgroundColor: "rgba(255,255,255,0.04)",
        zIndex: 50,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${fillWidth}%`,
          background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          borderRadius: "0 2px 2px 0",
          boxShadow: `0 0 10px ${primaryColor}50`,
          willChange: "width",
        }}
      />
      <div
        style={{
          position: "absolute",
          height: "100%",
          width: 2,
          background: "white",
          left: `${fillWidth}%`,
          borderRadius: 2,
          boxShadow: `0 0 6px 1px ${primaryColor}60`,
          opacity: progress > 0.01 ? 0.7 : 0,
          willChange: "left",
        }}
      />
    </div>
  );
};

// ─── Scene Counter ──────────────────────────────────────────────────

export const SceneCounter: React.FC<{
  current: number;
  total: number;
  textColor: string;
  delay?: number;
}> = ({ current, total, textColor, delay = 5 }) => {
  const frame = useCurrentFrame();
  const fade = getFadeIn(frame, 12, delay);

  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        right: 40,
        zIndex: 50,
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: 13,
        fontWeight: 600,
        color: `${textColor}35`,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        opacity: fade,
      }}
    >
      {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </div>
  );
};

// ─── Lower Third Bar ────────────────────────────────────────────────

export const LowerThirdBar: React.FC<{
  text: string;
  primaryColor: string;
  delay?: number;
}> = ({ text, primaryColor, delay = 5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barS = getSpringProgress(frame, fps, delay, { damping: 16, stiffness: 120, mass: 1, overshootClamping: false });
  const textS = getSpringProgress(frame, fps, getStaggerDelay(0, delay, 10), DEFAULT_SPRING);

  const barScaleX = interpolate(barS, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textOpacity = interpolate(textS, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: 40,
        zIndex: 50,
      }}
    >
      <div
        style={{
          height: 3,
          width: 180,
          background: `linear-gradient(90deg, ${primaryColor}, transparent)`,
          borderRadius: 2,
          transformOrigin: "left center",
          transform: `scaleX(${barScaleX})`,
          marginBottom: 8,
          willChange: "transform",
        }}
      />
      <p
        style={{
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: `${primaryColor}bb`,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: 0,
          opacity: textOpacity,
        }}
      >
        {text}
      </p>
    </div>
  );
};

// ─── Chapter Marker ─────────────────────────────────────────────────

export const ChapterMarker: React.FC<{
  title: string;
  subtitle?: string;
  primaryColor: string;
  textColor: string;
  delay?: number;
}> = ({ title, subtitle, primaryColor, textColor, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);

  const opacity = interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" });
  const y = interpolate(s, [0, 1], [30, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 100,
        left: 40,
        zIndex: 50,
        opacity,
        transform: `translateY(${y}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: primaryColor,
            boxShadow: `0 0 8px ${primaryColor}60`,
          }}
        />
        <span
          style={{
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: primaryColor,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
      </div>
      {subtitle && (
        <p
          style={{
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontSize: 13,
            fontWeight: 400,
            color: `${textColor}60`,
            margin: 0,
            marginLeft: 18,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

// ─── Watermark ──────────────────────────────────────────────────────

export const Watermark: React.FC<{
  text: string;
  textColor: string;
}> = ({ text, textColor }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 50,
        right: 40,
        zIndex: 50,
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: 11,
        fontWeight: 500,
        color: `${textColor}15`,
        letterSpacing: "0.05em",
      }}
    >
      {text}
    </div>
  );
};

// ─── Cinematic Film Grain + Vignette ────────────────────────────────

export const CinematicOverlay: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        zIndex: 200,
        pointerEvents: "none",
        mixBlendMode: "overlay",
        opacity: 0.12,
      }}
    >
      {/* Film grain using SVG noise filter */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <filter id="film-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#film-grain)" />
      </svg>

      {/* Vignette: darkens edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
