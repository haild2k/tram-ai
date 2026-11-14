// Bộ khối cảnh khai báo cho video giải thích paper 16:9: mỗi cảnh = header + danh sách block,
// block hiện đúng lúc giọng đọc tới cụm từ `cue`. Dùng chung cho bản Việt và bản -en.
import { createContext, useContext } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, enter, rise } from "./theme";
import { Hl } from "./ui";
import { BigStat, Box, Bullet, Card, FigCaption, Figure, Pill, RightArrow, WH, WK, WStage } from "./wide";

export type Lang = "vi" | "en";
const LangCtx = createContext<Lang>("vi");
export const LangProvider = LangCtx.Provider;

const MONO = "Menlo, Monaco, 'Courier New', monospace";

type VoiceData = { script: { scenes: { id: string; voiceText: string }[] }; durations: Record<string, number> };

export type Kit = {
  slug: string;
  ar: Record<string, number>;
  vi: VoiceData;
  en?: VoiceData & { cues: Record<string, Record<string, string>>; text: Record<string, string> };
};

export type Block =
  | { t: "fig"; src: string; h?: number; w?: number; caption?: string; cue?: string; steps?: [Box, string][] }
  | { t: "bullets"; items: [string, string][]; size?: number; marks?: string[] }
  | { t: "stats"; items: { num: number; dec?: number; suffix?: string; plain?: boolean; label: string; cue: string; color?: string; size?: number }[] }
  | { t: "cards"; items: { tag?: string; title: string; body?: string; cue: string; color?: string }[]; cols?: number }
  | { t: "bars"; rows: { name: string; v: number; cue: string; hi?: boolean; dim?: boolean; text?: string }[]; max: number; unit?: string; dec?: number; nameW?: number; h?: number }
  | { t: "duo"; rows: { name: string; a: number; b: number; cue: string; aText?: string; bText?: string }[]; aName: string; bName: string; max: number; dec?: number; h?: number }
  | { t: "flow"; items: { title: string; sub?: string; cue: string; color?: string }[]; size?: number }
  | { t: "table"; head: string[]; rows: { cells: string[]; cue: string; hi?: boolean }[]; widths?: number[]; size?: number }
  | { t: "code"; lines: [string, string][]; size?: number; plain?: boolean }
  | { t: "formula"; text: string; cue: string; note?: string }
  | { t: "pills"; items: [string, string][] }
  | { t: "note"; text: string; cue?: string; color?: string }
  | { t: "row"; items: Block[]; gap?: number; widths?: number[] }
  | { t: "col"; items: Block[]; gap?: number }
  | { t: "custom"; C: React.FC };

export type SceneSpec = { n?: string; k: string; title: string; size?: number; blocks: Block[]; justify?: React.CSSProperties["justifyContent"] };

/** `*chữ*` trong chuỗi được tô màu nhấn. */
const Rich: React.FC<{ s: string }> = ({ s }) => (
  <>{s.split("*").map((x, i) => (i % 2 ? <Hl key={i}>{x}</Hl> : <span key={i}>{x}</span>))}</>
);

const fmt = (v: number, dec: number, lang: Lang) => {
  const [i, d] = v.toFixed(dec).split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, lang === "vi" ? "." : ",");
  return d ? `${int}${lang === "vi" ? "," : "."}${d}` : int;
};

const VI_CHAR = /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/;
/** Số kiểu Việt → kiểu Anh cho chuỗi không cần dịch: `1.024,5` → `1,024.5`. */
const enNumbers = (s: string) => s.replace(/(\d)\.(\d{3})(?!\d)/g, "$1\0$2").replace(/(\d),(\d)/g, "$1.$2").replace(/\0/g, ",");

export const makeKit = (kit: Kit) => {
  const IMG = `videos/${kit.slug}/img`;

  const useCue = (id: string) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const lang = useContext(LangCtx);
    const data = lang === "vi" ? kit.vi : kit.en;
    if (!data) throw new Error("missing EN data");
    const text = data.script.scenes.find((s) => s.id === id)?.voiceText;
    if (text === undefined) throw new Error(`scene ${id} not in script`);
    const dur = data.durations[id];
    const tr = (vi: string) => {
      if (lang === "vi") return vi;
      const en = kit.en?.text[vi];
      if (en === undefined && !VI_CHAR.test(vi)) return enNumbers(vi);
      if (en === undefined) throw new Error(`missing EN text: ${vi}`);
      return en;
    };
    const t = (viPhrase: string) => {
      const phrase = lang === "vi" ? viPhrase : kit.en?.cues[id]?.[viPhrase];
      if (phrase === undefined) throw new Error(`missing EN cue "${viPhrase}" in scene ${id}`);
      const i = text.indexOf(phrase);
      if (i < 0) throw new Error(`cue "${phrase}" not found in scene ${id}`);
      return Math.max(0, (i / text.length) * dur - 0.15);
    };
    const at = (sec: number, d?: number) => enter(frame, fps, sec, d);
    const on = (phrase: string, d?: number) => at(t(phrase), d);
    const count = (to: number, start: number, dec: number) =>
      fmt(
        interpolate(frame, [start * fps, (start + 1) * fps], [0, to], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: (x) => 1 - Math.pow(1 - x, 3),
        }),
        dec,
        lang,
      );
    const steps = (list: [Box, string][]) => {
      let cur: [Box, number] | null = null;
      for (const [b, ph] of list) if (frame >= t(ph) * fps) cur = [b, t(ph)];
      return cur ? { hl: cur[0], hlP: at(cur[1], 0.5) } : { hl: undefined, hlP: 0 };
    };
    return { frame, fps, lang, tr, t, at, on, count, steps, f: (v: number, d = 1) => fmt(v, d, lang) };
  };

  type Cue = ReturnType<typeof useCue>;

  const Render: React.FC<{ b: Block; c: Cue }> = ({ b, c }) => {
    switch (b.t) {
      case "fig": {
        const ar = kit.ar[b.src];
        const h = b.steps ? c.steps(b.steps) : { hl: undefined, hlP: 0 };
        const size = b.w ? { width: b.w } : { height: b.h ?? 560 };
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Figure src={`${IMG}/${b.src}.png`} p={b.cue ? c.on(b.cue) : c.at(0.5)} ar={ar} {...size} hl={h.hl} hlP={h.hlP} pad={14} />
            {b.caption && (
              <FigCaption p={c.at(0.9)} style={{ fontSize: 30, fontWeight: 600, marginTop: 18, textAlign: "center" }}>
                <Rich s={c.tr(b.caption)} />
              </FigCaption>
            )}
          </div>
        );
      }
      case "bullets":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {b.items.map(([txt, cue], i) => (
              <Bullet key={txt} p={c.on(cue)} mark={b.marks ? b.marks[i] : i + 1} size={b.size ?? 36}>
                <Rich s={c.tr(txt)} />
              </Bullet>
            ))}
          </div>
        );
      case "stats":
        return (
          <div style={{ display: "flex", gap: 36, justifyContent: "space-between" }}>
            {b.items.map((s) => (
              <div key={s.label} style={{ flex: 1 }}>
                <BigStat
                  p={c.on(s.cue)}
                  color={s.color}
                  size={s.size ?? 104}
                  value={<span style={{ whiteSpace: "nowrap" }}>{s.plain ? String(s.num) : c.count(s.num, c.t(s.cue), s.dec ?? 0)}{c.tr(s.suffix ?? "")}</span>}
                  label={c.tr(s.label)}
                />
              </div>
            ))}
          </div>
        );
      case "cards":
        return (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${b.cols ?? b.items.length}, 1fr)`, gap: 24 }}>
            {b.items.map((it) => (
              <Card key={it.title} p={c.on(it.cue)} accent={it.color ?? C.accent1}>
                {it.tag && <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2.5, color: it.color ?? C.accent1 }}>{c.tr(it.tag)}</div>}
                <div style={{ fontSize: 38, fontWeight: 800, marginTop: it.tag ? 8 : 0, lineHeight: 1.2 }}>
                  <Rich s={c.tr(it.title)} />
                </div>
                {it.body && <div style={{ fontSize: 29, color: C.muted, marginTop: 10, lineHeight: 1.35 }}>{c.tr(it.body)}</div>}
              </Card>
            ))}
          </div>
        );
      case "bars":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {b.rows.map((r) => {
              const p = c.on(r.cue);
              const color = r.hi ? C.accent2 : r.dim ? "rgba(244,241,234,0.32)" : C.accent1;
              return (
                <div key={r.name} style={{ ...rise(p, 20), display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ width: b.nameW ?? 420, fontSize: 31, fontWeight: 700, textAlign: "right", color: r.hi ? C.accent2 : C.ink }}>{c.tr(r.name)}</div>
                  <div style={{ flex: 1, height: b.h ?? 56, borderRadius: 12, background: C.faint, overflow: "hidden" }}>
                    <div style={{ width: `${(r.v / b.max) * 100 * p}%`, height: "100%", background: color, borderRadius: 12 }} />
                  </div>
                  <div style={{ width: 270, fontSize: 40, fontWeight: 900, color, textAlign: "right", whiteSpace: "nowrap" }}>
                    {r.text ? c.tr(r.text) : `${c.f(r.v, b.dec ?? 1)}${c.tr(b.unit ?? "")}`}
                  </div>
                </div>
              );
            })}
          </div>
        );
      case "duo": {
        const bar = (v: number, p: number, color: string, name: string, txt?: string) => (
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 6 }}>
            <div style={{ width: 300, fontSize: 26, fontWeight: 600, color: C.muted }}>{c.tr(name)}</div>
            <div style={{ flex: 1, height: b.h ?? 36, borderRadius: 10, background: C.faint, overflow: "hidden" }}>
              <div style={{ width: `${(v / b.max) * 100 * p}%`, height: "100%", background: color, borderRadius: 10 }} />
            </div>
            <div style={{ width: 170, fontSize: 36, fontWeight: 900, color, textAlign: "right", opacity: p }}>{txt ? c.tr(txt) : c.f(v, b.dec ?? 1)}</div>
          </div>
        );
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {b.rows.map((r) => {
              const p = c.on(r.cue);
              return (
                <div key={r.name} style={rise(p, 24)}>
                  <div style={{ fontSize: 31, fontWeight: 800 }}>{c.tr(r.name)}</div>
                  {bar(r.a, p, "rgba(244,241,234,0.45)", b.aName, r.aText)}
                  {bar(r.b, p, C.accent2, b.bName, r.bText)}
                </div>
              );
            })}
          </div>
        );
      }
      case "flow":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {b.items.map((it, i) => {
              const p = c.on(it.cue);
              const color = it.color ?? C.accent1;
              return (
                <div key={it.title} style={{ display: "contents" }}>
                  {i > 0 && <RightArrow p={p} size={40} />}
                  <div style={{ ...rise(p, 26), flex: 1, background: C.card, border: `2px solid ${color}`, borderRadius: 18, padding: "18px 16px", textAlign: "center", alignSelf: "stretch" }}>
                    <div style={{ fontSize: b.size ?? 31, fontWeight: 800, color, lineHeight: 1.2 }}>{c.tr(it.title)}</div>
                    {it.sub && <div style={{ fontSize: 24, color: C.muted, marginTop: 8, lineHeight: 1.3 }}>{c.tr(it.sub)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      case "table": {
        const cols = (b.widths ?? b.head.map(() => 1)).map((w) => `${w}fr`).join(" ");
        const cell: React.CSSProperties = { fontSize: b.size ?? 30, padding: "13px 16px", lineHeight: 1.2 };
        return (
          <div style={{ ...rise(c.at(0.5), 24), borderRadius: 18, overflow: "hidden", border: `2px solid ${C.faint}` }}>
            <div style={{ display: "grid", gridTemplateColumns: cols, background: "rgba(111,140,255,0.2)" }}>
              {b.head.map((h) => (
                <div key={h} style={{ ...cell, fontWeight: 800, fontSize: (b.size ?? 30) - 3, color: C.accent1 }}>{c.tr(h)}</div>
              ))}
            </div>
            {b.rows.map((r) => (
              <div key={r.cells.join()} style={{ ...rise(c.on(r.cue), 14), display: "grid", gridTemplateColumns: cols, borderTop: `1px solid ${C.faint}`, background: r.hi ? "rgba(242,178,84,0.14)" : undefined }}>
                {r.cells.map((x, i) => (
                  <div key={i} style={{ ...cell, fontWeight: i === 0 || r.hi ? 700 : 500, color: r.hi ? C.accent2 : C.ink }}>{c.tr(x)}</div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      case "code":
        return (
          <div style={{ ...rise(c.at(0.5), 24), background: "#090c20", border: `2px solid ${C.faint}`, borderRadius: 18, padding: "26px 30px" }}>
            {b.lines.map(([l, cue]) => (
              <div key={l} style={{ opacity: c.on(cue), fontFamily: MONO, fontSize: b.size ?? 29, lineHeight: 1.65, color: l.startsWith("#") ? C.muted : C.ink, whiteSpace: "pre" }}>
                {l.startsWith("#") ? c.tr(l) : <>{!b.plain && <span style={{ color: C.accent2 }}>$ </span>}{VI_CHAR.test(l) ? c.tr(l) : l}</>}
              </div>
            ))}
          </div>
        );
      case "formula":
        return (
          <Card p={c.on(b.cue)} accent={C.accent2} style={{ textAlign: "center", padding: "30px 28px" }}>
            <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 700, color: C.accent2 }}>{c.tr(b.text)}</div>
            {b.note && <div style={{ fontSize: 29, color: C.muted, marginTop: 12 }}>{c.tr(b.note)}</div>}
          </Card>
        );
      case "pills":
        return (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {b.items.map(([txt, cue], i) => (
              <Pill key={txt} color={i % 2 ? C.accent1 : C.accent2} style={{ ...rise(c.on(cue), 20), fontSize: 30 }}>
                {c.tr(txt)}
              </Pill>
            ))}
          </div>
        );
      case "note":
        return (
          <div style={{ ...rise(b.cue ? c.on(b.cue) : c.at(0.8), 24), fontSize: 33, fontWeight: 600, color: b.color ?? C.muted, lineHeight: 1.35 }}>
            <Rich s={c.tr(b.text)} />
          </div>
        );
      case "row":
        return (
          <div style={{ display: "flex", gap: b.gap ?? 44, alignItems: "center" }}>
            {b.items.map((x, i) => (
              <div key={i} style={{ flex: b.widths ? b.widths[i] : x.t === "fig" ? "0 0 auto" : 1, minWidth: 0 }}>
                <Render b={x} c={c} />
              </div>
            ))}
          </div>
        );
      case "col":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: b.gap ?? 40 }}>
            {b.items.map((x, i) => (
              <Render key={i} b={x} c={c} />
            ))}
          </div>
        );
      case "custom":
        return <b.C />;
    }
  };

  const scene = (id: string, s: SceneSpec): React.FC => {
    const Scene: React.FC = () => {
      const c = useCue(id);
      return (
        <WStage justify={s.justify ?? "flex-start"}>
          <WK p={c.at(0.1)} n={s.n}>
            {c.tr(s.k)}
          </WK>
          <WH p={c.at(0.3)} size={s.size ?? 58}>
            <Rich s={c.tr(s.title)} />
          </WH>
          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 32 }}>
            {s.blocks.map((b, i) => (
              <Render key={i} b={b} c={c} />
            ))}
          </div>
        </WStage>
      );
    };
    return Scene;
  };

  return { scene, useCue };
};
