#!/usr/bin/env python3
"""Dọn outputDir sau khi video đã đăng xong lên TOÀN BỘ media: xoá mọi file .mp4 và .mp3
(video.mp4, video_en.mp4, voice/*.mp3, clips/*.mp4, youtube-studio/*.mp3…), giữ lại
kịch bản đăng, thumbnail, phụ đề, research.md, CREDITS.md, script.json.

  python3 .claude/skills/tram-ai-skill/scripts/cleanup_output.py --dir <outputDir> [--dry-run]

Chỉ xoá khi đủ file đánh dấu đã đăng (ghi ngay sau mỗi lần đăng thành công):
  .yt_vi_done   — ID video YouTube kênh Trạm AI
  .fb_done      — ID video Facebook Page Trạm AI
  .yt_en_done   — ID video Tram AI Channel, HOẶC .en_skipped (chủ đề riêng cho người Việt,
                  ghi lý do vào file) — bắt buộc một trong hai
Thiếu đánh dấu nào → in ra, KHÔNG xoá gì, thoát mã 1 (để còn đăng lại).
--force bỏ qua kiểm tra (chỉ dùng khi user bảo rõ).
"""
import argparse
import os
import sys

EXT = (".mp4", ".mp3")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    d = os.path.abspath(a.dir)
    if not os.path.isdir(d):
        sys.exit(f"Không thấy thư mục {d}")
    # Chặn dọn nhầm ngoài kho video của Trạm AI
    if f"{os.sep}videos{os.sep}tram-ai{os.sep}" not in d + os.sep:
        sys.exit(f"Từ chối: {d} không nằm trong videos/tram-ai/")

    has = lambda n: os.path.isfile(os.path.join(d, n))
    missing = [n for n in (".yt_vi_done", ".fb_done") if not has(n)]
    if not (has(".yt_en_done") or has(".en_skipped")):
        missing.append(".yt_en_done hoặc .en_skipped")
    if missing and not a.force:
        print("Chưa đăng đủ media, KHÔNG dọn. Thiếu: " + ", ".join(missing))
        sys.exit(1)

    files = []
    for root, _, names in os.walk(d):
        for n in names:
            if n.lower().endswith(EXT):
                p = os.path.join(root, n)
                files.append((p, os.path.getsize(p)))
    total = sum(s for _, s in files)
    for p, s in files:
        print(f"{'(thử) ' if a.dry_run else ''}xoá {os.path.relpath(p, d)}  {s / 1e6:.1f} MB")
    if a.dry_run:
        print(f"Sẽ giải phóng {total / 1e6:.1f} MB ({len(files)} file)")
        return
    for p, _ in files:
        os.remove(p)
    # Xoá thư mục con đã rỗng (voice/, clips/…)
    for root, dirs, names in os.walk(d, topdown=False):
        if root != d and not os.listdir(root):
            os.rmdir(root)
    with open(os.path.join(d, ".cleaned"), "w", encoding="utf-8") as f:
        f.write("\n".join(os.path.relpath(p, d) for p, _ in files) + "\n")
    print(f"✓ Đã dọn {len(files)} file .mp4/.mp3, giải phóng {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
