import React from "react";
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig, Sequence, interpolate } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { TRANSITION_FRAMES } from "./animations";
import { Backgrounds, getBackgroundForSceneType } from "./backgrounds";
import { TransitionOverlay, getTransitionForIndex, TransitionType } from "./transitions";
import { CinematicOverlay } from "./overlays";
import { sceneComponentMap, SceneData } from "./scenes";
import { templateComponentMap } from "./templates";

// ─── Schema ─────────────────────────────────────────────────────────

const sceneSchema = z.object({
  type: z.enum([
    "statement", "evidence", "flow", "metric", "lockup",
    // Legacy fallbacks
    "title", "problem", "solution", "feature", "benefit",
    "process", "stats", "socialProof", "comparison", "cta",
  ]),
  text: z.string(),
  subtext: z.string().optional().default(""),
  visualDirection: z.string().optional().default(""),
  template: z.string().optional().default(""),
  audioUrl: z.string(),
  durationInFrames: z.number().min(1),
  imageUrl: z.string().optional().default(""),
});

export const explainerVideoSchema = z.object({
  scenes: z.array(sceneSchema),
  aspectRatio: z.string().optional().default("16:9"),
  logoUrl: z.string().optional().default(""),
  primaryColor: zColor().optional().default("#4f46e5"),
  secondaryColor: zColor().optional().default("#0ea5e9"),
  bgColor: zColor().optional().default("#f8f9fa"),
  textColor: zColor().optional().default("#111111"),
  accentColor: zColor().optional().default("#6366f1"),
});

export type ExplainerVideoProps = z.infer<typeof explainerVideoSchema>;

export const defaultProps: ExplainerVideoProps = {
  scenes: [
    {
      type: "statement",
      template: "heroStatement",
      text: "Missed call. Missed job.",
      visualDirection: "Bold statement text",
      audioUrl: "",
      durationInFrames: 120,
      imageUrl: "",
    },
    {
      type: "evidence",
      template: "phoneDemo",
      text: "AI answers every call.",
      subtext: "The reveal",
      visualDirection: "Clean product card",
      audioUrl: "",
      durationInFrames: 150,
      imageUrl: "",
    },
    {
      type: "flow",
      template: "workflowSteps",
      text: "Call answered → Lead qualified → Job booked",
      visualDirection: "Step flow cards",
      audioUrl: "",
      durationInFrames: 180,
      imageUrl: "",
    },
  ],
  aspectRatio: "16:9",
  logoUrl: "",
  primaryColor: "#0ea5e9",
  secondaryColor: "#6366f1",
  bgColor: "#f8f9fa",
  textColor: "#111111",
  accentColor: "#0ea5e9",
};

// ─── Main Component ─────────────────────────────────────────────────

export const ExplainerVideo: React.FC<ExplainerVideoProps> = ({
  scenes,
  primaryColor,
  bgColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const totalFrames = durationInFrames;

  // Build scene schedule with transition overlaps
  let accumulated = 0;
  const sceneSchedule = scenes.map((scene, i) => {
    const from = i === 0 ? 0 : accumulated - TRANSITION_FRAMES;
    accumulated += scene.durationInFrames - (i > 0 ? TRANSITION_FRAMES : 0);
    return { scene, from, duration: scene.durationInFrames };
  });

  // Determine active transition
  const activeTransition = sceneSchedule.findIndex(({ from, duration }) => {
    const end = from + duration;
    return frame >= end - TRANSITION_FRAMES && frame < end && frame < totalFrames;
  });

  const transitionProgress = activeTransition >= 0
    ? (frame - (sceneSchedule[activeTransition].from + sceneSchedule[activeTransition].duration - TRANSITION_FRAMES)) / TRANSITION_FRAMES
    : -1;

  const transitionType: TransitionType = activeTransition >= 0
    ? getTransitionForIndex(activeTransition)
    : "wipe";

  // Background selection based on currently dominant scene
  const currentSceneIdx = sceneSchedule.findIndex(({ from, duration }) =>
    frame >= from && frame < from + duration
  );
  const effectiveIdx = Math.max(0, currentSceneIdx >= 0 ? currentSceneIdx : scenes.length - 1);

  const dominantBgType = getBackgroundForSceneType(scenes[effectiveIdx]?.type || "cleanLight");
  const BackgroundComponent = Backgrounds[dominantBgType] || Backgrounds.cleanLight;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Animated background */}
      <BackgroundComponent
        bgColor={bgColor}
        primaryColor={primaryColor}
      />

      {/* Scenes with overlap transitions (visual only) */}
      {sceneSchedule.map(({ scene, from, duration }, i) => {
        const SceneComponent = scene.template && templateComponentMap[scene.template]
      ? templateComponentMap[scene.template]
      : sceneComponentMap[scene.type] || sceneComponentMap.statement;
        const zIndex = i;

        return (
          <Sequence key={i} from={from} durationInFrames={duration + TRANSITION_FRAMES}>
            <div style={{ position: "absolute", inset: 0, zIndex }}>
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
              />
            </div>
          </Sequence>
        );
      })}

      {/* Audio layer — NO overlap, with smooth fade in/out */}
      {sceneSchedule.map(({ scene, from, duration }, i) => {
        if (!scene.audioUrl) return null;
        const isLast = i === scenes.length - 1;
        const audioDuration = isLast ? duration : Math.max(1, duration - TRANSITION_FRAMES);
        const fadeFrames = Math.min(10, Math.floor(audioDuration / 4));

        return (
          <Sequence key={`audio-${i}`} from={from} durationInFrames={audioDuration}>
            <Audio
              src={scene.audioUrl}
              volume={(f) => {
                return interpolate(
                  f,
                  [0, fadeFrames, audioDuration - fadeFrames, audioDuration],
                  [0, 1, 1, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
              }}
            />
          </Sequence>
        );
      })}

      {/* Transition overlay */}
      {activeTransition >= 0 && transitionProgress >= 0 && (
        <AbsoluteFill style={{ zIndex: 99, pointerEvents: "none" }}>
          <TransitionOverlay
            type={transitionType}
            progress={transitionProgress}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        </AbsoluteFill>
      )}

      {/* Subtle film grain texture */}
      <CinematicOverlay />
    </AbsoluteFill>
  );
};
