// Entry riêng cho series "Skill cho AI Agent" — chỉ đăng ký video có trên máy này,
// vì Root.tsx import video chỉ có trên máy dựng khác (src/videos/ bị gitignore).
// Dùng: npx remotion render src/series.tsx <Id> <out>
import { registerRoot } from "remotion";
import { SkillAgentBrowser, SkillAgentBrowserEn, SkillAgentBrowserEnThumb, SkillAgentBrowserThumb } from "./videos/skill-agent-browser";
import { SkillFrontendDesign, SkillFrontendDesignEn, SkillFrontendDesignEnThumb, SkillFrontendDesignThumb } from "./videos/skill-frontend-design";
import { SkillFrontendDesignM, SkillFrontendDesignMEn, SkillFrontendDesignMEnThumb, SkillFrontendDesignMThumb } from "./videos/skill-frontend-design-m";

const SeriesRoot: React.FC = () => (
  <>
    <SkillAgentBrowser />
    <SkillAgentBrowserThumb />
    <SkillAgentBrowserEn />
    <SkillAgentBrowserEnThumb />
    <SkillFrontendDesign />
    <SkillFrontendDesignThumb />
    <SkillFrontendDesignEn />
    <SkillFrontendDesignEnThumb />
    <SkillFrontendDesignM />
    <SkillFrontendDesignMThumb />
    <SkillFrontendDesignMEn />
    <SkillFrontendDesignMEnThumb />
  </>
);

registerRoot(SeriesRoot);
