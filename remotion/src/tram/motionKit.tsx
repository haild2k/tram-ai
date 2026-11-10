// Style "skill-motion" cho series "Skill cho AI Agent" (16:9, video dài).
// 1 beat = 1 ý = 3–6 giây: pill tiến độ + tiêu đề 2 dòng VIẾT HOA (blur-in) + 1 vật thể
// minh hoạ đang "chạy" + caption pill đổi theo lời đọc. Nền tối, quầng sáng ấm, bụi sao.
// Cue: src/videos/<slug>/cues.json (mốc từng từ, scripts/align_cues.py); thiếu → ước lượng
// theo vị trí ký tự trong lời đọc.
import { Audio } from "@remotion/media";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { noise2D, noise3D } from "@remotion/noise";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Composition, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FPS, TRANSITION, timeline } from "./TramShort";
import { fontFamily } from "./theme";
import { OutroWide, SOCIALS_EN } from "./wide";

const { fontFamily: mono } = loadMono("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });

/* ---- Màu ------------------------------------------------------------------ */
export const M = {
  bg: "#07091a",
  ink: "#f6f2ea",
  muted: "rgba(246,242,234,0.62)",
  faint: "rgba(246,242,234,0.12)",
  hot: "#ff8a3d",
  gold: "#f2b254",
  blue: "#6f8cff",
  ok: "#3ddc97",
  bad: "#ff5a5a",
  card: "rgba(18,20,38,0.88)",
  line: "rgba(255,150,70,0.38)",
};
const GRAD = `linear-gradient(90deg, ${M.gold}, ${M.hot})`;

/* ---- Kiểu dữ liệu --------------------------------------------------------- */
type Lang = "vi" | "en";
export type Bi = string | { vi: string; en: string };
type Cap = { at?: Bi; t: Bi };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type V = Record<string, any> & { kind: string };
export type Beat = { id: string; chapter?: Bi; title: [Bi, Bi]; accent?: 0 | 1; v: V; caps?: Cap[]; voice: { vi: string; en: string } };
export type MSpec = { meta: { title: Bi }; slug: string; img: string; beats: Beat[] };
type Cues = Record<string, Record<string, number>>;

const Ctx = createContext<{ lang: Lang; text: Record<string, string>; dur: Record<string, number>; cues: Cues; img: string; parts: Record<string, [number, number]> }>({
  lang: "vi",
  text: {},
  dur: {},
  cues: {},
  img: "",
  parts: {},
});

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const springy = Easing.bezier(0.34, 1.56, 0.64, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Hook mỗi beat: T(bi), at(phrase) giây, on(at, mặc định) 0→1. */
const useBeat = (id: string) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useContext(Ctx);
  const T = (b: Bi | undefined) => (b === undefined ? "" : typeof b === "string" ? b : b[c.lang]);
  const text = c.text[id] ?? "";
  const dur = c.dur[id] ?? 4;
  const at = (ph: Bi | undefined, dflt = 0) => {
    if (!ph) return dflt;
    const p = T(ph);
    const hit = c.cues[id]?.[p];
    if (hit !== undefined) return hit;
    const i = text.indexOf(p);
    return i < 0 ? dflt : (i / Math.max(1, text.length)) * dur;
  };
  const t = frame / fps;
  const prog = (sec: number, d = 0.45, e = ease) => interpolate(t, [sec, sec + d], [0, 1], { ...clamp, easing: e });
  return { frame, fps, t, T, at, prog, dur, lang: c.lang, img: c.img, part: c.parts[id] };
};

/* ---- Âm thanh ------------------------------------------------------------- */
const Sfx: React.FC<{ name: string; at: number; vol?: number }> = ({ name, at, vol = 0.3 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={Math.round(1.4 * fps)} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
};
const Typing: React.FC<{ from: number; sec: number }> = ({ from, sec }) => {
  const n = Math.min(40, Math.floor(sec / 0.09));
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <Sfx key={i} name="type" at={from + i * 0.09} vol={0.12} />
      ))}
    </>
  );
};

/* ---- Nền ------------------------------------------------------------------ */
const Glow: React.FC = () => {
  const frame = useCurrentFrame();
  const b = 0.85 + 0.15 * noise2D("g", frame / 160, 0);
  const x = 50 + 4 * noise2D("x", frame / 300, 1);
  return (
    <AbsoluteFill style={{ background: M.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 60% at ${x}% 55%, rgba(255,120,40,${0.2 * b}), rgba(255,120,40,0) 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 35% 35% at 50% 58%, rgba(242,178,84,${0.1 * b}), rgba(0,0,0,0) 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};
const DOTS = Array.from({ length: 90 }, (_, i) => ({ x: (i * 977) % 1920, y: (i * 613) % 1080, r: 1 + ((i * 37) % 3) * 0.7, s: i }));
const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {DOTS.map((d) => {
        const dx = 30 * noise3D("dx", d.s, 0, frame / 400);
        const dy = 30 * noise3D("dy", d.s, 1, frame / 400) - ((frame * 0.15) % 1080) * 0;
        const tw = 0.25 + 0.45 * (0.5 + 0.5 * noise3D("tw", d.s, 2, frame / 40));
        return <div key={d.s} style={{ position: "absolute", left: d.x + dx, top: d.y + dy, width: d.r * 2, height: d.r * 2, borderRadius: 9, background: "#ffe6c8", opacity: tw }} />;
      })}
    </AbsoluteFill>
  );
};

/* ---- Khối dùng chung ------------------------------------------------------- */
const Icon: React.FC<{ name: string; size?: number; style?: React.CSSProperties }> = ({ name, size = 64, style }) => (
  <Img src={staticFile(`icons3d/${name}.png`)} style={{ width: size, height: size, objectFit: "contain", ...style }} />
);
const Win: React.FC<{ title?: string; w?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, w = 1060, children, style }) => (
  <div style={{ width: w, background: M.card, border: `1.5px solid ${M.line}`, borderRadius: 24, boxShadow: "0 0 80px rgba(255,120,40,0.16), 0 30px 60px rgba(0,0,0,0.5)", overflow: "hidden", ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", borderBottom: `1px solid ${M.faint}` }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div key={c} style={{ width: 13, height: 13, borderRadius: 9, background: c }} />
      ))}
      {title && <div style={{ marginLeft: 12, fontSize: 24, fontWeight: 600, color: M.muted }}>{title}</div>}
    </div>
    <div style={{ padding: "22px 30px 26px" }}>{children}</div>
  </div>
);
const pop = (p: number): React.CSSProperties => ({ opacity: Math.min(1, p * 1.6), scale: `${0.86 + 0.14 * p}`, translate: `0px ${(1 - p) * 26}px` });
const blurIn = (p: number): React.CSSProperties => ({ opacity: p, filter: `blur(${(1 - p) * 14}px)`, translate: `0px ${(1 - p) * 18}px` });
const Box: React.FC<{ on: boolean; tone?: "ok" | "bad"; p: number }> = ({ on, tone = "ok", p }) => (
  <div style={{ width: 40, height: 40, flex: "none", borderRadius: 10, border: `2px solid ${on ? (tone === "ok" ? M.ok : M.bad) : M.faint}`, background: on ? (tone === "ok" ? M.ok : M.bad) : "transparent", display: "flex", alignItems: "center", justifyContent: "center", scale: `${on ? 0.8 + 0.2 * p : 1}` }}>
    {on && <div style={{ color: M.bg, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{tone === "ok" ? "✓" : "✕"}</div>}
  </div>
);
const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg width="54" height="54" viewBox="0 0 24 24" style={{ position: "absolute", left: x, top: y, scale: `${1 - 0.15 * press}`, filter: "drop-shadow(0 4px 8px rgba(0,0,0,.6))", zIndex: 5 }}>
    <path d="M4 2 L4 19 L8.5 14.5 L11.5 21 L14 20 L11 13.5 L17.5 13.5 Z" fill="#fff" stroke="#111" strokeWidth="1.2" />
  </svg>
);

/* ---- Các loại vật thể ------------------------------------------------------ */
type VP = { b: Beat; v: V };

/** Danh sách item xuất hiện theo `at` hoặc rải đều. */
const useItems = (b: Beat, items: { at?: Bi }[], start = 0.35, gap = 0.4) => {
  const B = useBeat(b.id);
  const times = items.map((it, i) => (it.at ? Math.max(0.2, B.at(it.at) - 0.1) : start + i * gap));
  const last = times.reduce((m, s, i) => (B.t >= s ? i : m), -1);
  return { ...B, times, last };
};

const WindowV: React.FC<VP> = ({ b, v }) => {
  const rows = v.rows as { at?: Bi; k: Bi; v?: Bi; icon?: string; tone?: "ok" | "bad" }[];
  const I = useItems(b, rows);
  return (
    <Win title={I.T(v.title)} w={v.w ?? 1080}>
      {rows.map((r, i) => {
        const p = I.prog(I.times[i], 0.5, springy);
        const cur = i === I.last;
        const col = r.tone === "ok" ? M.ok : r.tone === "bad" ? M.bad : M.gold;
        return (
          <div key={i} style={{ ...pop(p), display: "flex", alignItems: "center", gap: 22, padding: "14px 18px", marginTop: i ? 10 : 0, borderRadius: 14, border: `1.5px solid ${cur ? col : "transparent"}`, background: cur ? "rgba(255,140,60,0.08)" : "rgba(255,255,255,0.03)" }}>
            {r.icon && <Icon name={r.icon} size={48} />}
            <div style={{ fontSize: 34, fontWeight: 800, color: M.ink, flex: r.v ? "none" : 1, width: r.v ? (v.kw ?? 330) : undefined }}>{I.T(r.k)}</div>
            {r.v && <div style={{ fontSize: 30, fontWeight: 600, color: cur ? col : M.muted, flex: 1 }}>{I.T(r.v)}</div>}
          </div>
        );
      })}
      {rows.map((_, i) => (
        <Sfx key={i} name="pop" at={I.times[i]} vol={0.2} />
      ))}
    </Win>
  );
};

const ChecklistV: React.FC<VP> = ({ b, v }) => {
  const items = v.items as { at?: Bi; t: Bi; tone?: "ok" | "bad" }[];
  const I = useItems(b, items, 0.6, 0.6);
  return (
    <Win title={I.T(v.title)} w={v.w ?? 980}>
      {items.map((it, i) => {
        const on = I.t >= I.times[i];
        const cur = i === I.last;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 16px", marginTop: i ? 10 : 0, borderRadius: 14, border: `1.5px solid ${cur ? M.gold : M.faint}`, opacity: on ? 1 : 0.55 }}>
            <Box on={on} tone={it.tone} p={I.prog(I.times[i], 0.3, springy)} />
            <div style={{ fontSize: 34, fontWeight: 700 }}>{I.T(it.t)}</div>
          </div>
        );
      })}
      {items.map((it, i) => (
        <Sfx key={i} name="tick" at={I.times[i]} vol={0.25} />
      ))}
    </Win>
  );
};

const SkillCardV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const tc = B.at(v.at, Math.min(2.2, B.dur * 0.6));
  const appear = B.prog(0.15, 0.5, springy);
  const move = B.prog(tc - 0.8, 0.75);
  const press = B.prog(tc, 0.12) * (1 - B.prog(tc + 0.15, 0.2));
  const done = B.t >= tc;
  return (
    <div style={{ position: "relative", ...pop(appear) }}>
      <Win w={880}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 92, height: 92, borderRadius: 20, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={v.icon ?? "puzzle"} size={70} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 3, color: M.hot }}>{B.T(v.label ?? "SKILL")}</div>
            <div style={{ fontSize: 46, fontWeight: 800 }}>{B.T(v.name)}</div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${M.faint}`, margin: "22px 0 16px" }} />
        {(v.lines ?? []).map((l: Bi, i: number) => (
          <div key={i} style={{ fontSize: 30, fontWeight: 600, color: i === 0 && v.lines.length > 1 ? M.muted : M.ink, marginTop: 6 }}>
            {B.T(l)}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 22 }}>
          {v.btn2 && <div style={{ fontSize: 28, fontWeight: 700, padding: "12px 26px", borderRadius: 14, border: `1.5px solid ${M.faint}` }}>{B.T(v.btn2)}</div>}
          <div style={{ fontSize: 28, fontWeight: 800, padding: "12px 30px", borderRadius: 14, background: done ? M.ok : M.hot, color: M.bg, scale: `${1 - press * 0.08}`, boxShadow: `0 0 ${20 + press * 40}px rgba(255,138,61,0.6)` }}>
            {done && v.done ? B.T(v.done) : B.T(v.btn ?? "Dùng skill")}
          </div>
        </div>
      </Win>
      <Cursor x={interpolate(move, [0, 1], [380, 760])} y={interpolate(move, [0, 1], [520, 330 + (v.btnY ?? 0)])} press={press} />
      <Sfx name="click" at={tc} vol={0.45} />
    </div>
  );
};

const typed = (s: string, p: number) => s.slice(0, Math.round(s.length * Math.max(0, Math.min(1, p))));

const TerminalV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const lines = v.lines as { cmd?: string; out?: Bi; at?: Bi; tone?: "ok" | "bad" | "dim" }[];
  let cursor = 0.4;
  const sched = lines.map((l) => {
    const s = l.at ? Math.max(cursor, B.at(l.at) - 0.1) : cursor;
    const len = l.cmd ? Math.min(1.8, l.cmd.length * 0.035) : 0.15;
    cursor = s + len + 0.25;
    return { s, len };
  });
  const appear = B.prog(0, 0.4);
  return (
    <div style={pop(appear)}>
      <Win title={B.T(v.title ?? "Terminal")} w={v.w ?? 1260}>
        <div style={{ fontFamily: mono, fontSize: v.size ?? 32, lineHeight: 1.6 }}>
          {lines.map((l, i) => {
            const { s, len } = sched[i];
            if (B.t < s) return null;
            const col = l.tone === "ok" ? M.ok : l.tone === "bad" ? M.bad : l.tone === "dim" ? M.muted : M.ink;
            return l.cmd ? (
              <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                <span style={{ color: M.hot }}>$ </span>
                {typed(l.cmd, (B.t - s) / len)}
                {B.t < s + len + 0.3 && <span style={{ opacity: Math.round(B.t * 3) % 2, color: M.gold }}>▌</span>}
              </div>
            ) : (
              <div key={i} style={{ color: col, ...blurIn(B.prog(s, 0.3)) }}>
                {B.T(l.out)}
              </div>
            );
          })}
        </div>
      </Win>
      {lines.map((l, i) => (l.cmd ? <Typing key={i} from={sched[i].s} sec={sched[i].len} /> : <Sfx key={i} name="pop" at={sched[i].s} vol={0.12} />))}
    </div>
  );
};

const FileV: React.FC<VP> = ({ b, v }) => {
  const lines = v.lines as { t: Bi; at?: Bi; hl?: "ok" | "bad" | "hot" }[];
  const hot = lines.filter((l) => l.hl);
  const I = useItems(b, hot, 0.8, 0.9);
  const appear = I.prog(0, 0.45);
  return (
    <div style={pop(appear)}>
      <Win title={I.T(v.name)} w={v.w ?? 1200}>
        <div style={{ fontFamily: mono, fontSize: v.size ?? 30, lineHeight: 1.75 }}>
          {lines.map((l, i) => {
            const k = hot.indexOf(l);
            const on = k >= 0 && I.t >= I.times[k];
            const col = l.hl === "ok" ? M.ok : l.hl === "bad" ? M.bad : M.gold;
            return (
              <div key={i} style={{ display: "flex", gap: 24, padding: "0 12px", borderRadius: 8, background: on ? `${col}22` : "transparent", borderLeft: `4px solid ${on ? col : "transparent"}` }}>
                <span style={{ color: "rgba(246,242,234,0.3)", width: 34, textAlign: "right" }}>{i + 1}</span>
                <span style={{ color: on ? M.ink : k >= 0 ? M.muted : "rgba(246,242,234,0.72)", whiteSpace: "pre-wrap" }}>{I.T(l.t)}</span>
              </div>
            );
          })}
        </div>
      </Win>
      {hot.map((_, i) => (
        <Sfx key={i} name="pop" at={I.times[i]} vol={0.15} />
      ))}
    </div>
  );
};

const FlowV: React.FC<VP> = ({ b, v }) => {
  const items = v.items as { icon: string; label: Bi; at?: Bi }[];
  const I = useItems(b, items, 0.3, 0.55);
  const n = items.length;
  const tile = n > 4 ? 150 : 180;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 26 }}>
      {items.map((it, i) => {
        const p = I.prog(I.times[i], 0.5, springy);
        const cur = i === I.last;
        return (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ fontSize: 60, color: M.hot, marginTop: tile / 2 - 40, opacity: p, translate: `${(1 - p) * -20}px 0px` }}>→</div>}
            <div style={{ ...pop(p), display: "flex", flexDirection: "column", alignItems: "center", width: tile + 70 }}>
              <div style={{ width: tile, height: tile, borderRadius: 34, background: M.card, border: `2px solid ${cur ? M.hot : M.line}`, boxShadow: cur ? "0 0 50px rgba(255,138,61,0.45)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={it.icon} size={tile * 0.62} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 18, textAlign: "center", color: cur ? M.ink : M.muted, lineHeight: 1.2 }}>{I.T(it.label)}</div>
            </div>
          </React.Fragment>
        );
      })}
      {items.map((_, i) => (
        <Sfx key={i} name="pop" at={I.times[i]} vol={0.22} />
      ))}
    </div>
  );
};

const IconV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const p = B.prog(0.15, 0.6, springy);
  const tm = B.at(v.at, 1.2);
  const mk = B.prog(tm, 0.4);
  const bob = 8 * Math.sin(B.t * 2.2);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ ...pop(p), position: "relative", width: 300, height: 300, borderRadius: 60, background: M.card, border: `2px solid ${v.mark === "strike" ? M.bad : M.line}`, boxShadow: "0 0 90px rgba(255,120,40,0.3)", display: "flex", alignItems: "center", justifyContent: "center", translate: `0px ${bob}px` }}>
        <Icon name={v.icon} size={200} />
        {v.mark === "strike" && <div style={{ position: "absolute", width: 360 * mk, height: 18, borderRadius: 9, background: M.bad, rotate: "-45deg", boxShadow: "0 0 30px rgba(255,90,90,0.8)" }} />}
        {v.mark === "check" && <div style={{ position: "absolute", right: -26, bottom: -26, width: 96, height: 96, borderRadius: 50, background: M.ok, color: M.bg, fontSize: 64, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", scale: `${mk}` }}>✓</div>}
      </div>
      {v.label && <div style={{ ...blurIn(B.prog(0.6, 0.5)), fontSize: 40, fontWeight: 800, marginTop: 44, textAlign: "center", maxWidth: 1300 }}>{B.T(v.label)}</div>}
      <Sfx name={v.mark === "strike" ? "hit" : "pop"} at={v.mark ? tm : 0.15} vol={0.35} />
    </div>
  );
};

const QuoteV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const s = B.at(v.at, 0.4);
  const q = B.T(v.t);
  const len = Math.min(B.dur * 0.75, q.length * 0.04);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", ...pop(B.prog(0.1, 0.5)) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "26px 40px", borderRadius: 60, background: M.card, border: `2px solid ${M.line}`, maxWidth: 1400, boxShadow: "0 0 60px rgba(255,120,40,0.2)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 30, background: M.hot, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", color: M.bg, fontSize: 30, fontWeight: 900 }}>❝</div>
        <div style={{ display: "flex", gap: 5, alignItems: "center", flex: "none" }}>
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} style={{ width: 5, borderRadius: 3, background: M.hot, height: 10 + 34 * Math.abs(noise2D("w", i, B.t * 3)) }} />
          ))}
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, fontStyle: "italic", lineHeight: 1.3 }}>“{typed(q, (B.t - s) / len)}”</div>
      </div>
      {v.who && <div style={{ ...blurIn(B.prog(s + len, 0.4)), fontSize: 28, fontWeight: 600, color: M.muted, marginTop: 26 }}>{B.T(v.who)}</div>}
      <Typing from={s} sec={len} />
    </div>
  );
};

const Side: React.FC<{ B: ReturnType<typeof useBeat>; s: V; p: number; good?: boolean }> = ({ B, s, p, good }) => {
  const col = good === undefined ? M.blue : good ? M.ok : M.bad;
  return (
    <div style={{ ...pop(p), width: 680, minHeight: 300, borderRadius: 28, background: M.card, border: `2px solid ${col}`, boxShadow: `0 0 60px ${col}33`, padding: "30px 36px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {s.icon && <Icon name={s.icon} size={74} />}
        {s.tag && <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, color: col }}>{B.T(s.tag)}</div>}
      </div>
      <div style={{ fontSize: s.big ? 52 : 40, fontWeight: 800, marginTop: 16, lineHeight: 1.2, fontFamily: s.mono ? mono : undefined }}>{B.T(s.title)}</div>
      {(s.lines ?? []).map((l: Bi, i: number) => (
        <div key={i} style={{ fontSize: 30, fontWeight: 600, color: M.muted, marginTop: 10 }}>
          {B.T(l)}
        </div>
      ))}
      {good !== undefined && (
        <div style={{ position: "absolute", top: -30, right: -30, width: 76, height: 76, borderRadius: 40, background: col, color: M.bg, fontSize: 46, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", scale: `${Math.min(1, p * 1.2)}`, rotate: `${(1 - p) * -40}deg` }}>
          {good ? "✓" : "✕"}
        </div>
      )}
    </div>
  );
};
const VersusV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const ta = B.at(v.a.at, 0.3);
  const tb = B.at(v.b.at, Math.max(ta + 0.9, B.dur * 0.45));
  const neutral = v.neutral === true;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
      <Side B={B} s={v.a} p={B.prog(ta, 0.5, springy)} good={neutral ? undefined : (v.a.good ?? false)} />
      <div style={{ fontSize: 44, fontWeight: 900, color: M.muted, opacity: B.prog(tb - 0.2, 0.3) }}>VS</div>
      <Side B={B} s={v.b} p={B.prog(tb, 0.5, springy)} good={neutral ? undefined : (v.b.good ?? true)} />
      <Sfx name="pop" at={ta} vol={0.25} />
      <Sfx name={neutral ? "pop" : "tick"} at={tb} vol={0.3} />
    </div>
  );
};

const fmt = (n: number, dec: number, lang: Lang) =>
  n.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const StatV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const p = B.prog(0.2, 1.4, Easing.out(Easing.cubic));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", ...pop(B.prog(0.1, 0.4)) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        {v.icon && <Icon name={v.icon} size={170} style={{ translate: `0px ${8 * Math.sin(B.t * 2)}px` }} />}
        <div style={{ fontSize: 190, fontWeight: 900, lineHeight: 1, letterSpacing: -6, background: GRAD, WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 40px rgba(255,138,61,0.4))" }}>
          {B.T(v.pre)}
          {fmt(v.value * p, v.dec ?? 0, B.lang)}
          {B.T(v.suf)}
        </div>
      </div>
      <div style={{ fontSize: 44, fontWeight: 800, marginTop: 20 }}>{B.T(v.label)}</div>
      {v.sub && <div style={{ ...blurIn(B.prog(1.2, 0.5)), fontSize: 30, fontWeight: 600, color: M.muted, marginTop: 14 }}>{B.T(v.sub)}</div>}
      <Sfx name="riser" at={0} vol={0.18} />
    </div>
  );
};

const ImageV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const z = 1 + 0.05 * (B.t / Math.max(1, B.dur));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", ...pop(B.prog(0.1, 0.6)) }}>
      <div style={{ width: v.w ?? 900, borderRadius: 24, overflow: "hidden", border: `2px solid ${M.line}`, boxShadow: "0 0 80px rgba(255,120,40,0.25)" }}>
        <Img src={staticFile(`${B.img}/${v.src}`)} style={{ width: "100%", display: "block", scale: `${z}` }} />
      </div>
      {v.label && <div style={{ fontSize: 28, fontWeight: 600, color: M.muted, marginTop: 18 }}>{B.T(v.label)}</div>}
      <Sfx name="pop" at={0.1} vol={0.2} />
    </div>
  );
};

const ChatV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const items = (v.items ?? []) as { t: Bi; at?: Bi }[];
  const u = B.T(v.user);
  const uLen = Math.min(1.4, u.length * 0.04);
  const tStatus = 0.4 + uLen + 0.3;
  const I = useItems(b, items, tStatus + 0.7, 0.7);
  const allDone = items.length > 0 && B.t >= I.times[items.length - 1] + 0.4;
  return (
    <div style={pop(B.prog(0, 0.4))}>
      <Win title={B.T(v.title ?? "Claude")} w={v.w ?? 1060}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ fontSize: 34, fontWeight: 700, padding: "16px 26px", borderRadius: 20, background: "rgba(255,138,61,0.18)", border: `1.5px solid ${M.line}` }}>
            {typed(u, (B.t - 0.4) / uLen) || " "}
          </div>
        </div>
        {B.t >= tStatus && (
          <div style={{ ...blurIn(B.prog(tStatus, 0.3)), display: "inline-flex", alignItems: "center", gap: 14, marginTop: 20, padding: "10px 20px", borderRadius: 30, border: `1.5px solid ${M.faint}`, fontSize: 28, fontWeight: 600 }}>
            {allDone ? <span style={{ color: M.ok, fontWeight: 900 }}>✓</span> : <div style={{ width: 24, height: 24, borderRadius: 14, border: `3px solid ${M.hot}`, borderTopColor: "transparent", rotate: `${B.t * 360}deg` }} />}
            {B.T(v.status)}
          </div>
        )}
        {items.map((it, i) =>
          B.t >= I.times[i] ? (
            <div key={i} style={{ ...blurIn(I.prog(I.times[i], 0.3)), display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}>
              <Box on tone="ok" p={I.prog(I.times[i], 0.3, springy)} />
              <div style={{ fontSize: 32, fontWeight: 700 }}>{I.T(it.t)}</div>
            </div>
          ) : null,
        )}
        <div style={{ marginTop: 24, padding: "14px 20px", borderRadius: 14, border: `1px solid ${M.faint}`, fontSize: 26, color: M.muted }}>{B.lang === "vi" ? "Nhắn cho Claude…" : "Message Claude…"}</div>
      </Win>
      <Typing from={0.4} sec={uLen} />
      {items.map((_, i) => (
        <Sfx key={i} name="tick" at={I.times[i]} vol={0.22} />
      ))}
    </div>
  );
};

const GridV: React.FC<VP> = ({ b, v }) => {
  const items = v.items as { icon?: string; t: Bi; sub?: Bi; at?: Bi; tone?: "ok" | "bad" }[];
  const I = useItems(b, items, 0.3, 0.45);
  const cols = v.cols ?? Math.min(3, items.length);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${v.cw ?? 430}px)`, gap: 26 }}>
      {items.map((it, i) => {
        const p = I.prog(I.times[i], 0.5, springy);
        const cur = i === I.last;
        const col = it.tone === "ok" ? M.ok : it.tone === "bad" ? M.bad : M.hot;
        return (
          <div key={i} style={{ ...pop(p), borderRadius: 24, background: M.card, border: `2px solid ${cur ? col : M.line}`, boxShadow: cur ? `0 0 50px ${col}55` : "none", padding: "24px 26px", display: "flex", alignItems: "center", gap: 20 }}>
            {it.icon && <Icon name={it.icon} size={70} />}
            {it.tone && !it.icon && <Box on tone={it.tone} p={p} />}
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2 }}>{I.T(it.t)}</div>
              {it.sub && <div style={{ fontSize: 25, fontWeight: 600, color: M.muted, marginTop: 6 }}>{I.T(it.sub)}</div>}
            </div>
          </div>
        );
      })}
      {items.map((_, i) => (
        <Sfx key={i} name="pop" at={I.times[i]} vol={0.2} />
      ))}
    </div>
  );
};

/** 3 trang web "do AI làm" y hệt nhau. */
const MiniPage: React.FC<{ p: number; w: number }> = ({ p, w }) => (
  <div style={{ ...pop(p), width: w, height: w * 0.72, borderRadius: 18, overflow: "hidden", background: "#fff", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
    <div style={{ height: "46%", background: "linear-gradient(135deg,#7c3aed,#a855f7 60%,#ec4899)", padding: w * 0.06, color: "#fff", fontFamily: "Inter, Arial, sans-serif" }}>
      <div style={{ fontSize: w * 0.075, fontWeight: 700 }}>Build faster with AI</div>
      <div style={{ width: "55%", height: w * 0.022, background: "rgba(255,255,255,0.6)", borderRadius: 6, marginTop: w * 0.03 }} />
      <div style={{ width: w * 0.22, height: w * 0.06, background: "#fff", borderRadius: 8, marginTop: w * 0.04 }} />
    </div>
    <div style={{ display: "flex", gap: w * 0.03, padding: w * 0.05 }}>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ flex: 1, height: w * 0.22, borderRadius: 12, background: "#f4f4f7", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />
      ))}
    </div>
  </div>
);
const PagesV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const n = v.n ?? 3;
  const conv = v.converge ? B.prog(B.dur * 0.35, 1.2) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 40 }}>
        {Array.from({ length: n }, (_, i) => {
          const off = (i - (n - 1) / 2) * 500 * conv;
          return (
            <div key={i} style={{ translate: `${-off}px 0px`, rotate: `${(i - 1) * 3 * (1 - conv)}deg`, opacity: conv > 0 && i !== Math.floor(n / 2) ? 1 - conv * 0.6 : 1 }}>
              <MiniPage p={B.prog(0.2 + i * 0.5, 0.5, springy)} w={460} />
              <div style={{ textAlign: "center", fontSize: 26, fontWeight: 700, color: M.muted, marginTop: 14 }}>{B.T(v.label ?? { vi: "Trang AI", en: "AI page" })} #{i + 1}</div>
            </div>
          );
        })}
      </div>
      {Array.from({ length: n }, (_, i) => (
        <Sfx key={i} name="pop" at={0.2 + i * 0.5} vol={0.25} />
      ))}
    </div>
  );
};

/** Mô phỏng 5 "look" mặc định của AI. */
const LookV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const p = B.prog(0.15, 0.6, springy);
  const W = 1000;
  const H = 520;
  const sw = (v.swatch ?? []) as string[];
  const body = (() => {
    switch (v.look) {
      case 1:
        return (
          <div style={{ width: W, height: H, background: "#F4F1EA", padding: 56, color: "#1d1a16" }}>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 86, lineHeight: 1, fontWeight: 700 }}>Crafted with care.</div>
            <div style={{ fontSize: 28, marginTop: 24, width: 600, color: "#5b544b" }}>A thoughtful studio for thoughtful brands.</div>
            <div style={{ display: "inline-block", marginTop: 34, background: "#D97757", color: "#fff", fontSize: 28, fontWeight: 700, padding: "16px 32px", borderRadius: 40 }}>Get started</div>
          </div>
        );
      case 2:
        return (
          <div style={{ width: W, height: H, background: "#0B0B0B", padding: 56, color: "#eee" }}>
            <div style={{ fontSize: 84, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>
              SHIP <span style={{ color: "#B6FF3B" }}>FASTER</span>
            </div>
            <div style={{ fontSize: 28, marginTop: 24, color: "#999" }}>The platform for modern teams.</div>
            <div style={{ display: "inline-block", marginTop: 34, background: "#B6FF3B", color: "#0B0B0B", fontSize: 28, fontWeight: 800, padding: "16px 32px" }}>Start now</div>
          </div>
        );
      case 3:
        return (
          <div style={{ width: W, height: H, background: "#f7f5ef", padding: 40, color: "#111", fontFamily: "Georgia, serif" }}>
            <div style={{ borderTop: "2px solid #111", borderBottom: "1px solid #111", padding: "10px 0", fontSize: 54, fontWeight: 700, textAlign: "center" }}>The Daily Product</div>
            <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ flex: 1, borderLeft: k ? "1px solid #111" : "none", paddingLeft: k ? 20 : 0 }}>
                  {Array.from({ length: 9 }, (_, j) => (
                    <div key={j} style={{ height: 12, background: "#bbb", marginTop: 12, width: `${70 + ((j * 17 + k * 11) % 30)}%` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ width: W, height: H, background: "linear-gradient(160deg,#eef2ff,#fdf2f8)", padding: 48, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 26 }}>
            {Array.from({ length: 6 }, (_, k) => (
              <div key={k} style={{ background: "#fff", borderRadius: 18, boxShadow: "0 8px 20px rgba(0,0,0,.1)", padding: 22 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg,#818cf8,#c084fc)" }} />
                <div style={{ height: 14, background: "#ddd", borderRadius: 7, marginTop: 18, width: "80%" }} />
                <div style={{ height: 12, background: "#eee", borderRadius: 6, marginTop: 10 }} />
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div style={{ width: W, height: H, background: "#111", padding: 56, color: "#eee" }}>
            <div style={{ fontSize: 24, letterSpacing: 6, fontWeight: 800, color: "#ff7849" }}>INTRODUCING — THE PLATFORM</div>
            <div style={{ fontSize: 70, fontWeight: 800, marginTop: 16 }}>Work, reimagined</div>
            <div style={{ fontFamily: mono, fontSize: 24, color: "#888", marginTop: 20 }}>Fast · Secure · Scalable</div>
            <div style={{ display: "flex", gap: 20, marginTop: 34 }}>
              <div style={{ fontSize: 28, fontWeight: 700, background: "#ff7849", color: "#111", padding: "14px 28px", borderRadius: 10 }}>Get started →</div>
              <div style={{ fontSize: 28, fontWeight: 700, border: "1px solid #555", padding: "14px 28px", borderRadius: 10 }}>Learn more →</div>
            </div>
          </div>
        );
    }
  })();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
      <div style={{ ...pop(p), borderRadius: 22, overflow: "hidden", border: `2px solid ${M.line}`, boxShadow: "0 0 80px rgba(255,120,40,0.2)" }}>{body}</div>
      {sw.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sw.map((c, i) => (
            <div key={c} style={{ ...pop(B.prog(0.8 + i * 0.3, 0.4, springy)), display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: c, border: `2px solid ${M.faint}` }} />
              <div style={{ fontFamily: mono, fontSize: 26, color: M.muted }}>{c}</div>
            </div>
          ))}
        </div>
      )}
      <Sfx name="pop" at={0.15} vol={0.25} />
    </div>
  );
};

/** Nút bấm → trạng thái mới (vd "Đăng" → "Đã đăng"). */
const ButtonV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const tc = B.at(v.at, Math.min(1.8, B.dur * 0.5));
  const move = B.prog(tc - 0.8, 0.75);
  const press = B.prog(tc, 0.12) * (1 - B.prog(tc + 0.15, 0.2));
  const toast = B.prog(tc + 0.25, 0.4, springy);
  return (
    <div style={{ position: "relative", width: 1000, height: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...pop(B.prog(0.1, 0.5)) }}>
      <div style={{ fontSize: 44, fontWeight: 800, padding: "26px 64px", borderRadius: 22, background: M.hot, color: M.bg, scale: `${1 - press * 0.08}`, boxShadow: `0 0 ${30 + press * 50}px rgba(255,138,61,0.6)` }}>{B.T(v.btn)}</div>
      <div style={{ ...pop(toast), marginTop: 60, display: "flex", alignItems: "center", gap: 16, padding: "18px 34px", borderRadius: 18, background: M.card, border: `2px solid ${M.ok}`, fontSize: 36, fontWeight: 700 }}>
        <span style={{ color: M.ok, fontWeight: 900 }}>✓</span>
        {B.T(v.toast)}
      </div>
      <Cursor x={interpolate(move, [0, 1], [820, 560])} y={interpolate(move, [0, 1], [420, 150])} press={press} />
      <Sfx name="click" at={tc} vol={0.45} />
      <Sfx name="tick" at={tc + 0.25} vol={0.25} />
    </div>
  );
};

const TimelineV: React.FC<VP> = ({ b, v }) => {
  const items = v.items as { when: Bi; t: Bi; sub?: Bi; at?: Bi }[];
  const I = useItems(b, items, 0.4, 0.7);
  const n = items.length;
  const lineP = I.prog(I.times[0], Math.max(0.6, I.times[n - 1] - I.times[0] + 0.4));
  return (
    <div style={{ position: "relative", width: 1500 }}>
      <div style={{ position: "absolute", left: 120, top: 46, height: 6, borderRadius: 3, width: 1260 * lineP, background: GRAD, boxShadow: "0 0 20px rgba(255,138,61,0.6)" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {items.map((it, i) => {
          const p = I.prog(I.times[i], 0.5, springy);
          const cur = i === I.last;
          return (
            <div key={i} style={{ ...pop(p), width: 400, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: 98, height: 98, borderRadius: 50, background: cur ? M.hot : M.card, border: `3px solid ${M.hot}`, color: cur ? M.bg : M.ink, fontSize: 40, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: cur ? "0 0 40px rgba(255,138,61,0.7)" : "none" }}>{i + 1}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: M.gold, marginTop: 20 }}>{I.T(it.when)}</div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{I.T(it.t)}</div>
              {it.sub && <div style={{ fontSize: 26, fontWeight: 600, color: M.muted, marginTop: 8 }}>{I.T(it.sub)}</div>}
            </div>
          );
        })}
      </div>
      {items.map((_, i) => (
        <Sfx key={i} name="pop" at={I.times[i]} vol={0.22} />
      ))}
    </div>
  );
};

const BarsV: React.FC<VP> = ({ b, v }) => {
  const items = v.items as { k: Bi; v: number; at?: Bi; label?: Bi }[];
  const I = useItems(b, items, 0.4, 0.6);
  const max = v.max ?? Math.max(...items.map((x) => x.v));
  return (
    <Win title={I.T(v.title)} w={1200}>
      {items.map((it, i) => {
        const p = I.prog(I.times[i], 0.8, Easing.out(Easing.cubic));
        const cur = i === I.last;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, marginTop: i ? 22 : 4, opacity: 0.35 + 0.65 * Math.min(1, p * 2) }}>
            <div style={{ width: 200, fontSize: 34, fontWeight: 800 }}>{I.T(it.k)}</div>
            <div style={{ flex: 1, height: 54, borderRadius: 12, background: "rgba(255,255,255,0.05)" }}>
              <div style={{ width: `${(it.v / max) * 100 * p}%`, height: "100%", borderRadius: 12, background: cur ? GRAD : "rgba(242,178,84,0.55)" }} />
            </div>
            <div style={{ width: 120, fontSize: 36, fontWeight: 900, color: cur ? M.gold : M.ink }}>{I.T(it.label) || it.v}</div>
          </div>
        );
      })}
      {items.map((_, i) => (
        <Sfx key={i} name="pop" at={I.times[i]} vol={0.2} />
      ))}
    </Win>
  );
};

const CtaV: React.FC<VP> = ({ b, v }) => {
  const B = useBeat(b.id);
  const rows = [
    { t: v.ask, at: 0.3, icon: "speech" },
    { t: v.save, at: B.at(v.saveAt, 1.4), icon: "bookmark" },
    { t: v.follow, at: B.at(v.followAt, 2.2), icon: "bell" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ ...pop(B.prog(r.at, 0.5, springy)), display: "flex", alignItems: "center", gap: 20, padding: i === 2 ? "20px 46px" : "18px 40px", borderRadius: 40, background: i === 2 ? M.hot : M.card, color: i === 2 ? M.bg : M.ink, border: `2px solid ${i === 2 ? M.hot : M.line}`, fontSize: i === 0 ? 46 : 38, fontWeight: 800, boxShadow: i === 0 ? "0 0 60px rgba(255,120,40,0.3)" : "none" }}>
          <Icon name={r.icon} size={i === 0 ? 64 : 52} />
          {B.T(r.t)}
          <Sfx name="pop" at={r.at} vol={0.25} />
        </div>
      ))}
    </div>
  );
};

const KINDS: Record<string, React.FC<VP>> = {
  window: WindowV,
  checklist: ChecklistV,
  skillcard: SkillCardV,
  terminal: TerminalV,
  file: FileV,
  flow: FlowV,
  icon: IconV,
  quote: QuoteV,
  versus: VersusV,
  stat: StatV,
  image: ImageV,
  chat: ChatV,
  grid: GridV,
  pages: PagesV,
  look: LookV,
  button: ButtonV,
  timeline: TimelineV,
  bars: BarsV,
  cta: CtaV,
};
export const MOTION_KINDS = Object.keys(KINDS);

/* ---- Khung beat ----------------------------------------------------------- */
const PartPill: React.FC<{ part?: [number, number]; p: number; lang: Lang }> = ({ part, p, lang }) => {
  if (!part || part[0] <= 0) return null;
  const [k, n] = part;
  const label = k > n ? (lang === "vi" ? "TỔNG KẾT" : "RECAP") : `${lang === "vi" ? "PHẦN" : "PART"} ${k}/${n}`;
  return (
    <div style={{ ...blurIn(p), display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 3, color: M.hot, padding: "6px 18px", borderRadius: 20, border: `2px solid ${M.hot}` }}>{label}</div>
      {k <= n && (
        <div style={{ display: "flex", gap: 7 }}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: i < k ? M.hot : M.faint }} />
          ))}
        </div>
      )}
    </div>
  );
};

const Title: React.FC<{ lines: [string, string]; accent: 0 | 1; t: number }> = ({ lines, accent, t }) => {
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(80, Math.floor(1600 / Math.max(8, longest * 0.66)));
  return (
    <div style={{ textAlign: "center", lineHeight: 1.22, fontWeight: 900, fontSize: size, letterSpacing: -0.5, textTransform: "uppercase" }}>
      {lines.map((l, i) => {
        const p = interpolate(t, [0.05 + i * 0.12, 0.55 + i * 0.12], [0, 1], { ...clamp, easing: ease });
        const hot = i === accent;
        return (
          <div key={i} style={{ ...blurIn(p), marginTop: i ? -0.12 * size : 0 }}>
            {/* inline-block + đệm trên: chữ gradient (background-clip) không bị cắt mất dấu tiếng Việt */}
            <span style={hot ? { display: "inline-block", paddingTop: "0.16em", background: GRAD, WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 24px rgba(255,138,61,0.35))" } : { display: "inline-block", paddingTop: "0.16em", color: M.ink }}>
              {l}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Caption: React.FC<{ b: Beat }> = ({ b }) => {
  const B = useBeat(b.id);
  const caps = b.caps ?? [];
  if (!caps.length) return null;
  const times = caps.map((c, i) => (i === 0 && !c.at ? 0.25 : Math.max(0.25, B.at(c.at) - 0.15)));
  const k = times.reduce((m, s, i) => (B.t >= s ? i : m), -1);
  if (k < 0) return null;
  const p = B.prog(times[k], 0.35);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex", justifyContent: "center" }}>
      <div style={{ ...blurIn(p), scale: `${0.94 + 0.06 * p}`, fontSize: 36, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", padding: "14px 38px", borderRadius: 40, border: `2.5px solid ${M.hot}`, background: "rgba(10,10,24,0.75)", boxShadow: "0 0 30px rgba(255,138,61,0.35), inset 0 0 20px rgba(255,138,61,0.12)" }}>
        {B.T(caps[k].t)}
      </div>
    </div>
  );
};

const BeatView: React.FC<{ b: Beat }> = ({ b }) => {
  const B = useBeat(b.id);
  const Kind = KINDS[b.v.kind];
  if (!Kind) throw new Error(`motionKit: kind lạ "${b.v.kind}" ở beat ${b.id}`);
  return (
    <AbsoluteFill style={{ fontFamily, color: M.ink }}>
      <div style={{ position: "absolute", top: 54, left: 0, right: 0 }}>
        <PartPill part={B.part} p={B.prog(0, 0.4)} lang={B.lang} />
        <div style={{ marginTop: 14 }}>
          <Title lines={[B.T(b.title[0]), B.T(b.title[1])]} accent={b.accent ?? 1} t={B.t} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 350, bottom: 150, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ scale: `${b.v.scale ?? 1.12}` }}>
          <Kind b={b} v={b.v} />
        </div>
      </div>
      <Caption b={b} />
      <Sfx name="whoosh" at={0} vol={0.16} />
    </AbsoluteFill>
  );
};

/* ---- Đăng ký video -------------------------------------------------------- */
export type MThumb = { badge: Bi; name: [Bi, Bi]; nameSize?: number; line1: Bi; icons: string[]; foot: Bi };

export const defineMotion = ({ id, spec, lang, durations, cues, next, thumb }: { id: string; spec: MSpec; lang: Lang; durations: Record<string, number>; cues: Cues; next: Bi; thumb: MThumb }) => {
  const T = (b: Bi) => (typeof b === "string" ? b : b[lang]);
  const slug = lang === "en" ? `${spec.slug}-en` : spec.slug;
  const beats = spec.beats;
  // Phần: chương đầu (mở đầu) = 0, chương giữa = 1..n, chương cuối (tổng kết) = n+1.
  const chIdx: number[] = [];
  let c = -1;
  beats.forEach((b) => {
    if (b.chapter) c += 1;
    chIdx.push(Math.max(0, c));
  });
  const nCh = c + 1;
  const parts = Object.fromEntries(beats.map((b, i) => [b.id, [chIdx[i] === 0 ? 0 : chIdx[i], nCh - 2] as [number, number]]));
  const ctx = { lang, text: Object.fromEntries(beats.map((b) => [b.id, b.voice[lang]])), dur: durations, cues, img: spec.img, parts };
  const ids = [...beats.map((b) => b.id), "outro"];
  const { sceneFrames, total } = timeline(ids, durations);

  const Video: React.FC = () => (
    <Ctx.Provider value={ctx}>
      <AbsoluteFill style={{ background: M.bg }}>
        <Glow />
        <Dust />
        <Audio src={staticFile("sfx/pad.wav")} loop volume={0.05} />
        <TransitionSeries>
          {ids.flatMap((bid, i) => {
            const b = beats[i];
            const seq = (
              <TransitionSeries.Sequence key={bid} name={bid} durationInFrames={sceneFrames[i]}>
                {b ? <BeatView b={b} /> : lang === "en" ? <OutroWide brand="Tram AI" tagline={T(next)} socials={SOCIALS_EN} /> : <OutroWide tagline={T(next)} />}
                <Audio src={staticFile(`videos/${slug}/voice/${bid}.mp3`)} />
              </TransitionSeries.Sequence>
            );
            return i === ids.length - 1 ? [seq] : [seq, <TransitionSeries.Transition key={`${bid}-t`} presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />];
          })}
        </TransitionSeries>
      </AbsoluteFill>
    </Ctx.Provider>
  );
  const Register: React.FC = () => <Composition id={id} component={Video} durationInFrames={total} fps={FPS} width={1920} height={1080} />;

  const minutes = Math.round(total / FPS / 60);
  const ThumbC: React.FC = () => (
    <AbsoluteFill style={{ fontFamily, color: M.ink, background: M.bg }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 70% at 72% 55%, rgba(255,120,40,0.35), rgba(0,0,0,0) 70%)" }} />
      <div style={{ position: "absolute", right: 70, top: 120, width: 470, height: 470 }}>
        {thumb.icons.map((ic, i) => {
          const pos = [
            { l: 120, t: 70, s: 300, r: -6 },
            { l: 0, t: 0, s: 150, r: -14 },
            { l: 330, t: 300, s: 150, r: 12 },
          ][i] ?? { l: 0, t: 300, s: 130, r: 0 };
          return (
            <div key={ic} style={{ position: "absolute", left: pos.l, top: pos.t, width: pos.s + 50, height: pos.s + 50, borderRadius: 40, background: M.card, border: `2px solid ${i ? M.line : M.hot}`, boxShadow: i ? "none" : "0 0 70px rgba(255,138,61,0.5)", display: "flex", alignItems: "center", justifyContent: "center", rotate: `${pos.r}deg` }}>
              <Icon name={ic} size={pos.s} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 64, top: 64, width: 720 }}>
        <div style={{ display: "inline-block", fontSize: 28, fontWeight: 900, letterSpacing: 2, color: M.hot, border: `3px solid ${M.hot}`, padding: "6px 18px", borderRadius: 30 }}>{T(thumb.badge)}</div>
        <div style={{ fontSize: thumb.nameSize ?? 112, fontWeight: 900, lineHeight: 0.98, letterSpacing: -3, marginTop: 26, textTransform: "uppercase" }}>
          {T(thumb.name[0])}
          <br />
          <span style={{ background: GRAD, WebkitBackgroundClip: "text", color: "transparent" }}>{T(thumb.name[1])}</span>
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, marginTop: 26, lineHeight: 1.12 }}>{T(thumb.line1)}</div>
        <div style={{ fontSize: 36, fontWeight: 700, marginTop: 10, color: M.gold }}>{lang === "en" ? `in ${minutes} minutes` : `trong ${minutes} phút`}</div>
      </div>
      <div style={{ position: "absolute", left: 64, bottom: 46, fontSize: 30, fontWeight: 700, color: M.muted }}>{T(thumb.foot)}</div>
    </AbsoluteFill>
  );
  const Thumb: React.FC = () => <Composition id={`${id}Thumb`} component={ThumbC} durationInFrames={1} fps={30} width={1280} height={720} />;
  return { Video: Register, Thumb };
};
