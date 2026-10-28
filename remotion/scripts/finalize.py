#!/usr/bin/env python3
"""Chuẩn bị outputDir sau khi render 1 video style remotion của Trạm AI.

  python3 scripts/finalize.py <slug> <outputDir> [aspect]   # aspect mặc định 9:16; video dài 16:9

Copy voice/scene-<id>.mp3, tạo clips/scene-<id>-fit.mp4 GIỮ CHỖ (video đen 16x16
đúng độ dài từng cảnh — make_youtube_studio.py đo mốc cảnh từ đây) và script.json
có startSec/durationSec. Công thức thời lượng phải khớp timeline() trong
src/tram/TramShort.tsx.
"""
import json
import math
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS, TRANSITION, PAD_SEC, OUTRO_HOLD_SEC = 30, 10, 0.35, 1.6


def main():
    slug, out = sys.argv[1], sys.argv[2]
    aspect = sys.argv[3] if len(sys.argv) > 3 else "9:16"
    src = os.path.join(ROOT, "src", "videos", slug)
    vdir = os.path.join(ROOT, "public", "videos", slug, "voice")
    script = json.load(open(os.path.join(src, "script.json"), encoding="utf-8"))
    dur = json.load(open(os.path.join(src, "durations.json")))
    ids = [s["id"] for s in script["scenes"]]
    last = len(ids) - 1
    vis = [math.ceil((dur[k] + OUTRO_HOLD_SEC) * FPS) if i == last else math.ceil((dur[k] + PAD_SEC) * FPS)
           for i, k in enumerate(ids)]

    os.makedirs(os.path.join(out, "voice"), exist_ok=True)
    os.makedirs(os.path.join(out, "clips"), exist_ok=True)
    start = 0
    for sc, v in zip(script["scenes"], vis):
        k = sc["id"]
        shutil.copy(os.path.join(vdir, f"{k}.mp3"), os.path.join(out, "voice", f"scene-{k}.mp3"))
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
                        f"color=c=black:s=16x16:r={FPS}:d={v / FPS:.4f}", "-c:v", "libx264",
                        os.path.join(out, "clips", f"scene-{k}-fit.mp4")], check=True)
        sc.update(startSec=round(start / FPS, 3), durationSec=round(v / FPS, 3), voiceSec=dur[k])
        start += v
    script["metadata"].update(aspect=aspect, renderer="remotion", style="remotion", voice="minh_quan", fps=FPS)
    json.dump(script, open(os.path.join(out, "script.json"), "w"), ensure_ascii=False, indent=2)
    print(f"{len(ids)} cảnh · {start / FPS:.2f}s → {out}")


if __name__ == "__main__":
    main()
