import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type BrandKit = {
  brandName?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontFamily?: string;
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  brandName: "Dialfyne",
  logoUrl: "",
  primaryColor: "#1fa8f4",
  secondaryColor: "#8bcdf3",
  bgColor: "#000000",
  textColor: "#ffffff",
  accentColor: "#38bdf8",
  fontFamily: "Instrument Sans, Inter, Arial, sans-serif",
};

export const resolveBrandKit = (kit: Partial<BrandKit>): BrandKit => ({
  ...DEFAULT_BRAND_KIT,
  ...kit,
});

export const BrandLogo: React.FC<{
  brand: BrandKit;
  size?: number;
  showName?: boolean;
  opacity?: number;
}> = ({ brand, size = 48, showName = true, opacity = 1 }) => {
  const fontFamily = brand.fontFamily || DEFAULT_BRAND_KIT.fontFamily;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.28), opacity }}>
      {brand.logoUrl ? (
        <img
          src={brand.logoUrl}
          alt=""
          style={{
            width: size * 5.2,
            height: size,
            objectFit: "contain",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: Math.max(8, Math.round(size * 0.22)),
            background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})`,
            boxShadow: `0 18px 50px ${brand.primaryColor}22`,
          }}
        />
      )}
      {showName && brand.brandName && !brand.logoUrl && (
        <div
          style={{
            fontFamily,
            color: brand.textColor,
            fontSize: Math.round(size * 0.46),
            fontWeight: 760,
            lineHeight: 1,
          }}
        >
          {brand.brandName}
        </div>
      )}
    </div>
  );
};

export const BrandWatermark: React.FC<{
  brand: BrandKit;
  frame: number;
}> = ({ brand, frame }) => {
  const { width } = useVideoConfig();
  const s = spring({ frame: Math.max(0, frame - 12), fps: 30, config: { damping: 22, stiffness: 140, mass: 0.8 } });
  const compact = width < 1200;
  return (
    <div
      style={{
        position: "absolute",
        left: compact ? 34 : 54,
        top: compact ? 30 : 44,
        transform: `translateY(${interpolate(s, [0, 1], [-12, 0])}px)`,
        opacity: interpolate(s, [0, 1], [0, 0.82]),
        pointerEvents: "none",
      }}
    >
      <BrandLogo brand={brand} size={compact ? 36 : 46} showName={!compact} opacity={0.95} />
    </div>
  );
};

export const BrandAssetsComposition: React.FC<Partial<BrandKit>> = (props) => {
  const brand = resolveBrandKit(props);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pulse = interpolate(Math.sin(frame / 42), [-1, 1], [0.92, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: brand.bgColor, color: brand.textColor, fontFamily: brand.fontFamily }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 42%, ${brand.primaryColor}10, transparent 44%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.12,
          right: width * 0.12,
          top: height * 0.18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 60,
        }}
      >
        <BrandLogo brand={brand} size={76} showName />
        <div style={{ display: "flex", gap: 18 }}>
          {[brand.primaryColor, brand.secondaryColor, brand.accentColor, brand.bgColor, brand.textColor].map((color) => (
            <div
              key={color}
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                background: color,
                border: "1px solid rgba(255,255,255,0.16)",
                boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
                transform: `scale(${pulse})`,
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: width * 0.12,
          bottom: height * 0.18,
          fontSize: 84,
          fontWeight: 820,
          lineHeight: 0.95,
          maxWidth: 980,
        }}
      >
        Premium launch film system
      </div>
      <div
        style={{
          position: "absolute",
          right: width * 0.12,
          bottom: height * 0.19,
          textAlign: "right",
          color: `${brand.textColor}99`,
          fontSize: 26,
          lineHeight: 1.4,
        }}
      >
        Logos, colors, fonts, and motion defaults.
      </div>
    </AbsoluteFill>
  );
};
