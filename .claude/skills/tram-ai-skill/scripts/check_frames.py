#!/usr/bin/env python3
"""Find and re-render corrupted frames in a Remotion JPEG sequence (style remotion).

Chrome's GPU compositor occasionally captures a broken frame — black tiles over
part of the picture, or the frame tiled into a grid of smaller copies of itself.
Each one lasts 1–3 frames, so the final video looks like it "jerks" / flashes.
It is random (a re-render of the same frame is fine) and gets worse with high
--concurrency on this machine.

Detection: frames i..i+w-1 (w <= 3) are glitched when they differ from frame
i-1 while frame i-1 and frame i+w are near-identical (the picture "comes back").
Fix: re-render just those frames (small ranges, --concurrency=1) and copy them
over, then check again (up to --rounds times).

Usage (from repo root, before muxing with ffmpeg):
  python3 check_frames.py <seqDir>                                   # report only
  python3 check_frames.py <seqDir> --fix --comp <Id> \\
      --browser-executable "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
Exit code 0 = clean, 1 = glitched frames remain.
"""
import argparse
import glob
import os
import re
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

NAME = re.compile(r"(\d+)\.(jpe?g|png)$")
DIFF_MIN = 2.0  # mean abs diff (0–255) on a 160x90 grey thumbnail


def thumb(path):
    im = Image.open(path)
    im.draft("L", (240, 135))
    return np.asarray(im.convert("L").resize((160, 90)), dtype=np.int16)


def frames(seq):
    out = {}
    for f in glob.glob(os.path.join(seq, "*")):
        m = NAME.search(f)
        if m:
            out[int(m.group(1))] = f
    return dict(sorted(out.items()))


def detect(fs, only=None):
    """Return sorted glitched frame numbers. `only` limits the scan to these numbers' neighbourhoods."""
    nums = list(fs)
    idx = range(1, len(nums) - 1)
    if only is not None:
        pos = {n: i for i, n in enumerate(nums)}
        idx = sorted({j for n in only for j in range(pos[n] - 3, pos[n] + 4) if 1 <= j < len(nums) - 1})
    cache = {}

    def t(i):
        if i not in cache:
            cache[i] = thumb(fs[nums[i]])
        return cache[i]

    bad = set()
    for i in idx:
        for w in (1, 2, 3):
            if i + w >= len(nums):
                break
            prev, nxt = t(i - 1), t(i + w)
            d = min(np.abs(t(k) - prev).mean() for k in range(i, i + w))
            if d > DIFF_MIN and np.abs(prev - nxt).mean() < d / 2:
                bad.update(nums[i:i + w])
                break
        if only is None and len(cache) > 8:  # keep memory flat on a full scan
            for k in [k for k in cache if k < i - 2]:
                del cache[k]
    return sorted(bad)


def ranges(nums, gap=2):
    out = []
    for n in nums:
        if out and n - out[-1][1] <= gap:
            out[-1][1] = n
        else:
            out.append([n, n])
    return out


def rerender(args, fs, bad):
    tmp = tempfile.mkdtemp(prefix="refix-")
    try:
        for a, b in ranges(bad):
            d = os.path.join(tmp, f"{a}-{b}")
            cmd = ["npx", "remotion", "render", args.entry, args.comp, os.path.abspath(d), "--sequence",
                   f"--frames={a}-{b}", "--image-format=jpeg", f"--jpeg-quality={args.jpeg_quality}",
                   "--muted", "--concurrency=1", "--log=error"]
            if args.browser_executable:
                cmd.append(f"--browser-executable={args.browser_executable}")
            print(f"  render lại {a}-{b}")
            r = subprocess.run(cmd, cwd=args.remotion_dir, capture_output=True, text=True)
            if r.returncode:
                sys.exit(f"render {a}-{b} lỗi:\n{r.stdout}{r.stderr}")
            for n, f in frames(d).items():
                if n in fs:
                    shutil.copyfile(f, fs[n])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("seq")
    p.add_argument("--fix", action="store_true")
    p.add_argument("--comp", help="composition id, vd PaperHarness2")
    p.add_argument("--entry", default="src/index.ts", help="entry hoặc thư mục bundle (tương đối remotion/)")
    p.add_argument("--remotion-dir", default="remotion")
    p.add_argument("--browser-executable")
    p.add_argument("--jpeg-quality", type=int, default=92)
    p.add_argument("--rounds", type=int, default=3)
    args = p.parse_args()

    fs = frames(args.seq)
    if len(fs) < 3:
        sys.exit(f"Không thấy chuỗi ảnh trong {args.seq}")
    bad = detect(fs)
    print(f"{len(fs)} khung, {len(bad)} khung hỏng: {bad[:40]}{' …' if len(bad) > 40 else ''}")
    if bad and args.fix:
        if not args.comp:
            sys.exit("--fix cần --comp <Id>")
        for r in range(args.rounds):
            rerender(args, fs, bad)
            bad = detect(fs, only=bad)
            print(f"vòng {r + 1}: còn {len(bad)} khung hỏng {bad}")
            if not bad:
                break
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
