// Khối dựng cho loạt video dài dạng KHÓA HỌC / TUTORIAL của Trạm AI (16:9).
// Dùng chung cho các phần của một khóa: cảnh mở bài học, danh sách ý có mốc theo lời đọc,
// ô prompt gõ chữ (thực hành), kế hoạch có dấu tích, bảng so sánh.
import { createContext, useContext } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, enter, rise } from "./theme";
import { Card, WH, WK, WStage } from "./wide";

/* ---- Mốc theo lời đọc --------------------------------------------------- */

/** Ngôn ngữ nhãn mặc định của khối dựng (bản tiếng Anh: "en"). */
const LangCtx = createContext<"vi" | "en">("vi");
export const CourseLang = LangCtx.Provider;
const useL = () => {
  const lang = useContext(LangCtx);
  return <T,>(vi: T, en: T): T => (lang === "en" ? en : vi);
};

export type CueSource = {
  text: Record<string, string>;
  dur: Record<string, number>;
};
const CueCtx = createContext<CueSource>({ text: {}, dur: {} });
export const CueProvider = CueCtx.Provider;

/**
 * useCue(id): `at("cụm từ")` = giây giọng đọc tới cụm từ (theo vị trí ký tự × độ dài giọng);
 * `on("cụm từ")` = 0→1 bật khối đúng lúc đó. Cụm từ không có trong lời đọc → lỗi (bắt sớm khi kiểm khung).
 */
export const useCue = (id: string) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = useContext(CueCtx);
  const text = src.text[id];
  const dur = src.dur[id];
  if (text === undefined || dur === undefined)
    throw new Error(`useCue: thiếu lời đọc/độ dài cho cảnh ${id}`);
  const at = (phrase: string) => {
    const i = text.indexOf(phrase);
    if (i < 0)
      throw new Error(
        `useCue(${id}): không thấy cụm "${phrase}" trong lời đọc`,
      );
    return (i / text.length) * dur;
  };
  const on = (phrase: string, d = 0.6) =>
    enter(frame, fps, Math.max(0, at(phrase) - 0.15), d);
  const e = (sec: number, d = 0.7) => enter(frame, fps, sec, d);
  return { frame, fps, at, on, e, dur };
};

/* ---- Khối giao diện ------------------------------------------------------ */

export const Head: React.FC<{
  p: number;
  n?: string;
  kicker: string;
  size?: number;
  children: React.ReactNode;
  color?: string;
}> = ({ p, n, kicker, size = 62, children, color }) => (
  <>
    {(kicker || n) && (
      <WK p={p} n={n} color={color}>
        {kicker}
      </WK>
    )}
    <WH p={p} size={size}>
      {children}
    </WH>
  </>
);

/** Nhãn "THỰC HÀNH" vàng. */
export const PracticeTag: React.FC<{ p: number; label?: string }> = ({
  p,
  label,
}) => {
  const L = useL();
  return (
    <span
      style={{
        ...rise(p, 16),
        display: "inline-block",
        alignSelf: "flex-start",
        background: C.accent2,
        color: C.bg1,
        fontWeight: 900,
        fontSize: 24,
        letterSpacing: 3,
        padding: "6px 16px",
        borderRadius: 10,
        marginBottom: 18,
      }}
    >
      {label ?? L("THỰC HÀNH", "PRACTICE")}
    </span>
  );
};

/** Dòng ý: ô số + chữ, kích thước vừa khung ngang. */
export const Pt: React.FC<{
  p: number;
  mark?: React.ReactNode;
  color?: string;
  size?: number;
  children: React.ReactNode;
  sub?: React.ReactNode;
}> = ({ p, mark, color = C.accent2, size = 34, children, sub }) => (
  <div
    style={{
      ...rise(p, 26),
      display: "flex",
      alignItems: "flex-start",
      gap: 20,
      marginTop: 20,
    }}
  >
    {mark !== undefined && (
      <div
        style={{
          minWidth: size * 1.4,
          height: size * 1.4,
          borderRadius: 12,
          background: color,
          color: C.bg1,
          fontWeight: 900,
          fontSize: size * 0.72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {mark}
      </div>
    )}
    <div style={{ flex: 1, paddingTop: 3 }}>
      <div style={{ fontSize: size, fontWeight: 650, lineHeight: 1.3 }}>
        {children}
      </div>
      {sub && (
        <div
          style={{
            fontSize: size * 0.8,
            color: C.muted,
            marginTop: 4,
            lineHeight: 1.35,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  </div>
);

/** Chip thư mục / công cụ đính kèm trong ô prompt. */
export const Chip: React.FC<{
  children: React.ReactNode;
  color?: string;
  p?: number;
}> = ({ children, color = C.accent1, p = 1 }) => (
  <span
    style={{
      ...rise(p, 10),
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      border: `2px solid ${color}`,
      color,
      borderRadius: 12,
      padding: "6px 14px",
      fontSize: 24,
      fontWeight: 700,
      marginRight: 12,
    }}
  >
    <span
      style={{
        width: 22,
        height: 16,
        borderRadius: 3,
        background: color,
        display: "inline-block",
        opacity: 0.85,
      }}
    />
    {children}
  </span>
);

/**
 * Ô nhập prompt mô phỏng: chữ hiện dần (gõ) trong khoảng [from, to] giây, con trỏ nhấp nháy.
 */
export const Composer: React.FC<{
  p: number;
  text: string;
  from: number;
  to: number;
  chips?: React.ReactNode;
  size?: number;
  placeholder?: string;
  style?: React.CSSProperties;
}> = ({ p, text, from, to, chips, size = 32, placeholder: ph, style }) => {
  const L = useL();
  const placeholder =
    ph ?? L("Mô tả việc bạn cần làm", "Describe what you need");
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k =
    to - from < 0.05
      ? frame >= from * fps
        ? 1
        : 0
      : interpolate(frame, [from * fps, to * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const n = Math.round(text.length * k);
  const shown = text.slice(0, n);
  const caret = Math.floor(frame / 15) % 2 === 0 && k < 1;
  return (
    <div
      style={{
        ...rise(p, 30),
        background: "rgba(255,255,255,0.07)",
        border: `2px solid ${C.faint}`,
        borderRadius: 26,
        padding: "26px 32px 22px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: size,
          lineHeight: 1.42,
          fontWeight: 500,
          minHeight: size * 1.42 * 2,
          whiteSpace: "pre-wrap",
        }}
      >
        {n === 0 ? (
          <span style={{ color: C.muted }}>{placeholder}</span>
        ) : (
          shown
        )}
        {caret && <span style={{ color: C.accent2, display: "inline-block", width: 0 }}>▍</span>}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 18,
          borderTop: `2px solid ${C.faint}`,
          paddingTop: 16,
        }}
      >
        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {chips}
        </div>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: k >= 1 ? C.accent2 : C.faint,
            color: C.bg1,
            fontSize: 30,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ↑
        </div>
      </div>
    </div>
  );
};

/** Dòng kế hoạch / tiến độ: ô tròn → dấu tích khi `done` > 0. */
export const Step: React.FC<{
  p: number;
  done?: number;
  children: React.ReactNode;
  flag?: boolean;
  size?: number;
}> = ({ p, done = 0, children, flag, size = 30 }) => (
  <div
    style={{
      ...rise(p, 20),
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "12px 0",
      borderBottom: `2px solid ${C.faint}`,
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: `3px solid ${flag ? C.danger : done > 0 ? C.accent1 : C.faint}`,
        background: done > 0 ? `rgba(111,140,255,${done})` : "transparent",
        color: C.ink,
        fontSize: 22,
        fontWeight: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {flag ? "!" : done > 0.5 ? "✓" : ""}
    </div>
    <div
      style={{
        fontSize: size,
        fontWeight: 600,
        lineHeight: 1.3,
        color: flag ? C.ink : undefined,
      }}
    >
      {children}
    </div>
  </div>
);

/** Thẻ có tiêu đề nhỏ màu + thân. */
export const InfoCard: React.FC<{
  p: number;
  title: React.ReactNode;
  children?: React.ReactNode;
  accent?: string;
  hot?: number;
  style?: React.CSSProperties;
  size?: number;
}> = ({ p, title, children, accent = C.accent1, hot = 0, style, size = 30 }) => (
  <Card
    p={p}
    accent={hot > 0 ? accent : C.faint}
    style={{
      background: hot > 0 ? `rgba(111,140,255,${0.06 + 0.1 * hot})` : C.card,
      ...style,
    }}
  >
    <div style={{ fontSize: size + 2, fontWeight: 800, color: accent }}>{title}</div>
    {children && (
      <div
        style={{
          fontSize: size,
          fontWeight: 500,
          lineHeight: 1.38,
          marginTop: 8,
        }}
      >
        {children}
      </div>
    )}
  </Card>
);

/** Cảnh mở mỗi bài: số bài lớn + tên bài + câu dẫn + tên tutorial gốc. */
export const LessonOpen: React.FC<{
  id: string;
  num: string;
  title: React.ReactNode;
  lead: React.ReactNode;
  leadAt?: string;
  source: string;
  tags?: { at: string; text: React.ReactNode }[];
}> = ({ id, num, title, lead, leadAt, source, tags = [] }) => {
  const { e, on } = useCue(id);
  const L = useL();
  const big = e(0, 0.9);
  return (
    <WStage>
      <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
        <div
          style={{
            opacity: big,
            scale: `${0.85 + 0.15 * big}`,
            textAlign: "center",
            width: 420,
          }}
        >
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: 6,
              color: C.accent1,
            }}
          >
            {L("BÀI", "LESSON")}
          </div>
          <div
            style={{
              fontSize: 260,
              fontWeight: 900,
              lineHeight: 0.95,
              color: C.accent2,
              letterSpacing: -10,
            }}
          >
            {num}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <WH p={e(0.3)} size={72}>
            {title}
          </WH>
          <div
            style={{
              ...rise(leadAt ? on(leadAt) : e(1.2)),
              fontSize: 34,
              color: C.muted,
              fontWeight: 500,
              lineHeight: 1.4,
              marginTop: 24,
            }}
          >
            {lead}
          </div>
          {tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                marginTop: 30,
              }}
            >
              {tags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    ...rise(on(t.at), 16),
                    border: `2px solid ${C.accent1}`,
                    borderRadius: 999,
                    padding: "8px 20px",
                    fontSize: 27,
                    fontWeight: 700,
                  }}
                >
                  {t.text}
                </span>
              ))}
            </div>
          )}
          <div
            style={{
              opacity: e(1.5),
              marginTop: 36,
              fontSize: 23,
              color: C.muted,
            }}
          >
            <span style={{ color: C.accent2, fontWeight: 700 }}>
              {L("Bài gốc · Claude Academy:", "Original · Claude Academy:")}
            </span>{" "}
            {source}
          </div>
        </div>
      </div>
    </WStage>
  );
};
