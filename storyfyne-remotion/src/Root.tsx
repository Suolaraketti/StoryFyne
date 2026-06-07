import { Composition, CalculateMetadataFunction } from "remotion";
import { ExplainerVideo, explainerVideoSchema, defaultProps, ExplainerVideoProps } from "./ExplainerVideo";
import { BrandAssetsComposition, DEFAULT_BRAND_KIT } from "./brand-assets";

const calculateMetadata: CalculateMetadataFunction<ExplainerVideoProps> = async ({ props }) => {
  const scenes = props.scenes || [];
  const totalFrames = scenes.reduce((sum, s) => sum + (s.durationInFrames || 30), 0);
  return {
    durationInFrames: Math.max(totalFrames, 30),
  };
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ExplainerVideo"
        component={ExplainerVideo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        schema={explainerVideoSchema}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="ExplainerVideoMobile"
        component={ExplainerVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        schema={explainerVideoSchema}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="BrandAssets"
        component={BrandAssetsComposition}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_BRAND_KIT}
      />
    </>
  );
};
