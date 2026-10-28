#!/usr/bin/env python3
"""Thêm bản tiếng Anh cho 1 video YouTube Trạm AI ĐÃ ĐĂNG: phụ đề VI/EN (.srt) +
tiêu đề/mô tả tiếng Anh (localizations.en). Không đụng tới bản âm thanh (API
YouTube không hỗ trợ upload audio track — làm tay trong Studio).

Dùng chung token với upload_youtube.py (credentials/youtube_token.pickle). Token
cũ thiếu scope youtube.force-ssl → lần đầu in link Google để đồng ý 1 lần, sau đó tự động.

  python3 youtube_i18n.py --dir <outputDir> --video-id <id> --dry-run   # chỉ in kế hoạch, không gọi API
  python3 youtube_i18n.py --dir <outputDir> --video-id <id> --check     # đăng nhập + đọc phụ đề/ngôn ngữ hiện có
  python3 youtube_i18n.py --dir <outputDir> --video-id <id>             # làm thật
      [--replace]   xoá phụ đề cùng ngôn ngữ đã có rồi tải lại
      [--no-vi]     không tải subtitles_vi.srt

Đầu vào trong outputDir: youtube_en.md (title + "## Mô tả (Description)"),
youtube-studio/subtitles_vi.srt, youtube-studio/subtitles_en.srt.
Quota: captions.insert ~400 đơn vị / file, videos.update ~50, list ~1.
"""
import argparse
import os
import sys

from upload_youtube import CLIENT_SECRET_FILE, TRAM_AI_CHANNEL_ID, get_credentials, parse_youtube_md, save_credentials

TRACK_NAME = {"vi": "Tiếng Việt", "en": "English"}


def client():
    from googleapiclient.discovery import build

    creds = get_credentials(CLIENT_SECRET_FILE, save=False)  # chỉ lưu sau khi đúng kênh
    yt = build("youtube", "v3", credentials=creds)
    ids = {c["id"]: c["snippet"]["title"] for c in yt.channels().list(part="snippet", mine=True).execute().get("items", [])}
    if TRAM_AI_CHANNEL_ID not in ids:
        sys.exit(f"Lỗi: đang đăng nhập kênh {ids or '(không có kênh)'}, KHÔNG phải Trạm AI — token KHÔNG được lưu. "
                 "Đăng nhập lại và chọn đúng kênh Trạm AI ở màn hình chọn kênh.")
    save_credentials(creds)
    print(f"Kênh: {', '.join(ids.values())}")
    return yt


def show_state(yt, vid):
    v = yt.videos().list(part="snippet,localizations", id=vid).execute()["items"]
    if not v:
        sys.exit(f"Không tìm thấy video {vid} trên kênh.")
    sn = v[0]["snippet"]
    print(f"Video: {sn['title']}")
    print(f"  defaultLanguage={sn.get('defaultLanguage')}  defaultAudioLanguage={sn.get('defaultAudioLanguage')}")
    print(f"  localizations: {list(v[0].get('localizations', {}))}")
    caps = yt.captions().list(part="snippet", videoId=vid).execute().get("items", [])
    for c in caps:
        print(f"  phụ đề: {c['snippet']['language']} · {c['snippet']['name'] or '(auto)'} · {c['snippet']['trackKind']} · id {c['id']}")
    return v[0], caps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--video-id", required=True)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--replace", action="store_true")
    ap.add_argument("--no-vi", action="store_true")
    a = ap.parse_args()

    studio = os.path.join(a.dir, "youtube-studio")
    title_en, desc_en, _ = parse_youtube_md(os.path.join(a.dir, "youtube_en.md"))
    srts = {lang: os.path.join(studio, f"subtitles_{lang}.srt") for lang in (["en"] if a.no_vi else ["vi", "en"])}
    for p in srts.values():
        if not os.path.exists(p):
            sys.exit(f"Thiếu {p}")

    print(f"--- Kế hoạch cho video {a.video_id} ---")
    print("snippet.defaultLanguage = vi, defaultAudioLanguage = vi")
    print(f"localizations.en.title = {title_en}")
    print(f"localizations.en.description = ({len(desc_en)} ký tự)\n{desc_en[:400]}{'…' if len(desc_en) > 400 else ''}")
    for lang, p in srts.items():
        print(f"phụ đề {lang} ← {p}")
    print("-----------------------------------")
    if a.dry_run:
        return

    from googleapiclient.http import MediaFileUpload

    yt = client()
    video, caps = show_state(yt, a.video_id)
    if a.check:
        return

    sn = video["snippet"]
    body = {
        "id": a.video_id,
        "snippet": {
            "title": sn["title"],
            "description": sn.get("description", ""),
            "categoryId": sn["categoryId"],
            "tags": sn.get("tags", []),
            "defaultLanguage": "vi",
            "defaultAudioLanguage": "vi",
        },
        "localizations": {**video.get("localizations", {}), "en": {"title": title_en, "description": desc_en}},
    }
    yt.videos().update(part="snippet,localizations", body=body).execute()
    print("✓ Đã đặt tiêu đề + mô tả tiếng Anh (localizations.en)")

    for lang, path in srts.items():
        same = [c for c in caps if c["snippet"]["language"] == lang and c["snippet"]["trackKind"] == "standard"]
        if same and not a.replace:
            print(f"• Bỏ qua phụ đề {lang}: đã có (dùng --replace để tải lại)")
            continue
        for c in same:
            yt.captions().delete(id=c["id"]).execute()
        yt.captions().insert(
            part="snippet",
            body={"snippet": {"videoId": a.video_id, "language": lang, "name": TRACK_NAME[lang], "isDraft": False}},
            media_body=MediaFileUpload(path, mimetype="application/octet-stream"),
        ).execute()
        print(f"✓ Đã tải phụ đề {lang}")

    show_state(yt, a.video_id)


if __name__ == "__main__":
    main()
