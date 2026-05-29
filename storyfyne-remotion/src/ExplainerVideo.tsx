import React from "react";
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig, Sequence, interpolate } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { TRANSITION_FRAMES } from "./animations";
import { Backgrounds, getBackgroundForSceneType } from "./backgrounds";
import { CinematicMaster, CinematicMood } from "./effects";
import { FilmGrain } from "./scene-core";
import { sceneComponentMap, SceneData } from "./scenes";
import { templateComponentMap } from "./templates";
import { BrandMark } from "./media";

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
  imageUrls: z.array(z.string()).optional().default([]),
  imageFit: z.enum(["cover", "contain"]).optional().default("cover"),
  device: z.enum(["browser", "phone", "tablet", "window", "bare"]).optional().default("browser"),
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
  primaryColor: zColor().optional().default("#10a37f"),
  secondaryColor: zColor().optional().default("#19c59f"),
  bgColor: zColor().optional().default("#050505"),
  textColor: zColor().optional().default("#ffffff"),
  accentColor: zColor().optional().default("#10a37f"),
  mood: z.enum(["clean", "dramatic", "retro", "cyber", "warm", "cold", "minimal"]).optional().default("clean"),
});

export type ExplainerVideoProps = z.infer<typeof explainerVideoSchema>;

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
      imageUrls: [],
      imageFit: "cover",
      device: "browser",
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
      text: "AI answers every call.",
      subtext: "The reveal",
      visualDirection: "Clean product card",
      audioUrl: "",
      durationInFrames: 150,
      audioMarkers: [],
      imageUrl: "",
      imageUrls: [],
      imageFit: "cover",
      device: "browser",
      headline: "AI answers every call.",
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
      imageUrls: [],
      imageFit: "cover",
      device: "browser",
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
  ],
  aspectRatio: "16:9",
  logoUrl: "",
  primaryColor: "#10a37f",
  secondaryColor: "#19c59f",
  bgColor: "#050505",
  textColor: "#ffffff",
  accentColor: "#10a37f",
  mood: "clean",
};

// ─── Main Component ─────────────────────────────────────────────────

export const ExplainerVideo: React.FC<ExplainerVideoProps> = ({
  scenes,
  logoUrl,
  primaryColor,
  secondaryColor,
  bgColor,
  textColor,
  accentColor,
  mood,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
  const dominantBgType = getBackgroundForSceneType(scenes[effectiveIdx]?.type || "cleanDark");
  const BackgroundComponent = Backgrounds[dominantBgType] || Backgrounds.cleanDark;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Animated background */}
      <BackgroundComponent bgColor={bgColor} primaryColor={primaryColor} secondaryColor={secondaryColor} />

      {/* Visual scenes — overlapping during transitions */}
      {visualSchedule.map(({ scene, from, duration, visualDuration }, i) => {
        const SceneComponent = scene.template && templateComponentMap[scene.template]
          ? templateComponentMap[scene.template]
          : sceneComponentMap[scene.type] || sceneComponentMap.statement;

        // Alternate entrance/exit directions + transition flavor for variety
        const entranceDirs: Array<"left" | "right" | "up" | "down"> = ["up", "right", "left", "down"];
        const exitDirs: Array<"left" | "right" | "up" | "down"> = ["down", "left", "right", "up"];
        const entranceStyles: Array<"rise" | "zoom" | "slide" | "tilt" | "drift"> = ["rise", "zoom", "slide", "tilt", "drift"];
        const entranceDir = entranceDirs[i % entranceDirs.length];
        const exitDir = exitDirs[i % exitDirs.length];
        // First scene always rises (clean open); last is a calm drift.
        const entranceStyle = i === 0 ? "rise" : i === scenes.length - 1 ? "drift" : entranceStyles[i % entranceStyles.length];

        return (
          <Sequence key={`scene-${i}`} from={from} durationInFrames={visualDuration}>
            <div style={{ position: "absolute", inset: 0 }}>
              <SceneComponent
                scene={scene as SceneData}
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
                entranceStyle={entranceStyle}
                audioMarkers={scene.audioMarkers}
                logoUrl={logoUrl}
              />
            </div>
          </Sequence>
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

      {/* Persistent brand mark — fades in after the intro, hides when the
          logo is the on-screen subject (lockup / logoReveal scenes). */}
      {logoUrl && !["brandLockup", "logoReveal"].includes(scenes[effectiveIdx]?.template || "") && frame > scenes[0]?.durationInFrames * 0.5 && (
        <BrandMark logoUrl={logoUrl} frame={frame} fps={fps} delay={0} primaryColor={primaryColor} position="topLeft" />
      )}

      {/* Cinematic overlay */}
      <CinematicMaster mood={(mood as CinematicMood) || "clean"} frame={frame} />
    </AbsoluteFill>
  );
};
