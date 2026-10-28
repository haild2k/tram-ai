#!/usr/bin/env python3
"""Sinh giọng đọc cho 1 video style remotion của Trạm AI.

  python3 scripts/tts.py <slug>            # chỉ sinh cảnh chưa có file .raw.mp3
  python3 scripts/tts.py <slug> --force    # sinh lại tất cả

Đọc src/videos/<slug>/script.json (scenes[].id + voiceText), gọi OmniVoice remote
(giọng minh_quan), tăng tốc riêng cảnh đầu (hook) atempo=1.10, chuẩn hoá loudness,
ghi public/videos/<slug>/voice/<id>.mp3 và src/videos/<slug>/durations.json.
"""
import argparse
import concurrent.futures as cf
import json
import os
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--endpoint", default=os.environ.get("OMNIVOICE_ENDPOINT", "http://14.178.142.29:13562"))
    ap.add_argument("--voice", default="minh_quan")
    ap.add_argument("--hook-tempo", type=float, default=1.10)
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    src = os.path.join(ROOT, "src", "videos", a.slug)
    vdir = os.path.join(ROOT, "public", "videos", a.slug, "voice")
    os.makedirs(vdir, exist_ok=True)
    scenes = json.load(open(os.path.join(src, "script.json"), encoding="utf-8"))["scenes"]

    health = json.load(urllib.request.urlopen(f"{a.endpoint}/health", timeout=10))
    if a.voice not in health.get("voices", []):
        sys.exit(f"Server TTS không có giọng {a.voice}: {health}")

    def tts(sc):
        raw = os.path.join(vdir, f"{sc['id']}.raw.mp3")
        if a.force or not os.path.exists(raw):
            body = json.dumps({"text": sc["voiceText"], "voice": a.voice}).encode()
            req = urllib.request.Request(f"{a.endpoint}/tts", data=body,
                                         headers={"Content-Type": "application/json", "Accept": "audio/mpeg"})
            open(raw, "wb").write(urllib.request.urlopen(req, timeout=180).read())
        return sc["id"]

    with cf.ThreadPoolExecutor(3) as ex:
        list(ex.map(tts, scenes))

    durations = {}
    for i, sc in enumerate(scenes):
        af = "loudnorm=I=-16:TP=-1.5:LRA=11"
        if i == 0:
            af = f"atempo={a.hook_tempo},{af}"
        out = os.path.join(vdir, f"{sc['id']}.mp3")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", os.path.join(vdir, f"{sc['id']}.raw.mp3"),
                        "-af", af, "-ar", "44100", "-c:a", "libmp3lame", "-q:a", "2", out], check=True)
        d = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out])
        durations[sc["id"]] = round(float(d), 3)
        print(f"{sc['id']:12s} {durations[sc['id']]:6.2f}s")

    json.dump(durations, open(os.path.join(src, "durations.json"), "w"), indent=1)
    print(f"tổng giọng {sum(durations.values()):.1f}s")


if __name__ == "__main__":
    main()
