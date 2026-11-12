#!/usr/bin/env python3
"""Mốc thời gian từng cụm cue theo giọng TTS thật (style skill-motion).
  python3 scripts/align_cues.py <slug> [--retranscribe]
Ghép voice/<id>.mp3 của mọi beat (cách nhau 1 giây lặng) thành 1 wav 16 kHz cho từng ngôn ngữ,
phiên âm bằng whisper.cpp (scripts/whisper_tokens.mjs), rồi tìm vị trí từng cụm `at` trong
phần lời của beat đó (so khớp mờ). Ghi src/videos/<slug>[-en]/cues.json: {beat: {cụm: giây}}.
Cụm không khớp đủ chắc → bỏ trống, motionKit tự ước lượng theo vị trí ký tự.
"""
import difflib
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
import wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motion_build import phrases  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAP = 1.0


def norm(s):
    s = unicodedata.normalize("NFC", s.lower())
    return re.sub(r"[^\w]+", " ", s).strip()


def main():
    slug = sys.argv[1]
    spec = json.load(open(os.path.join(ROOT, "src", "videos", slug, "spec.json"), encoding="utf-8"))
    for lang, sl in (("vi", slug), ("en", slug + "-en")):
        vdir = os.path.join(ROOT, "public", "videos", sl, "voice")
        dur = json.load(open(os.path.join(ROOT, "src", "videos", sl, "durations.json")))
        tmp = tempfile.mkdtemp(dir=os.environ.get("TMPDIR"))
        lst, offs, t = [], {}, 0.0
        sil = os.path.join(tmp, "sil.wav")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"anullsrc=r=16000:cl=mono", "-t", str(GAP), sil], check=True)
        for b in spec["beats"]:
            w = os.path.join(tmp, b["id"] + ".wav")
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", os.path.join(vdir, b["id"] + ".mp3"), "-ar", "16000", "-ac", "1", w], check=True)
            offs[b["id"]] = t
            with wave.open(w) as wf:
                t += wf.getnframes() / wf.getframerate() + GAP
            lst += [w, sil]
        listf = os.path.join(tmp, "list.txt")
        open(listf, "w").write("".join(f"file '{p}'\n" for p in lst))
        allw = os.path.join(tmp, "all.wav")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", listf, "-c", "copy", allw], check=True)
        # Cache kết quả whisper theo lời đọc: đổi lời hoặc giọng thì xoá whisper_tokens.json để phiên âm lại.
        tokf = os.path.join(ROOT, "src", "videos", sl, "whisper_tokens.json")
        if not os.path.exists(tokf) or "--retranscribe" in sys.argv:
            subprocess.run(["node", "scripts/whisper_tokens.mjs", allw, lang, tokf], check=True, cwd=ROOT)
        toks = json.load(open(tokf))
        words = []  # (chuỗi chuẩn hoá, giây)
        for tk in toks:
            txt = tk["text"]
            if txt.startswith(" ") or not words:
                words.append([txt, tk["startMs"] / 1000])
            else:
                words[-1][0] += txt
        words = [(norm(w), s) for w, s in words if norm(w)]
        cues, hit, miss = {}, 0, 0
        for b in spec["beats"]:
            o, d = offs[b["id"]], dur[b["id"]]
            ws = [(w, s - o) for w, s in words if o - 0.3 <= s <= o + d + 0.3]
            res = {}
            for ph in phrases({k: x for k, x in b.items() if k != "voice"}, lang, []):
                pw = norm(ph).split()
                if not pw or not ws:
                    continue
                n = len(pw)
                best, bi = 0.0, -1
                for i in range(len(ws)):
                    cand = " ".join(w for w, _ in ws[i:i + n])
                    r = difflib.SequenceMatcher(None, " ".join(pw), cand).ratio()
                    if r > best:
                        best, bi = r, i
                if best >= 0.6:
                    res[ph] = round(max(0.0, ws[bi][1]), 2)
                    hit += 1
                else:
                    miss += 1
            if res:
                cues[b["id"]] = res
        json.dump(cues, open(os.path.join(ROOT, "src", "videos", sl, "cues.json"), "w"), ensure_ascii=False, indent=1)
        print(f"{lang}: {hit} cụm khớp, {miss} cụm ước lượng → src/videos/{sl}/cues.json")


if __name__ == "__main__":
    main()
