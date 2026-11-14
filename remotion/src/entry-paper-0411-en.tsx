import { registerRoot } from "remotion";
import { PaperDrPixelEn, PaperDrPixelEnThumb } from "./videos/paper-drpixel-en";
import { PaperLeanGuardEn, PaperLeanGuardEnThumb } from "./videos/paper-leanguard-en";

const Root: React.FC = () => (
  <>
    <PaperDrPixelEn />
    <PaperDrPixelEnThumb />
    <PaperLeanGuardEn />
    <PaperLeanGuardEnThumb />
  </>
);

registerRoot(Root);
