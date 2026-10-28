#!/usr/bin/env python3
"""Upload video.mp4 + metadata (youtube.md) từ 1 outputDir lên kênh YouTube TRẠM AI.

Bản copy của upload-youtube-video cho kênh Trạm AI. Credentials nằm NGOÀI repo,
trong $TRAM_AI_CREDS (mặc định <repo>/credentials):
  youtube_client_secret.json   OAuth client (Desktop)
  youtube_token.pickle         token đã đăng nhập (scopes upload + readonly)
Trước khi upload, script kiểm tra kênh đang đăng nhập đúng là Trạm AI
(--expect-channel) — sai kênh thì dừng, KHÔNG đăng.

Dùng:
  python3 upload_youtube.py --dir videos/_render/<slug>-<timestamp>/
  python3 upload_youtube.py --dir videos/_render/<slug>-<timestamp>/ --dry-run
"""

import argparse
import os
import pickle
import re
import sys

CREDS_DIR = os.environ.get("TRAM_AI_CREDS", os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../../credentials")))
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",  # phụ đề + localizations (youtube_i18n.py)
]
TOKEN_FILE = os.path.join(CREDS_DIR, "youtube_token.pickle")
CLIENT_SECRET_FILE = os.path.join(CREDS_DIR, "youtube_client_secret.json")
TRAM_AI_CHANNEL_ID = "UC-OcFyd7wjGQ69ur92o6Rzg"


def parse_youtube_md(md_path):
    """Trích title/description/tags từ file youtube.md do skill create-youtube-content sinh ra."""
    text = open(md_path, "r", encoding="utf-8").read()

    title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else None

    def section(heading):
        pattern = rf"^##\s+{re.escape(heading)}\s*$(.*?)(?=^##\s+|\Z)"
        m = re.search(pattern, text, re.MULTILINE | re.DOTALL)
        return m.group(1).strip() if m else ""

    description = section("Mô tả (Description)")
    tags_raw = section("Tags")
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if tags_raw else []

    return title, description, tags


def get_credentials(client_secret_path, save=True):
    import google_auth_oauthlib.flow
    from google.auth.transport.requests import Request

    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as f:
            creds = pickle.load(f)

    # Token cũ thiếu scope mới (vd force-ssl) → xin đồng ý lại 1 lần, gộp vào cùng token
    if creds and not set(SCOPES) <= set(creds.scopes or []):
        print(f"Token thiếu quyền {sorted(set(SCOPES) - set(creds.scopes or []))} → cần đồng ý lại 1 lần.", flush=True)
        creds = None
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    elif not creds or not creds.valid:
        flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
            client_secret_path, SCOPES
        )
        creds = flow.run_local_server(port=8090, open_browser=False, prompt="consent")

    if save:
        save_credentials(creds)
    return creds


def save_credentials(creds):
    with open(TOKEN_FILE, "wb") as f:
        pickle.dump(creds, f)


def set_thumbnail(youtube, video_id, thumbnail_path):
    """Gắn thumbnail tuỳ chỉnh cho video đã upload. Không raise — lỗi ở đây chỉ
    in cảnh báo, KHÔNG làm fail cả script vì video đã đăng thành công rồi."""
    from googleapiclient.errors import HttpError
    from googleapiclient.http import MediaFileUpload

    try:
        youtube.thumbnails().set(
            videoId=video_id, media_body=MediaFileUpload(thumbnail_path)
        ).execute()
        print(f"✓ Đã gắn thumbnail: {thumbnail_path}")
        return True
    except HttpError as e:
        print(f"Cảnh báo: gắn thumbnail thất bại ({e}).")
        print(
            "Video vẫn đã đăng thành công, chỉ chưa gắn được thumbnail. Lý do "
            "phổ biến: kênh chưa xác minh số điện thoại (custom thumbnail yêu "
            "cầu verify tại https://www.youtube.com/verify)."
        )
        return False


EXPECT_CHANNEL = TRAM_AI_CHANNEL_ID


def build_youtube_client(client_secret_path):
    from googleapiclient.discovery import build

    if not os.path.exists(client_secret_path):
        print(f"Lỗi: Không tìm thấy file '{client_secret_path}'.")
        print("Tạo OAuth client (Desktop app) tại Google Cloud Console > APIs & Services > Credentials,")
        print(f"tải JSON về và đặt tại '{client_secret_path}' (cạnh script này).")
        sys.exit(1)

    print("Đang xác thực tài khoản Google...")
    credentials = get_credentials(client_secret_path, save=False)  # chỉ lưu sau khi đúng kênh
    youtube = build("youtube", "v3", credentials=credentials)
    items = youtube.channels().list(part="snippet", mine=True).execute().get("items", [])
    ids = {c["id"]: c["snippet"]["title"] for c in items}
    if EXPECT_CHANNEL and EXPECT_CHANNEL not in ids:
        print(f"Lỗi: tài khoản đang đăng nhập là kênh {ids or '(không có kênh)'}, "
              f"KHÔNG phải Trạm AI ({EXPECT_CHANNEL}). Dừng, không đăng.")
        sys.exit(1)
    save_credentials(credentials)
    print(f"Kênh: {', '.join(ids.values())}")
    return youtube


def upload_video(
    file_path,
    title,
    description,
    tags,
    category_id,
    privacy_status,
    client_secret_path,
    thumbnail_path=None,
):
    from googleapiclient.http import MediaFileUpload

    if not os.path.exists(file_path):
        print(f"Lỗi: Không tìm thấy file video tại đường dẫn: {file_path}")
        sys.exit(1)

    youtube = build_youtube_client(client_secret_path)

    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": category_id,
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(file_path, chunksize=-1, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    print(f"Đang tiến hành upload video: {file_path}...")
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"Đã tải lên được: {int(status.progress() * 100)}%")

    video_id = response.get("id")
    print("Upload video lên YouTube thành công!")
    print(f"Video ID: {video_id}")
    print(f"Đường dẫn xem video: https://youtu.be/{video_id}")

    if thumbnail_path:
        if os.path.exists(thumbnail_path):
            print(f"Đang gắn thumbnail: {thumbnail_path}...")
            set_thumbnail(youtube, video_id, thumbnail_path)
        else:
            print(f"Cảnh báo: không tìm thấy thumbnail '{thumbnail_path}', bỏ qua.")

    return video_id


def main():
    parser = argparse.ArgumentParser(description="Upload video + metadata từ outputDir lên YouTube")
    parser.add_argument("--dir", required=True, help="outputDir chứa video.mp4 + youtube.md")
    parser.add_argument("--video", default=None, help="Đường dẫn video (mặc định <dir>/video.mp4)")
    parser.add_argument("--metadata", default=None, help="Đường dẫn youtube.md (mặc định <dir>/youtube.md)")
    parser.add_argument("--category", default="28", help="YouTube category ID (mặc định 28 = Science & Technology)")
    parser.add_argument("--privacy", default="public", choices=["public", "unlisted", "private"], help="Mặc định public")
    parser.add_argument("--client-secret", default=CLIENT_SECRET_FILE)
    parser.add_argument(
        "--thumbnail",
        default=None,
        help="Ảnh thumbnail để gắn sau khi upload (mặc định <dir>/thumbnail.png nếu có)",
    )
    parser.add_argument(
        "--no-thumbnail", action="store_true", help="Không gắn thumbnail dù có file thumbnail.png"
    )
    parser.add_argument(
        "--set-thumbnail-only",
        metavar="VIDEO_ID",
        default=None,
        help="Chỉ gắn/đổi lại thumbnail cho video ĐÃ đăng (không upload lại video)",
    )
    parser.add_argument("--expect-channel", default=TRAM_AI_CHANNEL_ID,
                        help="ID kênh bắt buộc phải khớp trước khi đăng ('' để bỏ kiểm tra)")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ in metadata đã parse, không upload")
    args = parser.parse_args()
    global EXPECT_CHANNEL
    EXPECT_CHANNEL = args.expect_channel

    if args.set_thumbnail_only:
        thumb = args.thumbnail or os.path.join(args.dir, "thumbnail.png")
        if not os.path.exists(thumb):
            print(f"Lỗi: không tìm thấy thumbnail '{thumb}'.")
            sys.exit(1)
        print(f"Video ID : {args.set_thumbnail_only}")
        print(f"Thumbnail: {thumb}")
        if args.dry_run:
            return
        youtube = build_youtube_client(args.client_secret)
        ok = set_thumbnail(youtube, args.set_thumbnail_only, thumb)
        sys.exit(0 if ok else 1)

    video_path = args.video or os.path.join(args.dir, "video.mp4")
    metadata_path = args.metadata or os.path.join(args.dir, "youtube.md")
    thumbnail_path = None
    if not args.no_thumbnail:
        thumbnail_path = args.thumbnail or (os.path.join(args.dir, "thumbnail.png") if args.dir else None)
        if thumbnail_path and not os.path.exists(thumbnail_path):
            thumbnail_path = None

    if not os.path.exists(metadata_path):
        print(f"Lỗi: Không tìm thấy file metadata tại: {metadata_path}")
        sys.exit(1)

    title, description, tags = parse_youtube_md(metadata_path)
    if not title or not description:
        print(f"Lỗi: Không parse được title/description từ {metadata_path}")
        sys.exit(1)

    print("--- Metadata sẽ dùng để upload ---")
    print(f"Title: {title}")
    print(f"Description:\n{description}")
    print(f"Tags: {tags}")
    print(f"Privacy: {args.privacy}")
    print(f"Video file: {video_path}")
    print(f"Thumbnail: {thumbnail_path or '(không có / bỏ qua)'}")
    print("-----------------------------------")

    if args.dry_run:
        return

    upload_video(
        file_path=video_path,
        title=title,
        description=description,
        tags=tags,
        category_id=args.category,
        privacy_status=args.privacy,
        client_secret_path=args.client_secret,
        thumbnail_path=thumbnail_path,
    )


if __name__ == "__main__":
    main()
