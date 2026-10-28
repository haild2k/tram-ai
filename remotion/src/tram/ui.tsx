// Bộ thành phần dùng chung cho style "remotion" của Trạm AI.
// Mỗi video chỉ viết các cảnh riêng trong src/videos/<slug>/Scenes.tsx và ghép từ các khối này.
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SAFE_X, enter, fontFamily, rise } from "./theme";

export const Stage: React.FC<{ children: React.ReactNode; justify?: React.CSSProperties["justifyContent"] }> = ({
  children,
  justify = "center",
}) => (
  <AbsoluteFill
    style={{
      padding: `160px ${SAFE_X}px 170px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: justify,
      fontFamily,
      color: C.ink,
    }}
  >
    {children}
  </AbsoluteFill>
);

export const Kicker: React.FC<{ p: number; children: React.ReactNode; color?: string }> = ({ p, children, color = C.accent1 }) => (
  <div style={{ ...rise(p, 30), display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
    <div style={{ width: 56, height: 6, borderRadius: 3, background: color }} />
    <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 4, color }}>{children}</div>
  </div>
);

export const H: React.FC<{ p: number; size?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  p,
  size = 88,
  children,
  style,
}) => (
  <div style={{ ...rise(p), fontSize: size, fontWeight: 900, lineHeight: 1.12, letterSpacing: -1.5, ...style }}>
    {children}
  </div>
);

export const Hl: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.accent2 }) => (
  <span style={{ color }}>{children}</span>
);

export const count = (frame: number, fps: number, from: number, to: number, startSec: number, durSec: number) =>
  Math.round(
    interpolate(frame, [startSec * fps, (startSec + durSec) * fps], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (x) => 1 - Math.pow(1 - x, 3),
    }),
  );

/** Ảnh trong khung bo góc, trồi lên khi vào và zoom chậm (Ken Burns). */
export const Photo: React.FC<{
  src: string;
  p: number;
  height: number;
  width?: number | string;
  fit?: "cover" | "contain";
  focus?: string;
  credit?: string;
  bg?: string;
  style?: React.CSSProperties;
}> = ({ src, p, height, width = "100%", fit = "cover", focus = "50% 50%", credit, bg = "transparent", style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div
      style={{
        ...rise(p, 50),
        position: "relative",
        width,
        height,
        borderRadius: 28,
        overflow: "hidden",
        background: bg,
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        border: `2px solid ${C.faint}`,
        flexShrink: 0,
        ...style,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          objectPosition: focus,
          scale: fit === "cover" ? `${interpolate(frame, [0, durationInFrames], [1.1, 1.0])}` : undefined,
        }}
      />
      {credit && (
        <div
          style={{
            position: "absolute",
            right: 14,
            bottom: 12,
            fontSize: 20,
            color: "rgba(255,255,255,0.85)",
            background: "rgba(0,0,0,0.45)",
            padding: "4px 10px",
            borderRadius: 8,
          }}
        >
          {credit}
        </div>
      )}
    </div>
  );
};

/** Nhãn nhỏ dưới biểu đồ gốc. */
export const Caption: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => (
  <div style={{ opacity: p, fontSize: 28, color: C.muted, marginTop: 14 }}>{children}</div>
);

export const Chip: React.FC<{ children: React.ReactNode; on?: boolean }> = ({ children, on }) => (
  <div
    style={{
      width: 64,
      height: 64,
      borderRadius: "50%",
      border: `3px solid ${on ? C.accent2 : C.faint}`,
      background: on ? C.accent2 : "transparent",
      color: on ? C.bg1 : C.muted,
      fontSize: 34,
      fontWeight: 800,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);

export const HBar: React.FC<{ label: React.ReactNode; v: number; p: number; color: string }> = ({ label, v, p, color }) => (
  <div style={{ ...rise(Math.min(1, p * 3), 40), marginTop: 56 }}>
    <div style={{ fontSize: 44, fontWeight: 600, marginBottom: 20 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
      <div style={{ flex: 1, height: 96, borderRadius: 20, background: C.faint, overflow: "hidden" }}>
        <div style={{ width: `${v * p}%`, height: "100%", background: color, borderRadius: 20 }} />
      </div>
      <div style={{ width: 230, fontSize: 104, fontWeight: 900, color, textAlign: "right", letterSpacing: -3 }}>{Math.round(v * p)}%</div>
    </div>
  </div>
);

export const Stat: React.FC<{ p: number; value: string; text: React.ReactNode; color: string }> = ({ p, value, text, color }) => (
  <div
    style={{
      ...rise(p, 50),
      display: "flex",
      alignItems: "center",
      gap: 30,
      padding: "22px 0",
      borderBottom: `2px solid ${C.faint}`,
    }}
  >
    <div style={{ width: 260, fontSize: 116, fontWeight: 900, color, letterSpacing: -4, lineHeight: 1 }}>{value}</div>
    <div style={{ flex: 1, fontSize: 42, fontWeight: 600, lineHeight: 1.25 }}>{text}</div>
  </div>
);

export const FlowBox: React.FC<{ p: number; title: string; sub: string; accent: string; children?: React.ReactNode }> = ({
  p,
  title,
  sub,
  accent,
  children,
}) => (
  <div
    style={{
      ...rise(p, 40),
      position: "relative",
      border: `3px solid ${accent}`,
      background: C.card,
      borderRadius: 24,
      padding: "22px 32px",
    }}
  >
    <div style={{ fontSize: 46, fontWeight: 800 }}>{title}</div>
    <div style={{ fontSize: 32, color: C.muted, marginTop: 4 }}>{sub}</div>
    {children}
  </div>
);

export const Arrow: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ opacity: p, alignSelf: "center", fontSize: 54, color: C.muted, lineHeight: 1, margin: "8px 0" }}>↓</div>
);

/* OUTRO chuẩn Trạm AI ---------------------------------------------------- */
const SOCIALS = [
  { plat: "YouTube", handle: "youtube.com/@tram-ai" },
  { plat: "TikTok", handle: "tiktok.com/@tram.ai.vn" },
  { plat: "Facebook", handle: "facebook.com/tram.ai.channel" },
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = enter(frame, fps, 0, 0.9);
  return (
    <Stage>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Img
          src={staticFile("logo.png")}
          style={{ width: 380, height: 380, opacity: logo, scale: `${0.7 + 0.3 * logo}`, rotate: `${(1 - logo) * -30}deg` }}
        />
        <H p={enter(frame, fps, 0.4)} size={110} style={{ marginTop: 40 }}>
          Trạm AI
        </H>
        <div style={{ ...rise(enter(frame, fps, 0.7)), fontSize: 46, fontWeight: 600, color: C.muted, marginTop: 20, lineHeight: 1.35 }}>
          Theo dõi để cập nhật
          <br />
          trí tuệ nhân tạo mỗi ngày
        </div>
        <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
          {SOCIALS.map((s, i) => (
            <div
              key={s.plat}
              style={{
                ...rise(enter(frame, fps, 1.0 + i * 0.2), 30),
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                background: C.card,
                border: `2px solid ${C.faint}`,
                borderRadius: 20,
                padding: "20px 32px",
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 800, color: C.accent2 }}>{s.plat}</span>
              <span style={{ fontSize: 42, fontWeight: 600 }}>{s.handle}</span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
};
