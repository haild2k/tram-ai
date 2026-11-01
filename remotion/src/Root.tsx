import { AgentsJudgmentCalls } from "./videos/agents-judgment-calls";
import { OpenaiRobotsAiTraining } from "./videos/openai-robots-ai-training";
import { OpenaiRobotsAiTrainingEn } from "./videos/openai-robots-ai-training-en";
import { PaperTradingAgents } from "./videos/paper-tradingagents";
import { PaperTradingAgentsThumb } from "./videos/paper-tradingagents/Thumb";
import { PaperTradingAgentsEn } from "./videos/paper-tradingagents-en";

// Mỗi video Trạm AI style "remotion" = 1 thư mục src/videos/<slug>/ + 1 dòng ở đây.
// (src/videos/ bị gitignore — chỉ đăng ký video có trên máy đang dựng.)
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <AgentsJudgmentCalls />
      <OpenaiRobotsAiTraining />
      <OpenaiRobotsAiTrainingEn />
      <PaperTradingAgents />
      <PaperTradingAgentsThumb />
      <PaperTradingAgentsEn />
    </>
  );
};
