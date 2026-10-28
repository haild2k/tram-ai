import { AgentsJudgmentCalls } from "./videos/agents-judgment-calls";
import { PaperTradingAgents } from "./videos/paper-tradingagents";
import { PaperTradingAgentsThumb } from "./videos/paper-tradingagents/Thumb";

// Mỗi video Trạm AI style "remotion" = 1 thư mục src/videos/<slug>/ + 1 dòng ở đây.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <AgentsJudgmentCalls />
      <PaperTradingAgents />
      <PaperTradingAgentsThumb />
    </>
  );
};
