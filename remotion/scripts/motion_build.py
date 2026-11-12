#!/usr/bin/env python3
"""Sinh script.json (vi + en) từ spec.json style skill-motion (tram/motionKit.tsx).
  python3 scripts/motion_build.py <slug> [--studio <outputDir>]
- Kiểm: id không trùng, kind hợp lệ, lời đọc không có chữ số, mọi cụm `at`
  (ở caps, v, v.items/rows/lines, v.a/v.b) có nguyên văn trong lời đọc đúng ngôn ngữ.
- Ghi src/videos/<slug>/script.json, src/videos/<slug>-en/script.json (cho tts.py, finalize.py),
  tạo cues.json rỗng nếu chưa có (align_cues.py ghi mốc thật).
- --studio: ghi <outputDir>/youtube-studio/scenes.json cho make_youtube_studio.py.
"""
import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTRO = {"vi": "Theo dõi Trạm AI để cập nhật trí tuệ nhân tạo mỗi ngày.",
         "en": "Follow Tram AI for daily updates on artificial intelligence."}
KINDS = {"window", "checklist", "skillcard", "terminal", "file", "flow", "icon", "quote", "versus", "stat",
         "image", "chat", "grid", "pages", "look", "button", "timeline", "bars", "cta"}
CUE_KEYS = {"at", "saveAt", "followAt"}


def T(b, lang):
    return b if isinstance(b, str) else b[lang]


def phrases(node, lang, out):
    """Gom mọi cụm cue trong 1 beat (đệ quy)."""
    if isinstance(node, dict):
        for k, v in node.items():
            if k in CUE_KEYS and v:
                out.append(T(v, lang))
            elif isinstance(v, (dict, list)) and k != "voice":
                phrases(v, lang, out)
    elif isinstance(node, list):
        for x in node:
            phrases(x, lang, out)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--studio")
    a = ap.parse_args()
    src = os.path.join(ROOT, "src", "videos", a.slug)
    spec = json.load(open(os.path.join(src, "spec.json"), encoding="utf-8"))
    errs, ids = [], set()
    for b in spec["beats"]:
        bid = b["id"]
        if bid in ids or bid == "outro":
            errs.append(f"{bid}: trùng id")
        ids.add(bid)
        if b["v"]["kind"] not in KINDS:
            errs.append(f"{bid}: kind lạ {b['v']['kind']}")
        if len(b["title"]) != 2:
            errs.append(f"{bid}: title phải có 2 dòng")
        for lang in ("vi", "en"):
            v = b["voice"][lang]
            if re.search(r"\d", v):
                errs.append(f"{bid}/{lang}: lời đọc còn chữ số → {re.findall(r'[^ ]*[0-9][^ ]*', v)}")
            for ph in phrases({k: x for k, x in b.items() if k != "voice"}, lang, []):
                if ph not in v:
                    errs.append(f"{bid}/{lang}: thiếu cụm “{ph}” trong lời đọc")
    if errs:
        print("\n".join(errs))
        sys.exit(1)
    meta = spec["meta"]
    for lang, d in (("vi", src), ("en", src + "-en")):
        os.makedirs(d, exist_ok=True)
        scenes = []
        for b in spec["beats"]:
            x = {"id": b["id"]}
            if b.get("chapter"):
                x["chapter"] = T(b["chapter"], lang)
            x["voiceText"] = b["voice"][lang]
            scenes.append(x)
        scenes.append({"id": "outro", "voiceText": OUTRO[lang]})
        md = {"channel": "Trạm AI" if lang == "vi" else "Tram AI", "style": "skill-motion",
              "title": T(meta["title"], lang), "type": meta.get("type", "chu-de"),
              "source": meta.get("source", ""), "url": meta.get("url", "")}
        json.dump({"metadata": md, "scenes": scenes}, open(os.path.join(d, "script.json"), "w"), ensure_ascii=False, indent=1)
        cf = os.path.join(d, "cues.json")
        if not os.path.exists(cf):
            json.dump({}, open(cf, "w"))
    vi_w = sum(len(b["voice"]["vi"].split()) for b in spec["beats"])
    en_w = sum(len(b["voice"]["en"].split()) for b in spec["beats"])
    n = len(spec["beats"])
    print(f"{n} beat · vi {vi_w} từ (~{vi_w / 4.2 / 60 + n * 0.35 / 60:.1f} phút) · en {en_w} từ (~{en_w / 2.6 / 60 + n * 0.35 / 60:.1f} phút)")
    if a.studio:
        st = os.path.join(a.studio, "youtube-studio")
        os.makedirs(st, exist_ok=True)
        out = [{"id": b["id"], "vi": b["voice"]["vi"], "en": b["voice"]["en"], "en_tts": b["voice"]["en"]} for b in spec["beats"]]
        out.append({"id": "outro", "vi": OUTRO["vi"], "en": OUTRO["en"], "en_tts": OUTRO["en"]})
        json.dump(out, open(os.path.join(st, "scenes.json"), "w"), ensure_ascii=False, indent=1)
        print("→", os.path.join(st, "scenes.json"))


if __name__ == "__main__":
    main()
