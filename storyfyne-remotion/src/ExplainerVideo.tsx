import React from "react";
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { TRANSITION_FRAMES } from "./animations";
import { Backgrounds, getBackgroundForSceneType } from "./backgrounds";
import { TransitionOverlay, getTransitionForIndex, TransitionType } from "./transitions";
import { LogoOverlay, ProgressBar, SceneCounter, LowerThirdBar, ChapterMarker } from "./overlays";
import { sceneComponentMap, SceneData } from "./scenes";

// ─── Schema ─────────────────────────────────────────────────────────

const sceneSchema = z.object({
  type: z.enum([
    "title", "problem", "solution", "feature", "benefit",
    "process", "stats", "socialProof", "comparison", "cta",
  ]),
  text: z.string(),
  subtext: z.string().optional().default(""),
  visualDirection: z.string().optional().default(""),
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
  bgColor: zColor().optional().default("#0f172a"),
  textColor: zColor().optional().default("#f8fafc"),
  accentColor: zColor().optional().default("#6366f1"),
});

export type ExplainerVideoProps = z.infer<typeof explainerVideoSchema>;

export const defaultProps: ExplainerVideoProps = {
  scenes: [
    {
      type: "title",
      text: "Welcome to Storyfyne Explainer",
      subtext: "Turn ideas into motion graphics",
      visualDirection: "Opening title card",
      audioUrl: "",
      durationInFrames: 150,
      imageUrl: "",
    },
    {
      type: "feature",
      text: "We turn your ideas into motion graphics",
      subtext: "Professional videos in minutes",
      visualDirection: "Motion text reveal",
      audioUrl: "",
      durationInFrames: 180,
      imageUrl: "",
    },
  ],
  aspectRatio: "16:9",
  logoUrl: "",
  primaryColor: "#4f46e5",
  secondaryColor: "#0ea5e9",
  bgColor: "#0f172a",
  textColor: "#f8fafc",
  accentColor: "#6366f1",
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

  // Current scene for overlays
  const currentSceneIndex = sceneSchedule.findIndex(({ from, duration }) =>
    frame >= from && frame < from + duration - TRANSITION_FRAMES / 2
  );
  const effectiveSceneIndex = Math.max(0, currentSceneIndex >= 0 ? currentSceneIndex : scenes.length - 1);

  const overallProgress = frame / Math.max(totalFrames - 1, 1);

  // Background selection based on dominant scene type
  const dominantBgType = getBackgroundForSceneType(scenes[effectiveSceneIndex]?.type || "gradientMesh");
  const BackgroundComponent = Backgrounds[dominantBgType] || Backgrounds.gradientMesh;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Animated background */}
      <BackgroundComponent
        bgColor={bgColor}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />

      {/* Scenes with overlap transitions */}
      {sceneSchedule.map(({ scene, from, duration }, i) => {
        const SceneComponent = sceneComponentMap[scene.type] || sceneComponentMap.feature;
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
            {scene.audioUrl && <Audio src={scene.audioUrl} />}
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

      {/* Persistent overlays */}
      <LogoOverlay logoUrl={logoUrl} primaryColor={primaryColor} />

      <SceneCounter
        current={effectiveSceneIndex}
        total={scenes.length}
        textColor={textColor}
      />

      {scenes[effectiveSceneIndex] && (
        <LowerThirdBar
          text={scenes[effectiveSceneIndex].visualDirection || scenes[effectiveSceneIndex].type}
          primaryColor={primaryColor}
        />
      )}

      <ProgressBar
        progress={overallProgress}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
    </AbsoluteFill>
  );
};
