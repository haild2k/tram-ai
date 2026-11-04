import { TokenLivestream, TokenLivestreamThumb } from "./videos/token-livestream-03-11";
import { TokenLivestreamEn, TokenLivestreamEnThumb } from "./videos/token-livestream-03-11-en";
import { DeepseekSuperAgent, DeepseekSuperAgentThumb } from "./videos/deepseek-sieu-tac-nhan-03-11";
import { DeepseekSuperAgentEn, DeepseekSuperAgentEnThumb } from "./videos/deepseek-sieu-tac-nhan-03-11-en";
import { GoldmanClaudeCode, GoldmanClaudeCodeThumb } from "./videos/goldman-claude-code-03-11";
import { GoldmanClaudeCodeEn, GoldmanClaudeCodeEnThumb } from "./videos/goldman-claude-code-03-11-en";
import { ToanHocAi, ToanHocAiThumb } from "./videos/toan-hoc-ai-03-11";
import { ToanHocAiEn, ToanHocAiEnThumb } from "./videos/toan-hoc-ai-03-11-en";
import { GoogleAiClick, GoogleAiClickThumb } from "./videos/google-ai-click-03-11";
import { GoogleAiClickEn, GoogleAiClickEnThumb } from "./videos/google-ai-click-03-11-en";
import { KhoaCoworkP1En, KhoaCoworkP1EnThumb } from "./videos/khoa-cowork-p1-03-11-en";
import { KhoaCoworkP1, KhoaCoworkP1Thumb } from "./videos/khoa-cowork-p1-03-11";
import { KhoaCoworkP2, KhoaCoworkP2En, KhoaCoworkP2EnThumb, KhoaCoworkP2Thumb } from "./videos/khoa-cowork-p2-03-11";
import { KhoaCoworkP3, KhoaCoworkP3En, KhoaCoworkP3EnThumb, KhoaCoworkP3Thumb } from "./videos/khoa-cowork-p3-03-11";
import { KhoaCoworkP4, KhoaCoworkP4En, KhoaCoworkP4EnThumb, KhoaCoworkP4Thumb } from "./videos/khoa-cowork-p4-03-11";
import { KhoaCoworkP5, KhoaCoworkP5En, KhoaCoworkP5EnThumb, KhoaCoworkP5Thumb } from "./videos/khoa-cowork-p5-03-11";
import { PhimNganAiEn, PhimNganAiEnThumb } from "./videos/phim-ngan-ai-02-11-en";
import { AnthropicPhongVanEn, AnthropicPhongVanEnThumb } from "./videos/anthropic-phong-van-02-11-en";
import { TokenTiengVietEn, TokenTiengVietEnThumb } from "./videos/token-tieng-viet-02-11-en";
import { PhimNganAi, PhimNganAiThumb } from "./videos/phim-ngan-ai-02-11";
import { AnthropicPhongVan, AnthropicPhongVanThumb } from "./videos/anthropic-phong-van-02-11";
import { ChatgptNgungThuoc, ChatgptNgungThuocThumb } from "./videos/chatgpt-ngung-thuoc-31-10";
import { TokenTiengViet, TokenTiengVietThumb } from "./videos/token-tieng-viet-02-11";
import { GithubCpuAi, GithubCpuAiThumb } from "./videos/github-cpu-ai-31-10";

// Mỗi video Trạm AI style "remotion" = 1 thư mục src/videos/<slug>/ + 1 dòng ở đây.
// (src/videos/ bị gitignore — chỉ đăng ký video có trên máy đang dựng.)
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <TokenLivestream />
      <TokenLivestreamThumb />
      <TokenLivestreamEn />
      <TokenLivestreamEnThumb />
      <DeepseekSuperAgent />
      <DeepseekSuperAgentThumb />
      <DeepseekSuperAgentEn />
      <DeepseekSuperAgentEnThumb />
      <GoldmanClaudeCode />
      <GoldmanClaudeCodeThumb />
      <GoldmanClaudeCodeEn />
      <GoldmanClaudeCodeEnThumb />
      <ToanHocAi />
      <ToanHocAiThumb />
      <ToanHocAiEn />
      <ToanHocAiEnThumb />
      <GoogleAiClick />
      <GoogleAiClickThumb />
      <GoogleAiClickEn />
      <GoogleAiClickEnThumb />
      <KhoaCoworkP1En />
      <KhoaCoworkP1EnThumb />
      <KhoaCoworkP1 />
      <KhoaCoworkP1Thumb />
      <KhoaCoworkP2 />
      <KhoaCoworkP2Thumb />
      <KhoaCoworkP2En />
      <KhoaCoworkP2EnThumb />
      <KhoaCoworkP3 />
      <KhoaCoworkP3Thumb />
      <KhoaCoworkP3En />
      <KhoaCoworkP3EnThumb />
      <KhoaCoworkP4 />
      <KhoaCoworkP4Thumb />
      <KhoaCoworkP4En />
      <KhoaCoworkP4EnThumb />
      <KhoaCoworkP5 />
      <KhoaCoworkP5Thumb />
      <KhoaCoworkP5En />
      <KhoaCoworkP5EnThumb />
      <PhimNganAiEn />
      <PhimNganAiEnThumb />
      <AnthropicPhongVanEn />
      <AnthropicPhongVanEnThumb />
      <TokenTiengVietEn />
      <TokenTiengVietEnThumb />
      <PhimNganAi />
      <PhimNganAiThumb />
      <AnthropicPhongVan />
      <AnthropicPhongVanThumb />
      <TokenTiengViet />
      <TokenTiengVietThumb />
      <GithubCpuAi />
      <GithubCpuAiThumb />
      <ChatgptNgungThuoc />
      <ChatgptNgungThuocThumb />
    </>
  );
};
