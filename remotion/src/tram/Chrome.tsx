import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./theme";

/** Nền: gradient thương hiệu + lưới mảnh + 2 quầng sáng trôi chậm + hạt nhiễu. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${C.bg1} 0%, ${C.bg2} 55%, ${C.bg1} 100%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.faint} 1px, transparent 1px), linear-gradient(90deg, ${C.faint} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          opacity: 0.35,
          maskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent1}55 0%, transparent 65%)`,
          left: -300 + Math.sin(t * 0.35) * 120,
          top: 200 + Math.cos(t * 0.25) * 140,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent2}33 0%, transparent 65%)`,
          right: -260 + Math.cos(t * 0.3) * 100,
          bottom: 180 + Math.sin(t * 0.22) * 120,
        }}
      />
      <AbsoluteFill style={{ opacity: 0.08 }}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
