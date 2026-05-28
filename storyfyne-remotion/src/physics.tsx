// ─── Physics & Particle Systems ─────────────────────────────────────
// Gravity, wind, collision, audio-reactive elements, liquid effects,
// constellation networks, magnetic fields. Procedural motion that feels
// alive and impossible to replicate with static animation.

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random, spring } from "remotion";

// ─── 1. Gravity Particles ───────────────────────────────────────────
// Particles fall with gravity, bounce off floor, and settle.
// Perfect for "impact" moments like bookings confirmed or revenue dropping.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  mass: number;
}

export const GravityParticles: React.FC<{
  count?: number;
  frame: number;
  fps: number;
  colors?: string[];
  gravity?: number;
  bounce?: number;
  delay?: number;
  spawnRate?: number;
}> = ({ count = 50, frame, fps, colors = ["#0ea5e9", "#6366f1", "#8b5cf6"], gravity = 0.5, bounce = 0.6, delay = 0, spawnRate = 2 }) => {
  const { width, height } = useVideoConfig();
  const floor = height - 20;

  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: random(`gp-x-${i}`) * width,
      y: -20 - random(`gp-y-${i}`) * 100,
      vx: (random(`gp-vx-${i}`) - 0.5) * 4,
      vy: 0,
      size: 4 + random(`gp-s-${i}`) * 8,
      color: colors[Math.floor(random(`gp-c-${i}`) * colors.length)],
      mass: 0.5 + random(`gp-m-${i}`) * 1,
      spawnFrame: Math.floor(i / spawnRate),
    }));
  }, [count, width, colors, spawnRate]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      {particles.map((p, i) => {
        const f = Math.max(0, frame - delay - p.spawnFrame);
        let x = p.x + p.vx * f;
        let y = p.y;
        let vy = p.vy + gravity * f * p.mass;

        // Simple bounce physics
        const newY = p.y + vy * f;
        if (newY > floor) {
          const over = newY - floor;
          const bounces = Math.floor(over / (floor - p.y));
          const remaining = over % (floor - p.y);
          y = floor - remaining * Math.pow(bounce, bounces);
        } else {
          y = newY;
        }

        const opacity = interpolate(f, [0, 10, 200], [0, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
              background: p.color,
              opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}40`,
            }}
          />
        );
      })}
    </div>
  );
};

// ─── 2. Constellation Network ───────────────────────────────────────
// Dots connected by lines that pulse. Nodes drift slowly.
// Great for "network", "AI", "connections" metaphors.

export const ConstellationNetwork: React.FC<{
  nodeCount?: number;
  frame: number;
  fps: number;
  colors?: string[];
  connectionDistance?: number;
}> = ({ nodeCount = 30, frame, fps, colors = ["#0ea5e9", "#6366f1"], connectionDistance = 150 }) => {
  const { width, height } = useVideoConfig();

  const nodes = React.useMemo(() => {
    return Array.from({ length: nodeCount }, (_, i) => ({
      baseX: random(`cn-x-${i}`) * width,
      baseY: random(`cn-y-${i}`) * height,
      speedX: (random(`cn-sx-${i}`) - 0.5) * 0.3,
      speedY: (random(`cn-sy-${i}`) - 0.5) * 0.3,
      size: 2 + random(`cn-s-${i}`) * 3,
      color: colors[Math.floor(random(`cn-c-${i}`) * colors.length)],
      pulseSpeed: 0.02 + random(`cn-p-${i}`) * 0.03,
    }));
  }, [nodeCount, width, height, colors]);

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
      {nodes.map((n, i) => {
        const x = n.baseX + Math.sin(frame * n.speedX * 0.05) * 30;
        const y = n.baseY + Math.cos(frame * n.speedY * 0.05) * 30;
        const pulse = Math.sin(frame * n.pulseSpeed) * 0.3 + 0.7;

        return (
          <React.Fragment key={i}>
            {nodes.slice(i + 1).map((n2, j) => {
              const x2 = n2.baseX + Math.sin(frame * n2.speedX * 0.05) * 30;
              const y2 = n2.baseY + Math.cos(frame * n2.speedY * 0.05) * 30;
              const dist = Math.sqrt((x - x2) ** 2 + (y - y2) ** 2);
              if (dist > connectionDistance) return null;
              const opacity = (1 - dist / connectionDistance) * 0.2;
              return (
                <line
                  key={`line-${i}-${j}`}
                  x1={x} y1={y} x2={x2} y2={y2}
                  stroke={n.color}
                  strokeWidth={1}
                  opacity={opacity}
                />
              );
            })}
            <circle cx={x} cy={y} r={n.size * pulse} fill={n.color} opacity={0.6} />
          </React.Fragment>
        );
      })}
    </svg>
  );
};

// ─── 3. Audio-Reactive Bars ─────────────────────────────────────────
// Vertical bars that react to simulated audio amplitude.
// Can be synced to scene energy level.

export const AudioReactiveBars: React.FC<{
  barCount?: number;
  frame: number;
  fps: number;
  color?: string;
  energy?: number;
  mirrored?: boolean;
}> = ({ barCount = 40, frame, fps, color = "#0ea5e9", energy = 1, mirrored = true }) => {
  const { width, height } = useVideoConfig();
  const barWidth = width / barCount;

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", pointerEvents: "none", zIndex: 20 }}>
      {Array.from({ length: barCount }).map((_, i) => {
        const noise = Math.sin(frame * 0.15 + i * 0.5) * 0.5 + 0.5;
        const noise2 = Math.sin(frame * 0.08 + i * 0.3 + 2) * 0.5 + 0.5;
        const h = (noise * noise2) * height * 0.4 * energy;
        return (
          <div
            key={i}
            style={{
              width: barWidth - 2,
              height: h,
              background: `linear-gradient(180deg, ${color}88 0%, ${color}20 100%)`,
              borderRadius: "2px 2px 0 0",
              opacity: 0.6,
            }}
          />
        );
      })}
    </div>
  );
};

// ─── 4. Floating Orbs ───────────────────────────────────────────────
// Large soft orbs that drift and collide softly. Dreamy, ethereal feel.

export const FloatingOrbs: React.FC<{
  count?: number;
  frame: number;
  fps: number;
  colors?: string[];
  sizeRange?: [number, number];
}> = ({ count = 8, frame, fps, colors = ["#0ea5e920", "#6366f120", "#8b5cf620"], sizeRange = [100, 400] }) => {
  const { width, height } = useVideoConfig();

  const orbs = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: random(`orb-x-${i}`) * width,
      y: random(`orb-y-${i}`) * height,
      size: sizeRange[0] + random(`orb-s-${i}`) * (sizeRange[1] - sizeRange[0]),
      color: colors[Math.floor(random(`orb-c-${i}`) * colors.length)],
      speedX: (random(`orb-sx-${i}`) - 0.5) * 0.4,
      speedY: (random(`orb-sy-${i}`) - 0.5) * 0.3,
      phase: random(`orb-p-${i}`) * Math.PI * 2,
    }));
  }, [count, width, height, colors, sizeRange]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
      {orbs.map((orb, i) => {
        const x = orb.x + Math.sin(frame * 0.01 + orb.phase) * 50 + orb.speedX * frame;
        const y = orb.y + Math.cos(frame * 0.008 + orb.phase) * 40 + orb.speedY * frame;
        const pulse = Math.sin(frame * 0.02 + orb.phase) * 0.1 + 0.9;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ((x % width) + width) % width - orb.size / 2,
              top: ((y % height) + height) % height - orb.size / 2,
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: orb.color,
              filter: "blur(40px)",
              transform: `scale(${pulse})`,
            }}
          />
        );
      })}
    </div>
  );
};

// ─── 5. Magnetic Field Lines ────────────────────────────────────────
// Curved lines that flow around an invisible center point.
// Organic, fluid motion. Great for energy/power metaphors.

export const MagneticField: React.FC<{
  lineCount?: number;
  frame: number;
  color?: string;
}> = ({ lineCount = 20, frame, color = "#0ea5e9" }) => {
  const { width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8 }}>
      {Array.from({ length: lineCount }).map((_, i) => {
        const angle = (i / lineCount) * Math.PI * 2;
        const r1 = 100 + Math.sin(frame * 0.02 + i) * 30;
        const r2 = 300 + Math.cos(frame * 0.015 + i) * 50;
        const x1 = cx + Math.cos(angle) * r1;
        const y1 = cy + Math.sin(angle) * r1;
        const x2 = cx + Math.cos(angle + 0.3) * r2;
        const y2 = cy + Math.sin(angle + 0.3) * r2;
        const cx1 = cx + Math.cos(angle + 0.1) * (r1 + r2) / 2;
        const cy1 = cy + Math.sin(angle + 0.1) * (r1 + r2) / 2;

        return (
          <path
            key={i}
            d={`M${x1},${y1} Q${cx1},${cy1} ${x2},${y2}`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={0.15 + Math.sin(frame * 0.03 + i) * 0.1}
          />
        );
      })}
    </svg>
  );
};

// ─── 6. Ripple Effect ───────────────────────────────────────────────
// Concentric circles expanding from a point like water drops.
// Use for impact moments: "Booked!", "Connected!", "Done!"

export const RippleEffect: React.FC<{
  x?: number;
  y?: number;
  frame: number;
  color?: string;
  maxRadius?: number;
  ringCount?: number;
  delay?: number;
}> = ({ x, y, frame, color = "#0ea5e9", maxRadius = 300, ringCount = 4, delay = 0 }) => {
  const { width, height } = useVideoConfig();
  const cx = x ?? width / 2;
  const cy = y ?? height / 2;
  const f = Math.max(0, frame - delay);

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 60 }}>
      {Array.from({ length: ringCount }).map((_, i) => {
        const ringDelay = i * 15;
        const ringFrame = Math.max(0, f - ringDelay);
        const progress = Math.min(1, ringFrame / 40);
        const r = progress * maxRadius;
        const opacity = (1 - progress) * 0.4;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};

// ─── 7. DNA Helix ───────────────────────────────────────────────────
// Double helix strands rotating. Great for bio/health/medical metaphors
// or representing "building blocks" of a product.

export const DNAHelix: React.FC<{
  frame: number;
  color1?: string;
  color2?: string;
  nodeCount?: number;
}> = ({ frame, color1 = "#0ea5e9", color2 = "#6366f1", nodeCount = 20 }) => {
  const { width, height } = useVideoConfig();
  const cx = width / 2;
  const startY = height * 0.15;
  const spacing = (height * 0.7) / nodeCount;

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 15 }}>
      {Array.from({ length: nodeCount }).map((_, i) => {
        const y = startY + i * spacing;
        const angle = (frame * 0.05) + (i * 0.3);
        const x1 = cx + Math.sin(angle) * 60;
        const x2 = cx + Math.sin(angle + Math.PI) * 60;
        const opacity = 0.6 + Math.sin(angle) * 0.3;

        return (
          <React.Fragment key={i}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={`${color1}40`} strokeWidth={1.5} />
            <circle cx={x1} cy={y} r={5} fill={color1} opacity={opacity} />
            <circle cx={x2} cy={y} r={5} fill={color2} opacity={opacity} />
          </React.Fragment>
        );
      })}
    </svg>
  );
};
