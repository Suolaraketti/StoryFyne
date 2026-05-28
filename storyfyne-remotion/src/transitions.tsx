// ─── Cinematic Transition Library ───────────────────────────────────
// Scene-to-scene transitions. All GPU-accelerated via clip-path
// or transform. No blur filters.

import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";

// ─── Transition Types ───────────────────────────────────────────────

export type TransitionType =
  | "wipe"
  | "slide"
  | "zoom"
  | "circleReveal"
  | "split"
  | "rotate"
  | "fadeScale"
  | "curtain";

export const ALL_TRANSITIONS: TransitionType[] = [
  "wipe",
  "slide",
  "zoom",
  "circleReveal",
  "split",
  "rotate",
  "fadeScale",
  "curtain",
];

/** Get a transition type based on scene index for variety */
export const getTransitionForIndex = (index: number): TransitionType => {
  return ALL_TRANSITIONS[index % ALL_TRANSITIONS.length];
};

// ─── 1. Wipe Transition ─────────────────────────────────────────────

export const WipeTransition: React.FC<{
  progress: number;
  primaryColor: string;
  secondaryColor: string;
  direction?: "left" | "right" | "up" | "down";
}> = ({ progress, primaryColor, secondaryColor, direction = "right" }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = Easing.out(Easing.cubic)(clamped);

  const clipPaths: Record<string, string> = {
    left: `polygon(${100 - eased * 100}% 0, 100% 0, 100% 100%, ${100 - eased * 100}% 100%)`,
    right: `polygon(0 0, ${eased * 100}% 0, ${eased * 100}% 100%, 0 100%)`,
    up: `polygon(0 ${100 - eased * 100}%, 100% ${100 - eased * 100}%, 100% 100%, 0 100%)`,
    down: `polygon(0 0, 100% 0, 100% ${eased * 100}%, 0 ${eased * 100}%)`,
  };

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        clipPath: clipPaths[direction],
      }}
    />
  );
};

// ─── 2. Slide Transition ────────────────────────────────────────────

export const SlideTransition: React.FC<{
  progress: number;
  direction?: "left" | "right";
}> = ({ progress, direction = "right" }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = Easing.inOut(Easing.quad)(clamped);
  const x = direction === "right"
    ? interpolate(eased, [0, 1], [-100, 0])
    : interpolate(eased, [0, 1], [100, 0]);

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        backgroundColor: "#000",
        transform: `translateX(${x}%)`,
        willChange: "transform",
      }}
    />
  );
};

// ─── 3. Zoom Transition ─────────────────────────────────────────────

export const ZoomTransition: React.FC<{
  progress: number;
  primaryColor: string;
}> = ({ progress, primaryColor }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = Easing.out(Easing.cubic)(clamped);
  const scale = interpolate(eased, [0, 1], [0, 1.5]);
  const opacity = interpolate(eased, [0, 0.5, 1], [1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}, transparent)`,
          transform: `scale(${scale})`,
          opacity,
          willChange: "transform, opacity",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 4. Circle Reveal ───────────────────────────────────────────────

export const CircleRevealTransition: React.FC<{
  progress: number;
  primaryColor: string;
}> = ({ progress, primaryColor }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = Easing.out(Easing.cubic)(clamped);
  const radius = eased * 150;

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        backgroundColor: primaryColor,
        clipPath: `circle(${radius}% at 50% 50%)`,
      }}
    />
  );
};

// ─── 5. Split Transition ────────────────────────────────────────────

export const SplitTransition: React.FC<{
  progress: number;
  primaryColor: string;
  direction?: "horizontal" | "vertical";
}> = ({ progress, primaryColor, direction = "horizontal" }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = Easing.out(Easing.cubic)(clamped);

  if (direction === "horizontal") {
    const offset = eased * 50;
    return (
      <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "50%",
            height: "100%",
            backgroundColor: primaryColor,
            transform: `translateX(${-offset}%)`,
            willChange: "transform",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "50%",
            height: "100%",
            backgroundColor: primaryColor,
            transform: `translateX(${offset}%)`,
            willChange: "transform",
          }}
        />
      </AbsoluteFill>
    );
  }

  const offset = eased * 50;
  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "50%",
          backgroundColor: primaryColor,
          transform: `translateY(${-offset}%)`,
          willChange: "transform",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: "50%",
          backgroundColor: primaryColor,
          transform: `translateY(${offset}%)`,
          willChange: "transform",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 6. Rotate Transition ───────────────────────────────────────────

export const RotateTransition: React.FC<{
  progress: number;
  primaryColor: string;
}> = ({ progress, primaryColor }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = Easing.out(Easing.cubic)(clamped);
  const rotateY = interpolate(eased, [0, 1], [90, 0]);

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        perspective: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: primaryColor,
          transform: `rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 7. Fade Scale Transition ───────────────────────────────────────

export const FadeScaleTransition: React.FC<{
  progress: number;
  primaryColor: string;
}> = ({ progress, primaryColor }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const scale = interpolate(clamped, [0, 0.5, 1], [1.1, 1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(clamped, [0, 0.3, 0.7, 1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        zIndex: 100,
        pointerEvents: "none",
        backgroundColor: primaryColor,
        opacity,
        transform: `scale(${scale})`,
        willChange: "transform, opacity",
      }}
    />
  );
};

// ─── 8. Curtain Transition ──────────────────────────────────────────

export const CurtainTransition: React.FC<{
  progress: number;
  primaryColor: string;
  secondaryColor: string;
}> = ({ progress, primaryColor, secondaryColor }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = Easing.inOut(Easing.cubic)(clamped);

  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: `${eased * 100}%`,
          background: `linear-gradient(180deg, ${primaryColor}, ${secondaryColor})`,
          willChange: "transform",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Transition Router ──────────────────────────────────────────────

export const TransitionOverlay: React.FC<{
  type: TransitionType;
  progress: number;
  primaryColor: string;
  secondaryColor: string;
}> = ({ type, progress, primaryColor, secondaryColor }) => {
  switch (type) {
    case "wipe":
      return <WipeTransition progress={progress} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "slide":
      return <SlideTransition progress={progress} />;
    case "zoom":
      return <ZoomTransition progress={progress} primaryColor={primaryColor} />;
    case "circleReveal":
      return <CircleRevealTransition progress={progress} primaryColor={primaryColor} />;
    case "split":
      return <SplitTransition progress={progress} primaryColor={primaryColor} />;
    case "rotate":
      return <RotateTransition progress={progress} primaryColor={primaryColor} />;
    case "fadeScale":
      return <FadeScaleTransition progress={progress} primaryColor={primaryColor} />;
    case "curtain":
      return <CurtainTransition progress={progress} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    default:
      return <WipeTransition progress={progress} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
  }
};
