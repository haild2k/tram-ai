#!/usr/bin/env python3
"""Lọc ảnh trùng / gần trùng (ảnh paper ↔ ảnh README GitHub, bản PDF ↔ bản PNG…).

  python3 dedupe_images.py <dir> [--threshold 0.12] [--out <keep_dir>]

Mỗi ảnh: cắt viền trắng/đồng màu → dHash 16x16 (256 bit) + tỉ lệ khung. Hai ảnh
cùng nhóm khi khoảng cách Hamming ≤ threshold·256 VÀ tỉ lệ khung lệch ≤ 12%.
Mỗi nhóm giữ ảnh nhiều điểm ảnh nhất (sau khi cắt viền). In bảng nhóm; có --out
thì copy ảnh được giữ sang thư mục đó. Chỉ dùng Pillow.
"""
import argparse
import glob
import os
import shutil

from PIL import Image, ImageChops


def trim(im):
    # PNG nền trong suốt (hay gặp ở README GitHub) → phủ lên nền trắng như bản PDF của paper
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        flat = Image.new("RGBA", im.size, "white")
        flat.alpha_composite(im)
        im = flat
    rgb = im.convert("RGB")
    bg = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
    box = ImageChops.difference(rgb, bg).convert("L").point(lambda v: 255 if v > 18 else 0).getbbox()
    return rgb.crop(box) if box else rgb


def dhash(im, n=16):
    g = im.convert("L").resize((n + 1, n), Image.LANCZOS)
    px = list(g.getdata())
    return [px[r * (n + 1) + c] > px[r * (n + 1) + c + 1] for r in range(n) for c in range(n)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    ap.add_argument("--threshold", type=float, default=0.12)
    ap.add_argument("--out")
    a = ap.parse_args()

    items = []
    for f in sorted(glob.glob(os.path.join(a.dir, "*"))):
        if not f.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
            continue
        im = trim(Image.open(f))
        items.append({"f": f, "h": dhash(im), "ar": im.width / im.height, "px": im.width * im.height})

    groups = []
    for it in items:
        for g in groups:
            ref = g[0]
            dist = sum(x != y for x, y in zip(it["h"], ref["h"]))
            if dist <= a.threshold * 256 and abs(it["ar"] - ref["ar"]) / ref["ar"] <= 0.12:
                g.append(it)
                break
        else:
            groups.append([it])

    if a.out:
        os.makedirs(a.out, exist_ok=True)
    for g in groups:
        keep = max(g, key=lambda x: x["px"])
        dups = [os.path.basename(x["f"]) for x in g if x is not keep]
        print(f"GIỮ {os.path.basename(keep['f'])}" + (f"   ← trùng: {', '.join(dups)}" if dups else ""))
        if a.out:
            shutil.copy(keep["f"], a.out)
    print(f"{len(items)} ảnh → {len(groups)} ảnh duy nhất")


if __name__ == "__main__":
    main()
