// ─── Scene Templates ────────────────────────────────────────────────
// OpenAI launch video templates.
// Every template: blur + scale + opacity stack on entrance.
// Nothing just appears. Everything arrives.

import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { getSpringProgress, getCamera, getFloat, getCinematicEntrance, TRANSITION_FRAMES, SNAPPY_SPRING, DEFAULT_SPRING } from "./animations";
import { SceneProps } from "./scenes";
import { ClipHeadline, CinematicHeadline, CinematicBody, SceneMotion, useSceneSizes, FONT } from "./scene-core";
import {
  PhoneFrame, BrowserFrame, ChatThread, NotificationCard,
  DashboardCard, StatCard, TestimonialCard, PricingCard, FeatureCard,
  ComparisonCard, CalendarBlock, CalendarMonth,
  BarChart, LineChart, ProgressRing,
  TypewriterInput, Button,
  Stepper,
  SocialProofRow, StatusPill, AnimatedNumber,
} from "./ui-mockups";
import { ScreenshotFrame, ScreenshotStack, LogoLockup, LogoWall, DeviceVariant, ImageFit } from "./media";
import { AICallPanel, CallTranscriptPanel } from "./voice";

// Collect every usable image off a scene: explicit list first, then single.
const sceneImages = (scene: SceneProps["scene"]): string[] => {
  const list = (scene.imageUrls || []).filter(Boolean);
  if (scene.imageUrl) list.unshift(scene.imageUrl);
  return Array.from(new Set(list));
};
const firstImage = (scene: SceneProps["scene"]): string => sceneImages(scene)[0] || "";

const sentenceToHeadline = (text: string, maxWords = 6) => {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  const first = cleaned.split(/[.!?]/)[0] || cleaned;
  return first.split(" ").slice(0, maxWords).join(" ");
};

const sceneHeadline = (scene: SceneProps["scene"], fallbackWords = 6) =>
  scene.headline || scene.subtext || sentenceToHeadline(scene.text, fallbackWords);

const sceneSubheadline = (scene: SceneProps["scene"], fallbackWords = 14) =>
  scene.subheadline || sentenceToHeadline(scene.text, fallbackWords);

const clampText = (text: string, max = 72) =>
  text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;

const defaultMetrics = [
  { value: "2.8K", label: "leads handled" },
  { value: "186", label: "meetings booked" },
  { value: "$47K", label: "pipeline created" },
];

const defaultFeatures = [
  { title: "Capture", description: "Every intent signal is routed instantly." },
  { title: "Qualify", description: "AI scores fit, urgency, and next step." },
  { title: "Book", description: "Calendar-ready handoff without manual follow-up." },
  { title: "Report", description: "Revenue impact stays visible in one place." },
];

const defaultPlans = [
  { name: "Launch", price: "$99", features: ["Core automation", "Lead capture"] },
  { name: "Scale", price: "$299", features: ["AI workflows", "Calendar sync", "Reporting"] },
  { name: "Partner", price: "Custom", features: ["Custom routing", "Team controls"] },
];

const PremiumCopy: React.FC<{
  scene: SceneProps["scene"];
  frame: number;
  fps: number;
  duration: number;
  textColor: string;
  primaryColor: string;
  align?: "left" | "center";
  compact?: boolean;
  audioMarkers?: number[];
}> = ({ scene, frame, fps, duration, textColor, primaryColor, align = "left", compact = false, audioMarkers }) => {
  const sizes = useSceneSizes();
  const headline = sceneHeadline(scene, compact ? 5 : 7);
  const subheadline = sceneSubheadline(scene, compact ? 10 : 14);
  // Adaptive headline size: long headlines step down so they don't wrap to an
  // ugly second line in a constrained column.
  const baseMul = compact ? (sizes.isVertical ? 0.4 : 0.46) : 0.6;
  const lenFactor = headline.length > 22 ? 0.74 : headline.length > 15 ? 0.86 : 1;
  const headlineSize = Math.round(sizes.headline * baseMul * lenFactor);
  const maxW = compact ? (sizes.isVertical ? 760 : 620) : 720;
  return (
    <div style={{ maxWidth: maxW, textAlign: align, marginLeft: align === "center" ? "auto" : undefined, marginRight: align === "center" ? "auto" : undefined }}>
      {scene.eyebrow && (
        <div style={{
          fontFamily: FONT,
          fontSize: sizes.small,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: primaryColor,
          marginBottom: 18,
        }}>
          {scene.eyebrow}
        </div>
      )}
      <CinematicHeadline
        text={headline}
        frame={frame}
        fps={fps}
        duration={duration}
        color={textColor}
        size={headlineSize}
        align={align}
        audioMarkers={audioMarkers}
      />
      {subheadline && subheadline !== headline && (
        <CinematicBody
          text={subheadline}
          frame={frame}
          fps={fps}
          duration={duration}
          color={`${textColor}bb`}
          size={Math.round(sizes.body * 0.7)}
          align={align}
          baseDelay={16}
          audioMarkers={audioMarkers}
        />
      )}
    </div>
  );
};

const GlassPanel: React.FC<{
  children: React.ReactNode;
  primaryColor: string;
  style?: React.CSSProperties;
}> = ({ children, primaryColor, style }) => (
  <div style={{
    background: "linear-gradient(180deg, rgba(255,255,255,0.105), rgba(255,255,255,0.045))",
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: 28,
    boxShadow: `0 40px 120px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 90px ${primaryColor}12`,
    backdropFilter: "blur(18px)",
    ...style,
  }}>
    {children}
  </div>
);

const MetricTile: React.FC<{
  value: string;
  label: string;
  frame: number;
  fps: number;
  delay: number;
  primaryColor: string;
  textColor: string;
}> = ({ value, label, frame, fps, delay, primaryColor, textColor }) => {
  const s = getSpringProgress(frame, fps, delay, SNAPPY_SPRING);
  return (
    <GlassPanel primaryColor={primaryColor} style={{
      padding: "34px 40px",
      minWidth: 230,
      opacity: interpolate(s, [0, 0.25, 1], [0, 1, 1], { extrapolateLeft: "clamp" }),
      transform: `translateY(${interpolate(s, [0, 1], [28, 0])}px) scale(${interpolate(s, [0, 1], [0.96, 1])})`,
    }}>
      <div style={{ fontFamily: FONT, fontSize: 64, fontWeight: 850, color: textColor, letterSpacing: "-0.045em", lineHeight: 0.95 }}><AnimatedNumber value={value} frame={frame} fps={fps} delay={delay} /></div>
      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: `${textColor}99`, marginTop: 14 }}>{label}</div>
      <div style={{ height: 2, width: 68, borderRadius: 99, background: primaryColor, marginTop: 20, opacity: 0.8 }} />
    </GlassPanel>
  );
};

// ─── 1. HERO STATEMENT ──────────────────────────────────────────────
// The flagship. Clip-path wipe + word pop + camera push.

export const HeroStatementTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const headline = sceneHeadline(scene, 7);
  const subheadline = scene.subheadline || "";
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ textAlign: "center", maxWidth: sizes.isVertical ? "90%" : "82%" }}>
          {scene.eyebrow && (
            <div style={{ fontFamily: FONT, fontSize: sizes.small, fontWeight: 750, letterSpacing: "0.14em", textTransform: "uppercase", color: primaryColor, marginBottom: 22 }}>
              {scene.eyebrow}
            </div>
          )}
          <ClipHeadline text={headline} frame={frame} fps={fps} duration={duration} color={textColor} size={Math.round(sizes.headline * 0.9)} audioMarkers={audioMarkers} highlight={scene.highlight} highlightColor={primaryColor} />
          {subheadline && (
            <CinematicBody text={subheadline} frame={frame} fps={fps} duration={duration} color={`${textColor}b8`} size={Math.round(sizes.body * 0.72)} baseDelay={22} audioMarkers={audioMarkers} />
          )}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 2. PHONE DEMO ──────────────────────────────────────────────────

export const PhoneDemoTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const textLower = scene.text.toLowerCase();
  const floatY = getFloat(frame, fps, 5, 0.35);

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ transform: `translateY(${floatY}px)` }}>
          <PhoneFrame frame={frame} fps={fps} primaryColor={primaryColor}>
            {(textLower.includes("call") || textLower.includes("alert") || textLower.includes("notify")) && (
              <NotificationCard title="Incoming Call" body={scene.subtext || scene.text} frame={frame} fps={fps} delay={10} icon="📞" audioMarkers={audioMarkers} />
            )}
            {(textLower.includes("chat") || textLower.includes("ai") || textLower.includes("talk")) && (
              <div style={{ marginTop: 60, padding: "0 4px" }}>
                <ChatThread
                  messages={[{ text: scene.subtext || "Hi, I need help with...", direction: "left" }, { text: scene.text, direction: "right" }]}
                  frame={frame} fps={fps} baseDelay={15} primaryColor={primaryColor} audioMarkers={audioMarkers}
                />
              </div>
            )}
            {(textLower.includes("book") || textLower.includes("calendar") || textLower.includes("schedule")) && (
              <div style={{ marginTop: 40, padding: "0 4px" }}>
                <CalendarBlock time="Today, 2:00 PM" title={scene.text} frame={frame} fps={fps} delay={15} primaryColor={primaryColor} audioMarkers={audioMarkers} />
              </div>
            )}
            <div style={{ position: "absolute", bottom: 20, left: 14, right: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {textLower.includes("answer") && <StatusPill label="Answered" frame={frame} fps={fps} delay={40} variant="success" audioMarkers={audioMarkers} />}
              {textLower.includes("qualif") && <StatusPill label="Qualified" frame={frame} fps={fps} delay={50} variant="accent" primaryColor={primaryColor} audioMarkers={audioMarkers} />}
              {textLower.includes("book") && <StatusPill label="Booked" frame={frame} fps={fps} delay={60} variant="success" audioMarkers={audioMarkers} />}
            </div>
          </PhoneFrame>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 3. BROWSER DASHBOARD ───────────────────────────────────────────

export const BrowserDashboardTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const { isVertical } = sizes;

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <BrowserFrame frame={frame} fps={fps} url={scene.subtext || "dashboard"}>
          <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", gap: 16, marginBottom: 20 }}>
            <DashboardCard label="Calls Answered" value="2,847" trend={24} trendLabel="vs last month" frame={frame} fps={fps} delay={10} audioMarkers={audioMarkers} />
            <DashboardCard label="Jobs Booked" value="186" trend={18} trendLabel="vs last month" frame={frame} fps={fps} delay={18} audioMarkers={audioMarkers} />
            {!isVertical && <DashboardCard label="Revenue" value="$47K" trend={32} trendLabel="vs last month" frame={frame} fps={fps} delay={26} audioMarkers={audioMarkers} />}
          </div>
          <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", gap: 16 }}>
            <div style={{ flex: 1, background: "#111", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 12 }}>Call Volume</div>
              <BarChart data={[{ label: "M", value: 45 }, { label: "T", value: 62 }, { label: "W", value: 38 }, { label: "T", value: 71 }, { label: "F", value: 55 }]} frame={frame} fps={fps} delay={30} primaryColor={primaryColor} audioMarkers={audioMarkers} />
            </div>
            <div style={{ flex: 1, background: "#111", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 12 }}>Revenue Trend</div>
              <LineChart data={[30, 45, 35, 60, 55, 80, 75]} frame={frame} fps={fps} delay={35} primaryColor={primaryColor} audioMarkers={audioMarkers} />
            </div>
          </div>
        </BrowserFrame>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 4. STATS GRID ──────────────────────────────────────────────────

export const StatsGridTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const stats = scene.text.split(",").map(s => s.trim()).filter(Boolean);
  const parsed = stats.map(s => {
    const match = s.match(/([$€£]?[\d,.]+[KMBkmb]?)(?:\s+)?(.+)?/);
    return { value: match?.[1] || s, label: match?.[2] || "" };
  });

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", gap: sizes.isVertical ? 40 : 60, alignItems: "center" }}>
          {parsed.map((stat, i) => (
            <StatCard key={i} value={stat.value} label={stat.label} frame={frame} fps={fps} delay={i * 12} audioMarkers={audioMarkers} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 5. TESTIMONIAL QUOTE ───────────────────────────────────────────

export const TestimonialQuoteTemplate: React.FC<SceneProps> = ({
  scene, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <TestimonialCard
          quote={scene.text}
          name={scene.subtext?.split("-")[0]?.trim() || "Customer"}
          role={scene.subtext?.split("-")[1]?.trim() || "Verified User"}
          rating={5}
          frame={frame} fps={fps} delay={10}
          audioMarkers={audioMarkers}
        />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 6. BEFORE AFTER ────────────────────────────────────────────────

export const BeforeAfterTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const parts = scene.text.split(/vs|versus|→|->/).map(s => s.trim());

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <ComparisonCard
          beforeLabel="Before" beforeText={parts[0] || "Before"}
          afterLabel="After" afterText={parts[1] || "After"}
          frame={frame} fps={fps} delay={10}
          audioMarkers={audioMarkers}
        />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 7. WORKFLOW STEPS ──────────────────────────────────────────────

export const WorkflowStepsTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const steps = scene.text.split(/[→\-\>]/).map(s => s.trim()).filter(Boolean);

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <Stepper steps={steps.slice(0, 4)} activeStep={steps.length - 1} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} audioMarkers={audioMarkers} />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 8. PRICING TIERS ───────────────────────────────────────────────

export const PricingTiersTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const { isVertical } = sizes;

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", gap: 16, alignItems: "center" }}>
          <PricingCard plan="Starter" price="$29" period="/mo" features={["100 calls/mo", "Basic AI", "Email summaries"]} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} audioMarkers={audioMarkers} />
          <PricingCard plan="Pro" price="$99" period="/mo" features={["Unlimited calls", "Custom AI voice", "Calendar sync", "Priority routing"]} highlighted frame={frame} fps={fps} delay={18} primaryColor={primaryColor} audioMarkers={audioMarkers} />
          {!isVertical && <PricingCard plan="Enterprise" price="Custom" period="" features={["Dedicated agent", "API access", "White-label", "SLA"]} frame={frame} fps={fps} delay={26} primaryColor={primaryColor} audioMarkers={audioMarkers} />}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 9. FEATURE HIGHLIGHT ───────────────────────────────────────────

export const FeatureHighlightTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const features = [
    { icon: "📞", title: "AI Answering", description: "24/7 call handling" },
    { icon: "🎯", title: "Lead Qualify", description: "Smart filtering" },
    { icon: "📅", title: "Auto Booking", description: "Calendar integration" },
    { icon: "💰", title: "Revenue Track", description: "Real-time metrics" },
  ];

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "grid", gridTemplateColumns: sizes.isVertical ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 500 }}>
          {features.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} description={f.description} frame={frame} fps={fps} delay={10 + i * 8} primaryColor={primaryColor} audioMarkers={audioMarkers} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 10. TYPEWRITER COMMAND ─────────────────────────────────────────

export const TypewriterCommandTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <TypewriterInput text={scene.text} frame={frame} fps={fps} delay={10} speed={0.4} audioMarkers={audioMarkers} />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 11. SOCIAL PROOF BANNER ────────────────────────────────────────

export const SocialProofBannerTemplate: React.FC<SceneProps> = ({
  scene, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <SocialProofRow
          avatars={["A", "B", "C", "D"]}
          count={scene.text}
          label={scene.subtext || "businesses trust us"}
          frame={frame} fps={fps} delay={10}
          audioMarkers={audioMarkers}
        />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 12. CALENDAR BOOKING ───────────────────────────────────────────

export const CalendarBookingTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const { isVertical } = sizes;

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", gap: 20, alignItems: "center" }}>
          <CalendarMonth month="March 2025" highlightedDays={[15, 16, 17, 18, 22]} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} audioMarkers={audioMarkers} />
          <CalendarBlock time="Mar 15, 2:00 PM" title={scene.text} frame={frame} fps={fps} delay={25} primaryColor={primaryColor} audioMarkers={audioMarkers} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 13. REVENUE COUNTER ────────────────────────────────────────────

export const RevenueCounterTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <ProgressRing percent={85} label={scene.text} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} audioMarkers={audioMarkers} />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 14. BRAND LOCKUP ───────────────────────────────────────────────
// Clean CTA. Line grows with spring. Text reveals word-by-word.

export const BrandLockupTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const lineS = spring({ frame: Math.max(0, frame - 20), fps, config: SNAPPY_SPRING });
  const lineWidth = interpolate(lineS, [0, 1], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isUrl = scene.text.includes(".") && !scene.text.includes(" ");
  const mainText = isUrl ? (scene.subtext || "Get started") : scene.text;
  const urlText = isUrl ? scene.text : (scene.subtext || "");

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ textAlign: "center" }}>
          <CinematicHeadline text={mainText} frame={frame} fps={fps} duration={duration} color={textColor} size={Math.round(sizes.headline * 0.6)} delay={0} audioMarkers={audioMarkers} />
          <div style={{ height: 3, width: lineWidth, background: primaryColor, borderRadius: 2, margin: "28px auto" }} />
          {urlText && (
            <CinematicBody text={urlText} frame={frame} fps={fps} duration={duration} color={primaryColor} size={sizes.body} baseDelay={14} audioMarkers={audioMarkers} />
          )}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── Template Map ───────────────────────────────────────────────────

// Premium replacements used by the template map below. They keep the old
// components available, but render from the richer visual brief when present.

export const PremiumPhoneDemoTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const floatY = getFloat(frame, fps, 4, 0.28);
  const messages = scene.messages && scene.messages.length > 0 ? scene.messages : ["I need help today.", sceneHeadline(scene, 8)];
  const pills = scene.statusPills && scene.statusPills.length > 0 ? scene.statusPills : ["Answered", "Qualified", "Booked"];
  const shouldShowCalendar = `${scene.text} ${scene.headline || ""} ${scene.subheadline || ""}`.toLowerCase().match(/book|calendar|schedule|appointment/);
  const shot = firstImage(scene);

  // Real product screenshot supplied → show it in a phone, copy beside it.
  if (shot) {
    return (
      <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
          <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", alignItems: "center", justifyContent: "center", gap: sizes.isVertical ? 42 : 84, width: "100%" }}>
            <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align={sizes.isVertical ? "center" : "left"} compact={sizes.isVertical} audioMarkers={audioMarkers} />
            <ScreenshotFrame imageUrl={shot} variant="phone" frame={frame} fps={fps} delay={8} primaryColor={primaryColor} fit={scene.imageFit || "cover"} />
          </div>
        </AbsoluteFill>
      </SceneMotion>
    );
  }

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", alignItems: "center", justifyContent: "center", gap: sizes.isVertical ? 42 : 90, width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align={sizes.isVertical ? "center" : "left"} compact={sizes.isVertical} audioMarkers={audioMarkers} />
          <div style={{ transform: `translateY(${floatY}px)` }}>
            <PhoneFrame frame={frame} fps={fps} primaryColor={primaryColor}>
              <NotificationCard title="AI concierge" body={clampText(scene.subheadline || sceneHeadline(scene, 9), 62)} frame={frame} fps={fps} delay={10} icon="AI" audioMarkers={audioMarkers} />
              <div style={{ marginTop: 64, padding: "0 4px" }}>
                <ChatThread
                  messages={messages.slice(0, 2).map((message, i) => ({ text: clampText(message, 54), direction: i === 0 ? "left" as const : "right" as const }))}
                  frame={frame}
                  fps={fps}
                  baseDelay={16}
                  primaryColor={primaryColor}
                  audioMarkers={audioMarkers}
                />
              </div>
              {shouldShowCalendar && (
                <div style={{ marginTop: 8, padding: "0 4px" }}>
                  <CalendarBlock time="Today, 2:00 PM" title={clampText(scene.headline || "Meeting booked", 42)} frame={frame} fps={fps} delay={30} primaryColor={primaryColor} audioMarkers={audioMarkers} />
                </div>
              )}
              <div style={{ position: "absolute", bottom: 20, left: 14, right: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {pills.slice(0, 3).map((pill, i) => (
                  <StatusPill key={pill} label={pill} frame={frame} fps={fps} delay={40 + i * 8} variant={i === 1 ? "accent" : "success"} primaryColor={primaryColor} audioMarkers={audioMarkers} />
                ))}
              </div>
            </PhoneFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumBrowserDashboardTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const { isVertical } = sizes;
  const shot = firstImage(scene);
  const cards = scene.dashboardCards && scene.dashboardCards.length > 0
    ? scene.dashboardCards
    : [
        { label: "Leads captured", value: "2,847", trend: "+24%" },
        { label: "Qualified", value: "68%", trend: "+18%" },
        { label: "Pipeline", value: "$47K", trend: "+32%" },
      ];

  // Real product screenshot supplied → show it in a browser with copy above.
  if (shot) {
    return (
      <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: isVertical ? 30 : 40, width: "100%", alignItems: "center" }}>
            <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
            <ScreenshotFrame imageUrl={shot} variant={(scene.device as DeviceVariant) || "browser"} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} url={scene.url || "app.command-center.ai"} fit={scene.imageFit || "cover"} maxHeightFraction={sizes.isVertical ? 0.52 : 0.62} />
          </div>
        </AbsoluteFill>
      </SceneMotion>
    );
  }

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, width: "100%", alignItems: "center" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <GlassPanel primaryColor={primaryColor} style={{ padding: 14, width: isVertical ? "94%" : "82%", maxWidth: 1040 }}>
            <BrowserFrame frame={frame} fps={fps} url={scene.url || "app.command-center.ai"}>
              <div style={{ display: "grid", gridTemplateColumns: isVertical ? "1fr" : "0.9fr 1.1fr", gap: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {cards.slice(0, isVertical ? 2 : 3).map((card, i) => (
                    <DashboardCard key={card.label} label={card.label} value={card.value} trend={Number(String(card.trend || "").replace(/[^0-9.-]/g, "")) || undefined} trendLabel="live" frame={frame} fps={fps} delay={12 + i * 8} audioMarkers={audioMarkers} />
                  ))}
                </div>
                <div style={{ background: "#111", borderRadius: 16, padding: 22, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {scene.chartLabel || "Conversion trend"}
                  </div>
                  <LineChart data={[22, 34, 31, 48, 56, 72, 86]} frame={frame} fps={fps} delay={30} primaryColor={primaryColor} audioMarkers={audioMarkers} />
                  <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <StatusPill label="Synced" frame={frame} fps={fps} delay={44} variant="accent" primaryColor={primaryColor} audioMarkers={audioMarkers} />
                    <StatusPill label="Ready" frame={frame} fps={fps} delay={52} variant="success" primaryColor={primaryColor} audioMarkers={audioMarkers} />
                  </div>
                </div>
              </div>
            </BrowserFrame>
          </GlassPanel>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumStatsGridTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const metrics = scene.metrics && scene.metrics.length > 0 ? scene.metrics : defaultMetrics;
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 46, alignItems: "center", width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", gap: 20, alignItems: "stretch", justifyContent: "center" }}>
            {metrics.slice(0, 3).map((metric, i) => (
              <MetricTile key={`${metric.value}-${metric.label}`} value={metric.value} label={metric.label} frame={frame} fps={fps} delay={18 + i * 9} primaryColor={primaryColor} textColor={textColor} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumBeforeAfterTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const parts = scene.text.split(/vs|versus|->/i).map(s => s.trim());
  const before = scene.before || parts[0] || "Manual follow-up";
  const after = scene.after || parts[1] || sceneHeadline(scene, 7);
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 38, alignItems: "center" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <ComparisonCard beforeLabel="Before" beforeText={before} afterLabel="After" afterText={after} frame={frame} fps={fps} delay={20} audioMarkers={audioMarkers} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumWorkflowStepsTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const steps = scene.steps && scene.steps.length > 0 ? scene.steps : scene.text.split(/->|to|then/i).map(s => s.trim()).filter(Boolean).slice(0, 3);
  const safeSteps = steps.length >= 2 ? steps : ["Capture", "Qualify", "Book"];
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 44, alignItems: "center", width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <GlassPanel primaryColor={primaryColor} style={{ padding: sizes.isVertical ? "30px 22px" : "38px 48px" }}>
            <Stepper steps={safeSteps.slice(0, 4)} activeStep={safeSteps.length - 1} frame={frame} fps={fps} delay={16} primaryColor={primaryColor} audioMarkers={audioMarkers} />
          </GlassPanel>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumFeatureHighlightTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const features = scene.features && scene.features.length > 0 ? scene.features : defaultFeatures;
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, alignItems: "center", width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <div style={{ display: "grid", gridTemplateColumns: sizes.isVertical ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 760, width: "100%" }}>
            {features.slice(0, 4).map((feature, i) => (
              <FeatureCard key={feature.title} icon={`0${i + 1}`} title={feature.title} description={feature.description || ""} frame={frame} fps={fps} delay={16 + i * 7} primaryColor={primaryColor} audioMarkers={audioMarkers} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumTypewriterCommandTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const command = scene.command || `Automate: ${sceneHeadline(scene, 8)}`;
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 36, alignItems: "center", width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <GlassPanel primaryColor={primaryColor} style={{ padding: 18, width: sizes.isVertical ? "92%" : 720 }}>
            <TypewriterInput text={command} frame={frame} fps={fps} delay={16} speed={0.6} audioMarkers={audioMarkers} />
          </GlassPanel>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumRevenueCounterTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const metric = scene.metrics?.[0] || { value: scene.headline || "$47K", label: scene.subheadline || "new pipeline created" };
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, alignItems: "center" }}>
          <MetricTile value={metric.value} label={metric.label} frame={frame} fps={fps} delay={8} primaryColor={primaryColor} textColor={textColor} />
          {scene.subheadline && (
            <CinematicBody text={scene.subheadline} frame={frame} fps={fps} duration={duration} color={`${textColor}aa`} size={Math.round(sizes.body * 0.7)} baseDelay={20} audioMarkers={audioMarkers} />
          )}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumPricingTiersTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const plans = scene.plans && scene.plans.length > 0 ? scene.plans : defaultPlans;
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", gap: 16, width: "100%", maxWidth: 920 }}>
            {plans.slice(0, sizes.isVertical ? 2 : 3).map((plan, i) => (
              <PricingCard key={plan.name} plan={plan.name} price={plan.price} period="" features={plan.features || []} highlighted={i === 1 || plans.length === 1} frame={frame} fps={fps} delay={16 + i * 8} primaryColor={primaryColor} audioMarkers={audioMarkers} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumSocialProofBannerTemplate: React.FC<SceneProps> = (props) => (
  <PremiumStatsGridTemplate
    {...props}
    scene={{ ...props.scene, metrics: props.scene.metrics && props.scene.metrics.length > 0 ? props.scene.metrics : [{ value: "1,200+", label: props.scene.headline || "teams onboarded" }] }}
  />
);

export const PremiumCalendarBookingTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", gap: 34, alignItems: "center" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} compact audioMarkers={audioMarkers} />
          <GlassPanel primaryColor={primaryColor} style={{ padding: 22 }}>
            <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", gap: 20, alignItems: "center" }}>
              <CalendarMonth month="March" highlightedDays={[15, 16, 17, 18, 22]} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} audioMarkers={audioMarkers} />
              <CalendarBlock time="Tomorrow, 10:30 AM" title={scene.headline || "Demo booked"} frame={frame} fps={fps} delay={26} primaryColor={primaryColor} audioMarkers={audioMarkers} />
            </div>
          </GlassPanel>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumTestimonialQuoteTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const attribution = scene.attribution || "Customer";
  const [name, role] = attribution.split("-").map(p => p.trim());
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "center" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <TestimonialCard quote={scene.quote || scene.subheadline || scene.text} name={name || "Customer"} role={role || "Verified user"} rating={5} frame={frame} fps={fps} delay={18} audioMarkers={audioMarkers} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const PremiumBrandLockupTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers, logoUrl,
}) => {
  const sizes = useSceneSizes();
  const lineS = spring({ frame: Math.max(0, frame - 20), fps, config: SNAPPY_SPRING });
  const lineWidth = interpolate(lineS, [0, 1], [0, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mainText = scene.cta || scene.headline || "Launch with confidence";
  const urlText = scene.url || scene.subheadline || "";
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ textAlign: "center", maxWidth: 860, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {logoUrl && (
            <div style={{ marginBottom: 34 }}>
              <LogoLockup logoUrl={logoUrl} frame={frame} fps={fps} delay={0} primaryColor={primaryColor} textColor={textColor} heightFraction={0.16} />
            </div>
          )}
          {scene.eyebrow && <div style={{ fontFamily: FONT, fontSize: sizes.small, fontWeight: 750, color: primaryColor, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 18 }}>{scene.eyebrow}</div>}
          <CinematicHeadline text={mainText} frame={frame} fps={fps} duration={duration} color={textColor} size={Math.round(sizes.headline * 0.58)} delay={logoUrl ? 10 : 0} audioMarkers={audioMarkers} />
          <div style={{ height: 3, width: lineWidth, background: primaryColor, borderRadius: 2, margin: "30px auto" }} />
          {urlText && (
            <CinematicBody text={urlText} frame={frame} fps={fps} duration={duration} color={primaryColor} size={Math.round(sizes.body * 0.72)} baseDelay={14} audioMarkers={audioMarkers} />
          )}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── IMAGE-DRIVEN TEMPLATES ─────────────────────────────────────────
// These exist to make real product assets the hero of a scene, the way
// premium SaaS launch films (and the Envato references) actually look.

// PRODUCT SHOWCASE — copy on one side, a device-framed screenshot on the
// other, with a 3D tilt that settles flat. Falls back to a tasteful copy
// card if no image is supplied.
export const ProductShowcaseTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const shot = firstImage(scene);
  const variant = (scene.device as DeviceVariant) || "browser";
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", alignItems: "center", justifyContent: "center", gap: sizes.isVertical ? 40 : 80, width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align={sizes.isVertical ? "center" : "left"} compact={sizes.isVertical} audioMarkers={audioMarkers} />
          {shot ? (
            <ScreenshotFrame
              imageUrl={shot}
              variant={variant}
              frame={frame}
              fps={fps}
              delay={8}
              primaryColor={primaryColor}
              url={scene.url || "app.example.com"}
              fit={scene.imageFit || "cover"}
              tilt={variant === "phone" ? 0 : 8}
              widthFraction={sizes.isVertical ? 0.92 : 0.5}
            />
          ) : (
            <GlassPanel primaryColor={primaryColor} style={{ padding: "60px 70px", minWidth: 320 }}>
              <div style={{ fontFamily: FONT, fontSize: Math.round(sizes.headline * 0.4), fontWeight: 850, color: textColor, letterSpacing: "-0.04em" }}>
                {scene.headline || sceneHeadline(scene, 4)}
              </div>
            </GlassPanel>
          )}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// HERO IMAGE — a single product shot as the centerpiece, large and
// floating over the stage with the headline beneath it.
export const HeroImageTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const shot = firstImage(scene);
  const variant = (scene.device as DeviceVariant) || "window";
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: sizes.isVertical ? 32 : 44, alignItems: "center", width: "100%" }}>
          {scene.eyebrow && (
            <div style={{ fontFamily: FONT, fontSize: sizes.small, fontWeight: 750, letterSpacing: "0.14em", textTransform: "uppercase", color: primaryColor }}>{scene.eyebrow}</div>
          )}
          {shot ? (
            <ScreenshotFrame imageUrl={shot} variant={variant} frame={frame} fps={fps} delay={6} primaryColor={primaryColor} url={scene.url || "app.example.com"} fit={scene.imageFit || "cover"} tilt={6} widthFraction={sizes.isVertical ? 0.9 : 0.62} maxHeightFraction={sizes.isVertical ? 0.5 : 0.56} />
          ) : null}
          <div style={{ textAlign: "center", maxWidth: sizes.isVertical ? "92%" : "76%" }}>
            <CinematicHeadline text={sceneHeadline(scene, 7)} frame={frame} fps={fps} duration={duration} color={textColor} size={Math.round(sizes.headline * 0.52)} delay={shot ? 14 : 0} audioMarkers={audioMarkers} />
            {scene.subheadline && (
              <CinematicBody text={scene.subheadline} frame={frame} fps={fps} duration={duration} color={`${textColor}b8`} size={Math.round(sizes.body * 0.66)} baseDelay={20} audioMarkers={audioMarkers} />
            )}
          </div>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// SCREENSHOT CAROUSEL — multiple product shots fanned in 3D depth.
export const ScreenshotCarouselTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const images = sceneImages(scene);
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: sizes.isVertical ? 36 : 50, alignItems: "center", width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          {images.length > 0 ? (
            <ScreenshotStack images={images} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} />
          ) : null}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// LOGO REVEAL — the brand logo as the on-screen subject, large and centered.
export const LogoRevealTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers, logoUrl,
}) => {
  const sizes = useSceneSizes();
  const mark = logoUrl || firstImage(scene);
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        {mark ? (
          <LogoLockup logoUrl={mark} wordmark={scene.headline || ""} frame={frame} fps={fps} delay={0} primaryColor={primaryColor} textColor={textColor} heightFraction={0.26} />
        ) : (
          <CinematicHeadline text={scene.headline || sceneHeadline(scene, 4)} frame={frame} fps={fps} duration={duration} color={textColor} size={Math.round(sizes.headline * 0.8)} audioMarkers={audioMarkers} />
        )}
      </AbsoluteFill>
    </SceneMotion>
  );
};

// FEATURE SPLIT — copy + a tightly-cropped screenshot detail, alternating side.
export const FeatureSplitTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const shot = firstImage(scene);
  if (!shot) {
    return <PremiumFeatureHighlightTemplate scene={scene} primaryColor={primaryColor} secondaryColor={primaryColor} textColor={textColor} accentColor={primaryColor} bgColor="#000" frame={frame} fps={fps} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers} />;
  }
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row-reverse", alignItems: "center", justifyContent: "center", gap: sizes.isVertical ? 36 : 80, width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align={sizes.isVertical ? "center" : "left"} compact={sizes.isVertical} audioMarkers={audioMarkers} />
          <ScreenshotFrame imageUrl={shot} variant={(scene.device as DeviceVariant) || "bare"} frame={frame} fps={fps} delay={8} primaryColor={primaryColor} fit={scene.imageFit || "cover"} widthFraction={sizes.isVertical ? 0.9 : 0.46} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// AI CALL — the hero visual for a voice-AI product. Copy + a live call panel
// with a reactive waveform, streaming transcript, and outcome chips.
export const AICallTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const messages = scene.messages && scene.messages.length > 0
    ? scene.messages
    : ["Hi, do you have any openings today?", "Absolutely — I can get you booked for 2 PM."];
  const pills = scene.statusPills && scene.statusPills.length > 0
    ? scene.statusPills
    : ["Answered", "Qualified", "Booked"];
  const caller = scene.attribution || scene.eyebrow || "Incoming call";
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", alignItems: "center", justifyContent: "center", gap: sizes.isVertical ? 40 : 80, width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align={sizes.isVertical ? "center" : "left"} compact={sizes.isVertical} audioMarkers={audioMarkers} />
          <AICallPanel frame={frame} fps={fps} primaryColor={primaryColor} delay={8} caller={caller} callerSub="AI Assistant • Live" messages={messages} pills={pills} audioMarkers={audioMarkers} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// CALL TRANSCRIPT — a clean transcript card with speaker turns streaming in.
export const CallTranscriptTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const src = scene.messages && scene.messages.length > 0
    ? scene.messages
    : ["Hi, I need someone to look at a leak today.", "I can help with that. Are mornings or afternoons better?", "Afternoon works.", "Great — you're booked for 2 PM today."];
  const turns = src.slice(0, 5).map((text, i) => ({ speaker: i % 2 === 1 ? "AI Agent" : "Caller", text }));
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: sizes.isVertical ? 32 : 42, alignItems: "center", width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <CallTranscriptPanel frame={frame} fps={fps} primaryColor={primaryColor} delay={10} title={scene.chartLabel || "Live transcript"} turns={turns} audioMarkers={audioMarkers} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// LOGO WALL — "trusted by teams" grid of customer/integration logos.
export const LogoWallTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection, entranceStyle, audioMarkers,
}) => {
  const sizes = useSceneSizes();
  const logos = sceneImages(scene);
  // Fall back to named marks from steps/features/text if no logos uploaded.
  const labels = (scene.steps && scene.steps.length > 0 ? scene.steps
    : scene.features && scene.features.length > 0 ? scene.features.map(f => f.title)
    : scene.text.split(/[,•|]/).map(s => s.trim()).filter(Boolean)).slice(0, 8);
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection} entranceStyle={entranceStyle} audioMarkers={audioMarkers}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: sizes.isVertical ? 36 : 48, alignItems: "center", width: "100%" }}>
          <PremiumCopy scene={scene} frame={frame} fps={fps} duration={duration} textColor={textColor} primaryColor={primaryColor} align="center" compact audioMarkers={audioMarkers} />
          <LogoWall logos={logos} labels={labels} frame={frame} fps={fps} delay={14} primaryColor={primaryColor} textColor={textColor} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const templateComponentMap: Record<string, React.FC<SceneProps>> = {
  heroStatement: HeroStatementTemplate,
  phoneDemo: PremiumPhoneDemoTemplate,
  browserDashboard: PremiumBrowserDashboardTemplate,
  statsGrid: PremiumStatsGridTemplate,
  testimonialQuote: PremiumTestimonialQuoteTemplate,
  beforeAfter: PremiumBeforeAfterTemplate,
  workflowSteps: PremiumWorkflowStepsTemplate,
  pricingTiers: PremiumPricingTiersTemplate,
  featureHighlight: PremiumFeatureHighlightTemplate,
  typewriterCommand: PremiumTypewriterCommandTemplate,
  socialProofBanner: PremiumSocialProofBannerTemplate,
  calendarBooking: PremiumCalendarBookingTemplate,
  revenueCounter: PremiumRevenueCounterTemplate,
  brandLockup: PremiumBrandLockupTemplate,
  productShowcase: ProductShowcaseTemplate,
  heroImage: HeroImageTemplate,
  screenshotCarousel: ScreenshotCarouselTemplate,
  logoReveal: LogoRevealTemplate,
  featureSplit: FeatureSplitTemplate,
  logoWall: LogoWallTemplate,
  aiCall: AICallTemplate,
  callTranscript: CallTranscriptTemplate,
};
