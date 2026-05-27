import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// ─── Schema ─────────────────────────────────────────────────────────

const sceneSchema = z.object({
  type: z.enum(["title", "feature", "benefit", "socialProof", "cta"]),
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

// ─── Animation Helpers ──────────────────────────────────────────────

function useEntrance(frame: number, fps: number, delay = 0) {
  const progress = Math.max(0, frame - delay) / 30;
  const s = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    y: interpolate(s, [0, 1], [40, 0]),
    scale: interpolate(s, [0, 1], [0.95, 1]),
  };
}

function useExit(frame: number, duration: number) {
  const exitStart = duration - 25;
  const exitProgress = frame > exitStart ? (frame - exitStart) / 25 : 0;
  return {
    opacity: interpolate(exitProgress, [0, 1], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    x: interpolate(exitProgress, [0, 1], [0, -60], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
}

// ─── Background ─────────────────────────────────────────────────────

const AnimatedBackground: React.FC<{
  bgColor: string;
  primaryColor: string;
  secondaryColor: string;
  frame: number;
  duration: number;
}> = ({ bgColor, primaryColor, secondaryColor, frame, duration }) => {
  const t = frame / Math.max(duration, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      {/* Gradient blob 1 */}
      <div
        style={{
          position: "absolute",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}18 0%, transparent 70%)`,
          left: `${-200 + t * 100}px`,
          top: `${-100 + t * 50}px`,
          filter: "blur(80px)",
          transform: `rotate(${t * 20}deg)`,
        }}
      />
      {/* Gradient blob 2 */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${secondaryColor}15 0%, transparent 70%)`,
          right: `${-150 + t * 80}px`,
          bottom: `${-100 + t * 60}px`,
          filter: "blur(80px)",
          transform: `rotate(${-t * 15}deg)`,
        }}
      />
      {/* Subtle grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${primaryColor}08 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}08 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Persistent Overlays ────────────────────────────────────────────

const LogoOverlay: React.FC<{ logoUrl: string; textColor: string }> = ({
  logoUrl,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const entrance = useEntrance(frame, 30, 0);

  if (!logoUrl) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 50,
        zIndex: 100,
        opacity: entrance.opacity,
        transform: `translateY(${entrance.y}px)`,
      }}
    >
      <Img
        src={logoUrl}
        style={{
          height: 48,
          width: "auto",
          maxWidth: 200,
          objectFit: "contain",
          filter: textColor === "#ffffff" || textColor === "#f8fafc" 
            ? "brightness(0) invert(1)" 
            : "none",
        }}
      />
    </div>
  );
};

const ProgressBar: React.FC<{
  progress: number;
  primaryColor: string;
  duration: number;
}> = ({ progress, primaryColor, duration }) => {
  const frame = useCurrentFrame();
  const exit = useExit(frame, duration);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: "rgba(255,255,255,0.08)",
        zIndex: 100,
        opacity: exit.opacity,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(progress * 100, 100)}%`,
          backgroundColor: primaryColor,
          borderRadius: "0 2px 2px 0",
          transition: "none",
        }}
      />
    </div>
  );
};

const SceneCounter: React.FC<{
  sequences: { durationInFrames: number }[];
  textColor: string;
}> = ({ sequences, textColor }) => {
  const frame = useCurrentFrame();
  let current = 0;
  let accumulated = 0;
  for (let i = 0; i < sequences.length; i++) {
    accumulated += sequences[i].durationInFrames;
    if (frame < accumulated) {
      current = i;
      break;
    }
  }
  const total = sequences.length;

  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        right: 50,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 14,
        fontWeight: 600,
        color: `${textColor}55`,
        letterSpacing: 1,
        textTransform: "uppercase",
        zIndex: 100,
      }}
    >
      {current + 1} / {total}
    </div>
  );
};

const LowerThird: React.FC<{
  text: string;
  primaryColor: string;
  frame: number;
  fps: number;
}> = ({ text, primaryColor, frame, fps }) => {
  const entrance = useEntrance(frame, fps, 10);
  if (!text) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 50,
        zIndex: 50,
        opacity: entrance.opacity,
        transform: `translateY(${entrance.y}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 4,
            height: 20,
            backgroundColor: primaryColor,
            borderRadius: 2,
          }}
        />
        <span
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: `${primaryColor}cc`,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ─── Scene Components ───────────────────────────────────────────────

const TitleScene: React.FC<{
  scene: z.infer<typeof sceneSchema>;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}> = ({ scene, primaryColor, secondaryColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const entrance = useEntrance(frame, fps, 0);
  const exit = useExit(frame, durationInFrames);

  const headlineOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [30, 55], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exit.opacity,
        transform: `translateX(${exit.x}px)`,
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "75%",
          zIndex: 2,
          opacity: entrance.opacity,
          transform: `translateY(${entrance.y}px) scale(${entrance.scale})`,
        }}
      >
        <h1
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: "72px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: textColor,
            margin: 0,
            textWrap: "balance",
            letterSpacing: "-0.02em",
            opacity: headlineOpacity,
          }}
        >
          {scene.text}
        </h1>
        {scene.subtext && (
          <p
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: "28px",
              fontWeight: 400,
              lineHeight: 1.4,
              color: `${textColor}aa`,
              margin: "24px 0 0 0",
              opacity: subtextOpacity,
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
            margin: "32px auto 0",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const FeatureScene: React.FC<{
  scene: z.infer<typeof sceneSchema>;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}> = ({ scene, primaryColor, secondaryColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const textEntrance = useEntrance(frame, fps, 0);
  const imgEntrance = useEntrance(frame, fps, 10);
  const exit = useExit(frame, durationInFrames);

  const hasImage = scene.imageUrl && scene.imageUrl.trim().length > 0;

  return (
    <AbsoluteFill
      style={{
        flexDirection: hasImage ? "row" : "column",
        justifyContent: "center",
        alignItems: "center",
        padding: hasImage ? "0 80px" : "0",
        gap: hasImage ? 60 : 0,
        opacity: exit.opacity,
        transform: `translateX(${exit.x}px)`,
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
            transform: `translateY(${imgEntrance.y}px)`,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: `0 25px 80px rgba(0,0,0,0.4), 0 0 0 1px ${primaryColor}22`,
              border: `2px solid ${primaryColor}33`,
              maxWidth: "90%",
            }}
          >
            <Img
              src={scene.imageUrl}
              style={{
                width: "100%",
                maxHeight: 520,
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          flex: hasImage ? 1 : undefined,
          maxWidth: hasImage ? "50%" : "70%",
          opacity: textEntrance.opacity,
          transform: `translateY(${textEntrance.y}px)`,
          zIndex: 2,
        }}
      >
        <h2
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: hasImage ? "52px" : "64px",
            fontWeight: 800,
            lineHeight: 1.2,
            color: textColor,
            margin: 0,
            textWrap: "balance",
          }}
        >
          {scene.text}
        </h2>
        {scene.subtext && (
          <p
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: 1.5,
              color: `${textColor}99`,
              margin: "20px 0 0 0",
            }}
          >
            {scene.subtext}
          </p>
        )}
        <div
          style={{
            height: 4,
            width: 80,
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: 2,
            marginTop: 28,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const BenefitCard: React.FC<{
  item: string;
  idx: number;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  frame: number;
  fps: number;
}> = ({ item, idx, primaryColor, secondaryColor, textColor, frame, fps }) => {
  const itemEntrance = useEntrance(frame, fps, idx * 8);
  return (
    <div
      style={{
        backgroundColor: `${primaryColor}15`,
        border: `1px solid ${primaryColor}30`,
        borderRadius: 16,
        padding: "32px 28px",
        width: 280,
        textAlign: "left",
        opacity: itemEntrance.opacity,
        transform: `translateY(${itemEntrance.y}px)`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          fontSize: 20,
        }}
      >
        ✓
      </div>
      <p
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 18,
          fontWeight: 600,
          color: textColor,
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {item.trim()}
      </p>
    </div>
  );
};

const BenefitScene: React.FC<{
  scene: z.infer<typeof sceneSchema>;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}> = ({ scene, primaryColor, secondaryColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExit(frame, durationInFrames);

  // Parse subtext into benefit items if it contains newlines or bullets
  const items = scene.subtext
    ? scene.subtext.split(/\n|•/).filter((s) => s.trim())
    : [];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exit.opacity,
        transform: `translateX(${exit.x}px)`,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "80%", zIndex: 2 }}>
        <h2
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: "56px",
            fontWeight: 800,
            color: textColor,
            margin: "0 0 48px 0",
            textWrap: "balance",
          }}
        >
          {scene.text}
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 32,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {items.length > 0 ? (
            items.slice(0, 3).map((item, idx) => (
              <BenefitCard
                key={idx}
                item={item}
                idx={idx}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                textColor={textColor}
                frame={frame}
                fps={fps}
              />
            ))
          ) : (
            <p
              style={{
                fontSize: 24,
                color: `${textColor}88`,
                fontFamily: "inherit",
              }}
            >
              {scene.subtext}
            </p>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SocialProofScene: React.FC<{
  scene: z.infer<typeof sceneSchema>;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}> = ({ scene, primaryColor, secondaryColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const entrance = useEntrance(frame, fps, 0);
  const exit = useExit(frame, durationInFrames);

  const quoteOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exit.opacity,
        transform: `translateX(${exit.x}px)`,
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          textAlign: "center",
          zIndex: 2,
          opacity: entrance.opacity,
          transform: `translateY(${entrance.y}px)`,
        }}
      >
        <div
          style={{
            fontSize: 120,
            lineHeight: 1,
            color: primaryColor,
            opacity: 0.3,
            marginBottom: -20,
            fontFamily: "Georgia, serif",
          }}
        >
          "
        </div>
        <p
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: "42px",
            fontWeight: 500,
            lineHeight: 1.35,
            color: textColor,
            fontStyle: "italic",
            margin: "16px 0 32px",
            opacity: quoteOpacity,
          }}
        >
          {scene.text}
        </p>
        {scene.subtext && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            />
            <span
              style={{
                fontFamily: "inherit",
                fontSize: 20,
                fontWeight: 600,
                color: `${textColor}cc`,
              }}
            >
              {scene.subtext}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const CTAScene: React.FC<{
  scene: z.infer<typeof sceneSchema>;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}> = ({ scene, primaryColor, secondaryColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const entrance = useEntrance(frame, fps, 0);
  const exit = useExit(frame, durationInFrames);

  const pulse = interpolate(
    frame % 60,
    [0, 30, 60],
    [1, 1.05, 1],
    {
      easing: Easing.inOut(Easing.sin),
    }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exit.opacity,
        transform: `translateX(${exit.x}px)`,
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "75%",
          zIndex: 2,
          opacity: entrance.opacity,
          transform: `translateY(${entrance.y}px)`,
        }}
      >
        <h2
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: "64px",
            fontWeight: 800,
            lineHeight: 1.2,
            color: textColor,
            margin: "0 0 24px 0",
            textWrap: "balance",
          }}
        >
          {scene.text}
        </h2>
        {scene.subtext && (
          <p
            style={{
              fontFamily: "inherit",
              fontSize: "24px",
              color: `${textColor}aa`,
              margin: "0 0 40px 0",
            }}
          >
            {scene.subtext}
          </p>
        )}
        <div
          style={{
            display: "inline-block",
            padding: "20px 48px",
            borderRadius: 14,
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            transform: `scale(${pulse})`,
            boxShadow: `0 12px 40px ${primaryColor}44`,
          }}
        >
          <span
            style={{
              fontFamily: "inherit",
              fontSize: "22px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Get Started →
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene Router ───────────────────────────────────────────────────

const Scene: React.FC<{
  scene: z.infer<typeof sceneSchema>;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}> = ({ scene, primaryColor, secondaryColor, textColor }) => {
  switch (scene.type) {
    case "title":
      return (
        <TitleScene
          scene={scene}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          textColor={textColor}
        />
      );
    case "feature":
      return (
        <FeatureScene
          scene={scene}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          textColor={textColor}
        />
      );
    case "benefit":
      return (
        <BenefitScene
          scene={scene}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          textColor={textColor}
        />
      );
    case "socialProof":
      return (
        <SocialProofScene
          scene={scene}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          textColor={textColor}
        />
      );
    case "cta":
      return (
        <CTAScene
          scene={scene}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          textColor={textColor}
        />
      );
    default:
      return (
        <TitleScene
          scene={scene}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          textColor={textColor}
        />
      );
  }
};

// ─── Main Composition ───────────────────────────────────────────────

export const ExplainerVideo: React.FC<ExplainerVideoProps> = ({
  scenes,
  logoUrl,
  primaryColor = "#4f46e5",
  secondaryColor = "#0ea5e9",
  bgColor = "#0f172a",
  textColor = "#f8fafc",
}) => {
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const sequences = useMemo(() => {
    let accumulatedFrames = 0;
    return scenes.map((scene, index) => {
      const from = accumulatedFrames;
      accumulatedFrames += scene.durationInFrames;
      return {
        scene,
        index,
        from,
        durationInFrames: scene.durationInFrames,
      };
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
      {/* Persistent animated background */}
      <AnimatedBackground
        bgColor={bgColor}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        frame={useCurrentFrame()}
        duration={durationInFrames}
      />

      {/* Scene sequences */}
      {sequences.map(({ scene, index, from, durationInFrames }) => (
        <Sequence key={index} from={from} durationInFrames={durationInFrames}>
          <Scene
            scene={scene}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            textColor={textColor}
          />
          <LowerThird
            text={scene.visualDirection}
            primaryColor={primaryColor}
            frame={useCurrentFrame()}
            fps={fps}
          />
          {scene.audioUrl && <Audio src={scene.audioUrl} startFrom={0} />}
        </Sequence>
      ))}

      {/* Persistent overlays */}
      <LogoOverlay logoUrl={logoUrl} textColor={textColor} />
      <SceneCounter
        sequences={sequences}
        textColor={textColor}
      />
      <ProgressBar
        progress={Math.min(useCurrentFrame() / totalDuration, 1)}
        primaryColor={primaryColor}
        duration={totalDuration}
      />
    </AbsoluteFill>
  );
};
