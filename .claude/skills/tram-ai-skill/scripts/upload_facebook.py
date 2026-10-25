#!/usr/bin/env python3
"""Upload video.mp4 lên Facebook Page TRẠM AI qua Graph API (credentials: $TRAM_AI_CREDS/facebook_credentials.json).

Skill này self-contained: script + requirements.txt nằm cùng thư mục, và
facebook_credentials.json mặc định cũng đọc ngay tại thư mục này — copy nguyên
folder skill sang project khác là chạy được.

Yêu cầu:
  pip install -r requirements.txt        (chạy trong thư mục skill này)
  facebook_credentials.json đặt cạnh script này:
    {
      "user_access_token": "EAAB...",   # User Access Token (có quyền pages_show_list,
                                        #   pages_manage_posts, pages_read_engagement)
      "target_page_id": "1430978420097668"
    }

Dùng:
  # Lấy title/description từ youtube.md trong outputDir
  python3 upload_facebook.py --dir videos/_render/<slug>-<timestamp>/
  python3 upload_facebook.py --dir videos/_render/<slug>-<timestamp>/ --dry-run

  # Hoặc chỉ định file + nội dung trực tiếp
  python3 upload_facebook.py --video path/to/video.mp4 \
      --title "Tiêu đề" --description "Mô tả video..."

  # Video dọc 9:16 -> đăng dạng Reel (tự bật khi script.json có aspect "9:16",
  # hoặc ép bằng --reel). Video ngang 16:9 -> đăng /videos như thường.
  python3 upload_facebook.py --dir videos/_render/<slug>-<timestamp>/ --reel

Ảnh bìa (cover): mặc định lấy <dir>/thumbnail.png; nếu không có thì trích 1 frame
CÓ HÌNH ẢNH từ video tại --cover-ms (mặc định 3000 ms) rồi đặt qua endpoint
/{video_id}/thumbnails (is_preferred=true). Cần ffmpeg trong PATH cho việc trích
frame. Tắt bằng --no-thumbnail.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time

import requests

SKILL_DIR = os.path.dirname(os.path.abspath(__file__))
GRAPH_VERSION = "v19.0"
CRED_FILE = os.path.join(
    os.environ.get("TRAM_AI_CREDS", "/home/haild/haild/Core/Scripts/upload_mxh/tram-ai"),
    "facebook_credentials.json",
)  # Page Trạm AI (1430978420097668)


def load_credentials(path):
    if not os.path.exists(path):
        print(f"Lỗi: Không tìm thấy file credentials tại '{path}'.")
        print("Tạo file với nội dung:")
        print('  {')
        print('    "user_access_token": "<User Access Token>",')
        print('    "target_page_id": "<Page ID>"')
        print('  }')
        print("Token cần quyền: pages_show_list, pages_manage_posts, pages_read_engagement.")
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    user_token = data.get("user_access_token")
    page_id = str(data.get("target_page_id") or "").strip()
    if not user_token or not page_id:
        print(f"Lỗi: '{path}' thiếu 'user_access_token' hoặc 'target_page_id'.")
        sys.exit(1)
    return user_token, page_id


def parse_youtube_md(md_path):
    """Trích title + description từ file youtube.md (skill create-youtube-content)."""
    text = open(md_path, "r", encoding="utf-8").read()

    title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else None

    def section(heading):
        pattern = rf"^##\s+{re.escape(heading)}\s*$(.*?)(?=^##\s+|\Z)"
        m = re.search(pattern, text, re.MULTILINE | re.DOTALL)
        return m.group(1).strip() if m else ""

    description = section("Mô tả (Description)")
    return title, description


def get_page_access_token(user_token, target_page_id):
    """Tìm và lấy Page Access Token của Page ID chỉ định."""
    url = f"https://graph.facebook.com/{GRAPH_VERSION}/me/accounts"
    params = {"access_token": user_token, "limit": 200}
    resp = requests.get(url, params=params).json()

    if "error" in resp:
        print(f"Lỗi lấy danh sách Page: {resp['error'].get('message')}")
        return None

    for page in resp.get("data", []):
        if str(page["id"]) == str(target_page_id):
            print(f"Đã tìm thấy Page: {page['name']} ({page['id']})")
            return page["access_token"]

    print(f"Không tìm thấy Page ID {target_page_id} trong tài khoản này.")
    print("Các Page khả dụng:", [f"{p['name']} ({p['id']})" for p in resp.get("data", [])])
    return None


def extract_frame(video_path, cover_ms, out_path):
    """Trích 1 frame CÓ HÌNH ẢNH từ video tại mốc cover_ms (mili giây) -> out_path (JPG)."""
    ts = max(0, int(cover_ms)) / 1000.0
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-ss", f"{ts:.3f}", "-i", video_path,
        "-frames:v", "1", "-q:v", "2", out_path,
    ]
    subprocess.run(cmd, check=True)
    if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
        raise RuntimeError(f"ffmpeg không tạo được frame tại {cover_ms} ms")
    return out_path


def resolve_cover(args, video_path, tmpdir):
    """Trả về (đường dẫn ảnh bìa, mô tả nguồn) hoặc (None, lý do) nếu bỏ qua."""
    if args.no_thumbnail:
        return None, "tắt (--no-thumbnail)"

    # 1. Ảnh do người dùng chỉ định
    if args.thumbnail:
        if os.path.exists(args.thumbnail):
            return args.thumbnail, f"file chỉ định: {args.thumbnail}"
        print(f"Cảnh báo: không thấy --thumbnail '{args.thumbnail}', thử cách khác.")

    # 2. thumbnail.png có sẵn trong outputDir (media-skill sinh ở Bước 5)
    if args.dir:
        p = os.path.join(args.dir, "thumbnail.png")
        if os.path.exists(p):
            return p, f"thumbnail.png trong outputDir"

    # 3. Trích frame từ video tại --cover-ms
    try:
        out = os.path.join(tmpdir, "fb_cover.jpg")
        extract_frame(video_path, args.cover_ms, out)
        return out, f"frame video lúc {args.cover_ms} ms"
    except Exception as e:  # noqa: BLE001 - cover không bắt buộc
        return None, f"không trích được frame ({e})"


def set_video_thumbnail(video_id, page_token, image_path, retries=6, delay=10):
    """POST /{video_id}/thumbnails (is_preferred=true). Dùng cho Reel (và video thường).

    Video xử lý bất đồng bộ nên thử lại vài lần trong lúc Facebook còn transcode.
    Không chặn luồng đăng nếu thất bại.
    """
    url = f"https://graph.facebook.com/{GRAPH_VERSION}/{video_id}/thumbnails"
    for attempt in range(1, retries + 1):
        with open(image_path, "rb") as fh:
            resp = requests.post(
                url,
                data={"access_token": page_token, "is_preferred": "true"},
                files={"source": fh},
            ).json()
        if "id" in resp or resp.get("success"):
            print(f"➜ Đã đặt ảnh bìa (thumbnail id: {resp.get('id', 'ok')})")
            return True
        err = resp.get("error", {})
        msg = err.get("message", json.dumps(resp, ensure_ascii=False))
        # video chưa sẵn sàng -> chờ rồi thử lại
        if attempt < retries:
            print(f"  ảnh bìa chưa đặt được ({msg}) — chờ {delay}s, thử lại "
                  f"({attempt}/{retries - 1})")
            time.sleep(delay)
        else:
            print(f"Cảnh báo: không đặt được ảnh bìa sau {retries} lần: {msg}")
    return False


def upload_reel(page_id, page_token, video_path, title, description, cover_path=None):
    """Đăng video dọc 9:16 dạng Reel qua endpoint /video_reels (upload 3 phase)."""
    base = f"https://graph.facebook.com/{GRAPH_VERSION}/{page_id}/video_reels"

    # Phase 1: start -> lấy video_id + upload_url
    start = requests.post(
        base, data={"upload_phase": "start", "access_token": page_token}
    ).json()
    if "video_id" not in start or "upload_url" not in start:
        print(f"\nLỗi khởi tạo Reel: {json.dumps(start, ensure_ascii=False, indent=2)}")
        sys.exit(1)
    video_id = start["video_id"]
    upload_url = start["upload_url"]

    # Phase 2: nạp file nhị phân lên upload_url (hosted upload)
    file_size = os.path.getsize(video_path)
    size_mb = file_size / (1024 * 1024)
    print(f"Đang tải Reel lên Facebook ({size_mb:.1f} MB), vui lòng chờ...")
    with open(video_path, "rb") as video_file:
        transfer = requests.post(
            upload_url,
            headers={
                "Authorization": f"OAuth {page_token}",
                "offset": "0",
                "file_size": str(file_size),
            },
            data=video_file,
        ).json()
    if not transfer.get("success"):
        print(f"\nLỗi tải Reel lên: {json.dumps(transfer, ensure_ascii=False, indent=2)}")
        sys.exit(1)

    # Phase 3: finish -> publish
    caption = "\n\n".join(p for p in (title, description) if p)
    finish = requests.post(
        base,
        data={
            "upload_phase": "finish",
            "video_id": video_id,
            "video_state": "PUBLISHED",
            "description": caption,
            "access_token": page_token,
        },
    ).json()
    if not (finish.get("success") or finish.get("id") or finish.get("post_id")):
        print(f"\nLỗi publish Reel: {json.dumps(finish, ensure_ascii=False, indent=2)}")
        sys.exit(1)

    print("\nĐăng Reel thành công!")
    print(f"➜ Video ID: {video_id}")
    print(f"➜ URL Reel: https://www.facebook.com/reel/{video_id}")
    print(f"➜ URL trên Page: https://www.facebook.com/{page_id}/videos/{video_id}")
    print("(Facebook xử lý Reel bất đồng bộ — có thể mất 1–2 phút để hiển thị.)")

    if cover_path:
        print(f"Đang đặt ảnh bìa Reel từ: {cover_path}")
        set_video_thumbnail(video_id, page_token, cover_path)

    return video_id


def upload_video(page_id, page_token, video_path, title, description, cover_path=None):
    url = f"https://graph-video.facebook.com/{GRAPH_VERSION}/{page_id}/videos"
    payload = {
        "title": title or "",
        "description": description or "",
        "access_token": page_token,
    }

    size_mb = os.path.getsize(video_path) / (1024 * 1024)
    print(f"Đang tải video lên Facebook ({size_mb:.1f} MB), vui lòng chờ...")
    cover_fh = None
    try:
        video_file = open(video_path, "rb")
        files = {"source": video_file}
        if cover_path:
            cover_fh = open(cover_path, "rb")
            files["thumb"] = cover_fh
            print(f"Kèm ảnh bìa: {cover_path}")
        resp = requests.post(url, data=payload, files=files).json()
    finally:
        try:
            video_file.close()
        except Exception:
            pass
        if cover_fh:
            cover_fh.close()

    if "id" in resp:
        video_id = resp["id"]
        print("\nĐăng video thành công!")
        print(f"➜ Video ID: {video_id}")
        print(f"➜ URL Video (Watch): https://www.facebook.com/watch/?v={video_id}")
        print(f"➜ URL Video trên Page: https://www.facebook.com/{page_id}/videos/{video_id}")
        # Đặt lại thumbnail qua endpoint riêng cho chắc (thumb khi tạo đôi khi bị bỏ qua)
        if cover_path:
            set_video_thumbnail(video_id, page_token, cover_path, retries=4, delay=8)
        return video_id

    print(f"\nLỗi đăng video: {json.dumps(resp, ensure_ascii=False, indent=2)}")
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Upload video.mp4 lên Facebook Page")
    parser.add_argument("--dir", default=None, help="outputDir chứa video.mp4 + youtube.md")
    parser.add_argument("--video", default=None, help="Đường dẫn video (mặc định <dir>/video.mp4)")
    parser.add_argument("--metadata", default=None, help="Đường dẫn youtube.md (mặc định <dir>/youtube.md)")
    parser.add_argument("--title", default=None, help="Tiêu đề video (ghi đè youtube.md)")
    parser.add_argument("--description", default=None, help="Mô tả video (ghi đè youtube.md)")
    parser.add_argument("--credentials", default=CRED_FILE)
    parser.add_argument("--reel", action="store_true",
                        help="Đăng dạng Reel (video dọc 9:16) qua endpoint /video_reels")
    parser.add_argument("--thumbnail", default=None,
                        help="Ảnh bìa (cover). Mặc định dùng <dir>/thumbnail.png nếu có, "
                             "nếu không thì trích 1 frame từ video tại --cover-ms.")
    parser.add_argument("--cover-ms", type=int, default=3000, dest="cover_ms",
                        help="Mốc (ms) để trích frame làm ảnh bìa khi không có thumbnail.png. "
                             "Chọn frame CÓ HÌNH ẢNH (không phải card tiêu đề). Mặc định 3000.")
    parser.add_argument("--no-thumbnail", action="store_true",
                        help="Không đặt ảnh bìa (để Facebook tự chọn frame).")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ in nội dung đã resolve, không upload")
    args = parser.parse_args()

    # Tự nhận diện Reel từ script.json (aspect 9:16) nếu chưa truyền --reel
    if not args.reel and args.dir:
        script_json = os.path.join(args.dir, "script.json")
        if os.path.exists(script_json):
            try:
                aspect = json.load(open(script_json, encoding="utf-8")).get("aspect")
                if str(aspect).strip() == "9:16":
                    args.reel = True
            except (ValueError, OSError):
                pass

    if not args.dir and not args.video:
        parser.error("cần --dir hoặc --video")

    video_path = args.video or os.path.join(args.dir, "video.mp4")
    if not os.path.exists(video_path):
        print(f"Lỗi: Không tìm thấy file video: {video_path}")
        sys.exit(1)

    title, description = args.title, args.description
    if title is None or description is None:
        metadata_path = args.metadata or (
            os.path.join(args.dir, "youtube.md") if args.dir else None
        )
        if metadata_path and os.path.exists(metadata_path):
            md_title, md_desc = parse_youtube_md(metadata_path)
            if title is None:
                title = md_title
            if description is None:
                description = md_desc
        elif metadata_path:
            print(f"Lỗi: Không tìm thấy {metadata_path}. Chạy skill create-youtube-content "
                  "trước, hoặc truyền --title/--description.")
            sys.exit(1)

    if not title:
        print("Lỗi: chưa có tiêu đề (thiếu youtube.md hoặc --title).")
        sys.exit(1)

    user_token, page_id = load_credentials(args.credentials)

    tmpdir = tempfile.mkdtemp(prefix="fb_upload_")
    cover_path, cover_src = resolve_cover(args, video_path, tmpdir)

    print("--- Nội dung sẽ dùng để đăng ---")
    print(f"Page ID: {page_id}")
    print(f"Video file: {video_path}")
    print(f"Định dạng: {'Reel (dọc 9:16)' if args.reel else 'Video thường (ngang 16:9)'}")
    print(f"Ảnh bìa: {cover_src}")
    print(f"Title: {title}")
    print(f"Description:\n{description}")
    print("--------------------------------")

    if args.dry_run:
        return

    page_token = get_page_access_token(user_token, page_id)
    if not page_token:
        sys.exit(1)

    if args.reel:
        upload_reel(page_id, page_token, video_path, title, description, cover_path)
    else:
        upload_video(page_id, page_token, video_path, title, description, cover_path)


if __name__ == "__main__":
    main()
