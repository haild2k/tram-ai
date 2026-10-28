import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import { Easing, interpolate } from "remotion";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700", "800", "900"],
  subsets: ["vietnamese", "latin"],
});

// Bảng màu Trạm AI (lấy từ logo) + màu chữ/phụ cho phong cách editorial.
export const C = {
  bg1: "#0e1230",
  bg2: "#1d1d4f",
  accent1: "#6f8cff",
  accent2: "#f2b254",
  ink: "#f4f1ea",
  muted: "rgba(244,241,234,0.62)",
  faint: "rgba(244,241,234,0.14)",
  card: "rgba(255,255,255,0.055)",
  danger: "#ff6b6b",
};

export const SAFE_X = 84;

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** 0→1 khi vào cảnh, bắt đầu ở `startSec`, kéo dài `durSec`. */
export const enter = (frame: number, fps: number, startSec: number, durSec = 0.7) =>
  interpolate(frame, [startSec * fps, (startSec + durSec) * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

/** Style trồi lên + hiện dần, dùng cho mọi khối chữ. */
export const rise = (p: number, dist = 60): React.CSSProperties => ({
  opacity: p,
  translate: `0px ${(1 - p) * dist}px`,
});
