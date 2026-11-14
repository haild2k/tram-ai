import { registerRoot } from "remotion";
import { HaiPaper } from "./videos/hai-paper-04-11";
import { HaiPaperEn } from "./videos/hai-paper-04-11-en";

const Root: React.FC = () => (
  <>
    <HaiPaper />
    <HaiPaperEn />
  </>
);

registerRoot(Root);
