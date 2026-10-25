import axios, { AxiosError } from "axios";
import { writeFile } from "node:fs/promises";
import type { TtsClient } from "./tts-client.js";

export interface OmniVoiceOpts {
  endpoint: string; // e.g. "http://127.0.0.1:8123"
  /** Voice id from OmniVoice/voice_library/ (e.g. "vira"). Omit → server default. */
  voice?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// OmniVoice local TTS: POST { text, voice? } → audio/mpeg bytes.
// `voice` selects a reference clip in OmniVoice/voice_library/; the timbre and
// ref transcript are resolved server-side. srtOutPath is ignored (no subtitles).
export class OmniVoiceClient implements TtsClient {
  constructor(private cfg: OmniVoiceOpts) {}

  async generate(text: string, audioOutPath: string, _srtOutPath?: string): Promise<void> {
    const delays = [1000, 2000, 4000];
    let lastErr: unknown;

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const resp = await axios.post<ArrayBuffer>(
          `${this.cfg.endpoint}/tts`,
          this.cfg.voice ? { text, voice: this.cfg.voice } : { text },
          { headers: { "Content-Type": "application/json", Accept: "audio/mpeg" }, responseType: "arraybuffer", timeout: 60000 },
        );
        await writeFile(audioOutPath, Buffer.from(resp.data));
        return;
      } catch (e) {
        lastErr = e;
        const status = (e as AxiosError).response?.status;
        if (status !== undefined && status < 500 && status !== 429) {
          throw new Error(`OmniVoice TTS failed (status ${status})`);
        }
        if (attempt < delays.length) await sleep(delays[attempt]);
      }
    }
    throw lastErr;
  }
}
