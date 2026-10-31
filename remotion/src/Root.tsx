import { AiAttention, AiAttentionThumb } from "./videos/ai-attention-30-10";
import { AiHamKichHoat, AiHamKichHoatThumb } from "./videos/ai-ham-kich-hoat-30-10";
import { AiHamKichHoatEn, AiHamKichHoatEnThumb } from "./videos/ai-ham-kich-hoat-30-10-en";
import { AiAttentionEn, AiAttentionEnThumb } from "./videos/ai-attention-30-10-en";
import { AiFineTuneLlm, AiFineTuneLlmThumb } from "./videos/ai-fine-tune-llm-30-10";
import { AiFineTuneLlmEn, AiFineTuneLlmEnThumb } from "./videos/ai-fine-tune-llm-30-10-en";
import { Gemini4Carbon } from "./videos/gemini-4-carbon";
import { Genie431 } from "./videos/genie-4-31-10";
import { Genie431En } from "./videos/genie-4-31-10-en";
import { PaperHarness2, PaperHarness2Thumb } from "./videos/paper-harness2";
import { PaperUnlimitedOcr, PaperUnlimitedOcrThumb } from "./videos/paper-unlimited-ocr";
import { PaperUnlimitedOcrEn, PaperUnlimitedOcrEnThumb } from "./videos/paper-unlimited-ocr-en";

// Mỗi video Trạm AI style "remotion" = 1 thư mục src/videos/<slug>/ + 1 dòng ở đây.
// (src/videos/ bị gitignore — chỉ đăng ký video có trên máy đang dựng.)
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <AiAttention />
      <AiAttentionThumb />
      <AiAttentionEn />
      <AiAttentionEnThumb />
      <AiHamKichHoat />
      <AiHamKichHoatThumb />
      <AiHamKichHoatEn />
      <AiHamKichHoatEnThumb />
      <AiFineTuneLlm />
      <AiFineTuneLlmThumb />
      <AiFineTuneLlmEn />
      <AiFineTuneLlmEnThumb />
      <Gemini4Carbon />
      <Genie431 />
      <Genie431En />
      <PaperHarness2 />
      <PaperHarness2Thumb />
      <PaperUnlimitedOcr />
      <PaperUnlimitedOcrThumb />
      <PaperUnlimitedOcrEn />
      <PaperUnlimitedOcrEnThumb />
    </>
  );
};
