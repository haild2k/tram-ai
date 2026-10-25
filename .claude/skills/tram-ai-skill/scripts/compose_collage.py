#!/usr/bin/env python3
"""Compose the HOOK background: one 16:9 collage of the main products of the video.

Each product gets a big panel (cover-cropped around its focus point) with a small
name label in the panel's top-left corner. The panels fill the TOP of the frame;
the bottom `--text-band` px is a solid dark band (matching the template --bg1)
where image-full lays the hook kicker + headline, so text never covers a car.

Layout by count: 2 → side by side · 3 → 1 big left + 2 stacked right ·
4 → 2x2 · 5–6 → 3x2.

Usage:
  python3 compose_collage.py --out <TPL>/assets/img-hook.jpg \
      --item "source-images/img-1.jpg|BMW M2|45% 55%" \
      --item "source-images/img-5.jpg|Kia Carens Clavis|40% 60%" \
      --item "source-images/img-21.jpg|Mazda CX-90" \
      --item "source-images/img-10.jpg|MG5 mới|55% 50%"
  (focus is optional, "x% y%" like CSS object-position; default "50% 50%")
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFont

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]
GAP_COLOR = (8, 16, 31)


def font(size):
    for p in FONT_CANDIDATES:
        if os.path.isfile(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def parse_item(s):
    parts = [p.strip() for p in s.split("|")]
    path, label = parts[0], (parts[1] if len(parts) > 1 else "")
    fx, fy = 0.5, 0.5
    if len(parts) > 2 and parts[2]:
        xs = parts[2].replace("%", "").split()
        fx, fy = float(xs[0]) / 100, float(xs[1] if len(xs) > 1 else xs[0]) / 100
    if not os.path.isfile(path):
        sys.exit(f"Lỗi: không thấy ảnh {path}")
    return path, label, fx, fy


def cover(im, w, h, fx, fy):
    """Scale to cover w×h, crop around the focus point (CSS object-fit: cover)."""
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = min(max(round(im.width * fx - w / 2), 0), im.width - w)
    y = min(max(round(im.height * fy - h / 2), 0), im.height - h)
    return im.crop((x, y, x + w, y + h))


def boxes(n, W, H, g):
    half_w, half_h = (W - g) // 2, (H - g) // 2
    if n == 2:
        return [(0, 0, half_w, H), (half_w + g, 0, W - half_w - g, H)]
    if n == 3:
        big = round(W * 0.58)
        return [(0, 0, big, H), (big + g, 0, W - big - g, half_h),
                (big + g, half_h + g, W - big - g, H - half_h - g)]
    if n == 4:
        return [(0, 0, half_w, half_h), (half_w + g, 0, W - half_w - g, half_h),
                (0, half_h + g, half_w, H - half_h - g), (half_w + g, half_h + g, W - half_w - g, H - half_h - g)]
    if n in (5, 6):
        cw = (W - 2 * g) // 3
        out = []
        for r in range(2):
            for c in range(3):
                out.append((c * (cw + g), r * (half_h + g), cw if c < 2 else W - 2 * (cw + g), half_h))
        return out[:n]
    sys.exit("Lỗi: cần 2–6 ảnh cho collage")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", required=True)
    ap.add_argument("--item", action="append", required=True, help='"path|nhãn|x% y%"')
    ap.add_argument("--size", default="1920x1080")
    ap.add_argument("--gap", type=int, default=8)
    ap.add_argument("--text-band", type=int, default=440,
                    help="chiều cao dải tối dưới cùng cho chữ hook (px, 0 = ảnh phủ kín khung)")
    ap.add_argument("--no-labels", action="store_true")
    a = ap.parse_args()

    W, H = (int(v) for v in a.size.lower().split("x"))
    items = [parse_item(s) for s in a.item]
    canvas = Image.new("RGB", (W, H), GAP_COLOR)
    draw = ImageDraw.Draw(canvas)
    f = font(max(26, H // 30))
    band = max(0, min(a.text_band, H // 2))
    for (path, label, fx, fy), (x, y, w, h) in zip(items, boxes(len(items), W, H - band - (a.gap if band else 0), a.gap)):
        canvas.paste(cover(Image.open(path).convert("RGB"), w, h, fx, fy), (x, y))
        if label and not a.no_labels:
            pad = 14
            tw, th = draw.textbbox((0, 0), label, font=f)[2:]
            bx, by = x + 22, y + 22
            draw.rounded_rectangle((bx, by, bx + tw + 2 * pad, by + th + 2 * pad - 4), radius=12, fill=(8, 16, 31))
            draw.text((bx + pad, by + pad - 6), label, font=f, fill=(255, 255, 255))
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    canvas.save(a.out, quality=92)
    print(f"✓ Collage {len(items)} ảnh → {a.out} ({W}x{H})")


if __name__ == "__main__":
    main()
