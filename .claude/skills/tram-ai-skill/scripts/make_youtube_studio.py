#!/usr/bin/env python3
"""Sinh bộ file YouTube Studio (phụ đề VI/EN + audio EN) cho 1 video Trạm AI.

Đầu vào: <outputDir>/youtube-studio/scenes.json — list {id, vi, en, en_tts}
  vi      phụ đề tiếng Việt hiển thị (giữ số dạng đẹp)
  en      phụ đề tiếng Anh hiển thị
  en_tts  lời đọc tiếng Anh (số viết ra chữ), phải vừa thời lượng cảnh

Mốc thời gian lấy từ chính video: cảnh i bắt đầu ở tổng độ dài các
clips/scene-*-fit.mp4 trước nó; lời Việt dài bằng voice/scene-<id>.mp3.

Đầu ra trong <outputDir>/youtube-studio/:
  subtitles_vi.srt, subtitles_en.srt, audio_en.mp3 (dài đúng bằng video.mp4),
  voice_en/scene-<id>.mp3 (từng cảnh, đã fit)

--no-voice: chỉ sinh 2 file .srt (không gọi TTS, không có audio_en.mp3 / voice_en/);
  phụ đề Anh lấy đúng mốc của lời Việt, en_tts không bắt buộc.

Dùng:
  python3 make_youtube_studio.py --dir <outputDir> [--no-voice] [--voice minh_quan]
      [--endpoint http://14.178.142.29:13562] [--max-tempo 1.2]
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request

FIT_MARGIN = 0.25  # giây nghỉ tối thiểu trước khi sang cảnh sau


def dur(path):
    # Giải mã toàn bộ để đo: ffprobe đoán sai độ dài mp3 bitrate thấp từ server TTS.
    err = subprocess.run(["ffmpeg", "-i", path, "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = re.findall(r"time=(\d+):(\d+):([\d.]+)", err)
    if not m:
        raise RuntimeError(f"không đo được độ dài: {path}")
    h, mi, s = m[-1]
    return int(h) * 3600 + int(mi) * 60 + float(s)


def tts(endpoint, voice, text, out):
    req = urllib.request.Request(
        f"{endpoint}/tts", data=json.dumps({"text": text, "voice": voice}).encode(),
        headers={"Content-Type": "application/json", "Accept": "audio/mpeg"})
    with urllib.request.urlopen(req, timeout=120) as r, open(out, "wb") as f:
        f.write(r.read())


def ts(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def chunks(text, max_len=84):
    """Tách câu → cụm ≤ max_len ký tự (ưu tiên cắt ở dấu câu, rồi dấu phẩy)."""
    sents = []
    for s in (x.strip() for x in re.split(r"(?<=[.?!])\s+", text)):
        if sents and len(sents[-1]) < 16:  # mẩu quá ngắn → gộp vào câu sau
            sents[-1] += " " + s
        elif s:
            sents.append(s)
    out = []
    for s in sents:
        n = -(-len(s) // max_len)  # số phần, chia đều để không còn mẩu lẻ
        while n > 1:
            target = len(s) // n
            # ưu tiên dấu phẩy gần điểm chia, không có thì khoảng trắng gần nhất
            cands = [m.end() for m in re.finditer(r",\s", s)] or []
            cands = [c for c in cands if abs(c - target) <= max_len // 4]
            if cands:
                cut = min(cands, key=lambda c: abs(c - target))
            else:
                sp = [m.start() for m in re.finditer(r"\s", s)]
                cut = min(sp, key=lambda c: abs(c - target))
            out.append(s[:cut].strip())
            s = s[cut:].strip()
            n -= 1
        out.append(s)
    return out


def wrap2(text, width=42):
    if len(text) <= width:
        return text
    mid = len(text) // 2
    left, right = text.rfind(" ", 0, mid + 1), text.find(" ", mid)
    cut = left if right < 0 or (left >= 0 and mid - left <= right - mid) else right
    return text[:cut].strip() + "\n" + text[cut:].strip()


def cues(text, start, length):
    parts = chunks(text)
    total = sum(len(p) for p in parts)
    t, res = start, []
    for p in parts:
        d = length * len(p) / total
        res.append((t, t + d, wrap2(p)))
        t += d
    return res


def write_srt(path, all_cues):
    with open(path, "w", encoding="utf-8") as f:
        for i, (a, b, txt) in enumerate(all_cues, 1):
            f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--voice", default="minh_quan")
    ap.add_argument("--endpoint", default=os.environ.get("OMNIVOICE_ENDPOINT", "http://14.178.142.29:13562"))
    ap.add_argument("--max-tempo", type=float, default=1.2)
    ap.add_argument("--no-voice", action="store_true", help="chỉ sinh phụ đề, không sinh giọng tiếng Anh")
    a = ap.parse_args()

    d = a.dir
    studio = os.path.join(d, "youtube-studio")
    scenes = json.load(open(os.path.join(studio, "scenes.json"), encoding="utf-8"))
    if not a.no_voice:
        os.makedirs(os.path.join(studio, "voice_en"), exist_ok=True)

    video_len = dur(os.path.join(d, "video.mp4"))
    starts, windows, t = {}, {}, 0.0
    for sc in scenes:
        clip = os.path.join(d, "clips", f"scene-{sc['id']}-fit.mp4")
        starts[sc["id"]] = t
        windows[sc["id"]] = dur(clip)
        t += windows[sc["id"]]

    vi_cues, en_cues, inputs, warn = [], [], [], []
    for sc in scenes:
        sid, st, win = sc["id"], starts[sc["id"]], windows[sc["id"]]
        vi_len = dur(os.path.join(d, "voice", f"scene-{sid}.mp3"))
        vi_cues += cues(sc["vi"], st, vi_len)
        if a.no_voice:
            en_cues += cues(sc["en"], st, vi_len)
            print(f"{sid}: start {st:6.2f}s  cảnh {win:5.2f}s  VI {vi_len:5.2f}s")
            continue

        raw = os.path.join(studio, "voice_en", f"scene-{sid}.raw.mp3")
        fit = os.path.join(studio, "voice_en", f"scene-{sid}.mp3")
        if not os.path.exists(raw):
            tts(a.endpoint, a.voice, sc["en_tts"], raw)
        en_len = dur(raw)
        budget = win - FIT_MARGIN
        tempo = max(1.0, en_len / budget)
        if tempo > a.max_tempo:
            warn.append(f"{sid}: lời Anh {en_len:.2f}s > cảnh {win:.2f}s (cần x{tempo:.2f}) — rút gọn en_tts")
            tempo = a.max_tempo
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", raw, "-filter:a", f"atempo={tempo:.4f}",
                        "-ar", "44100", "-ac", "2", fit], check=True)
        fit_len = dur(fit)
        en_cues += cues(sc["en"], st, fit_len)
        inputs.append((fit, st))
        print(f"{sid}: start {st:6.2f}s  cảnh {win:5.2f}s  VI {vi_len:5.2f}s  EN {en_len:5.2f}s → {fit_len:5.2f}s (x{tempo:.2f})")

    write_srt(os.path.join(studio, "subtitles_vi.srt"), vi_cues)
    write_srt(os.path.join(studio, "subtitles_en.srt"), en_cues)
    if a.no_voice:
        print(f"video {video_len:.2f}s · chỉ phụ đề (--no-voice)")
        return

    cmd = ["ffmpeg", "-loglevel", "error", "-y"]
    for p, _ in inputs:
        cmd += ["-i", p]
    flt = "".join(f"[{i}:a]adelay={int(st * 1000)}:all=1[a{i}];" for i, (_, st) in enumerate(inputs))
    flt += "".join(f"[a{i}]" for i in range(len(inputs)))
    flt += f"amix=inputs={len(inputs)}:normalize=0,apad,atrim=0:{video_len:.3f}[out]"
    cmd += ["-filter_complex", flt, "-map", "[out]", "-ar", "44100", "-ac", "2", "-b:a", "192k",
            os.path.join(studio, "audio_en.mp3")]
    subprocess.run(cmd, check=True)

    print(f"video {video_len:.2f}s · audio_en {dur(os.path.join(studio, 'audio_en.mp3')):.2f}s")
    for w in warn:
        print("CẢNH BÁO", w, file=sys.stderr)
    sys.exit(1 if warn else 0)


if __name__ == "__main__":
    main()
