// ─── Belief-Shaping Scene Library ───────────────────────────────────
// Fallback scene components when no template is matched.

import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { getSpringProgress, TRANSITION_FRAMES, SNAPPY_SPRING, DEFAULT_SPRING } from "./animations";
import { CinematicHeadline, CinematicBody, SceneMotion, useSceneSizes, FONT } from "./scene-core";

export interface SceneData {
  type: string;
  text: string;
  subtext?: string;
  visualDirection?: string;
  audioUrl?: string;
  durationInFrames: number;
  audioMarkers?: number[];
  imageUrl?: string;
  logoUrl?: string;
  brandName?: string;
  fontFamily?: string;
  headline?: string;
  subheadline?: string;
  eyebrow?: string;
  metrics?: { value: string; label: string }[];
  before?: string;
  after?: string;
  steps?: string[];
  features?: { title: string; description?: string }[];
  messages?: string[];
  statusPills?: string[];
  dashboardCards?: { label: string; value: string; trend?: string }[];
  chartLabel?: string;
  command?: string;
  quote?: string;
  attribution?: string;
  plans?: { name: string; price: string; features?: string[] }[];
  cta?: string;
  url?: string;
}

export interface SceneProps {
  scene: SceneData;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;
  bgColor: string;
  frame: number;
  fps: number;
  duration: number;
  entranceDirection?: "left" | "right" | "up" | "down";
  exitDirection?: "left" | "right" | "up" | "down";
  audioMarkers?: number[];
}

// ─── 1. STATEMENT ───────────────────────────────────────────────────

export const StatementScene: React.FC<SceneProps> = ({
  scene, textColor, frame, fps, duration, entranceDirection, exitDirection, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <CinematicHeadline text={scene.text} frame={frame} fps={fps} duration={duration} color={textColor} size={sizes.headline} audioMarkers={audioMarkers} />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 2. EVIDENCE ────────────────────────────────────────────────────

export const EvidenceScene: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const cardS = spring({ frame: Math.max(0, frame - 8), fps, config: DEFAULT_SPRING });

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{
          background: "#0f0f0f",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "48px 56px",
          maxWidth: "800px",
          width: "100%",
          opacity: interpolate(cardS, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
          transform: `translateY(${interpolate(cardS, [0, 1], [50, 0])}px)`,
          filter: `blur(${interpolate(cardS, [0, 0.5], [3, 0], { extrapolateLeft: "clamp" })}px)`,
          willChange: "transform, opacity, filter",
        }}>
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: primaryColor, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            {scene.subtext || " "}
          </div>
          <CinematicHeadline text={scene.text} frame={frame} fps={fps} duration={duration} color={textColor} size={Math.round(sizes.headline * 0.5)} align="left" audioMarkers={audioMarkers} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 3. FLOW ────────────────────────────────────────────────────────

export const FlowScene: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const steps = scene.text.split(/[→\-\>]/).map(s => s.trim()).filter(Boolean);

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, width: "100%", maxWidth: "1100px" }}>
          {steps.map((step, i) => {
            const s = spring({ frame: Math.max(0, frame - i * 10), fps, config: DEFAULT_SPRING });
            const isLast = i === steps.length - 1;
            return (
              <React.Fragment key={i}>
                <div style={{
                  background: "#0f0f0f",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "32px 36px",
                  minWidth: 160,
                  textAlign: "center",
                  opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                  transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
                  filter: `blur(${interpolate(s, [0, 0.5], [2, 0], { extrapolateLeft: "clamp" })}px)`,
                  willChange: "transform, opacity, filter",
                  flex: 1,
                }}>
                  <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: primaryColor, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Step {i + 1}</div>
                  <div style={{ fontFamily: FONT, fontSize: Math.round(sizes.body * 0.9), fontWeight: 600, color: textColor, lineHeight: 1.3 }}>{step}</div>
                </div>
                {!isLast && (
                  <div style={{ width: 32, height: 2, background: primaryColor, opacity: interpolate(s, [0, 1], [0, 0.4]), flexShrink: 0 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 4. METRIC ──────────────────────────────────────────────────────

export const MetricScene: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const numMatch = scene.text.match(/([$€£]?[\d,.]+[KMBkmb]?)/);
  const numberStr = numMatch ? numMatch[1] : "0";
  const label = scene.text.replace(numberStr, "").trim();
  const targetNum = parseFloat(numberStr.replace(/[$€£,]/g, "").replace(/K/i, "000").replace(/M/i, "000000"));
  const countS = getSpringProgress(frame, fps, 0, SNAPPY_SPRING);
  const displayed = Math.round(interpolate(countS, [0, 1], [0, targetNum], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const formatted = numberStr.startsWith("$") ? `$${displayed.toLocaleString()}` : displayed.toLocaleString();

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: FONT, fontSize: Math.round(sizes.headline * 1.3), fontWeight: 800, lineHeight: 1, color: primaryColor, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
            {formatted}
          </div>
          <div style={{ fontFamily: FONT, fontSize: sizes.body, fontWeight: 500, lineHeight: 1.4, color: `${textColor}88`, marginTop: 20, letterSpacing: "-0.01em" }}>
            {label}
          </div>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 5. LOCKUP ──────────────────────────────────────────────────────

export const LockupScene: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const lineS = spring({ frame: Math.max(0, frame - 20), fps, config: SNAPPY_SPRING });
  const lineWidth = interpolate(lineS, [0, 1], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isUrl = scene.text.includes(".") && !scene.text.includes(" ");
  const mainText = isUrl ? (scene.subtext || "Get started") : scene.text;
  const urlText = isUrl ? scene.text : (scene.subtext || "");

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: FONT, fontSize: Math.round(sizes.headline * 0.65), fontWeight: 800, lineHeight: 1.1, color: textColor, letterSpacing: "-0.03em", marginBottom: 24 }}>
            {mainText}
          </div>
          <div style={{ height: 3, width: lineWidth, background: primaryColor, borderRadius: 2, margin: "0 auto 24px" }} />
          {urlText && (
            <div style={{ fontFamily: FONT, fontSize: sizes.body, fontWeight: 500, color: primaryColor, letterSpacing: "0.02em" }}>
              {urlText}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── Scene Component Map ────────────────────────────────────────────

export const sceneComponentMap: Record<string, React.FC<SceneProps>> = {
  statement: StatementScene,
  evidence: EvidenceScene,
  flow: FlowScene,
  metric: MetricScene,
  lockup: LockupScene,
  title: StatementScene,
  problem: StatementScene,
  solution: StatementScene,
  feature: EvidenceScene,
  benefit: EvidenceScene,
  process: FlowScene,
  stats: MetricScene,
  socialProof: EvidenceScene,
  comparison: EvidenceScene,
  cta: LockupScene,
};
