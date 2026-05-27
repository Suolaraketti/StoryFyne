import { Composition } from "remotion";
import { ExplainerVideo, explainerVideoSchema, defaultProps } from "./ExplainerVideo";

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
      />
    </>
  );
};
