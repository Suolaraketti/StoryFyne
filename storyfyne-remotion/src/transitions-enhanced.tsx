// ─── Premium Transition Library ─────────────────────────────────────
// 3D transforms, morph effects, glitch transitions, depth pushes.
// These are scene-to-scene transitions that feel cinematic and expensive.
// Each transition is GPU-accelerated via transform3d and clip-path.

import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";

export type PremiumTransitionType =
  | "depthPush"
  | "pageFlip"
  | "morphShape"
  | "glitchCut"
  | "pixelDissolve"
  | "shutterReveal"
  | "zoomBlur"
  | "sliceWipe"
  | "perspectiveRotate"
  | "liquidWipe";

// ─── 1. Depth Push ──────────────────────────────────────────────────
// Old scene pushes BACK into z-space while new scene pushes FORWARD.
// Creates a "through the looking glass" feel.

export const DepthPushTransition: React.FC<{
  progress: number;
  children: React.ReactNode;
  direction?: "in" | "out";
}> = ({ progress, children, direction = "out" }) => {
  const eased = Easing.inOut(Easing.cubic)(progress);
  const z = direction === "out"
    ? interpolate(eased, [0, 1], [0, -800])
    : interpolate(eased, [0, 1], [800, 0]);
  const opacity = direction === "out"
    ? interpolate(eased, [0, 0.7], [1, 0])
    : interpolate(eased, [0.3, 1], [0, 1]);
  const scale = direction === "out"
    ? interpolate(eased, [0, 1], [1, 0.8])
    : interpolate(eased, [0, 1], [1.2, 1]);

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        perspective: 1000,
        opacity,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translateZ(${z}px) scale(${scale})`,
          transformStyle: "preserve-3d",
          willChange: "transform, opacity",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ─── 2. Page Flip ───────────────────────────────────────────────────
// 3D page turn like a book. Old scene rotates away on Y axis.

export const PageFlipTransition: React.FC<{
  progress: number;
  children: React.ReactNode;
  direction?: "in" | "out";
}> = ({ progress, children, direction = "out" }) => {
  const eased = Easing.inOut(Easing.quad)(progress);
  const rotateY = direction === "out"
    ? interpolate(eased, [0, 1], [0, -120])
    : interpolate(eased, [0, 1], [120, 0]);
  const opacity = direction === "out"
    ? interpolate(eased, [0.5, 1], [1, 0])
    : interpolate(eased, [0, 0.5], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        perspective: 1500,
        opacity,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: direction === "out" ? "left center" : "right center",
          transform: `rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ─── 3. Morph Shape ─────────────────────────────────────────────────
// A geometric shape morphs across the screen, revealing the next scene.

export const MorphShapeTransition: React.FC<{
  progress: number;
  primaryColor: string;
  secondaryColor: string;
}> = ({ progress, primaryColor, secondaryColor }) => {
  const eased = Easing.out(Easing.cubic)(progress);

  // Morph through shapes: circle → diamond → full screen
  const clipPaths = [
    `circle(0% at 50% 50%)`,
    `circle(${eased * 50}% at 50% 50%)`,
    `polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)`,
    `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`,
  ];

  const clipIndex = Math.min(Math.floor(eased * clipPaths.length), clipPaths.length - 1);
  const clipProgress = (eased * clipPaths.length) % 1;

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        clipPath: clipPaths[clipIndex],
        opacity: eased,
        willChange: "clip-path, opacity",
      }}
    />
  );
};

// ─── 4. Glitch Cut ──────────────────────────────────────────────────
// Digital corruption blocks that clear to reveal the next scene.

export const GlitchCutTransition: React.FC<{
  progress: number;
  children: React.ReactNode;
}> = ({ progress, children }) => {
  const eased = Easing.inOut(Easing.cubic)(progress);
  const blockCount = 20;

  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none" }}>
      {Array.from({ length: blockCount }).map((_, i) => {
        const blockProgress = (eased * blockCount - i) / 1;
        const active = blockProgress > 0 && blockProgress < 1;
        if (!active) return null;
        const y = (i / blockCount) * 100;
        const h = 100 / blockCount + 0.5;
        const offsetX = (Math.sin(i * 7.3) * 20) * (1 - blockProgress);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${offsetX}px`,
              top: `${y}%`,
              width: "100%",
              height: `${h}%`,
              background: i % 2 === 0 ? "rgba(255,0,0,0.1)" : "rgba(0,255,255,0.1)",
              opacity: 1 - blockProgress,
              transform: `translateX(${Math.sin(i * 3) * 10 * (1 - blockProgress)}px)`,
            }}
          />
        );
      })}
      <div style={{ opacity: eased > 0.7 ? 1 : 0 }}>{children}</div>
    </AbsoluteFill>
  );
};

// ─── 5. Pixel Dissolve ──────────────────────────────────────────────
// Scene dissolves into large pixels that fall away.

export const PixelDissolveTransition: React.FC<{
  progress: number;
  children: React.ReactNode;
}> = ({ progress, children }) => {
  const eased = Easing.in(Easing.quad)(progress);
  const pixelSize = 40;
  const cols = Math.ceil(1920 / pixelSize);
  const rows = Math.ceil(1080 / pixelSize);

  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none" }}>
      <div style={{ opacity: 1 - eased }}>{children}</div>
      {Array.from({ length: cols * rows }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const distFromCenter = Math.sqrt((col - cols / 2) ** 2 + (row - rows / 2) ** 2);
        const maxDist = Math.sqrt((cols / 2) ** 2 + (rows / 2) ** 2);
        const normalizedDist = distFromCenter / maxDist;
        const pixelProgress = (eased * 1.5 - normalizedDist * 0.5);

        if (pixelProgress < 0 || pixelProgress > 1) return null;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: col * pixelSize,
              top: row * pixelSize,
              width: pixelSize,
              height: pixelSize,
              background: `rgba(0,0,0,${pixelProgress * 0.1})`,
              transform: `translateY(${pixelProgress * 100}px) scale(${1 - pixelProgress * 0.3})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 6. Shutter Reveal ──────────────────────────────────────────────
// Camera shutter blades that open/close.

export const ShutterRevealTransition: React.FC<{
  progress: number;
  children: React.ReactNode;
}> = ({ progress, children }) => {
  const eased = Easing.inOut(Easing.cubic)(progress);
  const blades = 6;

  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none" }}>
      <div style={{ opacity: eased > 0.5 ? 1 : 0 }}>{children}</div>
      {Array.from({ length: blades }).map((_, i) => {
        const angle = (i / blades) * 360;
        const bladeProgress = (eased * blades - i) / 1;
        const scale = interpolate(bladeProgress, [0, 1], [1, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 1500,
              height: 1500,
              background: "#111",
              transformOrigin: "left center",
              transform: `rotate(${angle}deg) scaleX(${scale})`,
              opacity: scale > 0 ? 1 : 0,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 7. Zoom Blur ───────────────────────────────────────────────────
// Radial zoom blur that explodes outward during transition.

export const ZoomBlurTransition: React.FC<{
  progress: number;
  children: React.ReactNode;
  primaryColor?: string;
}> = ({ progress, children, primaryColor = "#0ea5e9" }) => {
  const eased = Easing.inOut(Easing.cubic)(progress);
  const scale = interpolate(eased, [0, 0.5, 1], [1, 3, 1]);
  const blur = interpolate(eased, [0, 0.5, 1], [0, 20, 0]);
  const opacity = interpolate(eased, [0, 0.3, 0.7, 1], [1, 0.3, 0.3, 1]);

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        filter: `blur(${blur}px)`,
        transform: `scale(${scale})`,
        opacity,
        willChange: "transform, filter, opacity",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ─── 8. Slice Wipe ──────────────────────────────────────────────────
// Screen sliced into horizontal strips that slide in alternate directions.

export const SliceWipeTransition: React.FC<{
  progress: number;
  children: React.ReactNode;
  sliceCount?: number;
}> = ({ progress, children, sliceCount = 8 }) => {
  const eased = Easing.out(Easing.cubic)(progress);

  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none", overflow: "hidden" }}>
      {Array.from({ length: sliceCount }).map((_, i) => {
        const direction = i % 2 === 0 ? -1 : 1;
        const sliceProgress = (eased * sliceCount - i) / 1;
        const clamped = Math.max(0, Math.min(1, sliceProgress));
        const x = interpolate(clamped, [0, 1], [direction * 100, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${(i / sliceCount) * 100}%`,
              width: "100%",
              height: `${100 / sliceCount + 0.5}%`,
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: `${-i * (100 / sliceCount)}%`, width: "100%", height: `${sliceCount * 100}%` }}>
              {children}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 9. Perspective Rotate ──────────────────────────────────────────
// Scene rotates in 3D space like a card being dealt.

export const PerspectiveRotateTransition: React.FC<{
  progress: number;
  children: React.ReactNode;
  axis?: "X" | "Y";
}> = ({ progress, children, axis = "Y" }) => {
  const eased = Easing.inOut(Easing.back(0.5))(progress);
  const rotate = axis === "Y"
    ? interpolate(eased, [0, 1], [90, 0])
    : interpolate(eased, [0, 1], [45, 0]);
  const opacity = interpolate(eased, [0, 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        perspective: 1200,
        opacity,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `rotate${axis}(${rotate}deg)`,
          transformStyle: "preserve-3d",
          willChange: "transform, opacity",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ─── 10. Liquid Wipe ────────────────────────────────────────────────
// Organic liquid blob that expands to cover the screen.

export const LiquidWipeTransition: React.FC<{
  progress: number;
  primaryColor: string;
  secondaryColor: string;
}> = ({ progress, primaryColor, secondaryColor }) => {
  const eased = Easing.inOut(Easing.cubic)(progress);
  const scale = interpolate(eased, [0, 1], [0, 3]);

  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 400,
          height: 400,
          borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          animation: "none",
          willChange: "transform",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Master Transition Component ────────────────────────────────────
// Routes to the correct transition based on type.

export const PremiumTransition: React.FC<{
  type: PremiumTransitionType;
  progress: number;
  children?: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
}> = ({ type, progress, children, primaryColor = "#0ea5e9", secondaryColor = "#6366f1" }) => {
  switch (type) {
    case "depthPush":
      return <DepthPushTransition progress={progress}>{children}</DepthPushTransition>;
    case "pageFlip":
      return <PageFlipTransition progress={progress}>{children}</PageFlipTransition>;
    case "morphShape":
      return <MorphShapeTransition progress={progress} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "glitchCut":
      return <GlitchCutTransition progress={progress}>{children}</GlitchCutTransition>;
    case "pixelDissolve":
      return <PixelDissolveTransition progress={progress}>{children}</PixelDissolveTransition>;
    case "shutterReveal":
      return <ShutterRevealTransition progress={progress}>{children}</ShutterRevealTransition>;
    case "zoomBlur":
      return <ZoomBlurTransition progress={progress}>{children}</ZoomBlurTransition>;
    case "sliceWipe":
      return <SliceWipeTransition progress={progress}>{children}</SliceWipeTransition>;
    case "perspectiveRotate":
      return <PerspectiveRotateTransition progress={progress}>{children}</PerspectiveRotateTransition>;
    case "liquidWipe":
      return <LiquidWipeTransition progress={progress} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    default:
      return null;
  }
};
