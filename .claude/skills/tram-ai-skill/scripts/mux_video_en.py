#!/usr/bin/env python3
"""Ghép bản tiếng Anh style remotion vào CHUNG thư mục với video tiếng Việt.

Đầu vào: chuỗi ảnh đã render của composition -en + remotion/src/videos/<slug>/script.json,
durations.json và giọng ở remotion/public/videos/<slug>/voice/.
Đầu ra trong <outputDir>: video_en.mp4, chapters_en.txt, subtitles_video_en.srt,
youtube_channel_en.md (metadata đăng Tram AI Channel: youtube_en.md + mốc chương của video_en.mp4).
Phụ đề và mốc khớp video_en.mp4 — khác youtube-studio/subtitles_en.srt + youtube_en.md, vốn khớp video.mp4.

  python3 mux_video_en.py --dir <outputDir> --slug <slug>-en --seq <thư mục ảnh> [--remotion-dir remotion]
"""
import argparse
import glob
import json
import math
import os
import re
import subprocess

from make_youtube_studio import cues, write_srt

FPS, TRANSITION, PAD_SEC, OUTRO_HOLD_SEC = 30, 10, 0.35, 1.6  # khớp timeline() trong TramShort.tsx


def stamp(sec):
    m, s = divmod(int(sec), 60)
    h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def write_channel_md(d, chapter_lines):
    src = os.path.join(d, "youtube_en.md")
    if not os.path.exists(src):
        print("Cảnh báo: thiếu youtube_en.md, chưa sinh youtube_channel_en.md")
        return
    text = open(src, encoding="utf-8").read()
    block = "⏱ Chapters:\n" + "\n".join(chapter_lines) + "\n"
    text, n = re.subn(r"⏱ Chapters:\n(?:.+\n?)+", lambda _: block, text)
    text = re.sub(r"youtube\.com/@tram-ai(?!-channel)\b", "youtube.com/@tram-ai-channel", text)
    if chapter_lines and not n:
        print("Cảnh báo: youtube_en.md không có khối ⏱ Chapters:, youtube_channel_en.md thiếu mốc chương")
    with open(os.path.join(d, "youtube_channel_en.md"), "w", encoding="utf-8") as f:
        f.write(text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--seq", required=True)
    ap.add_argument("--remotion-dir", default="remotion")
    a = ap.parse_args()

    src = os.path.join(a.remotion_dir, "src", "videos", a.slug)
    voice = os.path.join(a.remotion_dir, "public", "videos", a.slug, "voice")
    scenes = json.load(open(os.path.join(src, "script.json"), encoding="utf-8"))["scenes"]
    dur = json.load(open(os.path.join(src, "durations.json")))

    starts, frame = [], 0
    for i, sc in enumerate(scenes):
        starts.append(frame / FPS)
        hold = OUTRO_HOLD_SEC if i == len(scenes) - 1 else PAD_SEC
        frame += math.ceil((dur[sc["id"]] + hold) * FPS)
    total = frame / FPS

    frames = glob.glob(os.path.join(a.seq, "element-*.jpeg"))
    if len(frames) != frame:
        raise SystemExit(f"chuỗi ảnh có {len(frames)} khung, timeline cần {frame}")
    digits = len(os.path.basename(sorted(frames)[0])) - len("element-.jpeg")

    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(FPS),
           "-i", os.path.join(a.seq, f"element-%0{digits}d.jpeg")]
    for sc in scenes:
        cmd += ["-i", os.path.join(voice, f"{sc['id']}.mp3")]
    flt = "".join(f"[{i + 1}:a]adelay={int(st * 1000)}:all=1[a{i}];" for i, st in enumerate(starts))
    flt += "".join(f"[a{i}]" for i in range(len(scenes)))
    flt += f"amix=inputs={len(scenes)}:normalize=0,apad,atrim=0:{total:.3f}[out]"
    cmd += ["-filter_complex", flt, "-map", "0:v", "-map", "[out]", "-c:v", "libx264", "-preset", "medium",
            "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
            os.path.join(a.dir, "video_en.mp4")]
    subprocess.run(cmd, check=True)

    chapter_lines = [f"{stamp(st)} {sc.get('chapter') or 'Intro'}" for i, (sc, st) in enumerate(zip(scenes, starts))
                      if sc.get("chapter") or i == 0]
    with open(os.path.join(a.dir, "chapters_en.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(chapter_lines) + "\n")
    write_channel_md(a.dir, chapter_lines)
    all_cues = []
    for sc, st in zip(scenes, starts):
        all_cues += cues(sc["voiceText"], st, dur[sc["id"]])
    write_srt(os.path.join(a.dir, "subtitles_video_en.srt"), all_cues)
    print(f"video_en.mp4 {stamp(total)} · {len(scenes)} cảnh")


if __name__ == "__main__":
    main()
