// Bộ cảnh dựng từ DỮ LIỆU cho các phần của khóa học (16:9), song ngữ vi/en trong 1 file spec.json.
// Mỗi cảnh: { id, kind, chapter?, voice:{vi,en}, ...trường theo kind }. Chữ: {vi,en} hoặc chuỗi chung.
// `at` = cụm từ trong lời đọc (đúng ngôn ngữ) để bật khối đúng lúc; bỏ trống → tự rải đều theo giọng.
// Trong chữ: **đậm vàng**, ``mono``, xuống dòng bằng \n.
import { AbsoluteFill, Composition, Img, interpolate, staticFile } from "remotion";
import { Background } from "./Chrome";
import { Chip, Composer, CourseLang, CueProvider, Head, InfoCard, LessonOpen, PracticeTag, Pt, Step, useCue } from "./course";
import { C, fontFamily, rise } from "./theme";
import { defineLong } from "./TramLong";
import { FPS, timeline } from "./TramShort";
import { Card, RightArrow, SOCIALS_EN, OutroWide, WH, WK, WStage } from "./wide";
import { createContext, useContext } from "react";

export type Lang = "vi" | "en";
export type Bi = string | { vi: string; en: string };
type It = { at?: Bi; t: Bi; sub?: Bi; mark?: Bi; flag?: boolean; accent?: "a1" | "a2" | "red" };

export type Scene = {
  id: string;
  kind: string;
  chapter?: Bi;
  voice: { vi: string; en: string };
  kicker?: Bi;
  n?: Bi;
  title?: Bi;
  size?: number;
  lead?: Bi;
  leadAt?: Bi;
  num?: string;
  source?: string;
  img?: string;
  imgW?: number;
  caption?: Bi;
  practice?: Bi;
  items?: It[];
  cols?: number;
  prompt?: Bi;
  from?: Bi;
  to?: Bi;
  chips?: Bi[];
  note?: It;
  head?: [Bi, Bi, Bi];
  rows?: { at?: Bi; k: Bi; a: Bi; b: Bi }[];
  big?: Bi;
  sub?: Bi;
  lessons?: { num: string; t: Bi; pts: Bi[]; at?: Bi }[];
  current?: number;
};
export type Spec = {
  slug: string;
  img: string;
  scenes: Scene[];
};

const LangCtx = createContext<Lang>("vi");
const useT = () => {
  const lang = useContext(LangCtx);
  return (b: Bi | undefined): string => (b === undefined ? "" : typeof b === "string" ? b : b[lang]);
};

const ACC = { a1: C.accent1, a2: C.accent2, red: C.danger };

/** Chữ có **đậm vàng**, ``mono`` và \n. */
export const Rich: React.FC<{ s: string }> = ({ s }) => {
  const lines = s.split("\n");
  return (
    <>
      {lines.map((ln, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {ln.split(/(\*\*[^*]+\*\*|``[^`]+``)/).map((part, i) =>
            part.startsWith("**") ? (
              <span key={i} style={{ color: C.accent2 }}>
                {part.slice(2, -2)}
              </span>
            ) : part.startsWith("``") ? (
              <span key={i} style={{ fontFamily: "monospace", color: C.accent1, fontSize: "0.9em" }}>
                {part.slice(2, -2)}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </span>
      ))}
    </>
  );
};

/** Hook bật khối: theo cụm `at`, không có thì rải đều trong 80% đầu lời đọc. */
const useKit = (s: Scene) => {
  const cue = useCue(s.id);
  const T = useT();
  const R = (b: Bi | undefined) => <Rich s={T(b)} />;
  const auto = (i: number, n: number) => cue.e(0.5 + ((cue.dur * 0.8 - 0.5) * i) / Math.max(1, n));
  const P = (at: Bi | undefined, i = 0, n = 1) => (at ? cue.on(T(at)) : auto(i, n));
  return { ...cue, T, R, P };
};

const Row: React.FC<{ children: React.ReactNode; gap?: number; style?: React.CSSProperties }> = ({ children, gap = 40, style }) => (
  <div style={{ display: "flex", gap, alignItems: "center", ...style }}>{children}</div>
);

const Shot: React.FC<{ src: string; p: number; w: number; caption?: React.ReactNode; frame: number; fps: number }> = ({ src, p, w, caption, frame, fps }) => (
  <div style={{ ...rise(p, 30), width: w, flexShrink: 0 }}>
    <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
      <Img
        src={staticFile(src)}
        style={{ width: "100%", display: "block", scale: `${interpolate(frame, [0, 12 * fps], [1.04, 1], { extrapolateRight: "clamp" })}` }}
      />
    </div>
    {caption && <div style={{ fontSize: 22, color: C.muted, marginTop: 12 }}>{caption}</div>}
  </div>
);

/* ---- Các loại cảnh -------------------------------------------------------- */

type K = React.FC<{ s: Scene; img: string }>;

const Hook: K = ({ s, img }) => {
  const { frame, fps, e, R, P, T } = useKit(s);
  const items = s.items ?? [];
  return (
    <AbsoluteFill style={{ fontFamily, color: C.ink }}>
      {s.img && (
        <div
          style={{
            position: "absolute",
            right: 70,
            top: 160,
            width: s.imgW ?? 880,
            opacity: e(0, 0.8),
            scale: `${interpolate(frame, [0, 8 * fps], [1.04, 1], { extrapolateRight: "clamp" })}`,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          }}
        >
          <Img src={staticFile(`${img}/${s.img}`)} style={{ width: "100%", display: "block" }} />
        </div>
      )}
      {s.caption && <div style={{ position: "absolute", right: 70, bottom: 70, fontSize: 22, color: C.muted, opacity: e(0.5) }}>{T(s.caption)}</div>}
      <div style={{ position: "absolute", left: 110, top: 170, width: s.img ? 780 : 1600 }}>
        <WK p={e(0.1)} color={C.accent2}>
          {T(s.kicker)}
        </WK>
        <WH p={e(0.3)} size={s.size ?? 84}>
          {R(s.title)}
        </WH>
        <div style={{ marginTop: 40 }}>
          {items.map((it, i) => (
            <Pt key={i} p={P(it.at, i, items.length)} mark={i + 1} size={34}>
              {R(it.t)}
            </Pt>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Danh sách mục (lộ trình / nội dung phần), `current` = mục đang học được tô vàng. */
const Map: K = ({ s }) => {
  const { e, R, P, T } = useKit(s);
  const items = s.items ?? [];
  const cols = s.cols ?? 1;
  return (
    <WStage>
      <Head p={e(0)} kicker={T(s.kicker)} size={s.size ?? 60}>
        {R(s.title)}
      </Head>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, columnGap: 50, marginTop: 20 }}>
        {items.map((it, i) => {
          const cur = s.current !== undefined && i === s.current;
          const dim = s.current !== undefined && i !== s.current;
          return (
            <div key={i} style={{ opacity: dim ? 0.55 : 1 }}>
              <Pt p={P(it.at, i, items.length)} mark={it.mark ? T(it.mark) : i + 1} color={cur ? C.accent2 : C.accent1} size={cols > 1 ? 32 : 38} sub={it.sub ? R(it.sub) : undefined}>
                {R(it.t)}
              </Pt>
            </div>
          );
        })}
      </div>
    </WStage>
  );
};

const Lesson: K = ({ s }) => {
  const T = useT();
  return (
    <LessonOpen
      id={s.id}
      num={s.num ?? ""}
      title={<Rich s={T(s.title)} />}
      lead={<Rich s={T(s.lead)} />}
      leadAt={s.leadAt ? T(s.leadAt) : undefined}
      source={s.source ?? ""}
      tags={(s.items ?? []).map((it) => ({ at: T(it.at), text: <Rich s={T(it.t)} /> }))}
    />
  );
};

/** Ý chính (có thể kèm ảnh bên phải). */
const Points: K = ({ s, img }) => {
  const { frame, fps, e, R, P, T } = useKit(s);
  const items = s.items ?? [];
  const body = (
    <div style={{ flex: 1 }}>
      {s.practice && <PracticeTag p={e(0)} label={T(s.practice)} />}
      <Head p={e(0)} n={s.n ? T(s.n) : undefined} kicker={T(s.kicker)} size={s.size ?? 58}>
        {R(s.title)}
      </Head>
      <div style={{ marginTop: 14 }}>
        {items.map((it, i) => (
          <Pt
            key={i}
            p={P(it.at, i, items.length)}
            mark={it.mark ? T(it.mark) : i + 1}
            color={it.accent ? ACC[it.accent] : it.flag ? C.danger : C.accent2}
            size={s.img ? 32 : 38}
            sub={it.sub ? R(it.sub) : undefined}
          >
            {R(it.t)}
          </Pt>
        ))}
      </div>
      {s.note && (
        <div style={{ ...rise(P(s.note.at, items.length, items.length)), marginTop: 34, fontSize: 31, color: C.accent2, fontWeight: 700 }}>{R(s.note.t)}</div>
      )}
    </div>
  );
  if (!s.img) return <WStage>{body}</WStage>;
  return (
    <WStage>
      <Row gap={60} style={{ alignItems: "center" }}>
        {body}
        <Shot src={`${img}/${s.img}`} p={e(0.2)} w={s.imgW ?? 760} caption={s.caption ? T(s.caption) : undefined} frame={frame} fps={fps} />
      </Row>
    </WStage>
  );
};

/** Lưới thẻ. */
const Cards: K = ({ s }) => {
  const { e, R, P, T } = useKit(s);
  const items = s.items ?? [];
  const cols = s.cols ?? Math.min(items.length, 3);
  return (
    <WStage>
      {s.practice && <PracticeTag p={e(0)} label={T(s.practice)} />}
      <Head p={e(0)} n={s.n ? T(s.n) : undefined} kicker={T(s.kicker)} size={s.size ?? 58}>
        {R(s.title)}
      </Head>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24, marginTop: 34 }}>
        {items.map((it, i) => {
          const p = P(it.at, i, items.length);
          return (
            <InfoCard key={i} p={p} title={R(it.t)} accent={it.accent ? ACC[it.accent] : C.accent1} hot={it.flag ? 1 : 0} size={cols >= 3 ? 30 : items.length > 2 ? 31 : 34} style={{ padding: "26px 30px" }}>
              {it.sub ? R(it.sub) : undefined}
            </InfoCard>
          );
        })}
      </div>
      {s.note && (
        <div style={{ ...rise(P(s.note.at, items.length, items.length)), marginTop: 34, fontSize: 31, color: C.accent2, fontWeight: 700 }}>{R(s.note.t)}</div>
      )}
    </WStage>
  );
};

/** Thực hành: ô prompt gõ chữ. */
const Prompt: K = ({ s }) => {
  const { e, R, P, T, at, dur } = useKit(s);
  const from = s.from ? at(T(s.from)) : 0.8;
  const to = s.to ? at(T(s.to)) : Math.max(from + 1, 0.85 * dur);
  return (
    <WStage>
      <PracticeTag p={e(0)} label={T(s.practice) || undefined} />
      <WH p={e(0.15)} size={s.size ?? 54}>
        {R(s.title)}
      </WH>
      <div style={{ marginTop: 34 }}>
        <Composer
          p={e(0.3)}
          text={T(s.prompt)}
          from={from}
          to={to}
          size={T(s.prompt).length > 230 ? 28 : 31}
          chips={(s.chips ?? []).map((c, i) => (
            <Chip key={i} p={e(0.5 + i * 0.2)}>
              {T(c)}
            </Chip>
          ))}
        />
      </div>
      {s.note && <div style={{ ...rise(P(s.note.at)), marginTop: 28, fontSize: 31, color: C.accent2, fontWeight: 700 }}>{R(s.note.t)}</div>}
    </WStage>
  );
};

/** Quy trình / kế hoạch có dấu tích lần lượt. */
const Steps: K = ({ s }) => {
  const { e, R, P, T } = useKit(s);
  const items = s.items ?? [];
  return (
    <WStage>
      {s.practice && <PracticeTag p={e(0)} label={T(s.practice)} />}
      <Head p={e(0)} n={s.n ? T(s.n) : undefined} kicker={T(s.kicker)} size={s.size ?? 56}>
        {R(s.title)}
      </Head>
      <Card p={e(0.2)} style={{ marginTop: 24, padding: "14px 32px" }}>
        {items.map((it, i) => {
          const p = P(it.at, i, items.length);
          return (
            <Step key={i} p={Math.min(1, p * 3)} done={it.flag ? 0 : p} flag={it.flag} size={34}>
              {R(it.t)}
              {it.sub && <span style={{ color: C.muted, fontWeight: 500 }}> — {R(it.sub)}</span>}
            </Step>
          );
        })}
      </Card>
      {s.note && <div style={{ ...rise(P(s.note.at, items.length, items.length)), marginTop: 30, fontSize: 31, color: C.accent2, fontWeight: 700 }}>{R(s.note.t)}</div>}
    </WStage>
  );
};

/** Luồng ngang: các khối nối mũi tên. */
const Flow: K = ({ s }) => {
  const { e, R, P, T } = useKit(s);
  const items = s.items ?? [];
  return (
    <WStage>
      <Head p={e(0)} n={s.n ? T(s.n) : undefined} kicker={T(s.kicker)} size={s.size ?? 58}>
        {R(s.title)}
      </Head>
      <Row gap={16} style={{ marginTop: 50, alignItems: "stretch" }}>
        {items.map((it, i) => {
          const p = P(it.at, i, items.length);
          return (
            <div key={i} style={{ display: "contents" }}>
              {i > 0 && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <RightArrow p={p} size={44} />
                </div>
              )}
              <div
                style={{
                  ...rise(p, 26),
                  flex: 1,
                  background: i === items.length - 1 ? "rgba(242,178,84,0.12)" : C.card,
                  border: `2px solid ${i === items.length - 1 ? C.accent2 : C.faint}`,
                  borderRadius: 22,
                  padding: "32px 30px",
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: C.accent2 }}>{it.mark ? T(it.mark) : String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontSize: 38, fontWeight: 800, marginTop: 10, lineHeight: 1.2 }}>{R(it.t)}</div>
                {it.sub && <div style={{ fontSize: 29, color: C.muted, marginTop: 12, lineHeight: 1.38 }}>{R(it.sub)}</div>}
              </div>
            </div>
          );
        })}
      </Row>
      {s.note && <div style={{ ...rise(P(s.note.at, items.length, items.length)), marginTop: 40, fontSize: 31, color: C.accent2, fontWeight: 700 }}>{R(s.note.t)}</div>}
    </WStage>
  );
};

/** Bảng so sánh 2 cột. */
const Compare: K = ({ s }) => {
  const { e, R, P, T } = useKit(s);
  const rows = s.rows ?? [];
  const [h0, h1, h2] = s.head ?? ["", "", ""];
  const cell: React.CSSProperties = { padding: "18px 22px", fontSize: 31, lineHeight: 1.3, borderBottom: `2px solid ${C.faint}` };
  return (
    <WStage>
      <Head p={e(0)} n={s.n ? T(s.n) : undefined} kicker={T(s.kicker)} size={s.size ?? 56}>
        {R(s.title)}
      </Head>
      <div style={{ ...rise(e(0.2)), display: "grid", gridTemplateColumns: "0.8fr 1.1fr 1.1fr", marginTop: 26 }}>
        <div style={{ ...cell, color: C.muted, fontWeight: 700 }}>{T(h0)}</div>
        <div style={{ ...cell, color: C.accent1, fontWeight: 900, fontSize: 32 }}>{T(h1)}</div>
        <div style={{ ...cell, color: C.accent2, fontWeight: 900, fontSize: 32 }}>{T(h2)}</div>
        {rows.map((r, i) => {
          const p = P(r.at, i, rows.length);
          return (
            <div key={i} style={{ display: "contents" }}>
              <div style={{ ...cell, ...rise(p, 14), fontWeight: 800 }}>{R(r.k)}</div>
              <div style={{ ...cell, ...rise(p, 14) }}>{R(r.a)}</div>
              <div style={{ ...cell, ...rise(p, 14) }}>{R(r.b)}</div>
            </div>
          );
        })}
      </div>
    </WStage>
  );
};

/** Hội thoại: bạn ↔ Claude. mark "you"/"claude". */
const Chat: K = ({ s }) => {
  const { e, R, P, T } = useKit(s);
  const items = s.items ?? [];
  return (
    <WStage>
      {s.practice && <PracticeTag p={e(0)} label={T(s.practice)} />}
      <Head p={e(0)} n={s.n ? T(s.n) : undefined} kicker={T(s.kicker)} size={s.size ?? 52}>
        {R(s.title)}
      </Head>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 24 }}>
        {items.map((it, i) => {
          const me = T(it.mark) === "you";
          const p = P(it.at, i, items.length);
          return (
            <div key={i} style={{ ...rise(p, 20), alignSelf: me ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: 2, color: me ? C.accent2 : C.accent1, marginBottom: 6, textAlign: me ? "right" : "left" }}>
                {me ? T({ vi: "BẠN", en: "YOU" }) : "CLAUDE"}
              </div>
              <div
                style={{
                  background: me ? "rgba(242,178,84,0.14)" : C.card,
                  border: `2px solid ${me ? C.accent2 : C.faint}`,
                  borderRadius: 22,
                  padding: "16px 24px",
                  fontSize: 33,
                  lineHeight: 1.38,
                  fontWeight: 500,
                }}
              >
                {R(it.t)}
              </div>
            </div>
          );
        })}
      </div>
    </WStage>
  );
};

/** Cây thư mục / cấu trúc file. mark = độ sâu ("0","1","2"), flag = thư mục. */
const Tree: K = ({ s }) => {
  const { e, R, P, T } = useKit(s);
  const items = s.items ?? [];
  return (
    <WStage>
      <Row gap={70} style={{ alignItems: "center" }}>
        <div style={{ width: 640 }}>
          <Head p={e(0)} n={s.n ? T(s.n) : undefined} kicker={T(s.kicker)} size={s.size ?? 56}>
            {R(s.title)}
          </Head>
          {s.lead && <div style={{ ...rise(e(0.4)), fontSize: 30, color: C.muted, lineHeight: 1.4, marginTop: 18 }}>{R(s.lead)}</div>}
        </div>
        <Card p={e(0.2)} style={{ flex: 1, padding: "26px 34px", fontFamily: "monospace" }}>
          {items.map((it, i) => {
            const d = Number(T(it.mark) || "0");
            const p = P(it.at, i, items.length);
            return (
              <div key={i} style={{ ...rise(p, 12), display: "flex", alignItems: "baseline", gap: 16, padding: "7px 0", paddingLeft: d * 44 }}>
                <span style={{ color: it.flag ? C.accent2 : C.accent1, fontSize: 33, fontWeight: 800 }}>{it.flag ? "▸ " : "· "}{T(it.t)}</span>
                {it.sub && <span style={{ fontFamily, color: C.muted, fontSize: 27 }}>{R(it.sub)}</span>}
              </div>
            );
          })}
        </Card>
      </Row>
    </WStage>
  );
};

/** Câu lớn / con số lớn ở giữa. */
const Big: K = ({ s }) => {
  const { e, R, P, T } = useKit(s);
  const items = s.items ?? [];
  return (
    <WStage justify="center" style={{ alignItems: "flex-start" }}>
      <WK p={e(0)} n={s.n ? T(s.n) : undefined}>
        {T(s.kicker)}
      </WK>
      <div style={{ ...rise(e(0.2), 40), fontSize: s.size ?? 92, fontWeight: 900, lineHeight: 1.08, letterSpacing: -2 }}>{R(s.big)}</div>
      {s.sub && <div style={{ ...rise(e(0.7)), fontSize: 36, color: C.muted, marginTop: 30, lineHeight: 1.4, maxWidth: 1500 }}>{R(s.sub)}</div>}
      <Row gap={18} style={{ marginTop: 40, flexWrap: "wrap" }}>
        {items.map((it, i) => (
          <span
            key={i}
            style={{
              ...rise(P(it.at, i, items.length), 16),
              border: `2px solid ${C.accent1}`,
              borderRadius: 999,
              padding: "10px 24px",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {R(it.t)}
          </span>
        ))}
      </Row>
    </WStage>
  );
};

/** Tóm tắt các bài: lưới thẻ số bài + 2–3 ý. */
const Summary: K = ({ s }) => {
  const { e, R, P, T } = useKit(s);
  const ls = s.lessons ?? [];
  const cols = s.cols ?? Math.min(ls.length, 3);
  return (
    <WStage>
      <Head p={e(0)} kicker={T(s.kicker)} size={s.size ?? 54}>
        {R(s.title)}
      </Head>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22, marginTop: 26 }}>
        {ls.map((l, i) => (
          <Card key={i} p={P(l.at, i, ls.length)} style={{ padding: "26px 30px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontSize: 46, fontWeight: 900, color: C.accent2 }}>{l.num}</span>
              <span style={{ fontSize: 33, fontWeight: 800, lineHeight: 1.2 }}>{R(l.t)}</span>
            </div>
            {l.pts.map((pt, j) => (
              <div key={j} style={{ fontSize: ls.length > 6 ? 23 : 28, color: C.muted, marginTop: 10, lineHeight: 1.35 }}>
                • <Rich s={T(pt)} />
              </div>
            ))}
          </Card>
        ))}
      </div>
    </WStage>
  );
};

const KINDS: Record<string, K> = {
  hook: Hook,
  map: Map,
  lesson: Lesson,
  points: Points,
  cards: Cards,
  prompt: Prompt,
  steps: Steps,
  flow: Flow,
  compare: Compare,
  chat: Chat,
  tree: Tree,
  big: Big,
  summary: Summary,
};

/* ---- Đăng ký video + thumbnail ------------------------------------------- */

export type ThumbOpts = {
  part: number;
  total?: number;
  line1: Bi;
  img?: string;
  foot: Bi;
};

export const defineCourse = ({
  id,
  spec,
  lang,
  durations,
  next,
  thumb,
}: {
  id: string;
  spec: Spec;
  lang: Lang;
  durations: Record<string, number>;
  next: Bi;
  thumb: ThumbOpts;
}) => {
  const T = (b: Bi) => (typeof b === "string" ? b : b[lang]);
  const cues = {
    text: Object.fromEntries(spec.scenes.map((s) => [s.id, s.voice[lang]])),
    dur: durations,
  };
  const scenes = spec.scenes.map((s) => {
    const Kind = KINDS[s.kind];
    if (!Kind) throw new Error(`courseKit: kind lạ "${s.kind}" ở cảnh ${s.id}`);
    const Cmp: React.FC = () => (
      <LangCtx.Provider value={lang}>
        <CourseLang value={lang}>
          <CueProvider value={cues}>
            <Kind s={s} img={spec.img} />
          </CueProvider>
        </CourseLang>
      </LangCtx.Provider>
    );
    return { id: s.id, C: Cmp };
  });
  const Outro: React.FC = () =>
    lang === "en" ? <OutroWide brand="Tram AI" tagline={T(next)} socials={SOCIALS_EN} /> : <OutroWide tagline={T(next)} />;
  const Video = defineLong({ id, slug: lang === "en" ? `${spec.slug}-en` : spec.slug, voiceSec: durations, outro: Outro, scenes });

  const minutes = Math.round(timeline([...spec.scenes.map((s) => s.id), "outro"], durations).total / FPS / 60);
  const ThumbC: React.FC = () => (
    <AbsoluteFill style={{ fontFamily, color: C.ink }}>
      <Background />
      {thumb.img && (
        <div style={{ position: "absolute", right: 40, top: 110, width: 600, borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", rotate: "2deg" }}>
          <Img src={staticFile(`${spec.img}/${thumb.img}`)} style={{ width: "100%", display: "block" }} />
        </div>
      )}
      <div style={{ position: "absolute", left: 60, top: 70, width: 660 }}>
        <div style={{ display: "inline-block", background: C.accent2, color: C.bg1, fontWeight: 900, fontSize: 30, padding: "8px 20px", borderRadius: 12, letterSpacing: 2 }}>
          {lang === "en" ? `PART ${thumb.part}/${thumb.total ?? 5}` : `PHẦN ${thumb.part}/${thumb.total ?? 5}`}
        </div>
        <div style={{ fontSize: 118, fontWeight: 900, lineHeight: 1.0, letterSpacing: -3, marginTop: 26 }}>
          Claude
          <br />
          <span style={{ color: C.accent2 }}>Cowork</span>
        </div>
        <div style={{ fontSize: 50, fontWeight: 800, marginTop: 22, lineHeight: 1.15 }}>
          {T(thumb.line1)}
          <br />
          <span style={{ color: C.accent1 }}>{lang === "en" ? `in ${minutes} minutes` : `trong ${minutes} phút`}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, bottom: 46, fontSize: 30, fontWeight: 700, color: C.muted }}>{T(thumb.foot)}</div>
    </AbsoluteFill>
  );
  const Thumb: React.FC = () => <Composition id={`${id}Thumb`} component={ThumbC} durationInFrames={1} fps={30} width={1280} height={720} />;
  return { Video, Thumb };
};
