// Vietnamese number normalization for TTS input (Vietnamese convention):
//   - "," is ALWAYS the decimal mark:          "4,5"   → "bốn phẩy năm"
//   - "." + exactly 3 digits is a thousands sep: "4.500" → "bốn nghìn năm trăm"
//   - "." followed by anything else is read "chấm" (versions, engine sizes): "1.5" → "một chấm năm"
//   - "%" right after a number → "phần trăm"
//   - Unambiguous English-format numbers are read by their real value: "1,234,567", "1,234.5", "25,000"
//   - Dates "24.10.2026" / "24/10/2026" → "hai mươi tư tháng mười năm …"; times "7h30" / "7:30" → "bảy giờ ba mươi"
//   - Leading-zero codes are read digit by digit: "S05" → "S không năm", "0912…" → "không chín một hai …"
//   - Words are spaced from glued letters: "VF3" → "VF ba"
// Applied to every scene's voiceText before it is sent to TTS. Script authors should
// still write numbers out in words; this is a safety net for digits that slip through.

const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const SCALES = ["", "nghìn", "triệu", "tỷ"];

/** Reads a 3-digit block. `full` = block is not the leading one (needs "không trăm" / "lẻ"). */
function readBlock(n: number, full: boolean): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  const out: string[] = [];
  if (h > 0 || full) out.push(DIGITS[h], "trăm");
  if (t === 0) {
    if (u > 0 && (h > 0 || full)) out.push("lẻ");
  } else if (t === 1) {
    out.push("mười");
  } else {
    out.push(DIGITS[t], "mươi");
  }
  if (u > 0) {
    if (u === 1 && t >= 2) out.push("mốt");
    else if (u === 5 && t >= 1) out.push("lăm");
    else if (u === 4 && t >= 2) out.push("tư");
    else out.push(DIGITS[u]);
  }
  return out.join(" ");
}

/** Reads a non-negative integer given as a digit string (any length). */
export function readInteger(digits: string): string {
  const s = digits.replace(/^0+(?=\d)/, "");
  if (/^0+$/.test(s)) return "không";
  // Above 999 tỷ, split on "tỷ" and read the head recursively ("một nghìn tỷ").
  if (s.length > 12) {
    const head = s.slice(0, s.length - 9);
    const tail = s.slice(-9);
    const rest = /^0+$/.test(tail) ? "" : " " + readGroups(tail, true);
    return `${readInteger(head)} tỷ${rest}`;
  }
  return readGroups(s, false);
}

function readGroups(s: string, leadingFull: boolean): string {
  const blocks: number[] = [];
  for (let end = s.length; end > 0; end -= 3) blocks.unshift(Number(s.slice(Math.max(0, end - 3), end)));
  const out: string[] = [];
  blocks.forEach((b, i) => {
    if (b === 0) return;
    const scale = SCALES[blocks.length - 1 - i];
    const full = leadingFull || out.length > 0;
    out.push(readBlock(b, full) + (scale ? " " + scale : ""));
  });
  return out.join(" ");
}

/** Decimal part: ≤ 2 digits without a leading zero read as a number, otherwise digit by digit. */
function readDecimal(d: string): string {
  if (d.length <= 2 && d[0] !== "0") return readInteger(d);
  return d.split("").map((c) => DIGITS[Number(c)]).join(" ");
}

/** Decimal digits read after "phẩy"; trailing zeros carry no meaning ("3,50" → "ba phẩy năm", "2,0" → "hai"). */
function withDecimal(intWords: string, decimal: string | undefined): string {
  const d = (decimal ?? "").replace(/0+$/, "");
  return d ? `${intWords} phẩy ${readDecimal(d)}` : intWords;
}

function readNumberToken(tok: string): string {
  // English format can't be a Vietnamese decimal: several ",ddd" groups, ",ddd" then ".d", or ",000".
  const en = /^(\d{1,3}(?:,\d{3})+)(?:\.(\d+))?$/.exec(tok);
  if (en && (en[1].split(",").length > 2 || en[2] !== undefined || /^\d+(?:,000)+$/.test(en[1]))) {
    return withDecimal(readInteger(en[1].replace(/,/g, "")), en[2]);
  }
  if (/^0\d+$/.test(tok)) return readDecimal(tok);
  const [intRaw, ...decimals] = tok.split(",");
  const groups = intRaw.split(".");
  let intWords: string;
  if (groups.length > 1 && groups.slice(1).every((g) => g.length === 3)) {
    intWords = readInteger(groups.join(""));
  } else {
    intWords = [readInteger(groups[0]), ...groups.slice(1).map(readDecimal)].join(" chấm ");
  }
  return decimals.reduce(withDecimal, intWords);
}

/** Pads `words` with a space where the original number was glued to a letter ("VF3" → "VF ba"). */
function spaced(words: string, s: string, start: number, end: number): string {
  const letter = /\p{L}/u;
  return (letter.test(s[start - 1] ?? "") ? " " : "") + words + (letter.test(s[end] ?? "") ? " " : "");
}

/** Replaces every number (and a trailing %) in `text` with Vietnamese words. */
export function normalizeViNumbers(text: string): string {
  return text
    .replace(/\b(\d{1,2})([./])(\d{1,2})\2(\d{4})\b/g, (m, d: string, _sep, mo: string, y: string) =>
      Number(d) >= 1 && Number(d) <= 31 && Number(mo) >= 1 && Number(mo) <= 12
        ? `${readInteger(d)} tháng ${readInteger(mo)} năm ${readInteger(y)}`
        : m,
    )
    .replace(/(?<![\d.,:])(\d{1,2})(?:h([0-5]\d)?|:([0-5]\d))(?![\p{L}\d])/gu, (m, h: string, m1?: string, m2?: string, offset = 0, s = "") => {
      if (Number(h) > 23) return m;
      const min = m1 ?? m2;
      const words = `${readInteger(h)} giờ` + (min && min !== "00" ? ` ${readInteger(min)}` : "");
      return spaced(words, s, offset, offset + m.length);
    })
    .replace(/\d+(?:[.,]\d+)*(\s*%)?/g, (m, pct: string | undefined, offset: number, s: string) => {
      const num = pct ? m.slice(0, m.length - pct.length) : m;
      return spaced(readNumberToken(num) + (pct ? " phần trăm" : ""), s, offset, offset + m.length);
    });
}
