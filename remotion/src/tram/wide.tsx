// Khối dựng cho video dài 16:9 (1920x1080) style "remotion" của Trạm AI.
// Cùng ngôn ngữ hình ảnh với ui.tsx (short 9:16) nhưng cỡ chữ / khoảng cách cho khung ngang.
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, enter, fontFamily, rise } from "./theme";

export const WSAFE_X = 110;

export const WStage: React.FC<{
  children: React.ReactNode;
  justify?: React.CSSProperties["justifyContent"];
  style?: React.CSSProperties;
}> = ({ children, justify = "center", style }) => (
  <AbsoluteFill
    style={{
      padding: `80px ${WSAFE_X}px 80px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: justify,
      fontFamily,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);

/** Nhãn chương: vạch màu + "03 · ĐỘI PHÂN TÍCH". */
export const WK: React.FC<{ p: number; n?: string; children: React.ReactNode; color?: string }> = ({ p, n, children, color = C.accent1 }) => (
  <div style={{ ...rise(p, 24), display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
    <div style={{ width: 46, height: 5, borderRadius: 3, background: color }} />
    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3.5, color }}>
      {n && <span style={{ color: C.accent2 }}>{n} · </span>}
      {children}
    </div>
  </div>
);

export const WH: React.FC<{ p: number; size?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  p,
  size = 66,
  children,
  style,
}) => (
  <div style={{ ...rise(p, 40), fontSize: size, fontWeight: 900, lineHeight: 1.12, letterSpacing: -1.2, ...style }}>{children}</div>
);

export const Card: React.FC<{
  p: number;
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ p, children, accent = C.faint, style }) => (
  <div
    style={{
      ...rise(p, 34),
      background: C.card,
      border: `2px solid ${accent}`,
      borderRadius: 22,
      padding: "22px 28px",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Dòng gạch đầu có số / ký hiệu tròn. */
export const Bullet: React.FC<{ p: number; mark?: React.ReactNode; color?: string; children: React.ReactNode; size?: number }> = ({
  p,
  mark = "•",
  color = C.accent2,
  children,
  size = 36,
}) => (
  <div style={{ ...rise(p, 30), display: "flex", alignItems: "flex-start", gap: 20, fontSize: size, fontWeight: 600, lineHeight: 1.3 }}>
    <div
      style={{
        minWidth: size * 1.35,
        height: size * 1.35,
        borderRadius: 12,
        background: color,
        color: C.bg1,
        fontWeight: 900,
        fontSize: size * 0.8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {mark}
    </div>
    <div style={{ flex: 1, paddingTop: 2 }}>{children}</div>
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.accent1, style }) => (
  <span
    style={{
      display: "inline-block",
      padding: "6px 16px",
      borderRadius: 999,
      border: `2px solid ${color}`,
      color,
      fontSize: 26,
      fontWeight: 700,
      ...style,
    }}
  >
    {children}
  </span>
);

export type Box = { x: number; y: number; w: number; h: number }; // % của ảnh

/**
 * Hình gốc (paper / README) trên nền trắng, giữ tỉ lệ, zoom rất chậm. `hl` = vùng
 * tô sáng (toạ độ % theo ảnh) — phần còn lại tối đi; `hlP` 0→1 bật vùng đó.
 * `ar` = tỉ lệ rộng/cao của ảnh, để khung ôm vừa ảnh và vùng tô sáng khớp toạ độ.
 */
export const Figure: React.FC<{
  src: string;
  p: number;
  ar: number;
  width?: number;
  height?: number;
  hl?: Box;
  hlP?: number;
  pad?: number;
  bg?: string;
  style?: React.CSSProperties;
}> = ({ src, p, ar, width, height, hl, hlP = 0, pad = 18, bg = "#ffffff", style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const w = width ?? (height as number) * ar;
  const h = height ?? (width as number) / ar;
  return (
    <div
      style={{
        ...rise(p, 40),
        width: w + pad * 2,
        padding: pad,
        background: bg,
        borderRadius: 22,
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        flexShrink: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{ position: "relative", width: w, height: h, scale: `${interpolate(frame, [0, durationInFrames], [1, 1.03])}` }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        {hl && hlP > 0 && (
          <div
            style={{
              position: "absolute",
              left: `${hl.x}%`,
              top: `${hl.y}%`,
              width: `${hl.w}%`,
              height: `${hl.h}%`,
              borderRadius: 14,
              border: `5px solid ${C.accent2}`,
              boxShadow: `0 0 0 4000px rgba(14,18,48,${0.62 * hlP})`,
              opacity: hlP,
            }}
          />
        )}
      </div>
    </div>
  );
};

export const FigCaption: React.FC<{ p: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ p, children, style }) => (
  <div style={{ opacity: p, fontSize: 24, color: C.muted, marginTop: 12, ...style }}>{children}</div>
);

/** Số lớn chạy + nhãn. */
export const BigStat: React.FC<{ p: number; value: React.ReactNode; label: React.ReactNode; color?: string; size?: number }> = ({
  p,
  value,
  label,
  color = C.accent2,
  size = 110,
}) => (
  <div style={{ ...rise(p, 40) }}>
    <div style={{ fontSize: size, fontWeight: 900, color, letterSpacing: -4, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 30, fontWeight: 600, color: C.muted, marginTop: 10 }}>{label}</div>
  </div>
);

export const RightArrow: React.FC<{ p: number; color?: string; size?: number }> = ({ p, color = C.muted, size = 48 }) => (
  <div style={{ opacity: p, fontSize: size, color, lineHeight: 1, translate: `${(1 - p) * -20}px 0px` }}>→</div>
);

/* OUTRO ngang chuẩn Trạm AI ---------------------------------------------- */
const SOCIALS = [
  { plat: "YouTube", handle: "youtube.com/@tram-ai" },
  { plat: "TikTok", handle: "tiktok.com/@tram.ai.vn" },
  { plat: "Facebook", handle: "facebook.com/tram.ai.channel" },
];

export const OutroWide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = enter(frame, fps, 0, 0.9);
  return (
    <WStage>
      <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
        <Img
          src={staticFile("logo.png")}
          style={{ width: 400, height: 400, opacity: logo, scale: `${0.7 + 0.3 * logo}`, rotate: `${(1 - logo) * -30}deg` }}
        />
        <div style={{ flex: 1 }}>
          <WH p={enter(frame, fps, 0.4)} size={104}>
            Trạm AI
          </WH>
          <div style={{ ...rise(enter(frame, fps, 0.7)), fontSize: 40, fontWeight: 600, color: C.muted, marginTop: 14 }}>
            Theo dõi để cập nhật trí tuệ nhân tạo mỗi ngày
          </div>
          <div style={{ marginTop: 46, display: "flex", gap: 18 }}>
            {SOCIALS.map((s, i) => (
              <div
                key={s.plat}
                style={{
                  ...rise(enter(frame, fps, 1.0 + i * 0.2), 30),
                  flex: 1,
                  background: C.card,
                  border: `2px solid ${C.faint}`,
                  borderRadius: 20,
                  padding: "18px 20px",
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 800, color: C.accent2 }}>{s.plat}</div>
                <div style={{ fontSize: 25, fontWeight: 600, marginTop: 4, whiteSpace: "nowrap" }}>{s.handle}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WStage>
  );
};
