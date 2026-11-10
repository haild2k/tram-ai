// Cài whisper.cpp + model đa ngôn ngữ để lấy mốc thời gian từng từ của giọng TTS.
// Dùng: node scripts/install_whisper.mjs
import path from "path";
import { installWhisperCpp, downloadWhisperModel } from "@remotion/install-whisper-cpp";
const to = path.join(process.cwd(), "whisper.cpp");
await installWhisperCpp({ to, version: "1.7.6" });
await downloadWhisperModel({ model: "large-v3-turbo", folder: to });
console.log("OK", to);
