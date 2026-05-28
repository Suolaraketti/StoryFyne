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
  SocialProofRow, StatusPill,
} from "./ui-mockups";

// ─── 1. HERO STATEMENT ──────────────────────────────────────────────
// The flagship. Clip-path wipe + word pop + camera push.

export const HeroStatementTemplate: React.FC<SceneProps> = ({
  scene, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <ClipHeadline text={scene.text} frame={frame} fps={fps} duration={duration} color={textColor} size={sizes.headline} />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 2. PHONE DEMO ──────────────────────────────────────────────────

export const PhoneDemoTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  const textLower = scene.text.toLowerCase();
  const floatY = getFloat(frame, fps, 5, 0.35);

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ transform: `translateY(${floatY}px)` }}>
          <PhoneFrame frame={frame} fps={fps} primaryColor={primaryColor}>
            {(textLower.includes("call") || textLower.includes("alert") || textLower.includes("notify")) && (
              <NotificationCard title="Incoming Call" body={scene.subtext || scene.text} frame={frame} fps={fps} delay={10} icon="📞" />
            )}
            {(textLower.includes("chat") || textLower.includes("ai") || textLower.includes("talk")) && (
              <div style={{ marginTop: 60, padding: "0 4px" }}>
                <ChatThread
                  messages={[{ text: scene.subtext || "Hi, I need help with...", direction: "left" }, { text: scene.text, direction: "right" }]}
                  frame={frame} fps={fps} baseDelay={15} primaryColor={primaryColor}
                />
              </div>
            )}
            {(textLower.includes("book") || textLower.includes("calendar") || textLower.includes("schedule")) && (
              <div style={{ marginTop: 40, padding: "0 4px" }}>
                <CalendarBlock time="Today, 2:00 PM" title={scene.text} frame={frame} fps={fps} delay={15} primaryColor={primaryColor} />
              </div>
            )}
            <div style={{ position: "absolute", bottom: 20, left: 14, right: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {textLower.includes("answer") && <StatusPill label="Answered" frame={frame} fps={fps} delay={40} variant="success" />}
              {textLower.includes("qualif") && <StatusPill label="Qualified" frame={frame} fps={fps} delay={50} variant="accent" primaryColor={primaryColor} />}
              {textLower.includes("book") && <StatusPill label="Booked" frame={frame} fps={fps} delay={60} variant="success" />}
            </div>
          </PhoneFrame>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 3. BROWSER DASHBOARD ───────────────────────────────────────────

export const BrowserDashboardTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  const { isVertical } = sizes;

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <BrowserFrame frame={frame} fps={fps} url={scene.subtext || "dashboard"}>
          <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", gap: 16, marginBottom: 20 }}>
            <DashboardCard label="Calls Answered" value="2,847" trend={24} trendLabel="vs last month" frame={frame} fps={fps} delay={10} />
            <DashboardCard label="Jobs Booked" value="186" trend={18} trendLabel="vs last month" frame={frame} fps={fps} delay={18} />
            {!isVertical && <DashboardCard label="Revenue" value="$47K" trend={32} trendLabel="vs last month" frame={frame} fps={fps} delay={26} />}
          </div>
          <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", gap: 16 }}>
            <div style={{ flex: 1, background: "#111", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 12 }}>Call Volume</div>
              <BarChart data={[{ label: "M", value: 45 }, { label: "T", value: 62 }, { label: "W", value: 38 }, { label: "T", value: 71 }, { label: "F", value: 55 }]} frame={frame} fps={fps} delay={30} primaryColor={primaryColor} />
            </div>
            <div style={{ flex: 1, background: "#111", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 12 }}>Revenue Trend</div>
              <LineChart data={[30, 45, 35, 60, 55, 80, 75]} frame={frame} fps={fps} delay={35} primaryColor={primaryColor} />
            </div>
          </div>
        </BrowserFrame>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 4. STATS GRID ──────────────────────────────────────────────────

export const StatsGridTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  const stats = scene.text.split(",").map(s => s.trim()).filter(Boolean);
  const parsed = stats.map(s => {
    const match = s.match(/([$€£]?[\d,.]+[KMBkmb]?)(?:\s+)?(.+)?/);
    return { value: match?.[1] || s, label: match?.[2] || "" };
  });

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: sizes.isVertical ? "column" : "row", gap: sizes.isVertical ? 40 : 60, alignItems: "center" }}>
          {parsed.map((stat, i) => (
            <StatCard key={i} value={stat.value} label={stat.label} frame={frame} fps={fps} delay={i * 12} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 5. TESTIMONIAL QUOTE ───────────────────────────────────────────

export const TestimonialQuoteTemplate: React.FC<SceneProps> = ({
  scene, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <TestimonialCard
          quote={scene.text}
          name={scene.subtext?.split("-")[0]?.trim() || "Customer"}
          role={scene.subtext?.split("-")[1]?.trim() || "Verified User"}
          rating={5}
          frame={frame} fps={fps} delay={10}
        />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 6. BEFORE AFTER ────────────────────────────────────────────────

export const BeforeAfterTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  const parts = scene.text.split(/vs|versus|→|->/).map(s => s.trim());

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <ComparisonCard
          beforeLabel="Before" beforeText={parts[0] || "Before"}
          afterLabel="After" afterText={parts[1] || "After"}
          frame={frame} fps={fps} delay={10}
        />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 7. WORKFLOW STEPS ──────────────────────────────────────────────

export const WorkflowStepsTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  const steps = scene.text.split(/[→\-\>]/).map(s => s.trim()).filter(Boolean);

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <Stepper steps={steps.slice(0, 4)} activeStep={steps.length - 1} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 8. PRICING TIERS ───────────────────────────────────────────────

export const PricingTiersTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  const { isVertical } = sizes;

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", gap: 16, alignItems: "center" }}>
          <PricingCard plan="Starter" price="$29" period="/mo" features={["100 calls/mo", "Basic AI", "Email summaries"]} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} />
          <PricingCard plan="Pro" price="$99" period="/mo" features={["Unlimited calls", "Custom AI voice", "Calendar sync", "Priority routing"]} highlighted frame={frame} fps={fps} delay={18} primaryColor={primaryColor} />
          {!isVertical && <PricingCard plan="Enterprise" price="Custom" period="" features={["Dedicated agent", "API access", "White-label", "SLA"]} frame={frame} fps={fps} delay={26} primaryColor={primaryColor} />}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 9. FEATURE HIGHLIGHT ───────────────────────────────────────────

export const FeatureHighlightTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  const features = [
    { icon: "📞", title: "AI Answering", description: "24/7 call handling" },
    { icon: "🎯", title: "Lead Qualify", description: "Smart filtering" },
    { icon: "📅", title: "Auto Booking", description: "Calendar integration" },
    { icon: "💰", title: "Revenue Track", description: "Real-time metrics" },
  ];

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "grid", gridTemplateColumns: sizes.isVertical ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 500 }}>
          {features.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} description={f.description} frame={frame} fps={fps} delay={10 + i * 8} primaryColor={primaryColor} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 10. TYPEWRITER COMMAND ─────────────────────────────────────────

export const TypewriterCommandTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <TypewriterInput text={scene.text} frame={frame} fps={fps} delay={10} speed={0.4} />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 11. SOCIAL PROOF BANNER ────────────────────────────────────────

export const SocialProofBannerTemplate: React.FC<SceneProps> = ({
  scene, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <SocialProofRow
          avatars={["A", "B", "C", "D"]}
          count={scene.text}
          label={scene.subtext || "businesses trust us"}
          frame={frame} fps={fps} delay={10}
        />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 12. CALENDAR BOOKING ───────────────────────────────────────────

export const CalendarBookingTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  const { isVertical } = sizes;

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", gap: 20, alignItems: "center" }}>
          <CalendarMonth month="March 2025" highlightedDays={[15, 16, 17, 18, 22]} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} />
          <CalendarBlock time="Mar 15, 2:00 PM" title={scene.text} frame={frame} fps={fps} delay={25} primaryColor={primaryColor} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 13. REVENUE COUNTER ────────────────────────────────────────────

export const RevenueCounterTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <ProgressRing percent={85} label={scene.text} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} />
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── 14. BRAND LOCKUP ───────────────────────────────────────────────
// Clean CTA. Line grows with spring. Text reveals word-by-word.

export const BrandLockupTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration, entranceDirection, exitDirection,
}) => {
  const sizes = useSceneSizes();
  const lineS = spring({ frame: Math.max(0, frame - 20), fps, config: SNAPPY_SPRING });
  const lineWidth = interpolate(lineS, [0, 1], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isUrl = scene.text.includes(".") && !scene.text.includes(" ");
  const mainText = isUrl ? (scene.subtext || "Get started") : scene.text;
  const urlText = isUrl ? scene.text : (scene.subtext || "");

  return (
    <SceneMotion frame={frame} duration={duration} entranceDirection={entranceDirection} exitDirection={exitDirection}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${sizes.padX}` }}>
        <div style={{ textAlign: "center" }}>
          <CinematicHeadline text={mainText} frame={frame} fps={fps} duration={duration} color={textColor} size={Math.round(sizes.headline * 0.6)} delay={0} />
          <div style={{ height: 3, width: lineWidth, background: primaryColor, borderRadius: 2, margin: "28px auto" }} />
          {urlText && (
            <CinematicBody text={urlText} frame={frame} fps={fps} duration={duration} color={primaryColor} size={sizes.body} baseDelay={14} />
          )}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

// ─── Template Map ───────────────────────────────────────────────────

export const templateComponentMap: Record<string, React.FC<SceneProps>> = {
  heroStatement: HeroStatementTemplate,
  phoneDemo: PhoneDemoTemplate,
  browserDashboard: BrowserDashboardTemplate,
  statsGrid: StatsGridTemplate,
  testimonialQuote: TestimonialQuoteTemplate,
  beforeAfter: BeforeAfterTemplate,
  workflowSteps: WorkflowStepsTemplate,
  pricingTiers: PricingTiersTemplate,
  featureHighlight: FeatureHighlightTemplate,
  typewriterCommand: TypewriterCommandTemplate,
  socialProofBanner: SocialProofBannerTemplate,
  calendarBooking: CalendarBookingTemplate,
  revenueCounter: RevenueCounterTemplate,
  brandLockup: BrandLockupTemplate,
};
