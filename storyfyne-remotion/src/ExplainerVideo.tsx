import React from "react";
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig, Sequence, interpolate, staticFile, Easing } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { TRANSITION_FRAMES } from "./animations";
import { Backgrounds, getBackgroundForSceneType } from "./backgrounds";
import { CinematicMaster, CinematicMood } from "./effects";
import { FilmGrain } from "./scene-core";
import { sceneComponentMap, SceneData } from "./scenes";
import { templateComponentMap } from "./templates";
import { BrandWatermark, resolveBrandKit } from "./brand-assets";

// ─── Schema ─────────────────────────────────────────────────────────

const sceneSchema = z.object({
  type: z.enum([
    "statement", "evidence", "flow", "metric", "lockup",
    "title", "problem", "solution", "feature", "benefit",
    "process", "stats", "socialProof", "comparison", "cta",
  ]),
  text: z.string(),
  subtext: z.string().optional().default(""),
  visualDirection: z.string().optional().default(""),
  template: z.string().optional().default(""),
  audioUrl: z.string(),
  durationInFrames: z.number().min(1),
  audioMarkers: z.array(z.number()).optional().default([]),
  imageUrl: z.string().optional().default(""),
  headline: z.string().optional().default(""),
  subheadline: z.string().optional().default(""),
  eyebrow: z.string().optional().default(""),
  metrics: z.array(z.object({ value: z.string(), label: z.string() })).optional().default([]),
  before: z.string().optional().default(""),
  after: z.string().optional().default(""),
  steps: z.array(z.string()).optional().default([]),
  features: z.array(z.object({ title: z.string(), description: z.string().optional().default("") })).optional().default([]),
  messages: z.array(z.string()).optional().default([]),
  statusPills: z.array(z.string()).optional().default([]),
  dashboardCards: z.array(z.object({ label: z.string(), value: z.string(), trend: z.string().optional().default("") })).optional().default([]),
  chartLabel: z.string().optional().default(""),
  command: z.string().optional().default(""),
  quote: z.string().optional().default(""),
  attribution: z.string().optional().default(""),
  plans: z.array(z.object({ name: z.string(), price: z.string(), features: z.array(z.string()).optional().default([]) })).optional().default([]),
  cta: z.string().optional().default(""),
  url: z.string().optional().default(""),
});

export const explainerVideoSchema = z.object({
  scenes: z.array(sceneSchema),
  aspectRatio: z.string().optional().default("16:9"),
  logoUrl: z.string().optional().default(""),
  brandName: z.string().optional().default(""),
  fontFamily: z.string().optional().default("Instrument Sans, Inter, Arial, sans-serif"),
  primaryColor: zColor().optional().default("#10a37f"),
  secondaryColor: zColor().optional().default("#19c59f"),
  bgColor: zColor().optional().default("#050505"),
  textColor: zColor().optional().default("#ffffff"),
  accentColor: zColor().optional().default("#10a37f"),
  musicUrl: z.string().optional().default(""),
  musicVolume: z.number().min(0).max(1).optional().default(0.24),
  maintainBackground: z.boolean().optional().default(true),
  mood: z.enum(["clean", "dramatic", "retro", "cyber", "warm", "cold", "minimal"]).optional().default("clean"),
});

export type ExplainerVideoProps = z.infer<typeof explainerVideoSchema>;

const DynamicSwipeTransition: React.FC<{
  progress: number;
  primaryColor: string;
  secondaryColor: string;
  isVertical: boolean;
  direction: "left" | "right";
  intent: "reveal" | "advance" | "resolve";
}> = ({ progress, primaryColor, secondaryColor, isVertical, direction, intent }) => {
  const p = Math.max(0, Math.min(1, progress));
  const eased = Easing.inOut(Easing.cubic)(p);
  const opacity = intent === "resolve"
    ? interpolate(p, [0, 0.18, 0.74, 1], [0, 0.42, 0.42, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(p, [0, 0.08, 0.88, 1], [0, intent === "reveal" ? 0.95 : 0.7, intent === "reveal" ? 0.95 : 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const travel = interpolate(eased, [0, 1], [-58, 118]);
  const reverse = direction === "left" ? -1 : 1;
  const position = travel * reverse;
  const bandWidth = intent === "reveal" ? "44%" : intent === "advance" ? "32%" : "18%";
  const bandHeight = intent === "reveal" ? "38%" : intent === "advance" ? "28%" : "18%";

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, zIndex: 420 }}>
      <div
        style={{
          position: "absolute",
          left: isVertical ? "-10%" : `${position}%`,
          top: isVertical ? `${travel}%` : "-10%",
          width: isVertical ? "120%" : bandWidth,
          height: isVertical ? bandHeight : "120%",
          transform: isVertical ? "skewY(-4deg)" : "skewX(-6deg)",
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          boxShadow: `0 0 ${intent === "reveal" ? 90 : 54}px ${primaryColor}70`,
          willChange: "transform",
        }}
      />
      {intent !== "resolve" && <div
          style={{
            position: "absolute",
            left: isVertical ? "8%" : `${position - 14}%`,
            top: isVertical ? `${travel - 14}%` : "8%",
            width: isVertical ? "84%" : "16%",
            height: isVertical ? "15%" : "84%",
            transform: isVertical ? "skewY(-4deg)" : "skewX(-6deg)",
            background: `linear-gradient(135deg, transparent, ${primaryColor}3d, transparent)`,
            filter: "blur(10px)",
            willChange: "left, top",
          }}
        />}
      {intent !== "resolve" && Array.from({ length: intent === "reveal" ? 4 : 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: isVertical ? `${travel - 4 + i * 6}%` : `${24 + i * 11}%`,
            left: isVertical ? `${18 + i * 11}%` : `${position - 18 + i * 4}%`,
            width: isVertical ? 7 : 180 - i * 18,
            height: isVertical ? 150 - i * 12 : 7,
            borderRadius: 99,
            background: "#ffffff",
            opacity: 0.18 + i * 0.055,
            willChange: "transform",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const getTransitionIntent = (from?: SceneData, to?: SceneData): "reveal" | "advance" | "resolve" => {
  if (!from || !to) return "advance";
  if (to.type === "evidence" || to.type === "solution" || /answer|call|product/i.test(`${to.headline || ""} ${to.text || ""}`)) return "reveal";
  if (to.type === "lockup" || to.type === "cta") return "resolve";
  return "advance";
};

const getSceneTransitionStyle = ({
  localFrame,
  sceneIndex,
  sceneCount,
  duration,
  width,
  height,
  scene,
  previousScene,
  nextScene,
}: {
  localFrame: number;
  sceneIndex: number;
  sceneCount: number;
  duration: number;
  width: number;
  height: number;
  scene: SceneData;
  previousScene?: SceneData;
  nextScene?: SceneData;
}): React.CSSProperties => {
  const isVertical = height > width;
  const inProgress = sceneIndex > 0
    ? 1 - Math.min(1, Math.max(0, localFrame / TRANSITION_FRAMES))
    : 0;
  const outProgress = sceneIndex < sceneCount - 1
    ? Math.min(1, Math.max(0, (localFrame - (duration - TRANSITION_FRAMES)) / TRANSITION_FRAMES))
    : 0;
  const incoming = Easing.out(Easing.cubic)(inProgress);
  const outgoing = Easing.in(Easing.cubic)(outProgress);
  const inIntent = getTransitionIntent(previousScene, scene);
  const outIntent = getTransitionIntent(scene, nextScene);
  const incomingX = inIntent === "reveal" ? (isVertical ? 0 : 92) : inIntent === "resolve" ? 0 : (isVertical ? 0 : 64);
  const incomingY = inIntent === "reveal" ? (isVertical ? 132 : 26) : inIntent === "resolve" ? 28 : (isVertical ? 92 : 0);
  const outgoingX = outIntent === "reveal" ? (isVertical ? 0 : -34) : outIntent === "resolve" ? 0 : (isVertical ? 0 : -52);
  const outgoingY = outIntent === "reveal" ? (isVertical ? -46 : -10) : outIntent === "resolve" ? -18 : (isVertical ? -80 : 0);
  const incomingScale = inIntent === "reveal" ? 0.965 : inIntent === "resolve" ? 0.985 : 0.975;
  const outgoingScale = outIntent === "reveal" ? 0.94 : outIntent === "resolve" ? 0.985 : 0.965;
  const x = Math.round(incomingX * incoming + outgoingX * outgoing);
  const y = Math.round(incomingY * incoming + outgoingY * outgoing);
  const scale = 1 - (1 - incomingScale) * incoming - (1 - outgoingScale) * outgoing;
  const rotate = outIntent === "advance" && !isVertical ? `rotateY(${3 * outgoing}deg)` : "rotate(0deg)";
  const incomingOpacityCost = inIntent === "reveal" ? 0.86 : inIntent === "resolve" ? 0.16 : 0.58;
  const outgoingOpacityCost = outIntent === "reveal" ? 1.5 : outIntent === "resolve" ? 0.18 : 0.28;
  const opacity = 1 - incomingOpacityCost * incoming - outgoingOpacityCost * outgoing;
  const blur = Math.round((incoming * (inIntent === "reveal" ? 1.2 : 0.8) + outgoing * (outIntent === "reveal" ? 10 : outIntent === "resolve" ? 0.8 : 1.8)) * 10) / 10;

  return {
    position: "absolute",
    inset: 0,
    opacity,
    transform: `translate3d(${x}px, ${y}px, 0) ${rotate} scale(${scale})`,
    filter: `blur(${blur}px)`,
    transformOrigin: "center center",
    willChange: "transform, opacity, filter",
  };
};

export const defaultProps: ExplainerVideoProps = {
  scenes: [
    {
      type: "statement",
      template: "heroStatement",
      text: "Missed call. Missed job.",
      subtext: "",
      visualDirection: "Bold statement text",
      audioUrl: "",
      durationInFrames: 120,
      audioMarkers: [],
      imageUrl: "",
      headline: "Missed call. Missed job.",
      subheadline: "",
      eyebrow: "The problem",
      metrics: [],
      before: "",
      after: "",
      steps: [],
      features: [],
      messages: [],
      statusPills: [],
      dashboardCards: [],
      chartLabel: "",
      command: "",
      quote: "",
      attribution: "",
      plans: [],
      cta: "",
      url: "",
    },
    {
      type: "evidence",
      template: "phoneDemo",
      text: "Dialfyne answers every call.",
      subtext: "The reveal",
      visualDirection: "Clean product card",
      audioUrl: "",
      durationInFrames: 150,
      audioMarkers: [],
      imageUrl: "",
      headline: "Dialfyne answers every call.",
      subheadline: "A live product moment, not another missed opportunity.",
      eyebrow: "Product reveal",
      metrics: [],
      before: "",
      after: "",
      steps: [],
      features: [],
      messages: ["Can someone help today?", "Absolutely. I can get you booked."],
      statusPills: ["Answered", "Qualified", "Booked"],
      dashboardCards: [],
      chartLabel: "",
      command: "",
      quote: "",
      attribution: "",
      plans: [],
      cta: "",
      url: "",
    },
    {
      type: "flow",
      template: "workflowSteps",
      text: "Call answered → Lead qualified → Job booked",
      subtext: "",
      visualDirection: "Step flow cards",
      audioUrl: "",
      durationInFrames: 180,
      audioMarkers: [],
      imageUrl: "",
      headline: "From intent to booked.",
      subheadline: "The workflow runs while your team stays focused.",
      eyebrow: "Workflow",
      metrics: [],
      before: "",
      after: "",
      steps: ["Answer", "Qualify", "Book"],
      features: [],
      messages: [],
      statusPills: [],
      dashboardCards: [],
      chartLabel: "",
      command: "",
      quote: "",
      attribution: "",
      plans: [],
      cta: "",
      url: "",
    },
    {
      type: "lockup",
      template: "brandLockup",
      text: "Never miss a job.",
      subtext: "",
      visualDirection: "Dialfyne branded end card",
      audioUrl: "",
      durationInFrames: 120,
      audioMarkers: [],
      imageUrl: "",
      headline: "Never miss a job.",
      subheadline: "dialfyne.ai",
      eyebrow: "",
      metrics: [],
      before: "",
      after: "",
      steps: [],
      features: [],
      messages: [],
      statusPills: [],
      dashboardCards: [],
      chartLabel: "",
      command: "",
      quote: "",
      attribution: "",
      plans: [],
      cta: "Never miss a job.",
      url: "dialfyne.ai",
    },
  ],
  aspectRatio: "16:9",
  logoUrl: staticFile("brand/dialfyne-horizontal.png"),
  brandName: "Dialfyne",
  fontFamily: "Instrument Sans, Inter, Arial, sans-serif",
  primaryColor: "#1fa8f4",
  secondaryColor: "#8bcdf3",
  bgColor: "#000000",
  textColor: "#ffffff",
  accentColor: "#38bdf8",
  musicUrl: "",
  musicVolume: 0.24,
  maintainBackground: true,
  mood: "clean",
};

// ─── Main Component ─────────────────────────────────────────────────

export const ExplainerVideo: React.FC<ExplainerVideoProps> = ({
  scenes,
  logoUrl,
  brandName,
  fontFamily,
  primaryColor,
  secondaryColor,
  bgColor,
  textColor,
  accentColor,
  musicUrl,
  musicVolume,
  maintainBackground,
  mood,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;
  const brand = resolveBrandKit({ brandName, logoUrl, fontFamily, primaryColor, secondaryColor, bgColor, textColor, accentColor });

  // ─── Build schedules ──────────────────────────────────────────────
  // Audio: sequential, NO overlap. Each scene's audio plays fully.
  // Visual: overlapping during transitions. Scene i+1 starts while scene i is exiting.

  let audioAccumulated = 0;
  const audioSchedule = scenes.map((scene) => {
    const from = audioAccumulated;
    audioAccumulated += scene.durationInFrames;
    return { scene, from, duration: scene.durationInFrames };
  });
  const totalAudioFrames = audioAccumulated;

  let visualAccumulated = 0;
  const visualSchedule = scenes.map((scene, i) => {
    const from = i === 0 ? 0 : visualAccumulated - TRANSITION_FRAMES;
    visualAccumulated += scene.durationInFrames;
    // Visual stays for full duration + transition time to allow exit motion
    const visualDuration = scene.durationInFrames + (i < scenes.length - 1 ? TRANSITION_FRAMES : 0);
    return { scene, from, duration: scene.durationInFrames, visualDuration };
  });

  // ─── Background ───────────────────────────────────────────────────
  // Find currently dominant scene for background
  const currentSceneIdx = visualSchedule.findIndex(
    ({ from, visualDuration }) => frame >= from && frame < from + visualDuration
  );
  const effectiveIdx = Math.max(0, currentSceneIdx >= 0 ? currentSceneIdx : scenes.length - 1);
  const firstBgScene = scenes[0]?.type || "cleanDark";
  const dominantBgType = maintainBackground
    ? getBackgroundForSceneType(firstBgScene)
    : getBackgroundForSceneType(scenes[effectiveIdx]?.type || "cleanDark");
  const BackgroundComponent = Backgrounds[dominantBgType] || Backgrounds.cleanDark;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Animated background */}
      <BackgroundComponent bgColor={bgColor} primaryColor={primaryColor} />

      {/* Visual scenes — overlapping during transitions */}
      {visualSchedule.map(({ scene, from, duration, visualDuration }, i) => {
        const SceneComponent = scene.template && templateComponentMap[scene.template]
          ? templateComponentMap[scene.template]
          : sceneComponentMap[scene.type] || sceneComponentMap.statement;

        const previousScene = i > 0 ? scenes[i - 1] : undefined;
        const nextScene = i < scenes.length - 1 ? scenes[i + 1] : undefined;
        const entranceDir: "left" | "right" | "up" | "down" = isVertical ? "up" : "right";
        const exitDir: "left" | "right" | "up" | "down" = isVertical ? "up" : "left";

        return (
          <Sequence key={`scene-${i}`} from={from} durationInFrames={visualDuration}>
            <div
              style={{
                ...getSceneTransitionStyle({
                  localFrame: frame - from,
                  sceneIndex: i,
                  sceneCount: visualSchedule.length,
                  duration,
                  width,
                  height,
                  scene: scene as SceneData,
                  previousScene: previousScene as SceneData | undefined,
                  nextScene: nextScene as SceneData | undefined,
                }),
                zIndex: 20 + i,
              }}
            >
              <SceneComponent
                scene={{ ...scene, logoUrl, brandName, fontFamily } as SceneData}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                textColor={textColor}
                accentColor={accentColor}
                bgColor={bgColor}
                frame={frame - from}
                fps={fps}
                duration={duration}
                entranceDirection={entranceDir}
                exitDirection={exitDir}
                audioMarkers={scene.audioMarkers}
              />
            </div>
          </Sequence>
        );
      })}

      {visualSchedule.slice(0, -1).map(({ from, duration }, i) => {
        const start = from + duration - TRANSITION_FRAMES;
        const local = frame - start;
        if (local < 0 || local > TRANSITION_FRAMES) return null;
        const intent = getTransitionIntent(scenes[i] as SceneData, scenes[i + 1] as SceneData);
        return (
          <DynamicSwipeTransition
            key={`transition-${i}`}
            progress={local / TRANSITION_FRAMES}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            isVertical={isVertical}
            direction="right"
            intent={intent}
          />
        );
      })}

      {/* Audio layer — sequential, NO overlap, each plays fully */}
      {audioSchedule.map(({ scene, from, duration }, i) => {
        if (!scene.audioUrl) return null;
        const fadeFrames = Math.min(12, Math.floor(duration / 5));
        return (
          <Sequence key={`audio-${i}`} from={from} durationInFrames={duration}>
            <Audio
              src={scene.audioUrl}
              volume={(f) =>
                interpolate(
                  f,
                  [0, fadeFrames, duration - fadeFrames, duration],
                  [0, 1, 1, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                )
              }
            />
          </Sequence>
        );
      })}

      {musicUrl && (
        <Sequence from={0} durationInFrames={totalAudioFrames}>
          <Audio
            src={musicUrl}
            volume={() => Math.max(0, Math.min(1, musicVolume ?? 0.24))}
          />
        </Sequence>
      )}

      <BrandWatermark brand={brand} frame={frame} />

      {/* Cinematic overlay */}
      <CinematicMaster mood={(mood as CinematicMood) || "clean"} frame={frame} />
    </AbsoluteFill>
  );
};
