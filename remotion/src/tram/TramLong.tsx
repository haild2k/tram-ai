import { Composition } from "remotion";
import { FPS, SceneDef, TramShort, timeline } from "./TramShort";
import { OutroWide } from "./wide";

/**
 * Tạo component đăng ký 1 video dài 16:9 (1920x1080). Dùng chung timeline và
 * TransitionSeries với short; outro ngang chuẩn Trạm AI được nối tự động với id "outro".
 */
export const defineLong = ({
  id,
  slug,
  scenes,
  voiceSec,
}: {
  id: string;
  slug: string;
  scenes: SceneDef[];
  voiceSec: Record<string, number>;
}): React.FC => {
  const all = [...scenes, { id: "outro", C: OutroWide }];
  const { total } = timeline(
    all.map((s) => s.id),
    voiceSec,
  );
  const Video: React.FC = () => <TramShort slug={slug} scenes={all} voiceSec={voiceSec} />;
  const Register: React.FC = () => (
    <Composition id={id} component={Video} durationInFrames={total} fps={FPS} width={1920} height={1080} />
  );
  return Register;
};
