// ─── Belief-Shaping Scene Library ───────────────────────────────────
// One thought per frame. Motion controls attention. UI is evidence.
// No decoration. No particles. No glow. Restraint reads as confidence.

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import {
  getEntrance, getExit, getSpringProgress, TRANSITION_FRAMES,
  DEFAULT_SPRING, SNAPPY_SPRING,
} from "./animations";
import { PhoneFrame, ChatBubble, NotificationCard, CalendarBlock, StatusPill } from "./ui-mockups";

// ─── Types ──────────────────────────────────────────────────────────

export interface SceneData {
  type: string;
  text: string;
  subtext?: string;
  visualDirection?: string;
  audioUrl?: string;
  durationInFrames: number;
  imageUrl?: string;
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
}

// ─── Design Tokens ──────────────────────────────────────────────────

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const cardShadow = "0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
const cardRadius = 20;

// ─── Shared Entrance/Exit Wrapper ───────────────────────────────────

const SceneWrapper: React.FC<{
  frame: number;
  fps: number;
  duration: number;
  direction?: "left" | "right" | "up" | "down";
  children: React.ReactNode;
}> = ({ frame, fps, duration, direction = "left", children }) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, direction, TRANSITION_FRAMES, fps);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateY(${entrance.y + exit.y}px) translateX(${exit.x}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ─── 1. STATEMENT ───────────────────────────────────────────────────
// One big thought. Massive type. Nothing else.
// Used for: pain, reveal, transformation, punchline.

export const StatementScene: React.FC<SceneProps> = ({
  scene, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "down", TRANSITION_FRAMES, fps);

  const lines = scene.text.split(". ").filter(Boolean);
  const isMultiLine = lines.length > 1 && scene.text.length > 30;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 8%",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateY(${entrance.y + exit.y}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "90%" }}>
        {isMultiLine ? (
          lines.map((line, i) => {
            const s = getSpringProgress(frame, fps, i * 6, SNAPPY_SPRING);
            return (
              <div
                key={i}
                style={{
                  fontFamily: FONT,
                  fontSize: line.length < 15 ? "110px" : line.length < 30 ? "92px" : "76px",
                  fontWeight: 800,
                  lineHeight: 1.05,
                  color: textColor,
                  letterSpacing: "-0.035em",
                  textWrap: "balance",
                  opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                  transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
                  willChange: "transform, opacity",
                  marginBottom: i < lines.length - 1 ? 12 : 0,
                }}
              >
                {line}{i < lines.length - 1 ? "" : ""}
              </div>
            );
          })
        ) : (
          <div
            style={{
              fontFamily: FONT,
              fontSize: scene.text.length < 15 ? "120px" : scene.text.length < 30 ? "96px" : "78px",
              fontWeight: 800,
              lineHeight: 1.05,
              color: textColor,
              letterSpacing: "-0.035em",
              textWrap: "balance",
            }}
          >
            {scene.text}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── 2. EVIDENCE ────────────────────────────────────────────────────
// Clean UI card OR phone mockup showing the product in action.
// Used for: proof beats. One data point. One device screen.

export const EvidenceScene: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "right", TRANSITION_FRAMES, fps);
  const cardS = getSpringProgress(frame, fps, 8, DEFAULT_SPRING);
  const textLower = scene.text.toLowerCase();

  // Detect what kind of evidence to show
  const isPhoneMockup =
    textLower.includes("call") ||
    textLower.includes("answer") ||
    textLower.includes("chat") ||
    textLower.includes("message") ||
    textLower.includes("book") ||
    textLower.includes("calendar") ||
    textLower.includes("notify") ||
    textLower.includes("qualif") ||
    textLower.includes("lead");

  if (isPhoneMockup) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: entrance.opacity * exit.opacity,
          transform: `translateX(${exit.x}px) scale(${entrance.scale * exit.scale})`,
          willChange: "transform, opacity",
        }}
      >
        <PhoneFrame frame={frame} fps={fps} primaryColor={primaryColor}>
          {/* Notification */}
          {(textLower.includes("call") || textLower.includes("answer")) && (
            <NotificationCard
              title="Incoming Call"
              body={scene.subtext || "AI is answering..."}
              frame={frame}
              fps={fps}
              delay={10}
              icon="📞"
            />
          )}

          {/* Chat bubbles */}
          {(textLower.includes("chat") || textLower.includes("qualif") || textLower.includes("answer")) && (
            <div style={{ marginTop: 80, padding: "0 4px" }}>
              <ChatBubble
                text={scene.subtext || "Hi, I'd like to book a service call."}
                frame={frame}
                fps={fps}
                delay={20}
                direction="left"
              />
              <ChatBubble
                text="Absolutely. What type of service do you need?"
                frame={frame}
                fps={fps}
                delay={35}
                direction="right"
                primaryColor={primaryColor}
              />
            </div>
          )}

          {/* Status pills at bottom */}
          <div style={{ position: "absolute", bottom: 20, left: 14, right: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {textLower.includes("answer") && (
              <StatusPill label="Answered" frame={frame} fps={fps} delay={50} variant="success" />
            )}
            {textLower.includes("qualif") && (
              <StatusPill label="Qualified" frame={frame} fps={fps} delay={60} variant="accent" primaryColor={primaryColor} />
            )}
            {textLower.includes("book") && (
              <StatusPill label="Booked" frame={frame} fps={fps} delay={70} variant="success" />
            )}
          </div>

          {/* Calendar */}
          {textLower.includes("book") && (
            <div style={{ marginTop: 60, padding: "0 4px" }}>
              <CalendarBlock
                time="Today, 2:00 PM"
                title={scene.subtext || "Service call booked"}
                frame={frame}
                fps={fps}
                delay={30}
                primaryColor={primaryColor}
              />
            </div>
          )}
        </PhoneFrame>
      </AbsoluteFill>
    );
  }

  // Fallback: clean evidence card
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 10%",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateX(${exit.x}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: cardRadius,
          boxShadow: cardShadow,
          padding: "48px 56px",
          maxWidth: "720px",
          width: "100%",
          opacity: interpolate(cardS, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
          transform: `translateY(${interpolate(cardS, [0, 1], [40, 0])}px)`,
          willChange: "transform, opacity",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 600,
            color: primaryColor,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          {scene.subtext || " "}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: scene.text.length < 25 ? "52px" : "40px",
            fontWeight: 700,
            lineHeight: 1.15,
            color: textColor,
            letterSpacing: "-0.02em",
            textWrap: "balance",
          }}
        >
          {scene.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 3. FLOW ────────────────────────────────────────────────────────
// Visual metaphor: A → B → C transformation path.
// Used for: showing invisible workflow as visible cause-and-effect.

export const FlowScene: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "up", TRANSITION_FRAMES, fps);

  // Parse flow steps from text: "Call answered → Lead qualified → Job booked"
  const steps = scene.text.split(/[→\-\>]/).map(s => s.trim()).filter(Boolean);
  const stepCount = steps.length || 1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 6%",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateY(${entrance.y + exit.y}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          width: "100%",
          maxWidth: "1100px",
        }}
      >
        {steps.map((step, i) => {
          const s = getSpringProgress(frame, fps, i * 10, DEFAULT_SPRING);
          const isLast = i === steps.length - 1;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  boxShadow: cardShadow,
                  padding: "28px 32px",
                  minWidth: 140,
                  textAlign: "center",
                  opacity: interpolate(s, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                  transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px) scale(${interpolate(s, [0, 1], [0.92, 1])})`,
                  willChange: "transform, opacity",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 15,
                    fontWeight: 600,
                    color: primaryColor,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Step {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: step.length < 15 ? "28px" : "22px",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: textColor,
                    letterSpacing: "-0.01em",
                    textWrap: "balance",
                  }}
                >
                  {step}
                </div>
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    background: primaryColor,
                    opacity: interpolate(s, [0, 1], [0, 0.35]),
                    flexShrink: 0,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── 4. METRIC ──────────────────────────────────────────────────────
// Big rising number. One label. Maximum impact.
// Used for: outcomes, revenue recovered, jobs booked, time saved.

export const MetricScene: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "left", TRANSITION_FRAMES, fps);

  // Parse number from text like "2,847 calls answered" or "$47K recovered"
  const numMatch = scene.text.match(/([$€£]?[\d,.]+[KMBkmb]?)/);
  const numberStr = numMatch ? numMatch[1] : "0";
  const label = scene.text.replace(numberStr, "").trim();

  // Animate the number
  const targetNum = parseFloat(numberStr.replace(/[$€£,]/g, "").replace(/K/i, "000").replace(/M/i, "000000"));
  const countS = getSpringProgress(frame, fps, 0, SNAPPY_SPRING);
  const displayed = Math.round(interpolate(countS, [0, 1], [0, targetNum], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const formatted = numberStr.startsWith("$") ? `$${displayed.toLocaleString()}` : displayed.toLocaleString();

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateX(${exit.x}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: "140px",
            fontWeight: 800,
            lineHeight: 1.0,
            color: primaryColor,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatted}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: "32px",
            fontWeight: 500,
            lineHeight: 1.3,
            color: `${textColor}88`,
            marginTop: 16,
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 5. LOCKUP ──────────────────────────────────────────────────────
// Clean brand + URL. The final frame.
// Used for: CTA. Nothing but the essentials.

export const LockupScene: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "down", TRANSITION_FRAMES, fps);
  const lineS = getSpringProgress(frame, fps, 20, SNAPPY_SPRING);
  const lineWidth = interpolate(lineS, [0, 1], [0, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const isUrl = scene.text.includes(".") && !scene.text.includes(" ");
  const mainText = isUrl ? (scene.subtext || "Get started") : scene.text;
  const urlText = isUrl ? scene.text : (scene.subtext || "");

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateY(${entrance.y + exit.y}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: "64px",
            fontWeight: 800,
            lineHeight: 1.1,
            color: textColor,
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}
        >
          {mainText}
        </div>
        <div
          style={{
            height: 3,
            width: lineWidth,
            background: primaryColor,
            borderRadius: 2,
            margin: "0 auto 20px",
          }}
        />
        {urlText && (
          <div
            style={{
              fontFamily: FONT,
              fontSize: "24px",
              fontWeight: 500,
              color: primaryColor,
              letterSpacing: "0.02em",
            }}
          >
            {urlText}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene Component Map ────────────────────────────────────────────

export const sceneComponentMap: Record<string, React.FC<SceneProps>> = {
  statement: StatementScene,
  evidence: EvidenceScene,
  flow: FlowScene,
  metric: MetricScene,
  lockup: LockupScene,
  // Legacy fallbacks
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
