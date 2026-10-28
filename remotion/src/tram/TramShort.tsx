import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Composition, staticFile } from "remotion";
import { Background } from "./Chrome";
import { Outro } from "./ui";

export const FPS = 30;
export const TRANSITION = 10;
const PAD_SEC = 0.35; // lặng sau mỗi câu trước khi chuyển cảnh
const OUTRO_HOLD_SEC = 1.6;

export type SceneDef = { id: string; C: React.FC };

/**
 * Tính số frame mỗi cảnh từ độ dài giọng đọc. Mỗi cảnh (trừ cảnh cuối) dài thêm
 * TRANSITION frame để phần chồng lấn khi fade không cắt mất giọng đọc.
 * scripts/finalize.py tính lại đúng công thức này — sửa ở đây thì sửa cả ở đó.
 */
export const timeline = (ids: string[], voiceSec: Record<string, number>) => {
  const last = ids.length - 1;
  const sceneFrames = ids.map((id, i) =>
    i === last ? Math.ceil((voiceSec[id] + OUTRO_HOLD_SEC) * FPS) : Math.ceil((voiceSec[id] + PAD_SEC) * FPS) + TRANSITION,
  );
  const visibleFrames = sceneFrames.map((f, i) => (i === last ? f : f - TRANSITION));
  return { sceneFrames, total: visibleFrames.reduce((a, b) => a + b, 0) };
};

export const TramShort: React.FC<{ slug: string; scenes: SceneDef[]; voiceSec: Record<string, number> }> = ({
  slug,
  scenes,
  voiceSec,
}) => {
  const { sceneFrames } = timeline(
    scenes.map((s) => s.id),
    voiceSec,
  );
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        {scenes.flatMap(({ id, C }, i) => {
          const seq = (
            <TransitionSeries.Sequence key={id} name={id} durationInFrames={sceneFrames[i]}>
              <C />
              <Audio src={staticFile(`videos/${slug}/voice/${id}.mp3`)} />
            </TransitionSeries.Sequence>
          );
          return i === scenes.length - 1
            ? [seq]
            : [seq, <TransitionSeries.Transition key={`${id}-t`} presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/**
 * Tạo component đăng ký 1 video short 9:16; outro chuẩn Trạm AI được nối tự động
 * với id "outro". Cảnh truyền qua closure (props của Composition bị serialize JSON
 * nên không chứa được component).
 */
export const defineShort = ({
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
  const all = [...scenes, { id: "outro", C: Outro }];
  const { total } = timeline(
    all.map((s) => s.id),
    voiceSec,
  );
  const Video: React.FC = () => <TramShort slug={slug} scenes={all} voiceSec={voiceSec} />;
  const Register: React.FC = () => (
    <Composition id={id} component={Video} durationInFrames={total} fps={FPS} width={1080} height={1920} />
  );
  return Register;
};
