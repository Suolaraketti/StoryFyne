// ─── Cinematic Background Library ───────────────────────────────────
// Premium animated backgrounds optimized for Lambda (CPU rendering).
// Strategy: Use large divs with radial gradients, SVG patterns, and
// CSS transforms. Avoid heavy blur on small elements.

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { getFloat, getRotation, clamp } from "./animations";

// ─── 1. Animated Gradient Mesh ──────────────────────────────────────

export const GradientMesh: React.FC<{
  bgColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}> = ({ bgColor, primaryColor, secondaryColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / Math.max(durationInFrames, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      {/* Blob 1 - large slow drift */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}14 0%, transparent 65%)`,
          left: -150 + Math.sin(t * 2 * Math.PI) * 200,
          top: -200 + Math.cos(t * 1.5 * Math.PI) * 150,
          willChange: "transform",
          transform: `rotate(${t * 15}deg)`,
        }}
      />
      {/* Blob 2 - medium counter-drift */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${secondaryColor}0d 0%, transparent 65%)`,
          right: -100 + Math.cos(t * 1.8 * Math.PI) * 180,
          bottom: -150 + Math.sin(t * 2.2 * Math.PI) * 120,
          willChange: "transform",
          transform: `rotate(${-t * 12}deg)`,
        }}
      />
      {/* Blob 3 - accent, smaller, faster */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}0a 0%, transparent 65%)`,
          left: 30 + Math.sin(t * 3 * Math.PI + 1) * 250,
          bottom: 20 + Math.cos(t * 2.5 * Math.PI + 2) * 200,
          willChange: "transform",
        }}
      />
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${primaryColor}06 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}06 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 2. Dot Grid ────────────────────────────────────────────────────

export const DotGrid: React.FC<{
  bgColor: string;
  dotColor?: string;
  spacing?: number;
  dotSize?: number;
}> = ({ bgColor, dotColor = "rgba(255,255,255,0.06)", spacing = 50, dotSize = 2 }) => {
  const frame = useCurrentFrame();
  const floatY = getFloat(frame, 30, 8, 0.3);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -40,
          backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          willChange: "transform",
          transform: `translateY(${floatY}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 3. Line Wave ───────────────────────────────────────────────────

export const LineWave: React.FC<{
  bgColor: string;
  lineColor?: string;
  lineCount?: number;
}> = ({ bgColor, lineColor = "rgba(255,255,255,0.04)", lineCount = 8 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const lines = useMemo(() => {
    return Array.from({ length: lineCount }).map((_, i) => ({
      y: (height / (lineCount + 1)) * (i + 1),
      amplitude: 30 + i * 8,
      frequency: 0.003 + i * 0.0005,
      speed: 0.02 + i * 0.005,
      phase: i * 1.2,
    }));
  }, [lineCount, height]);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {lines.map((line, i) => {
          const points: string[] = [];
          for (let x = 0; x <= width; x += 10) {
            const y = line.y + Math.sin(x * line.frequency + frame * line.speed + line.phase) * line.amplitude;
            points.push(`${x},${y}`);
          }
          return (
            <polyline
              key={i}
              points={points.join(" ")}
              fill="none"
              stroke={lineColor}
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.5 + (i / lineCount) * 0.5}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ─── 4. Particle Field ──────────────────────────────────────────────

export const ParticleField: React.FC<{
  bgColor: string;
  particleColor?: string;
  count?: number;
}> = ({ bgColor, particleColor = "rgba(255,255,255,0.4)", count = 25 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 2 + Math.random() * 4,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -0.2 - Math.random() * 0.4,
      opacity: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, width, height]);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      {particles.map((p, i) => {
        const x = (p.x + frame * p.speedX + Math.sin(frame * 0.01 + p.phase) * 20) % (width + 40) - 20;
        const y = (p.y + frame * p.speedY) % (height + 40) - 20;
        const pulse = Math.sin(frame * 0.03 + p.phase) * 0.3 + 0.7;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: particleColor,
              opacity: p.opacity * pulse,
              willChange: "transform",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 5. Geometric Pattern ───────────────────────────────────────────

export const GeometricPattern: React.FC<{
  bgColor: string;
  shapeColor?: string;
}> = ({ bgColor, shapeColor = "rgba(255,255,255,0.03)" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const rotation = getRotation(frame, 30, 0.05);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: Math.max(width, height) * 1.5,
          height: Math.max(width, height) * 1.5,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          willChange: "transform",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 200 + i * 180,
              height: 200 + i * 180,
              border: `1px solid ${shapeColor}`,
              transform: `translate(-50%, -50%) rotate(${i * 15}deg)`,
              borderRadius: i % 2 === 0 ? "30%" : "50%",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── 6. Radial Spotlight ────────────────────────────────────────────

export const RadialSpotlight: React.FC<{
  bgColor: string;
  spotlightColor: string;
}> = ({ bgColor, spotlightColor }) => {
  const frame = useCurrentFrame();
  const t = frame / 300;
  const x = 50 + Math.sin(t * Math.PI * 2) * 30;
  const y = 50 + Math.cos(t * Math.PI * 1.5) * 25;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${x}% ${y}%, ${spotlightColor}15 0%, transparent 50%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Background Selector ────────────────────────────────────────────

export const Backgrounds: Record<string, React.FC<any>> = {
  gradientMesh: GradientMesh,
  dotGrid: DotGrid,
  lineWave: LineWave,
  particleField: ParticleField,
  geometric: GeometricPattern,
  radialSpotlight: RadialSpotlight,
};

export const getBackgroundForSceneType = (type: string): string => {
  const map: Record<string, string> = {
    title: "gradientMesh",
    problem: "dotGrid",
    solution: "gradientMesh",
    feature: "lineWave",
    benefit: "particleField",
    process: "geometric",
    stats: "radialSpotlight",
    socialProof: "gradientMesh",
    comparison: "dotGrid",
    cta: "gradientMesh",
  };
  return map[type] || "gradientMesh";
};
