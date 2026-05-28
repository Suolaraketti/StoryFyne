// ─── Scene Templates ────────────────────────────────────────────────
// Pre-built complete scene layouts. The AI picks a template per scene.
// Each template combines backgrounds, UI mockups, and motion into one
// belief-advancing frame.

import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { getEntrance, getExit, getSpringProgress, TRANSITION_FRAMES, DEFAULT_SPRING } from "./animations";
import { SceneProps } from "./scenes";
import {
  PhoneFrame, BrowserFrame, ChatBubble, ChatThread, NotificationCard,
  DashboardCard, StatCard, TestimonialCard, PricingCard, FeatureCard,
  ComparisonCard, CalendarBlock, CalendarMonth, InvoiceRow,
  BarChart, LineChart, ProgressRing,
  TypewriterInput, SearchBar, ToggleSwitch, Button,
  Stepper, Timeline, TabBar,
  Avatar, RatingStars, SocialProofRow, StatusPill, Tag,
} from "./ui-mockups";

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ─── 1. HERO STATEMENT ──────────────────────────────────────────────
// One massive thought. Nothing else. Maximum impact.

export const HeroStatementTemplate: React.FC<SceneProps> = ({
  scene, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "down", TRANSITION_FRAMES, fps);
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
      <div
        style={{
          fontFamily: FONT,
          fontSize: scene.text.length < 20 ? "110px" : scene.text.length < 40 ? "84px" : "68px",
          fontWeight: 800,
          lineHeight: 1.05,
          color: textColor,
          letterSpacing: "-0.035em",
          textWrap: "balance",
          textAlign: "center",
        }}
      >
        {scene.text}
      </div>
    </AbsoluteFill>
  );
};

// ─── 2. PHONE DEMO ──────────────────────────────────────────────────
// Phone frame showing app in action. Chat, notifications, or calendar.

export const PhoneDemoTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "right", TRANSITION_FRAMES, fps);
  const textLower = scene.text.toLowerCase();

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
        {/* Notification for call/alert scenes */}
        {(textLower.includes("call") || textLower.includes("alert") || textLower.includes("notify")) && (
          <NotificationCard
            title={scene.subtext || "Incoming"}
            body={scene.text}
            frame={frame}
            fps={fps}
            delay={10}
            icon="📞"
          />
        )}

        {/* Chat thread for AI/conversation scenes */}
        {(textLower.includes("chat") || textLower.includes("ai") || textLower.includes("talk") || textLower.includes("speak")) && (
          <div style={{ marginTop: textLower.includes("call") ? 100 : 20, padding: "0 4px" }}>
            <ChatThread
              messages={[
                { text: scene.subtext || "Hi, I need help with...", direction: "left" },
                { text: scene.text, direction: "right" },
              ]}
              frame={frame}
              fps={fps}
              baseDelay={15}
              primaryColor={primaryColor}
            />
          </div>
        )}

        {/* Calendar for booking scenes */}
        {(textLower.includes("book") || textLower.includes("calendar") || textLower.includes("schedule")) && (
          <div style={{ marginTop: 20, padding: "0 4px" }}>
            <CalendarBlock
              time="Today, 2:00 PM"
              title={scene.text}
              frame={frame}
              fps={fps}
              delay={15}
              primaryColor={primaryColor}
            />
          </div>
        )}

        {/* Status pills at bottom */}
        <div style={{ position: "absolute", bottom: 20, left: 14, right: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {textLower.includes("answer") && <StatusPill label="Answered" frame={frame} fps={fps} delay={40} variant="success" />}
          {textLower.includes("qualif") && <StatusPill label="Qualified" frame={frame} fps={fps} delay={50} variant="accent" primaryColor={primaryColor} />}
          {textLower.includes("book") && <StatusPill label="Booked" frame={frame} fps={fps} delay={60} variant="success" />}
        </div>
      </PhoneFrame>
    </AbsoluteFill>
  );
};

// ─── 3. BROWSER DASHBOARD ───────────────────────────────────────────
// Browser frame showing SaaS dashboard with stats and charts.

export const BrowserDashboardTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "right", TRANSITION_FRAMES, fps);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 5%",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateX(${exit.x}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <BrowserFrame frame={frame} fps={fps} url={scene.subtext || "dashboard"}>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <DashboardCard label="Calls Answered" value="2,847" trend={24} trendLabel="vs last month" frame={frame} fps={fps} delay={10} />
          <DashboardCard label="Jobs Booked" value="186" trend={18} trendLabel="vs last month" frame={frame} fps={fps} delay={18} />
          <DashboardCard label="Revenue" value="$47K" trend={32} trendLabel="vs last month" frame={frame} fps={fps} delay={26} />
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 12 }}>Call Volume</div>
            <BarChart data={[{ label: "M", value: 45 }, { label: "T", value: 62 }, { label: "W", value: 38 }, { label: "T", value: 71 }, { label: "F", value: 55 }]} frame={frame} fps={fps} delay={30} primaryColor={primaryColor} />
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 12 }}>Revenue Trend</div>
            <LineChart data={[30, 45, 35, 60, 55, 80, 75]} frame={frame} fps={fps} delay={35} primaryColor={primaryColor} />
          </div>
        </div>
      </BrowserFrame>
    </AbsoluteFill>
  );
};

// ─── 4. STATS GRID ──────────────────────────────────────────────────
// 3 big numbers in a row. High impact metrics.

export const StatsGridTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "left", TRANSITION_FRAMES, fps);

  // Parse numbers from text like "2,847 calls, 186 jobs, $47K revenue"
  const stats = scene.text.split(",").map((s) => s.trim()).filter(Boolean);
  const parsed = stats.map((s) => {
    const match = s.match(/([$€£]?[\d,.]+[KMBkmb]?)(?:\s+)?(.+)?/);
    return { value: match?.[1] || s, label: match?.[2] || "" };
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: 60,
        flexDirection: "row",
        padding: "0 8%",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateX(${exit.x}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      {parsed.map((stat, i) => (
        <StatCard
          key={i}
          value={stat.value}
          label={stat.label}
          frame={frame}
          fps={fps}
          delay={i * 12}
        />
      ))}
    </AbsoluteFill>
  );
};

// ─── 5. TESTIMONIAL QUOTE ───────────────────────────────────────────
// Social proof with quote, avatar, and rating.

export const TestimonialQuoteTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "down", TRANSITION_FRAMES, fps);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 10%",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateY(${entrance.y + exit.y}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <TestimonialCard
        quote={scene.text}
        name={scene.subtext?.split("-")[0]?.trim() || "Customer"}
        role={scene.subtext?.split("-")[1]?.trim() || "Verified User"}
        rating={5}
        frame={frame}
        fps={fps}
        delay={10}
      />
    </AbsoluteFill>
  );
};

// ─── 6. BEFORE AFTER ────────────────────────────────────────────────
// Split comparison showing old vs new.

export const BeforeAfterTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "right", TRANSITION_FRAMES, fps);

  const parts = scene.text.split("vs|versus|→|->").map((s) => s.trim());
  const before = parts[0] || "Before";
  const after = parts[1] || "After";

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
      <ComparisonCard
        beforeLabel="Before"
        beforeText={before}
        afterLabel="After"
        afterText={after}
        frame={frame}
        fps={fps}
        delay={10}
      />
    </AbsoluteFill>
  );
};

// ─── 7. WORKFLOW STEPS ──────────────────────────────────────────────
// 3-step horizontal flow with connecting lines.

export const WorkflowStepsTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "up", TRANSITION_FRAMES, fps);

  const steps = scene.text.split(/[→\-\>]/).map((s) => s.trim()).filter(Boolean);

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
      <Stepper steps={steps.slice(0, 4)} activeStep={steps.length - 1} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} />
    </AbsoluteFill>
  );
};

// ─── 8. PRICING TIERS ───────────────────────────────────────────────
// 3 pricing cards side by side.

export const PricingTiersTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "left", TRANSITION_FRAMES, fps);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 6%",
        gap: 16,
        flexDirection: "row",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateX(${exit.x}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <PricingCard plan="Starter" price="$29" period="/mo" features={["100 calls/mo", "Basic AI", "Email summaries"]} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} />
      <PricingCard plan="Pro" price="$99" period="/mo" features={["Unlimited calls", "Custom AI voice", "Calendar sync", "Priority routing"]} highlighted frame={frame} fps={fps} delay={18} primaryColor={primaryColor} />
      <PricingCard plan="Enterprise" price="Custom" period="" features={["Dedicated agent", "API access", "White-label", "SLA"]} frame={frame} fps={fps} delay={26} primaryColor={primaryColor} />
    </AbsoluteFill>
  );
};

// ─── 9. FEATURE HIGHLIGHT GRID ──────────────────────────────────────
// 2x2 grid of feature cards with icons.

export const FeatureHighlightTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "right", TRANSITION_FRAMES, fps);

  const features = [
    { icon: "📞", title: "AI Answering", description: "24/7 call handling" },
    { icon: "🎯", title: "Lead Qualify", description: "Smart filtering" },
    { icon: "📅", title: "Auto Booking", description: "Calendar integration" },
    { icon: "💰", title: "Revenue Track", description: "Real-time metrics" },
  ];

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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 500 }}>
        {features.map((f, i) => (
          <FeatureCard key={i} icon={f.icon} title={f.title} description={f.description} frame={frame} fps={fps} delay={10 + i * 8} primaryColor={primaryColor} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── 10. TYPEWRITER COMMAND ─────────────────────────────────────────
// Typewriter input showing an AI command being typed.

export const TypewriterCommandTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "down", TRANSITION_FRAMES, fps);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 10%",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateY(${entrance.y + exit.y}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <TypewriterInput text={scene.text} frame={frame} fps={fps} delay={10} speed={0.4} />
    </AbsoluteFill>
  );
};

// ─── 11. SOCIAL PROOF BANNER ────────────────────────────────────────
// Overlapping avatars + count + trust text.

export const SocialProofBannerTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "left", TRANSITION_FRAMES, fps);

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
      <SocialProofRow
        avatars={["A", "B", "C", "D"]}
        count={scene.text}
        label={scene.subtext || "businesses trust us"}
        frame={frame}
        fps={fps}
        delay={10}
      />
    </AbsoluteFill>
  );
};

// ─── 12. CALENDAR BOOKING FLOW ──────────────────────────────────────
// Month calendar + booking confirmation.

export const CalendarBookingTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "up", TRANSITION_FRAMES, fps);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 10%",
        gap: 20,
        flexDirection: "row",
        opacity: entrance.opacity * exit.opacity,
        transform: `translateY(${entrance.y + exit.y}px) scale(${entrance.scale * exit.scale})`,
        willChange: "transform, opacity",
      }}
    >
      <CalendarMonth month="March 2025" highlightedDays={[15, 16, 17, 18, 22]} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} />
      <CalendarBlock time="Mar 15, 2:00 PM" title={scene.text} frame={frame} fps={fps} delay={25} primaryColor={primaryColor} />
    </AbsoluteFill>
  );
};

// ─── 13. REVENUE COUNTER ────────────────────────────────────────────
// Big animated dollar number.

export const RevenueCounterTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "left", TRANSITION_FRAMES, fps);

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
      <ProgressRing percent={85} label={scene.text} frame={frame} fps={fps} delay={10} primaryColor={primaryColor} />
    </AbsoluteFill>
  );
};

// ─── 14. BRAND LOCKUP ───────────────────────────────────────────────
// Clean CTA with brand name + URL.

export const BrandLockupTemplate: React.FC<SceneProps> = ({
  scene, primaryColor, textColor, frame, fps, duration,
}) => {
  const entrance = getEntrance(frame, fps, 0);
  const exit = getExit(frame, duration, "down", TRANSITION_FRAMES, fps);
  const lineS = getSpringProgress(frame, fps, 20, DEFAULT_SPRING);
  const lineWidth = interpolate(lineS, [0, 1], [0, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
        <div style={{ fontFamily: FONT, fontSize: "64px", fontWeight: 800, lineHeight: 1.1, color: textColor, letterSpacing: "-0.03em", marginBottom: 20 }}>
          {scene.subtext || scene.text}
        </div>
        <div style={{ height: 3, width: lineWidth, background: primaryColor, borderRadius: 2, margin: "0 auto 20px" }} />
        <Button label={scene.text.includes(".") ? scene.text : "Get Started →"} frame={frame} fps={fps} delay={30} primaryColor={primaryColor} />
      </div>
    </AbsoluteFill>
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
