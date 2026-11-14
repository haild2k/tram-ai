import { registerRoot } from "remotion";
import { BauCuAi } from "./videos/bau-cu-ai-04-11";
import { BauCuAiEn } from "./videos/bau-cu-ai-04-11-en";
import { SiriTiengViet } from "./videos/siri-tieng-viet-04-11";
import { SiriTiengVietEn } from "./videos/siri-tieng-viet-04-11-en";
import { LifeVal } from "./videos/lifeval-04-11";
import { LifeValEn } from "./videos/lifeval-04-11-en";

const Root: React.FC = () => (
  <>
    <BauCuAi />
    <BauCuAiEn />
    <SiriTiengViet />
    <SiriTiengVietEn />
    <LifeVal />
    <LifeValEn />
  </>
);

registerRoot(Root);
