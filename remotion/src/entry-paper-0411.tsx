import { registerRoot } from "remotion";
import { PaperDrPixel, PaperDrPixelThumb } from "./videos/paper-drpixel";
import { PaperLeanGuard, PaperLeanGuardThumb } from "./videos/paper-leanguard";

const Root: React.FC = () => (
  <>
    <PaperDrPixel />
    <PaperDrPixelThumb />
    <PaperLeanGuard />
    <PaperLeanGuardThumb />
  </>
);

registerRoot(Root);
