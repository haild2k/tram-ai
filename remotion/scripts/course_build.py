#!/usr/bin/env python3
"""Sinh script.json (vi + en) từ spec.json song ngữ của 1 phần khóa học (tram/courseKit.tsx).
  python3 scripts/course_build.py <slug> [--studio <outputDir>]
- Kiểm: kind hợp lệ, mọi cụm `at`/`from`/`to`/`leadAt` có trong lời đọc đúng ngôn ngữ.
- Ghi src/videos/<slug>/script.json và src/videos/<slug>-en/script.json (cho tts.py, finalize.py).
- --studio: ghi <outputDir>/youtube-studio/scenes.json (vi, en, en_tts) cho make_youtube_studio.py.
"""
import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTRO = {"vi": "Theo dõi Trạm AI để cập nhật trí tuệ nhân tạo mỗi ngày.",
         "en": "Follow Tram AI for daily updates on artificial intelligence."}
KINDS = {"hook", "map", "lesson", "points", "cards", "prompt", "steps", "flow", "compare", "chat", "tree", "big", "summary", "fig", "math", "symbols"}


def T(b, lang):
    return b if isinstance(b, str) else b[lang]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--studio")
    a = ap.parse_args()
    src = os.path.join(ROOT, "src", "videos", a.slug)
    spec = json.load(open(os.path.join(src, "spec.json"), encoding="utf-8"))
    errs = []
    ids = set()
    for s in spec["scenes"]:
        sid = s["id"]
        if sid in ids:
            errs.append(f"{sid}: trùng id")
        ids.add(sid)
        if s["kind"] not in KINDS:
            errs.append(f"{sid}: kind lạ {s['kind']}")
        for lang in ("vi", "en"):
            v = s["voice"][lang]
            if re.search(r"\d", v):
                errs.append(f"{sid}/{lang}: lời đọc còn chữ số → viết ra chữ: {re.findall(r'[^ ]*[0-9][^ ]*', v)}")
            phrases = []
            for k in ("from", "to", "leadAt"):
                if s.get(k):
                    phrases.append(T(s[k], lang))
            for it in s.get("items", []) + ([s["note"]] if s.get("note") else []) + s.get("rows", []) + s.get("lessons", []) + s.get("hl", []) + s.get("bars", []) + s.get("vecs", []):
                if it.get("at"):
                    phrases.append(T(it["at"], lang))
            for ph in phrases:
                if ph not in v:
                    errs.append(f"{sid}/{lang}: thiếu cụm “{ph}” trong lời đọc")
        if s["kind"] == "lesson":
            for it in s.get("items", []):
                if not it.get("at"):
                    errs.append(f"{sid}: tag bài cần at")
    if errs:
        print("\n".join(errs))
        sys.exit(1)
    meta = spec["meta"]
    for lang, d in (("vi", src), ("en", src + "-en")):
        os.makedirs(d, exist_ok=True)
        scenes = []
        for s in spec["scenes"]:
            x = {"id": s["id"]}
            if s.get("chapter"):
                x["chapter"] = T(s["chapter"], lang)
            x["voiceText"] = s["voice"][lang]
            scenes.append(x)
        scenes.append({"id": "outro", "voiceText": OUTRO[lang]})
        md = {
            "channel": "Trạm AI" if lang == "vi" else "Tram AI",
            "style": "remotion",
            "title": T(meta["title"], lang),
            "type": meta.get("type", "chu-de"),
            "source": meta.get("source", "Claude Academy"),
            "url": meta.get("url", "https://academy.claude.com/all?kind=tutorial&product=cowork"),
        }
        json.dump({"metadata": md, "scenes": scenes}, open(os.path.join(d, "script.json"), "w"), ensure_ascii=False, indent=1)
    vi_w = sum(len(s["voice"]["vi"].split()) for s in spec["scenes"])
    en_w = sum(len(s["voice"]["en"].split()) for s in spec["scenes"])
    print(f"{len(spec['scenes'])} cảnh · vi {vi_w} từ (~{vi_w / 4.2 / 60:.1f} phút) · en {en_w} từ (~{en_w / 2.6 / 60:.1f} phút)")
    if a.studio:
        st = os.path.join(a.studio, "youtube-studio")
        os.makedirs(st, exist_ok=True)
        out = []
        for s in spec["scenes"]:
            sub = s.get("sub_vi") or s["voice"]["vi"]
            out.append({"id": s["id"], "vi": sub, "en": s["voice"]["en"], "en_tts": s["voice"]["en"]})
        out.append({"id": "outro", "vi": OUTRO["vi"], "en": OUTRO["en"], "en_tts": OUTRO["en"]})
        json.dump(out, open(os.path.join(st, "scenes.json"), "w"), ensure_ascii=False, indent=1)
        print("→", os.path.join(st, "scenes.json"))


if __name__ == "__main__":
    main()
