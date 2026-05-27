import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  staticFile,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

const sceneSchema = z.object({
  text: z.string(),
  visualDirection: z.string(),
  audioUrl: z.string(),
  durationInFrames: z.number().min(1),
});

export const explainerVideoSchema = z.object({
  scenes: z.array(sceneSchema),
  aspectRatio: z.string().optional().default("16:9"),
  primaryColor: zColor().optional().default("#4f46e5"),
  secondaryColor: zColor().optional().default("#0ea5e9"),
  bgColor: zColor().optional().default("#0f172a"),
  textColor: zColor().optional().default("#f8fafc"),
});

export type ExplainerVideoProps = z.infer<typeof explainerVideoSchema>;

export const defaultProps: ExplainerVideoProps = {
  scenes: [
    {
      text: "Welcome to Storyfyne Explainer",
      visualDirection: "Opening title card",
      audioUrl: "",
      durationInFrames: 150,
    },
    {
      text: "We turn your ideas into motion graphics",
      visualDirection: "Motion text reveal",
      audioUrl: "",
      durationInFrames: 180,
    },
  ],
  aspectRatio: "16:9",
  primaryColor: "#4f46e5",
  secondaryColor: "#0ea5e9",
  bgColor: "#0f172a",
  textColor: "#f8fafc",
};

const Scene: React.FC<{
  scene: z.infer<typeof sceneSchema>;
  index: number;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
}> = ({ scene, index, primaryColor, secondaryColor, bgColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const duration = scene.durationInFrames;

  // Entrance animation (first 30 frames)
  const entranceProgress = Math.min(frame / 30, 1);
  const textY = interpolate(entranceProgress, [0, 1], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(entranceProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit animation (last 20 frames)
  const exitStart = duration - 20;
  const exitProgress = frame > exitStart ? (frame - exitStart) / 20 : 0;
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(exitProgress, [0, 1], [1, 0.95], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background subtle motion
  const bgOffset = interpolate(frame, [0, duration], [0, 20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Alternating accent color per scene
  const accentColor = index % 2 === 0 ? primaryColor : secondaryColor;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      {/* Decorative background gradient blob */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          transform: `translate(${bgOffset - 100}px, ${-bgOffset + 50}px)`,
          filter: "blur(60px)",
        }}
      />

      {/* Scene text */}
      <div
        style={{
          transform: `translateY(${textY}px)`,
          opacity: textOpacity * exitOpacity,
          maxWidth: "80%",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <h1
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: "64px",
            fontWeight: 800,
            lineHeight: 1.2,
            color: textColor,
            margin: 0,
            textWrap: "balance",
          }}
        >
          {scene.text}
        </h1>

        {/* Accent underline */}
        <div
          style={{
            height: "6px",
            width: `${Math.min(entranceProgress * 300, 200)}px`,
            backgroundColor: accentColor,
            borderRadius: "3px",
            margin: "24px auto 0",
            transition: "none",
          }}
        />
      </div>

      {/* Visual direction hint (subtle, bottom corner) */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          right: "40px",
          fontSize: "14px",
          color: `${textColor}44`,
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {scene.visualDirection}
      </div>

      {/* Audio track for this scene */}
      {scene.audioUrl && (
        <Audio src={scene.audioUrl} startFrom={0} />
      )}
    </AbsoluteFill>
  );
};

export const ExplainerVideo: React.FC<ExplainerVideoProps> = ({
  scenes,
  primaryColor = "#4f46e5",
  secondaryColor = "#0ea5e9",
  bgColor = "#0f172a",
  textColor = "#f8fafc",
}) => {
  const { fps, width, height } = useVideoConfig();

  const sequences = useMemo(() => {
    let accumulatedFrames = 0;
    return scenes.map((scene, index) => {
      const from = accumulatedFrames;
      accumulatedFrames += scene.durationInFrames;
      return { scene, index, from, durationInFrames: scene.durationInFrames };
    });
  }, [scenes]);

  const totalDuration = sequences.reduce(
    (sum, seq) => sum + seq.durationInFrames,
    0
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        width,
        height,
      }}
    >
      {sequences.map(({ scene, index, from, durationInFrames }) => (
        <Sequence
          key={index}
          from={from}
          durationInFrames={durationInFrames}
        >
          <Scene
            scene={scene}
            index={index}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            bgColor={bgColor}
            textColor={textColor}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
