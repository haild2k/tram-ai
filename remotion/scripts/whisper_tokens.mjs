// Phiên âm 1 file wav 16 kHz bằng whisper.cpp (cài bằng scripts/install_whisper.mjs),
// ghi danh sách token có mốc thời gian: [{text, startMs, endMs}].
// Dùng: node scripts/whisper_tokens.mjs <in.wav> <vi|en> <out.json>
import fs from "fs";
import path from "path";
import { transcribe, toCaptions } from "@remotion/install-whisper-cpp";

const [, , input, lang, out] = process.argv;
const r = await transcribe({
  inputPath: input,
  whisperPath: path.join(process.cwd(), "whisper.cpp"),
  whisperCppVersion: "1.7.6",
  model: "large-v3-turbo",
  tokenLevelTimestamps: true,
  language: lang,
  printOutput: false,
  splitOnWord: true,
});
const { captions } = toCaptions({ whisperCppOutput: r });
fs.writeFileSync(out, JSON.stringify(captions.map((c) => ({ text: c.text, startMs: c.startMs, endMs: c.endMs }))));
console.log(`${captions.length} token → ${out}`);
