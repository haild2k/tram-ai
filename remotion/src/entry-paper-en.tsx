import { registerRoot } from "remotion";
import { PaperEdge0En, PaperEdge0EnThumb } from "./videos/paper-edge0-en";
import { PaperKronosEn, PaperKronosEnThumb } from "./videos/paper-kronos-en";
import { PaperTokenEconomizerEn, PaperTokenEconomizerEnThumb } from "./videos/paper-tokeneconomizer-en";

const Root: React.FC = () => (
  <>
    <PaperTokenEconomizerEn />
    <PaperTokenEconomizerEnThumb />
    <PaperEdge0En />
    <PaperEdge0EnThumb />
    <PaperKronosEn />
    <PaperKronosEnThumb />
  </>
);

registerRoot(Root);
