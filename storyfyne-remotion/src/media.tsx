// ─── Media Layer ────────────────────────────────────────────────────
// Real-asset rendering: screenshots, product images, and logos.
// Everything here is canvas-responsive and never distorts or overflows.
// Uses Remotion's <Img> so Lambda/GPU renders wait for images to load.

import React from "react";
import { Img, interpolate, useVideoConfig } from "remotion";
import { getSpringProgress, getFloat, getCinematicEntrance, DEFAULT_SPRING, SNAPPY_SPRING, clamp, lerp } from "./animations";
import { FONT } from "./theme";

export type DeviceVariant = "browser" | "phone" | "tablet" | "window" | "bare";
export type ImageFit = "cover" | "contain";

// ─── Stage Metrics ──────────────────────────────────────────────────
// One scaling unit derived from the canvas so devices/logos hold the
// same visual proportion in 16:9 (1920×1080) and 9:16 (1080×1920).

export function useStage() {
  const { width, height } = useVideoConfig();
  const isVertical = height > width;
  // unit: 1.0 at a 1080-tall stage. Drives device + chrome sizing.
  const unit = Math.min(width, height) / 1080;
  return { width, height, isVertical, unit };
}

// ─── Reveal Motion ──────────────────────────────────────────────────
// Shared cinematic arrival for any media element. Scale + lift + blur clear.

// Pure motion helper (no React hooks) — safe to call in loops.
function revealMotion(frame: number, fps: number, delay: number) {
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  return {
    opacity: interpolate(s, [0, 0.35, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
    y: interpolate(s, [0, 1], [54, 0]),
    scale: interpolate(s, [0, 1], [0.9, 1]),
    blur: interpolate(s, [0, 0.55], [10, 0], { extrapolateLeft: "clamp" }),
    progress: s,
  };
}

// ─── Screenshot Frame ───────────────────────────────────────────────
// Drops a real image into a device/browser chrome with correct scaling.
// `widthFraction` controls how much of the stage the device occupies.
// Phones are height-driven; everything else is width-driven, and both
// are capped so the chrome never exceeds the safe stage area.

export const ScreenshotFrame: React.FC<{
  imageUrl: string;
  variant?: DeviceVariant;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  url?: string;
  fit?: ImageFit;
  /** Fraction of stage width (browser/tablet/window/bare) the frame should fill. */
  widthFraction?: number;
  /** Fraction of stage height a phone should fill. */
  heightFraction?: number;
  /** Hard cap on total frame height as a fraction of the stage (stacked layouts). */
  maxHeightFraction?: number;
  /** Aspect ratio (w/h) of the screen content. Defaults per variant. */
  contentAspect?: number;
  /** 3D tilt in degrees for the "mockup intro" look. 0 = flat. */
  tilt?: number;
  float?: boolean;
  /** Letterbox color shown behind `contain` images. */
  screenBg?: string;
}> = ({
  imageUrl, variant = "browser", frame, fps, delay = 0,
  primaryColor = "#10a37f", url = "app.example.com", fit = "cover",
  widthFraction, heightFraction, maxHeightFraction, contentAspect, tilt = 0, float = true, screenBg = "#0b0d12",
}) => {
  const { width: stageW, height: stageH, isVertical, unit } = useStage();
  const reveal = revealMotion(frame, fps, delay);
  const floatY = float ? getFloat(frame, fps, 5 * unit, 0.3) : 0;
  if (!imageUrl) return null;

  // ── Phone: height-driven ──────────────────────────────────────────
  if (variant === "phone") {
    const hFrac = heightFraction ?? (isVertical ? 0.62 : 0.78);
    const targetH = clamp(stageH * hFrac, 360, stageH * 0.86);
    const frameH = targetH;
    const frameW = frameH * (9 / 19.5);
    const bezel = frameH * 0.018;
    const radius = frameH * 0.072;
    return (
      <div style={{ perspective: tilt ? 1600 : undefined, willChange: "transform, opacity, filter", opacity: reveal.opacity, filter: `blur(${reveal.blur}px)`, transform: `translateY(${reveal.y + floatY}px)` }}>
        <div style={{
          width: frameW, height: frameH, background: "#0a0a0c", borderRadius: radius,
          padding: bezel, position: "relative",
          boxShadow: `0 ${40 * unit}px ${110 * unit}px rgba(0,0,0,0.55), inset 0 0 0 ${1.5 * unit}px rgba(255,255,255,0.08)`,
          transform: `scale(${reveal.scale}) rotateY(${tilt * (1 - reveal.progress) + tilt * 0.0}deg)`,
          transformStyle: "preserve-3d",
        }}>
          <div style={{ position: "absolute", top: bezel + frameH * 0.012, left: "50%", transform: "translateX(-50%)", width: frameW * 0.32, height: frameH * 0.026, background: "#0a0a0c", borderRadius: 99, zIndex: 3 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: radius - bezel, overflow: "hidden", position: "relative", background: screenBg }}>
            <Img src={imageUrl} style={{ width: "100%", height: "100%", objectFit: fit, display: "block" }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Browser / Window / Tablet / Bare: width-driven ────────────────
  const aspect = contentAspect ?? (variant === "tablet" ? 4 / 3 : 16 / 10);
  const defaultWFrac = isVertical ? 0.92 : (variant === "tablet" ? 0.6 : 0.82);
  const wFrac = widthFraction ?? defaultWFrac;
  const chromeH = variant === "browser" ? 44 * unit : 0;
  const pad = variant === "tablet" ? 18 * unit : variant === "window" ? 0 : 0;

  // Width-fit, then cap by height so nothing clips off-stage.
  let frameW = clamp(stageW * wFrac, 320, stageW * 0.96);
  let screenW = frameW - pad * 2;
  let screenH = screenW / aspect;
  let frameH = screenH + chromeH + pad * 2;
  const maxFrameH = stageH * (maxHeightFraction ?? (isVertical ? 0.6 : 0.82));
  if (frameH > maxFrameH) {
    const k = maxFrameH / frameH;
    frameW *= k; screenW *= k; screenH *= k; frameH = maxFrameH;
  }

  const radius = variant === "bare" ? 16 * unit : variant === "tablet" ? 26 * unit : 16 * unit;
  const shadow = `0 ${44 * unit}px ${120 * unit}px rgba(0,0,0,0.5), 0 0 0 ${1 * unit}px rgba(255,255,255,0.06)`;

  const screen = (
    <div style={{ width: variant === "browser" ? "100%" : screenW, height: screenH, borderRadius: variant === "browser" ? 0 : radius, overflow: "hidden", position: "relative", background: screenBg }}>
      <Img src={imageUrl} style={{ width: "100%", height: "100%", objectFit: fit, display: "block" }} />
    </div>
  );

  return (
    <div style={{ perspective: tilt ? 1800 : undefined, willChange: "transform, opacity, filter", opacity: reveal.opacity, filter: `blur(${reveal.blur}px)`, transform: `translateY(${reveal.y + floatY}px)` }}>
      <div style={{
        width: frameW, borderRadius: radius, background: variant === "bare" ? "transparent" : "#11141b",
        boxShadow: variant === "bare" ? `0 ${30 * unit}px ${90 * unit}px rgba(0,0,0,0.45)` : shadow,
        overflow: "hidden", padding: pad,
        transform: `scale(${reveal.scale}) rotateY(${tilt * (1 - reveal.progress)}deg) rotateX(${tilt * 0.35 * (1 - reveal.progress)}deg)`,
        transformStyle: "preserve-3d",
      }}>
        {variant === "browser" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 * unit, height: chromeH, padding: `0 ${16 * unit}px`, background: "#1a1d26", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", gap: 6 * unit }}>
              {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
                <div key={c} style={{ width: 11 * unit, height: 11 * unit, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, maxWidth: frameW * 0.6, margin: "0 auto", background: "#0c0e14", borderRadius: 7 * unit, padding: `${5 * unit}px ${14 * unit}px`, fontFamily: FONT, fontSize: 12 * unit, color: "#8a90a0", textAlign: "center", border: "1px solid rgba(255,255,255,0.04)" }}>
              {url}
            </div>
          </div>
        )}
        {screen}
      </div>
    </div>
  );
};

// ─── Screenshot Stack ───────────────────────────────────────────────
// Overlapping perspective cards — the "glass carousel" of product shots.
// Renders 2–4 images fanned in 3D depth, each arriving on a stagger.

export const ScreenshotStack: React.FC<{
  images: string[];
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  contentAspect?: number;
}> = ({ images, frame, fps, delay = 0, primaryColor = "#10a37f", contentAspect = 16 / 10 }) => {
  const { width: stageW, height: stageH, isVertical, unit } = useStage();
  const shots = images.filter(Boolean).slice(0, 4);
  if (shots.length === 0) return null;

  let cardW = clamp(stageW * (isVertical ? 0.68 : 0.42), 300, 880 * unit);
  let cardH = cardW / contentAspect;
  const maxCardH = stageH * (isVertical ? 0.38 : 0.4);
  if (cardH > maxCardH) { cardH = maxCardH; cardW = cardH * contentAspect; }
  const spread = cardW * 0.16;

  return (
    <div style={{ position: "relative", width: cardW + spread * (shots.length - 1) * 1.4, height: cardH * 1.12, perspective: 2000 }}>
      {shots.map((src, i) => {
        const mid = (shots.length - 1) / 2;
        const offset = i - mid;
        const reveal = revealMotion(frame, fps, delay + i * 8);
        const depth = 1 - Math.abs(offset) * 0.06;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: cardW,
              height: cardH,
              marginLeft: -cardW / 2,
              marginTop: -cardH / 2,
              borderRadius: 18 * unit,
              overflow: "hidden",
              background: "#0b0d12",
              zIndex: 10 - Math.round(Math.abs(offset)),
              boxShadow: `0 ${36 * unit}px ${90 * unit}px rgba(0,0,0,0.5), 0 0 0 ${1 * unit}px rgba(255,255,255,0.06)`,
              opacity: reveal.opacity,
              filter: `blur(${reveal.blur}px)`,
              transform: `
                translateX(${offset * spread * 1.4 * reveal.progress}px)
                translateY(${reveal.y + Math.abs(offset) * 18 * unit}px)
                scale(${reveal.scale * depth})
                rotateY(${-offset * 16 * reveal.progress}deg)
              `,
              transformStyle: "preserve-3d",
              willChange: "transform, opacity, filter",
            }}
          >
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        );
      })}
    </div>
  );
};

// ─── Logo Lockup ────────────────────────────────────────────────────
// A real logo, contained within safe bounds, with optional wordmark.
// Scales the logo to the stage; never lets a huge upload blow out.

export const LogoLockup: React.FC<{
  logoUrl: string;
  wordmark?: string;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  textColor?: string;
  /** Max logo height as a fraction of stage height. */
  heightFraction?: number;
}> = ({ logoUrl, wordmark, frame, fps, delay = 0, primaryColor = "#10a37f", textColor = "#ffffff", heightFraction = 0.18 }) => {
  const { height: stageH, unit } = useStage();
  const reveal = revealMotion(frame, fps, delay);
  if (!logoUrl) return null;
  const logoH = clamp(stageH * heightFraction, 60, stageH * 0.34);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 * unit, opacity: reveal.opacity, filter: `blur(${reveal.blur}px)`, transform: `translateY(${reveal.y}px) scale(${reveal.scale})`, willChange: "transform, opacity, filter" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: -logoH * 0.4, borderRadius: "50%", background: `radial-gradient(circle, ${primaryColor}22 0%, transparent 65%)`, filter: `blur(${30 * unit}px)` }} />
        <Img src={logoUrl} style={{ height: logoH, width: "auto", maxWidth: "70vw", objectFit: "contain", position: "relative", filter: "drop-shadow(0 6px 22px rgba(0,0,0,0.4))" }} />
      </div>
      {wordmark && (
        <div style={{ fontFamily: FONT, fontSize: 34 * unit, fontWeight: 800, letterSpacing: "-0.03em", color: textColor }}>{wordmark}</div>
      )}
    </div>
  );
};

// ─── Logo Wall ──────────────────────────────────────────────────────
// "Trusted by teams" — a grid of customer/integration logos in soft glass
// chips, each arriving on a stagger. Falls back to text chips if no images.
export const LogoWall: React.FC<{
  logos: string[];
  labels?: string[];
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  textColor?: string;
}> = ({ logos, labels, frame, fps, delay = 0, primaryColor = "#10a37f", textColor = "#ffffff" }) => {
  const { width: stageW, isVertical, unit } = useStage();
  const items = (logos && logos.filter(Boolean).length > 0 ? logos.filter(Boolean) : (labels || [])).slice(0, isVertical ? 6 : 8);
  const useImages = logos && logos.filter(Boolean).length > 0;
  const cols = isVertical ? 2 : Math.min(4, items.length);
  const chipW = clamp((stageW * (isVertical ? 0.86 : 0.72)) / cols - 18 * unit, 150, 280 * unit);
  const chipH = chipW * 0.42;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${chipW}px)`, gap: 18 * unit, justifyContent: "center" }}>
      {items.map((it, i) => {
        const r = revealMotion(frame, fps, delay + i * 6);
        return (
          <div key={i} style={{
            width: chipW, height: chipH, borderRadius: 16 * unit,
            background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: chipW * 0.12,
            boxShadow: `0 ${16 * unit}px ${44 * unit}px rgba(0,0,0,0.32)`,
            opacity: r.opacity, transform: `translateY(${r.y * 0.5}px) scale(${r.scale})`, filter: `blur(${r.blur * 0.5}px)`,
            willChange: "transform, opacity, filter",
          }}>
            {useImages ? (
              <Img src={it} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }} />
            ) : (
              <span style={{ fontFamily: FONT, fontSize: chipH * 0.32, fontWeight: 800, color: textColor, letterSpacing: "-0.02em", opacity: 0.92 }}>{it}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Persistent Brand Mark ──────────────────────────────────────────
// Small corner logo that holds across scenes. Contained + capped so any
// uploaded asset stays a tasteful watermark, never a giant slab.

export const BrandMark: React.FC<{
  logoUrl: string;
  frame: number;
  fps: number;
  delay?: number;
  primaryColor?: string;
  position?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}> = ({ logoUrl, frame, fps, delay = 0, primaryColor = "#10a37f", position = "topLeft" }) => {
  const { unit } = useStage();
  const s = getSpringProgress(frame, fps, delay, DEFAULT_SPRING);
  if (!logoUrl) return null;
  const size = 46 * unit;
  const opacity = interpolate(s, [0, 0.4, 1], [0, 0.92, 0.92], { extrapolateLeft: "clamp" });
  const y = interpolate(s, [0, 1], [-16, 0]);
  const pad = 44 * unit;
  const pos: Record<string, React.CSSProperties> = {
    topLeft: { top: pad, left: pad },
    topRight: { top: pad, right: pad },
    bottomLeft: { bottom: pad, left: pad },
    bottomRight: { bottom: pad, right: pad },
  };
  return (
    <div style={{ position: "absolute", zIndex: 60, opacity, transform: `translateY(${y}px)`, willChange: "transform, opacity", ...pos[position] }}>
      <Img src={logoUrl} style={{ height: size, width: "auto", maxWidth: 200 * unit, objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))" }} />
    </div>
  );
};
