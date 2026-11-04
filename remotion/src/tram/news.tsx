// Bộ khối dùng chung cho short tin AI (style remotion) — song ngữ vi/en.
// Mốc thời gian trong cảnh tính theo PHẦN của lời đọc tiếng Việt (0–1), nên bản Anh
// chỉ cần TimeScale = giọng Anh / giọng Việt là khớp.
import { createContext, useContext } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SAFE_X, enter, fontFamily, rise } from "./theme";

export type Lang = "vi" | "en";
const LangCtx = createContext<Lang>("vi");
export const LangProvider = LangCtx.Provider;
export const useLang = () => {
  const lang = useContext(LangCtx);
  return { lang, L: <T,>(vi: T, en: T): T => (lang === "en" ? en : vi) };
};

const ScaleCtx = createContext(1);
export const TimeScale = ScaleCtx.Provider;

/** e(f): 0→1 khi giọng Việt đọc tới phần f (0–1) của cảnh `id`. */
export const useScene = (dur: Record<string, number>, id: string) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = useContext(ScaleCtx);
  const f = frame / k;
  const sec = (x: number) => x * dur[id];
  return {
    frame: f,
    fps,
    sec,
    e: (x: number, d?: number) => enter(f, fps, sec(x), d),
    n: (from: number, to: number, x: number, d = 1.2) =>
      interpolate(f, [sec(x) * fps, (sec(x) + d) * fps], [from, to], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
  };
};

/** Số kiểu Việt (1.000 / 2,5) hoặc kiểu Anh (1,000 / 2.5). */
export const fmt = (v: number, lang: Lang, digits = 0) => {
  const s = v.toFixed(digits);
  const [i, d] = s.split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : ".");
  return d ? int + (lang === "en" ? "." : ",") + d : int;
};

export const Card: React.FC<{
  p: number;
  title: React.ReactNode;
  sub?: React.ReactNode;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ p, title, sub, color = C.accent1, size = 48, style }) => (
  <div style={{ ...rise(p, 40), background: C.card, border: `3px solid ${color}`, borderRadius: 24, padding: "24px 30px", ...style }}>
    <div style={{ fontSize: size, fontWeight: 900, color, lineHeight: 1.15 }}>{title}</div>
    {sub && <div style={{ fontSize: 34, fontWeight: 600, color: C.muted, marginTop: 8, lineHeight: 1.3 }}>{sub}</div>}
  </div>
);

export const Quote: React.FC<{ p: number; children: React.ReactNode; by?: React.ReactNode; color?: string; size?: number }> = ({
  p,
  children,
  by,
  color = C.accent2,
  size = 54,
}) => (
  <div style={{ ...rise(p, 40), borderLeft: `6px solid ${color}`, paddingLeft: 28, marginTop: 40 }}>
    <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1.18 }}>{children}</div>
    {by && <div style={{ fontSize: 32, fontWeight: 600, color: C.muted, marginTop: 12 }}>{by}</div>}
  </div>
);

export const Strike: React.FC<{ p: number; children: React.ReactNode; color?: string }> = ({ p, children, color = C.danger }) => (
  <span style={{ position: "relative", display: "inline-block" }}>
    {children}
    <span style={{ position: "absolute", left: -6, top: "54%", height: 10, width: `calc(${p * 100}% + 12px)`, background: color, borderRadius: 6 }} />
  </span>
);

export const Pill: React.FC<{ p: number; children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({
  p,
  children,
  color = C.faint,
  style,
}) => (
  <div
    style={{
      ...rise(p, 30),
      display: "inline-flex",
      alignSelf: "flex-start",
      background: C.card,
      border: `2px solid ${color}`,
      borderRadius: 999,
      padding: "12px 28px",
      fontSize: 36,
      fontWeight: 700,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Con dấu nghiêng, phóng từ to về đúng cỡ. */
export const Stamp: React.FC<{ p: number; children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({
  p,
  children,
  color = C.accent2,
  size = 58,
  style,
}) => (
  <div
    style={{
      opacity: p,
      scale: `${1.3 - 0.3 * p}`,
      alignSelf: "center",
      border: `5px solid ${color}`,
      borderRadius: 20,
      padding: "16px 34px",
      fontSize: size,
      fontWeight: 900,
      color,
      rotate: "-2deg",
      textAlign: "center",
      lineHeight: 1.2,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Thanh ngang so sánh có số đếm chạy. */
export const Bar: React.FC<{ p: number; label: React.ReactNode; v: number; max?: number; color: string; text: string }> = ({
  p,
  label,
  v,
  max = 100,
  color,
  text,
}) => (
  <div style={{ ...rise(Math.min(1, p * 3), 30), marginTop: 34 }}>
    <div style={{ fontSize: 38, fontWeight: 700, marginBottom: 12 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ flex: 1, height: 70, borderRadius: 16, background: C.faint, overflow: "hidden" }}>
        <div style={{ width: `${(v / max) * 100 * p}%`, height: "100%", background: color, borderRadius: 16 }} />
      </div>
      <div style={{ minWidth: 200, fontSize: 76, fontWeight: 900, color, textAlign: "right", letterSpacing: -2 }}>{text}</div>
    </div>
  </div>
);

/** Hook: ảnh phủ nửa trên, mờ dần xuống nền; chữ đặt từ `top`. */
export const HookFrame: React.FC<{
  src: string;
  focus?: string;
  credit?: string;
  p: number;
  top?: number;
  imgHeight?: number;
  fit?: "cover" | "contain";
  children: React.ReactNode;
}> = ({ src, focus = "50% 40%", credit, p, top = 860, imgHeight = 1000, fit = "cover", children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily, color: C.ink }}>
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: imgHeight,
          opacity: p,
          WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: fit,
            objectPosition: focus,
            scale: `${interpolate(frame, [0, 6 * fps], [1.12, 1.0], { extrapolateRight: "clamp" })}`,
          }}
        />
      </div>
      {credit && (
        <div style={{ position: "absolute", right: 24, top: 24, fontSize: 20, color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: 8, opacity: p }}>
          {credit}
        </div>
      )}
      <div style={{ position: "absolute", left: SAFE_X, right: SAFE_X, top }}>{children}</div>
    </AbsoluteFill>
  );
};

/** Ghép index.tsx: bọc cảnh bằng ngôn ngữ + hệ số thời gian. */
export const wrap =
  (lang: Lang, Comp: React.FC, scale = 1): React.FC =>
  () => (
    <LangProvider value={lang}>
      <TimeScale value={scale}>
        <Comp />
      </TimeScale>
    </LangProvider>
  );
