#!/usr/bin/env python3
"""Compose a video thumbnail from ONE of the input images + the video title text.

No AI image generation — takes a source photo (one of the images the user gave
for the video), crops it to the video aspect, darkens it, and lays the title on
top in large bold Vietnamese-capable type. Output: <dir>/thumbnail.png.

Usage:
  python3 compose_thumbnail.py --dir videos/short/<date>/<slug>/            # auto: pick source-images/img-1, title from youtube.md/script.json, aspect from script.json
  python3 compose_thumbnail.py --dir <dir> --image path/to.jpg --title "..." --aspect 16:9
  python3 compose_thumbnail.py --dir <dir> --pick 2 --focus "50% 30%"          # use 2nd source image, keep upper-middle when cropping
  python3 compose_thumbnail.py --dir <dir> --dry-run
"""
import argparse
import glob
import json
import os
import re
import sys

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageFilter

SIZE_BY_ASPECT = {"16:9": (1920, 1088), "9:16": (1088, 1920)}

# Vietnamese-capable bold fonts, first that exists wins.
# (Linux paths first for Docker/prod parity; macOS system fonts as fallback so
# local runs on a Mac don't silently drop to PIL's tofu-prone bitmap default.)
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]
FONT_CANDIDATES_REG = [
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]

ACCENT = (242, 178, 84)   # Trạm AI gold (logo)
INK = (255, 255, 255)


def _first_existing(paths):
    for p in paths:
        if os.path.isfile(p):
            return p
    return None


def resolve_font(paths, size):
    p = _first_existing(paths)
    if not p:
        return ImageFont.load_default()
    return ImageFont.truetype(p, size)


def parse_focus(focus, iw, ih, tw, th):
    """Return (left, top) crop offset for a cover-fit, honoring a '50% 30%' focus."""
    scale = max(tw / iw, th / ih)
    rw, rh = int(round(iw * scale)), int(round(ih * scale))
    fx, fy = 0.5, 0.42
    if focus:
        m = re.findall(r"(\d+(?:\.\d+)?)\s*%", focus)
        if len(m) >= 2:
            fx, fy = float(m[0]) / 100, float(m[1]) / 100
        elif focus in ("top",):
            fy = 0.0
        elif focus in ("bottom",):
            fy = 1.0
        elif focus in ("left",):
            fx = 0.0
        elif focus in ("right",):
            fx = 1.0
    left = int(round((rw - tw) * fx))
    top = int(round((rh - th) * fy))
    left = max(0, min(left, rw - tw))
    top = max(0, min(top, rh - th))
    return (rw, rh), (left, top)


def cover_crop(img, tw, th, focus):
    img = img.convert("RGB")
    (rw, rh), (left, top) = parse_focus(focus, img.width, img.height, tw, th)
    img = img.resize((rw, rh), Image.LANCZOS)
    return img.crop((left, top, left + tw, top + th))


def wrap_to_width(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_title(draw, text, font_path, max_w, max_h, max_lines):
    """Largest font size (px) that wraps `text` into <= max_lines and fits max_h."""
    lo, hi, best = 34, 150, None
    while lo <= hi:
        mid = (lo + hi) // 2
        font = ImageFont.truetype(font_path, mid) if font_path else ImageFont.load_default()
        lines = wrap_to_width(draw, text, font, max_w)
        asc, desc = font.getmetrics()
        lh = int((asc + desc) * 1.14)
        if len(lines) <= max_lines and lh * len(lines) <= max_h:
            best = (mid, lines, lh)
            lo = mid + 1
        else:
            hi = mid - 1
    if best is None:
        font = ImageFont.truetype(font_path, 34) if font_path else ImageFont.load_default()
        best = (34, wrap_to_width(draw, text, font, max_w), 44)
    return best


def read_title(d):
    ymd = os.path.join(d, "youtube.md")
    if os.path.isfile(ymd):
        for line in open(ymd, encoding="utf-8"):
            if line.startswith("# "):
                return line[2:].strip()
    sj = os.path.join(d, "script.json")
    if os.path.isfile(sj):
        try:
            return json.load(open(sj, encoding="utf-8")).get("metadata", {}).get("title", "").strip()
        except Exception:
            pass
    return ""


def read_aspect(d):
    sj = os.path.join(d, "script.json")
    if os.path.isfile(sj):
        try:
            a = json.load(open(sj, encoding="utf-8")).get("aspect", "")
            if a in SIZE_BY_ASPECT:
                return a
        except Exception:
            pass
    return "16:9"


def pick_source_image(d, explicit, pick):
    if explicit:
        if not os.path.isfile(explicit):
            sys.exit(f"--image không tồn tại: {explicit}")
        return explicit
    cands = sorted(glob.glob(os.path.join(d, "source-images", "img-*")))
    if not cands:
        cands = sorted(
            glob.glob(os.path.join(d, "source-images", "*"))
            + glob.glob(os.path.join(d, "assets", "img-*"))
        )
    cands = [c for c in cands if c.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
    if not cands:
        sys.exit(f"Không tìm thấy ảnh đầu vào trong {d}/source-images/ — truyền --image <path>.")
    idx = max(1, pick) - 1
    return cands[idx] if idx < len(cands) else cands[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--image", help="ảnh nguồn cụ thể (mặc định: source-images/img-<pick>)")
    ap.add_argument("--pick", type=int, default=1, help="dùng ảnh nguồn thứ N (1-based), mặc định 1")
    ap.add_argument("--title", help="tiêu đề (mặc định: dòng # trong youtube.md, hoặc metadata.title)")
    ap.add_argument("--aspect", choices=list(SIZE_BY_ASPECT), help="mặc định: aspect trong script.json")
    ap.add_argument("--focus", default="", help="vùng giữ khi crop, vd 'top' hoặc '50% 30%'")
    ap.add_argument("--kicker", default="", help="nhãn nhỏ phía trên tiêu đề (mặc định: không có — KHÔNG hiện tên kênh)")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    d = a.dir.rstrip("/")
    src = pick_source_image(d, a.image, a.pick)
    title = (a.title or read_title(d)).strip()
    aspect = a.aspect or read_aspect(d)
    tw, th = SIZE_BY_ASPECT[aspect]
    out = os.path.join(d, "thumbnail.png")

    print(f"Ảnh nguồn : {src}")
    print(f"Tiêu đề   : {title or '(trống!)'}")
    print(f"Aspect    : {aspect} -> {tw}x{th}")
    print(f"Out       : {out}")
    if a.dry_run:
        return
    if not title:
        sys.exit("Không có tiêu đề — truyền --title hoặc tạo youtube.md trước.")

    base = cover_crop(Image.open(src), tw, th, a.focus)
    base = ImageEnhance.Color(base).enhance(1.08)
    base = ImageEnhance.Contrast(base).enhance(1.06)
    base = ImageEnhance.Brightness(base).enhance(0.92)

    # gradient scrim from bottom + left-side darken so the text area reads
    # while the subject (usually right-of-centre) stays bright
    grad = Image.new("L", (1, th), 0)
    for y in range(th):
        t = y / th
        grad.putpixel((0, y), int(20 + 225 * max(0, (t - 0.30) / 0.70) ** 1.6))
    grad = grad.resize((tw, th))
    scrim = Image.new("RGB", (tw, th), (5, 12, 22))
    base = Image.composite(scrim, base, grad)

    lgrad = Image.new("L", (tw, 1), 0)
    for x in range(tw):
        t = x / tw
        lgrad.putpixel((x, 0), int(150 * max(0, (0.62 - t) / 0.62) ** 1.3) + 26)
    lgrad = lgrad.resize((tw, th))
    base = Image.composite(Image.new("RGB", (tw, th), (4, 9, 16)), base, lgrad)

    draw = ImageDraw.Draw(base)
    pad = int(tw * 0.055)
    max_w = tw - 2 * pad
    max_h = int(th * (0.40 if aspect == "16:9" else 0.30))
    max_lines = 3 if aspect == "16:9" else 4

    font_path = _first_existing(FONT_CANDIDATES)
    size, lines, lh = fit_title(draw, title, font_path, max_w, max_h, max_lines)
    font = ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default()

    kfont = resolve_font(FONT_CANDIDATES, max(20, int(size * 0.34)))
    block_h = lh * len(lines)
    kicker_gap = int(size * 0.5)
    kicker = " ".join(list(a.kicker.upper())) if a.kicker else ""
    ky = th - pad - block_h - kicker_gap - (kfont.getmetrics()[0] if kicker else 0)
    y0 = th - pad - block_h

    # accent bar
    draw.rectangle([pad, ky if kicker else y0, pad + int(tw * 0.006),
                    th - pad], fill=ACCENT)
    tx = pad + int(tw * 0.028)

    if kicker:
        draw.text((tx, ky), kicker, font=kfont, fill=ACCENT)

    y = y0
    for ln in lines:
        # shadow then text
        draw.text((tx + 3, y + 3), ln, font=font, fill=(0, 0, 0))
        draw.text((tx, y), ln, font=font, fill=INK)
        y += lh

    base.save(out)
    print(f"✓ Đã tạo thumbnail (ghép từ ảnh nguồn + tiêu đề) -> {out}")


if __name__ == "__main__":
    main()
