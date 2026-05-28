// ─── Premium Scene Library ──────────────────────────────────────────
// Production-grade scene components for explainer videos.
// Each scene is a self-contained cinematic moment with entrance,
// content animation, and exit. All GPU-accelerated.

import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import {
  getSpringProgress, getEntrance, getExit, getSlideIn, getScaleIn,
  getFadeIn, getFloat, getCounter, getKenBurns, getStaggerDelay,
  getStrokeDraw, getPulse, TRANSITION_FRAMES,
  DEFAULT_SPRING, BOUNCY_SPRING, SNAPPY_SPRING, GENTLE_SPRING,
} from "./animations";
import { WordReveal, CharReveal, Typewriter, StaggeredLines, AnimatedNumber, BouncyText, MaskReveal } from "./text-animations";

// ─── Shared Types ───────────────────────────────────────────────────

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

// ─── Typography Constants ───────────────────────────────────────────

const FONT_HEADING = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const FONT_BODY = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const FONT_QUOTE = 'Georgia, "Times New Roman", serif';

// ─── 1. Title Scene ─────────────────────────────────────────────────

export const TitleScene: React.FC<SceneProps> = ({
  scene, primaryColor, secondaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const subEntrance = getSlideIn(frame, fps, 12, 30);
  const lineS = getSpringProgress(frame, fps, 20, SNAPPY_SPRING);
  const exit = getExit(frame, duration, "left");
  const lineWidth = interpolate(lineS, [0, 1], [0, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
      <div style={{ textAlign: "center", maxWidth: "78%", zIndex: 2 }}>
        <h1
          style={{
            fontFamily: FONT_HEADING,
            fontSize: "82px",
            fontWeight: 900,
            lineHeight: 1.08,
            color: textColor,
            margin: "0 0 18px 0",
            textWrap: "balance",
            letterSpacing: "-0.03em",
          }}
        >
          <WordReveal text={scene.text} delay={5} stagger={4} />
        </h1>
        {scene.subtext && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: "28px",
              fontWeight: 400,
              lineHeight: 1.4,
              color: `${textColor}90`,
              margin: "0 0 26px 0",
              opacity: subEntrance.opacity,
              transform: `translateY(${subEntrance.y}px)`,
              willChange: "transform, opacity",
            }}
          >
            {scene.subtext}
          </p>
        )}
        <div
          style={{
            height: 5,
            width: lineWidth,
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: 3,
            margin: "0 auto",
            boxShadow: `0 0 20px ${primaryColor}40`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── 2. Problem Scene ───────────────────────────────────────────────

export const ProblemScene: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, accentColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0, GENTLE_SPRING);
  const exit = getExit(frame, duration, "down");
  const floatY = getFloat(frame, fps, 6, 0.4);

  // Parse problem statements
  const problems = scene.text.split(/[.\n]/).filter(s => s.trim().length > 3).slice(0, 3);

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
      {/* Tension indicator */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 500,
          height: 500,
          transform: `translate(-50%, -50%) translateY(${floatY}px)`,
          borderRadius: "50%",
          border: `1px solid ${accentColor}15`,
          willChange: "transform",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 700,
          height: 700,
          transform: `translate(-50%, -50%)`,
          borderRadius: "50%",
          border: `1px solid ${accentColor}08`,
        }}
      />

      <div style={{ maxWidth: "68%", textAlign: "center", zIndex: 2 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            opacity: getFadeIn(frame, 15, 0),
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: accentColor }} />
          <span
            style={{
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            The Problem
          </span>
        </div>

        <h2
          style={{
            fontFamily: FONT_HEADING,
            fontSize: "56px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: textColor,
            margin: "0 0 28px 0",
            textWrap: "balance",
            letterSpacing: "-0.02em",
          }}
        >
          <WordReveal text={scene.subtext || scene.text} delay={5} stagger={4} />
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
          {problems.map((problem, i) => {
            const s = getSpringProgress(frame, fps, getStaggerDelay(i, 20, 8), DEFAULT_SPRING);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 22px",
                  backgroundColor: `${accentColor}08`,
                  borderRadius: 10,
                  borderLeft: `3px solid ${accentColor}60`,
                  opacity: interpolate(s, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                  transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
                  willChange: "transform, opacity",
                  maxWidth: "90%",
                }}
              >
                <span style={{ color: accentColor, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>×</span>
                <span
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: "20px",
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: `${textColor}cc`,
                    textAlign: "left",
                  }}
                >
                  {problem.trim()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 3. Solution Scene ──────────────────────────────────────────────

export const SolutionScene: React.FC<SceneProps> = ({
  scene, primaryColor, secondaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getScaleIn(frame, fps, 0, BOUNCY_SPRING);
  const subEntrance = getSlideIn(frame, fps, 15, 40);
  const exit = getExit(frame, duration, "up");
  const lineS = getSpringProgress(frame, fps, 25, SNAPPY_SPRING);
  const lineWidth = interpolate(lineS, [0, 1], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowPulse = getPulse(frame, fps, 1.2);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: entrance.opacity * exit.opacity,
        transform: `scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}${Math.round(glowPulse * 30).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div style={{ textAlign: "center", maxWidth: "76%", zIndex: 2 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            opacity: getFadeIn(frame, 12, 0),
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: primaryColor,
              boxShadow: `0 0 10px ${primaryColor}60`,
            }}
          />
          <span
            style={{
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 700,
              color: primaryColor,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            The Solution
          </span>
        </div>

        <h1
          style={{
            fontFamily: FONT_HEADING,
            fontSize: "76px",
            fontWeight: 900,
            lineHeight: 1.08,
            color: textColor,
            margin: "0 0 18px 0",
            textWrap: "balance",
            letterSpacing: "-0.03em",
          }}
        >
          <BouncyText text={scene.text} delay={5} />
        </h1>

        {scene.subtext && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: "26px",
              fontWeight: 400,
              lineHeight: 1.5,
              color: `${textColor}88`,
              margin: "0 0 28px 0",
              opacity: subEntrance.opacity,
              transform: `translateY(${subEntrance.y}px)`,
              willChange: "transform, opacity",
            }}
          >
            {scene.subtext}
          </p>
        )}

        <div
          style={{
            height: 5,
            width: lineWidth,
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: 3,
            margin: "0 auto",
            boxShadow: `0 0 20px ${primaryColor}50`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── 4. Feature Scene ───────────────────────────────────────────────

export const FeatureScene: React.FC<SceneProps> = ({
  scene, primaryColor, secondaryColor, textColor, frame, fps, duration,
}) => {
  const textEntrance = getEntrance(frame, fps, 0);
  const imgEntrance = getScaleIn(frame, fps, 8);
  const exit = getExit(frame, duration, "right");
  const hasImage = scene.imageUrl && scene.imageUrl.trim().length > 0;
  const kenBurns = getKenBurns(frame, duration);

  return (
    <AbsoluteFill
      style={{
        flexDirection: hasImage ? "row" : "column",
        justifyContent: "center",
        alignItems: "center",
        padding: hasImage ? "0 70px" : "0",
        gap: hasImage ? 50 : 0,
        opacity: exit.opacity,
        transform: `translateX(${exit.x}px)`,
        willChange: "transform, opacity",
      }}
    >
      {hasImage && (
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: imgEntrance.opacity,
            transform: `scale(${imgEntrance.scale})`,
            willChange: "transform, opacity",
          }}
        >
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: `0 25px 70px rgba(0,0,0,0.45), 0 0 0 1px ${primaryColor}15`,
              border: `2px solid ${primaryColor}1a`,
              maxWidth: "92%",
              position: "relative",
            }}
          >
            <Img
              src={scene.imageUrl || ""}
              style={{
                width: "100%",
                maxHeight: 480,
                objectFit: "cover",
                display: "block",
                transform: `scale(${kenBurns})`,
                willChange: "transform",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(180deg, transparent 60%, ${primaryColor}12 100%)`,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          flex: hasImage ? 1 : undefined,
          maxWidth: hasImage ? "48%" : "72%",
          opacity: textEntrance.opacity,
          transform: `translateY(${textEntrance.y}px) scale(${textEntrance.scale})`,
          zIndex: 2,
          willChange: "transform, opacity",
        }}
      >
        <h2
          style={{
            fontFamily: FONT_HEADING,
            fontSize: hasImage ? "50px" : "62px",
            fontWeight: 800,
            lineHeight: 1.12,
            color: textColor,
            margin: "0 0 16px 0",
            textWrap: "balance",
            letterSpacing: "-0.02em",
          }}
        >
          <WordReveal text={scene.text} delay={5} stagger={3} />
        </h2>
        {scene.subtext && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: "22px",
              fontWeight: 400,
              lineHeight: 1.5,
              color: `${textColor}80`,
              margin: "0 0 22px 0",
            }}
          >
            {scene.subtext}
          </p>
        )}
        <div
          style={{
            height: 4,
            width: 90,
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: 2,
            boxShadow: `0 0 12px ${primaryColor}30`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── 5. Benefit Scene ───────────────────────────────────────────────

export const BenefitScene: React.FC<SceneProps> = ({
  scene, primaryColor, secondaryColor, textColor, frame, fps, duration,
}) => {
  const titleEntrance = getSlideIn(frame, fps, 0, -40);
  const exit = getExit(frame, duration, "left");

  const rawItems = scene.text.split(/[.\n•]/).filter(s => s.trim().length > 2).slice(0, 4);
  const items = rawItems.length > 0 ? rawItems : [scene.text];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 70px",
        opacity: exit.opacity,
        transform: `translateX(${exit.x}px) scale(${exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ maxWidth: "72%", width: "100%" }}>
        <h2
          style={{
            fontFamily: FONT_HEADING,
            fontSize: "52px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: textColor,
            margin: "0 0 10px 0",
            textWrap: "balance",
            letterSpacing: "-0.02em",
            opacity: titleEntrance.opacity,
            transform: `translateY(${titleEntrance.y}px)`,
            willChange: "transform, opacity",
          }}
        >
          <WordReveal text={scene.subtext || "Benefits"} delay={0} stagger={4} />
        </h2>
        <div
          style={{
            height: 4,
            width: 100,
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: 2,
            marginBottom: 32,
            opacity: titleEntrance.opacity,
            transform: `translateY(${titleEntrance.y}px)`,
            willChange: "transform, opacity",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((item, i) => {
            const s = getSpringProgress(frame, fps, getStaggerDelay(i, 15, 7), DEFAULT_SPRING);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "16px 22px",
                  backgroundColor: `${primaryColor}08`,
                  borderRadius: 14,
                  border: `1px solid ${primaryColor}12`,
                  opacity: interpolate(s, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                  transform: `translateX(${interpolate(s, [0, 1], [-50, 0])}px)`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.12)`,
                  willChange: "transform, opacity",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transform: `scale(${interpolate(s, [0, 0.6, 1], [0, 1.15, 1], { extrapolateLeft: "clamp" })})`,
                    willChange: "transform",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: "20px",
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: textColor,
                  }}
                >
                  {item.trim()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 6. Process Scene ───────────────────────────────────────────────

export const ProcessScene: React.FC<SceneProps> = ({
  scene, primaryColor, secondaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "right");

  // Parse steps from text
  const steps = scene.text.split(/[.\n]/).filter(s => s.trim().length > 3).slice(0, 4);
  const stepLabels = ["Step 1", "Step 2", "Step 3", "Step 4"];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 60px",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateY(${entrance.y + exit.y}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ maxWidth: "80%", width: "100%" }}>
        <h2
          style={{
            fontFamily: FONT_HEADING,
            fontSize: "50px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: textColor,
            margin: "0 0 36px 0",
            textWrap: "balance",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          <WordReveal text={scene.subtext || "How It Works"} delay={0} stagger={4} />
        </h2>

        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          {steps.map((step, i) => {
            const s = getSpringProgress(frame, fps, getStaggerDelay(i, 12, 10), BOUNCY_SPRING);
            const lineProgress = getSpringProgress(frame, fps, getStaggerDelay(i, 18, 10), DEFAULT_SPRING);

            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div
                  style={{
                    width: 220,
                    padding: "24px 20px",
                    backgroundColor: `${primaryColor}08`,
                    borderRadius: 16,
                    border: `1px solid ${primaryColor}12`,
                    textAlign: "center",
                    opacity: interpolate(s, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                    transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
                    willChange: "transform, opacity",
                    boxShadow: `0 8px 30px rgba(0,0,0,0.15)`,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px auto",
                      fontFamily: FONT_HEADING,
                      fontSize: 18,
                      fontWeight: 800,
                      color: "white",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: "15px",
                      fontWeight: 500,
                      lineHeight: 1.4,
                      color: textColor,
                    }}
                  >
                    {step.trim()}
                  </span>
                </div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    style={{
                      width: 30,
                      height: 2,
                      backgroundColor: `${primaryColor}30`,
                      opacity: interpolate(lineProgress, [0, 1], [0, 1], { extrapolateLeft: "clamp" }),
                      willChange: "opacity",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 7. Stats Scene ─────────────────────────────────────────────────

export const StatsScene: React.FC<SceneProps> = ({
  scene, primaryColor, secondaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "up");

  // Try to extract numbers from text for animated counters
  const numberMatches = scene.text.match(/(\d+(?:[,.]\d+)?)\s*(%|x|X|times|hours?|minutes?|days?|weeks?|months?|years?|K|M|B)?/gi) || [];
  const labels = scene.text.replace(/(\d+(?:[,.]\d+)?)\s*(%|x|X|times|hours?|minutes?|days?|weeks?|months?|years?|K|M|B)?/gi, "|").split("|").filter(s => s.trim().length > 2);

  // Build stats array
  const stats: { value: number; suffix: string; label: string }[] = [];
  for (let i = 0; i < Math.max(numberMatches.length, labels.length); i++) {
    const match = numberMatches[i] || "";
    const numStr = match.replace(/[^\d.]/g, "");
    const value = numStr ? parseFloat(numStr) : 0;
    const suffix = match.replace(/[\d.]/g, "").trim() || "";
    const label = labels[i] || (i === 0 ? scene.subtext || "" : "");
    if (value > 0 || label) {
      stats.push({ value, suffix, label });
    }
  }

  // Fallback if no numbers found
  const displayStats = stats.length > 0 ? stats : [
    { value: 0, suffix: "", label: scene.text },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: entrance.opacity * exit.opacity,
        transform: `scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ maxWidth: "80%", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: FONT_HEADING,
            fontSize: "44px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: textColor,
            margin: "0 0 40px 0",
            textWrap: "balance",
            letterSpacing: "-0.02em",
          }}
        >
          <WordReveal text={scene.subtext || "The Numbers"} delay={0} stagger={4} />
        </h2>

        <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
          {displayStats.map((stat, i) => {
            const s = getSpringProgress(frame, fps, getStaggerDelay(i, 10, 12), BOUNCY_SPRING);
            const counterValue = stat.value > 0 ? getCounter(frame, fps, stat.value, 15 + i * 8, 40) : 0;

            return (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  opacity: interpolate(s, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
                  transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
                  willChange: "transform, opacity",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_HEADING,
                    fontSize: "72px",
                    fontWeight: 900,
                    lineHeight: 1,
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    marginBottom: 8,
                  }}
                >
                  {stat.value > 0 ? `${counterValue}${stat.suffix}` : "—"}
                </div>
                <div
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: "18px",
                    fontWeight: 500,
                    color: `${textColor}80`,
                    maxWidth: 200,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 8. Social Proof Scene ──────────────────────────────────────────

export const SocialProofScene: React.FC<SceneProps> = ({
  scene, primaryColor, secondaryColor, textColor, frame, fps, duration,
}) => {
  const cardEntrance = getScaleIn(frame, fps, 0, GENTLE_SPRING);
  const quoteS = getSpringProgress(frame, fps, 5, { damping: 12, stiffness: 80, mass: 1, overshootClamping: false });
  const textEntrance = getEntrance(frame, fps, 15);
  const exit = getExit(frame, duration, "right");

  const quoteScale = interpolate(quoteS, [0, 1], [0.3, 1]);
  const quoteOpacity = interpolate(quoteS, [0, 0.5, 1], [0, 1, 0.1], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exit.opacity,
        transform: `translateX(${exit.x}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          maxWidth: "68%",
          width: "100%",
          textAlign: "center",
          position: "relative",
          opacity: cardEntrance.opacity,
          transform: `scale(${cardEntrance.scale})`,
          willChange: "transform, opacity",
        }}
      >
        {/* Giant quote marks */}
        <div
          style={{
            fontFamily: FONT_QUOTE,
            fontSize: "200px",
            lineHeight: 1,
            color: primaryColor,
            position: "absolute",
            top: -70,
            left: -10,
            opacity: quoteOpacity,
            transform: `scale(${quoteScale})`,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          &ldquo;
        </div>

        <blockquote
          style={{
            fontFamily: FONT_QUOTE,
            fontSize: "40px",
            fontWeight: 400,
            lineHeight: 1.5,
            color: textColor,
            fontStyle: "italic",
            margin: "0 0 26px 0",
            opacity: textEntrance.opacity,
            transform: `translateY(${textEntrance.y}px)`,
            willChange: "transform, opacity",
          }}
        >
          <CharReveal text={scene.text} delay={10} stagger={2} />
        </blockquote>

        {scene.subtext && (
          <div
            style={{
              opacity: interpolate(getSpringProgress(frame, fps, 25, DEFAULT_SPRING), [0, 1], [0, 1], { extrapolateLeft: "clamp" }),
              transform: `translateY(${interpolate(getSpringProgress(frame, fps, 25, DEFAULT_SPRING), [0, 1], [20, 0])}px)`,
              willChange: "transform, opacity",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                margin: "0 auto 10px auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 700,
                color: "white",
                fontFamily: FONT_HEADING,
              }}
            >
              {scene.subtext[0]?.toUpperCase() || "U"}
            </div>
            <p
              style={{
                fontFamily: FONT_BODY,
                fontSize: "17px",
                fontWeight: 600,
                color: textColor,
                margin: "0 0 3px 0",
              }}
            >
              {scene.subtext}
            </p>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── 9. Comparison Scene ────────────────────────────────────────────

export const ComparisonScene: React.FC<SceneProps> = ({
  scene, primaryColor, secondaryColor, textColor, accentColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "left");

  // Parse before/after from text
  const parts = scene.text.split(/(?:vs|versus|compared to|before|after)/i);
  const beforeText = parts[0]?.trim() || "Before";
  const afterText = parts[1]?.trim() || scene.subtext || "After";

  const beforeS = getSpringProgress(frame, fps, 5, DEFAULT_SPRING);
  const afterS = getSpringProgress(frame, fps, 20, BOUNCY_SPRING);

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
      <div style={{ maxWidth: "75%", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: FONT_HEADING,
            fontSize: "48px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: textColor,
            margin: "0 0 36px 0",
            textWrap: "balance",
          }}
        >
          <WordReveal text={scene.subtext || "Before vs After"} delay={0} stagger={4} />
        </h2>

        <div style={{ display: "flex", gap: 30, justifyContent: "center", alignItems: "stretch" }}>
          {/* Before card */}
          <div
            style={{
              flex: 1,
              maxWidth: 400,
              padding: "32px 28px",
              backgroundColor: `${accentColor}08`,
              borderRadius: 16,
              border: `1px solid ${accentColor}18`,
              opacity: interpolate(beforeS, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
              transform: `translateX(${interpolate(beforeS, [0, 1], [-40, 0])}px)`,
              willChange: "transform, opacity",
            }}
          >
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 700,
                color: accentColor,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Before
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: "22px",
                fontWeight: 500,
                color: `${textColor}90`,
                lineHeight: 1.5,
              }}
            >
              {beforeText}
            </div>
          </div>

          {/* VS indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: getFadeIn(frame, 15, 15),
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_HEADING,
                fontSize: 14,
                fontWeight: 800,
                color: "white",
              }}
            >
              VS
            </div>
          </div>

          {/* After card */}
          <div
            style={{
              flex: 1,
              maxWidth: 400,
              padding: "32px 28px",
              backgroundColor: `${primaryColor}0a`,
              borderRadius: 16,
              border: `1px solid ${primaryColor}20`,
              opacity: interpolate(afterS, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
              transform: `translateX(${interpolate(afterS, [0, 1], [40, 0])}px)`,
              willChange: "transform, opacity",
              boxShadow: `0 8px 30px ${primaryColor}10`,
            }}
          >
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 700,
                color: primaryColor,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              After
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: "22px",
                fontWeight: 600,
                color: textColor,
                lineHeight: 1.5,
              }}
            >
              {afterText}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 10. CTA Scene ──────────────────────────────────────────────────

export const CTAScene: React.FC<SceneProps> = ({
  scene, primaryColor, secondaryColor, textColor, accentColor, frame, fps, duration,
}) => {
  const headlineS = getSpringProgress(frame, fps, 0, BOUNCY_SPRING);
  const subEntrance = getSlideIn(frame, fps, 10, 30);
  const buttonEntrance = getScaleIn(frame, fps, 20);
  const exit = getExit(frame, duration, "up");
  const pulse = getPulse(frame, fps, 1.5);

  // Particle burst behind button
  const particles = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      angle: (i / 10) * Math.PI * 2,
      speed: 40 + Math.random() * 50,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 8,
    }));
  }, []);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exit.opacity,
        transform: `translateY(${exit.y}px) scale(${exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 65%)`,
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${1 + Math.sin((frame / fps) * 1.5) * 0.08})`,
          willChange: "transform",
        }}
      />

      <div style={{ textAlign: "center", maxWidth: "68%", zIndex: 2 }}>
        <h1
          style={{
            fontFamily: FONT_HEADING,
            fontSize: "70px",
            fontWeight: 900,
            lineHeight: 1.08,
            color: textColor,
            margin: "0 0 18px 0",
            textWrap: "balance",
            letterSpacing: "-0.03em",
            opacity: interpolate(headlineS, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
            transform: `translateY(${interpolate(headlineS, [0, 1], [35, 0])}px) scale(${interpolate(headlineS, [0, 1], [0.9, 1])})`,
            willChange: "transform, opacity",
          }}
        >
          <WordReveal text={scene.text} delay={0} stagger={5} />
        </h1>

        {scene.subtext && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: 1.5,
              color: `${textColor}85`,
              margin: "0 0 36px 0",
              opacity: subEntrance.opacity,
              transform: `translateY(${subEntrance.y}px)`,
              willChange: "transform, opacity",
            }}
          >
            {scene.subtext}
          </p>
        )}

        {/* CTA Button */}
        <div style={{ position: "relative", display: "inline-block" }}>
          {particles.map((p, i) => {
            const localFrame = Math.max(0, frame - 30 - p.delay);
            const dist = Math.min(localFrame * (p.speed / 30), 90 + i * 5);
            const px = Math.cos(p.angle) * dist;
            const py = Math.sin(p.angle) * dist;
            const pOpacity = interpolate(localFrame, [0, 8, 20, 35], [0, 0.8, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  background: i % 2 === 0 ? primaryColor : secondaryColor,
                  left: "50%",
                  top: "50%",
                  marginLeft: px - p.size / 2,
                  marginTop: py - p.size / 2,
                  opacity: pOpacity,
                  boxShadow: `0 0 ${p.size * 2}px ${i % 2 === 0 ? primaryColor : secondaryColor}70`,
                  pointerEvents: "none",
                  willChange: "transform, opacity",
                }}
              />
            );
          })}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "18px 44px",
              borderRadius: 14,
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              fontFamily: FONT_BODY,
              fontSize: "22px",
              fontWeight: 700,
              color: "white",
              boxShadow: `0 8px 35px ${primaryColor}${Math.round(pulse * 55).toString(16).padStart(2, "0")}, 0 0 50px ${primaryColor}18`,
              opacity: buttonEntrance.opacity,
              transform: `scale(${buttonEntrance.scale})`,
              cursor: "default",
              willChange: "transform, opacity",
            }}
          >
            {scene.visualDirection || "Get Started"}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene Component Map ────────────────────────────────────────────

export const sceneComponentMap: Record<string, React.FC<SceneProps>> = {
  title: TitleScene,
  problem: ProblemScene,
  solution: SolutionScene,
  feature: FeatureScene,
  benefit: BenefitScene,
  process: ProcessScene,
  stats: StatsScene,
  socialProof: SocialProofScene,
  comparison: ComparisonScene,
  cta: CTAScene,
};
