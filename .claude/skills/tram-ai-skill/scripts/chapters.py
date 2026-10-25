#!/usr/bin/env python3
"""Build YouTube chapter timestamps for a long-form video from its rendered clips.

Chapters come from the optional top-level `"chapter": "<tên chương>"` field on
scenes in script.json (the first scene of each section carries it; the
pipeline's zod schema ignores the extra key). Each chapter starts at the
cumulative duration of the fitted clips before it — exactly what the pipeline
concatenated into video.mp4 — so timestamps match the final video.

YouTube rules enforced: first chapter at 00:00, >= 3 chapters, each >= 10s
(shorter ones are merged into the previous chapter).

Usage:
  python3 chapters.py --dir <outputDir>                       # write chapters.txt + print
  python3 chapters.py --dir <outputDir> --inject youtube.md   # also insert into the description
  python3 chapters.py --dir <outputDir> --inject youtube.md --inject facebook.md
"""
import argparse
import json
import os
import re
import subprocess
import sys

MIN_CHAPTER_SEC = 10
BLOCK_HEAD = "⏱ Mốc thời gian:"


def clip_duration(d, sid):
    for name in (f"clips/scene-{sid}-fit.mp4", f"clips/scene-{sid}.mp4"):
        p = os.path.join(d, name)
        if os.path.exists(p):
            out = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                capture_output=True, text=True).stdout.strip()
            try:
                return float(out)
            except ValueError:
                pass
    sys.exit(f"Lỗi: thiếu clip cho scene {sid} trong {d}/clips/ — chạy pipeline trước.")


def fmt(sec, long_form):
    sec = int(sec)
    h, m, s = sec // 3600, sec % 3600 // 60, sec % 60
    return f"{h}:{m:02d}:{s:02d}" if long_form else f"{m:02d}:{s:02d}"


def build(d):
    scenes = json.load(open(os.path.join(d, "script.json"), encoding="utf-8"))["scenes"]
    chapters, cursor = [], 0.0
    for i, sc in enumerate(scenes):
        title = (sc.get("chapter") or "").strip()
        if i == 0 and not title:
            title = "Mở đầu"
        if title:
            chapters.append([cursor, title])
        cursor += clip_duration(d, sc["id"])
    total = cursor

    # merge chapters shorter than MIN_CHAPTER_SEC into the previous one
    merged = []
    for idx, (start, title) in enumerate(chapters):
        end = chapters[idx + 1][0] if idx + 1 < len(chapters) else total
        if merged and end - start < MIN_CHAPTER_SEC:
            print(f"  ! chương '{title}' chỉ {end - start:.1f}s (<{MIN_CHAPTER_SEC}s) → gộp vào chương trước")
            continue
        merged.append([start, title])
    merged[0][0] = 0.0
    return merged, total


def inject(md_path, block):
    text = open(md_path, encoding="utf-8").read()
    m = re.search(r"^##\s+Mô tả \(Description\)\s*$(.*?)(?=^##\s+|\Z)", text, re.M | re.S)
    if not m:
        print(f"  ! {md_path}: không thấy mục '## Mô tả (Description)' — bỏ qua")
        return
    body = m.group(1)
    # idempotent: drop a previously injected block
    body = re.sub(rf"\n{re.escape(BLOCK_HEAD)}\n(?:.+\n?)+", "\n", body)
    anchor = re.search(r"^(Theo dõi Trạm AI|#\S)", body, re.M)
    if anchor:
        body = body[:anchor.start()].rstrip() + "\n\n" + block + "\n\n" + body[anchor.start():]
    else:
        body = body.rstrip() + "\n\n" + block + "\n\n"
    text = text[:m.start(1)] + body + text[m.end(1):]
    open(md_path, "w", encoding="utf-8").write(text)
    print(f"  ✓ đã chèn mốc thời gian vào {md_path}")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dir", required=True)
    ap.add_argument("--inject", action="append", default=[],
                    help="file .md (tương đối theo --dir) để chèn khối mốc thời gian vào mục Mô tả")
    a = ap.parse_args()

    chapters, total = build(a.dir)
    long_form = total >= 3600
    lines = [f"{fmt(s, long_form)} {t}" for s, t in chapters]
    block = BLOCK_HEAD + "\n" + "\n".join(lines)
    open(os.path.join(a.dir, "chapters.txt"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(block)
    print(f"(tổng thời lượng {fmt(total, long_form)} · {len(chapters)} chương → chapters.txt)")
    if len(chapters) < 3:
        print("  ! < 3 chương — YouTube sẽ KHÔNG hiện chapters (vẫn chèn để người xem bấm được).")
    for md in a.inject:
        inject(md if os.path.isabs(md) else os.path.join(a.dir, md), block)


if __name__ == "__main__":
    main()
