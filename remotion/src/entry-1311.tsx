import { registerRoot } from "remotion";
import { AiDecisionModel, AiDecisionModelThumb } from "./videos/ai-decision-model-13-11";
import { AiDecisionModelEn, AiDecisionModelEnThumb } from "./videos/ai-decision-model-13-11-en";
import { AiDistillModel, AiDistillModelThumb } from "./videos/ai-distill-model-13-11";
import { AiDistillModelEn, AiDistillModelEnThumb } from "./videos/ai-distill-model-13-11-en";

const Root: React.FC = () => (
  <>
    <AiDecisionModel />
    <AiDecisionModelThumb />
    <AiDecisionModelEn />
    <AiDecisionModelEnThumb />
    <AiDistillModel />
    <AiDistillModelThumb />
    <AiDistillModelEn />
    <AiDistillModelEnThumb />
  </>
);

registerRoot(Root);
