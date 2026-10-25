#!/usr/bin/env python3
"""Đăng video.mp4 lên TikTok @tram.ai.vn (Trạm AI) qua Content Posting API (Direct Post).

Bản copy của upload-tiktok-video cho kênh Trạm AI. Credentials nằm NGOÀI repo:
  $TRAM_AI_CREDS/tiktok/tiktok_credentials.json   client_key/secret + redirect_uri (github.io)
  $TRAM_AI_CREDS/tiktok/tiktok_token.json         token (tự refresh)
(TRAM_AI_CREDS mặc định /home/haild/haild/Core/Scripts/upload_mxh/tram-ai)

App TikTok "Trạm AI" đang ở Sandbox (chưa audit) → chỉ đăng được SELF_ONLY.
TikTok KHÔNG nhận redirect localhost cho app này → đăng nhập lại (khi refresh
token hết hạn) bằng luồng web 2 bước:
  python3 tiktok_web_auth.py url
  python3 tiktok_web_auth.py complete '<URL trang callback>'

Dùng:
  python3 upload_tiktok.py --dir <outputDir> --dry-run
  python3 upload_tiktok.py --dir <outputDir> --cover-ms 12000
  python3 upload_tiktok.py --video path/to/video.mp4 --caption "Nội dung #tramai"
"""

import argparse
import hashlib
import json
import os
import re
import secrets
import sys
import time
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests

try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

CREDS_DIR = os.path.join(os.environ.get("TRAM_AI_CREDS", "/home/haild/haild/Core/Scripts/upload_mxh/tram-ai"), "tiktok")
EXPECT_USERNAME = "tram.ai.vn"
CRED_FILE = os.path.join(CREDS_DIR, "tiktok_credentials.json")
TOKEN_FILE = os.path.join(CREDS_DIR, "tiktok_token.json")
PENDING_FILE = os.path.join(CREDS_DIR, ".tiktok_auth_pending.json")
SCOPES = "user.info.basic,video.publish"

AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/"
TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
API = "https://open.tiktokapis.com/v2"

MAX_CHUNK = 64 * 1024 * 1024  # 64 MB
MAX_CAPTION = 2200


# --------------------------------------------------------------------------- #
# Credentials & token
# --------------------------------------------------------------------------- #
def load_credentials(path):
    if not os.path.exists(path):
        sys.exit(
            f"Lỗi: không tìm thấy '{path}'.\n"
            "Tạo file JSON với client_key / client_secret / redirect_uri "
            "(xem docstring đầu file)."
        )
    cred = json.load(open(path, encoding="utf-8"))
    for k in ("client_key", "client_secret", "redirect_uri"):
        if not cred.get(k):
            sys.exit(f"Lỗi: '{path}' thiếu trường '{k}'.")
    return cred


def _save_token(tok):
    tok = dict(tok)
    tok["obtained_at"] = int(time.time())
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        json.dump(tok, f, indent=2)


def _run_callback_server(redirect_uri, timeout=1800, expected_state=None):
    parsed = urllib.parse.urlparse(redirect_uri)
    host = parsed.hostname or "localhost"
    port = parsed.port or 80
    result = {}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def do_GET(self):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            st = q.get("state", [None])[0]
            code = q.get("code", [None])[0]
            print(f"[callback] GET {self.path[:120]}  -> code={bool(code)} state={st}",
                  flush=True)
            if code and (expected_state is None or st == expected_state):
                result["code"] = code
                result["state"] = st
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            msg = "Đã nhận mã xác thực. Quay lại terminal." if result.get("code") \
                else "Chưa nhận được code hợp lệ, xem terminal."
            self.wfile.write(msg.encode("utf-8"))

    try:
        srv = HTTPServer((host, port), Handler)
    except OSError as e:
        print(f"Không mở được local server {host}:{port} ({e}). Dùng dán tay.")
        return result
    srv.timeout = 5
    deadline = time.time() + timeout
    while time.time() < deadline and not result.get("code"):
        try:
            srv.handle_request()
        except Exception as e:  # đừng để 1 request hỏng làm thoát vòng lặp
            print(f"[callback] lỗi xử lý request (bỏ qua): {e!r}", flush=True)
    print(f"[callback] kết thúc lắng nghe, có code: {bool(result.get('code'))}",
          flush=True)
    return result


def _parse_code(value):
    """Nhận URL redirect đầy đủ hoặc riêng mã code -> (code, state)."""
    value = value.strip()
    if "code=" in value or "state=" in value:
        q = urllib.parse.parse_qs(urllib.parse.urlparse(value).query)
        return q.get("code", [None])[0], q.get("state", [None])[0]
    return (value or None), None


def _make_pkce():
    state = secrets.token_urlsafe(16)
    # TikTok yêu cầu code_verifier chỉ gồm [A-Za-z0-9-._~], dài 43-128
    verifier = "".join(
        secrets.choice(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
        )
        for _ in range(64)
    )
    # TikTok Desktop: code_challenge = HEX(SHA256(verifier))  (KHÔNG phải base64url)
    challenge = hashlib.sha256(verifier.encode()).hexdigest()
    return state, verifier, challenge


def build_auth_url(cred):
    state, verifier, challenge = _make_pkce()
    with open(PENDING_FILE, "w", encoding="utf-8") as f:
        json.dump({"state": state, "code_verifier": verifier}, f)
    params = {
        "client_key": cred["client_key"],
        "response_type": "code",
        "scope": SCOPES,
        "redirect_uri": cred["redirect_uri"],
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    return AUTH_BASE + "?" + urllib.parse.urlencode(params)


def complete_auth(cred, redirected_value):
    if not os.path.exists(PENDING_FILE):
        sys.exit(f"Chưa có phiên đăng nhập chờ ({PENDING_FILE}). Chạy --auth-url trước.")
    pend = json.load(open(PENDING_FILE, encoding="utf-8"))
    code, state = _parse_code(redirected_value)
    if not code:
        sys.exit("Không tách được 'code' từ giá trị bạn cung cấp.")
    if state and state != pend["state"]:
        sys.exit("state không khớp — nghi ngờ CSRF, huỷ.")
    tok = exchange_code(cred, code, pend["code_verifier"])
    try:
        os.remove(PENDING_FILE)
    except OSError:
        pass
    return tok


def exchange_code(cred, code, code_verifier):
    # code đã được parse_qs URL-decode sẵn; TikTok cần bản đã decode, GIỮ NGUYÊN
    # mọi ký tự (kể cả '*' ở cuối). KHÔNG cắt xén.
    data = {
        "client_key": cred["client_key"],
        "client_secret": cred["client_secret"],
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": cred["redirect_uri"],
        "code_verifier": code_verifier,
    }
    print(f"[token] đổi code (len={len(code)}) lúc {time.strftime('%H:%M:%S')} ...",
          flush=True)
    r = requests.post(
        TOKEN_URL,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    j = r.json()
    if "access_token" not in j:
        sys.exit(
            "Lỗi đổi authorization code lấy token: "
            f"{j}\n"
            "- 'Authorization code is expired': code TikTok sống rất ngắn / dùng 1 "
            "lần → Authorize lại và làm thật nhanh, đừng mở lại tab cũ.\n"
            "- Nếu vẫn lỗi dù nhanh: kiểm tra Content Posting API đã được thêm vào "
            "sandbox chưa, và tài khoản đã ở Target users chưa."
        )
    _save_token(j)
    return j


def refresh_access_token(cred, tok):
    data = {
        "client_key": cred["client_key"],
        "client_secret": cred["client_secret"],
        "grant_type": "refresh_token",
        "refresh_token": tok.get("refresh_token", ""),
    }
    r = requests.post(TOKEN_URL, data=data, timeout=30)
    j = r.json()
    if "access_token" not in j:
        return None
    _save_token(j)
    return j


def authorize(cred):
    """Flow tương tác: in URL, chờ redirect ở local server, fallback dán tay."""
    state, verifier, challenge = _make_pkce()
    params = {
        "client_key": cred["client_key"],
        "response_type": "code",
        "scope": SCOPES,
        "redirect_uri": cred["redirect_uri"],
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    url = AUTH_BASE + "?" + urllib.parse.urlencode(params)
    print("\nMở URL sau trong trình duyệt để cấp quyền cho app TikTok:\n")
    print(url + "\n")
    print("(Đóng hết tab TikTok/localhost cũ trước khi mở, tránh dùng code cũ.)\n")

    code = None
    ru = cred["redirect_uri"]
    if ru.startswith("http://localhost") or ru.startswith("http://127.0.0.1"):
        res = _run_callback_server(ru, expected_state=state)
        if res.get("code"):
            if res.get("state") != state:
                sys.exit("state không khớp — nghi ngờ CSRF, huỷ.")
            code = res["code"]

    if not code:
        try:
            pasted = input("Dán URL bạn bị redirect tới (hoặc chỉ mã 'code'): ")
        except EOFError:
            sys.exit(
                "Không có stdin để dán code. Dùng 2 bước:\n"
                "  python3 upload_tiktok.py --auth-url\n"
                "  python3 upload_tiktok.py --auth-complete '<URL redirect>'"
            )
        code, st = _parse_code(pasted)
        if st and st != state:
            sys.exit("state không khớp — nghi ngờ CSRF, huỷ.")

    if not code:
        sys.exit("Không lấy được authorization code.")
    return exchange_code(cred, code, verifier)


def get_valid_token(cred):
    if os.path.exists(TOKEN_FILE):
        tok = json.load(open(TOKEN_FILE, encoding="utf-8"))
        age = time.time() - tok.get("obtained_at", 0)
        if age < tok.get("expires_in", 0) - 120:
            return tok
        refreshed = refresh_access_token(cred, tok)
        if refreshed:
            return refreshed
    sys.exit(
        "TikTok: refresh token hết hạn / chưa đăng nhập. Đăng nhập lại tài khoản tram.ai.vn:\n"
        "  python3 .claude/skills/tram-ai-skill/scripts/tiktok_web_auth.py url\n"
        "  python3 .claude/skills/tram-ai-skill/scripts/tiktok_web_auth.py complete '<URL callback>'"
    )


# --------------------------------------------------------------------------- #
# Caption
# --------------------------------------------------------------------------- #
def _parse_tiktok_md(text):
    out = []
    for ln in text.splitlines():
        s = ln.rstrip()
        st = s.strip()
        if st.startswith("## "):  # section header -> bỏ
            continue
        if st.startswith("# "):
            s = st[2:].strip()
        out.append(s)
    return "\n".join(out).strip()[:MAX_CAPTION]


def _caption_from_youtube_md(text):
    tm = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    title = tm.group(1).strip() if tm else ""
    hashtags = ""
    for ln in text.splitlines():
        st = ln.strip()
        if st.startswith("#") and not st.startswith("# ") and " #" in st:
            hashtags = st
            break
    cap = title
    if hashtags:
        cap += "\n\n" + hashtags
    return cap.strip()[:MAX_CAPTION]


def resolve_caption(args):
    if args.caption:
        return args.caption.strip()[:MAX_CAPTION]
    if args.dir:
        p = os.path.join(args.dir, "tiktok.md")
        if os.path.exists(p):
            return _parse_tiktok_md(open(p, encoding="utf-8").read())
        y = os.path.join(args.dir, "youtube.md")
        if os.path.exists(y):
            return _caption_from_youtube_md(open(y, encoding="utf-8").read())
    sys.exit(
        "Không có nội dung caption. Dùng --caption \"...\" hoặc tạo "
        "<dir>/tiktok.md (hoặc <dir>/youtube.md)."
    )


# --------------------------------------------------------------------------- #
# Content Posting API
# --------------------------------------------------------------------------- #
def _auth_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json; charset=UTF-8",
    }


def _check(j, what):
    err = j.get("error", {})
    if err and err.get("code") not in ("ok", None, ""):
        sys.exit(f"{what} lỗi: {err}")
    return j


def query_creator_info(token):
    r = requests.post(
        f"{API}/post/publish/creator_info/query/",
        headers=_auth_headers(token),
        timeout=30,
    )
    return _check(r.json(), "creator_info")["data"]


def _chunking(size):
    if size <= MAX_CHUNK:
        return size, 1
    chunk = MAX_CHUNK
    total = size // chunk  # chunk cuối gộp phần dư
    return chunk, total


def init_upload(token, caption, privacy, size, disable_comment, disable_duet,
                disable_stitch, cover_ms=1000):
    chunk_size, total = _chunking(size)
    body = {
        "post_info": {
            "title": caption,
            "privacy_level": privacy,
            "disable_comment": disable_comment,
            "disable_duet": disable_duet,
            "disable_stitch": disable_stitch,
            "video_cover_timestamp_ms": int(cover_ms),
        },
        "source_info": {
            "source": "FILE_UPLOAD",
            "video_size": size,
            "chunk_size": chunk_size,
            "total_chunk_count": total,
        },
    }
    r = requests.post(
        f"{API}/post/publish/video/init/",
        headers=_auth_headers(token),
        json=body,
        timeout=30,
    )
    data = _check(r.json(), "video/init")["data"]
    return data["publish_id"], data["upload_url"], chunk_size, total


def put_video(upload_url, path, size, chunk_size, total):
    with open(path, "rb") as f:
        for i in range(total):
            start = i * chunk_size
            end = size - 1 if i == total - 1 else start + chunk_size - 1
            f.seek(start)
            payload = f.read(end - start + 1)
            headers = {
                "Content-Type": "video/mp4",
                "Content-Length": str(len(payload)),
                "Content-Range": f"bytes {start}-{end}/{size}",
            }
            r = requests.put(upload_url, headers=headers, data=payload, timeout=300)
            if r.status_code not in (200, 201, 206):
                sys.exit(f"Upload chunk {i + 1}/{total} lỗi: {r.status_code} {r.text}")
            print(f"  đã tải chunk {i + 1}/{total}")


def poll_status(token, publish_id):
    for _ in range(60):
        r = requests.post(
            f"{API}/post/publish/status/fetch/",
            headers=_auth_headers(token),
            json={"publish_id": publish_id},
            timeout=30,
        )
        d = _check(r.json(), "status/fetch").get("data", {})
        st = d.get("status")
        if st == "PUBLISH_COMPLETE":
            return d
        if st == "FAILED":
            sys.exit(f"TikTok báo đăng THẤT BẠI: {d}")
        print(f"  trạng thái: {st} ...")
        time.sleep(5)
    print("Hết thời gian chờ xử lý — kiểm tra trong app TikTok (mục Nội dung).")
    return {}


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser(description="Đăng video lên TikTok (Content Posting API)")
    ap.add_argument("--dir", default=None, help="outputDir chứa video.mp4 + tiktok.md/youtube.md")
    ap.add_argument("--video", default=None, help="Đường dẫn video (mặc định <dir>/video.mp4)")
    ap.add_argument("--caption", default=None, help="Caption trực tiếp (ưu tiên hơn file)")
    ap.add_argument("--cover-ms", type=int, default=1000, dest="cover_ms",
                    help="Mốc thời gian (ms) lấy frame làm ảnh bìa TikTok. "
                         "Chọn frame CÓ HÌNH ẢNH (không phải card tiêu đề/nền trơn). Mặc định 1000.")
    ap.add_argument("--privacy", default="SELF_ONLY",
                    choices=["SELF_ONLY", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "PUBLIC_TO_EVERYONE"],
                    help="Mặc định SELF_ONLY (bắt buộc với app chưa audit)")
    ap.add_argument("--credentials", default=CRED_FILE)
    ap.add_argument("--dry-run", action="store_true", help="Chỉ in caption/video đã resolve, không gọi API")
    ap.add_argument("--check", action="store_true", help="Chỉ kiểm tra token + tài khoản rồi thoát")
    args = ap.parse_args()

    if args.check:
        cred = load_credentials(args.credentials)
        info = query_creator_info(get_valid_token(cred)["access_token"])
        print(f"✓ TikTok @{info.get('creator_username', '?')} · privacy cho phép: "
              f"{info.get('privacy_level_options')} · max {info.get('max_video_post_duration_sec')}s")
        return

    video_path = args.video or (os.path.join(args.dir, "video.mp4") if args.dir else None)
    if not video_path or not os.path.exists(video_path):
        sys.exit(f"Lỗi: không tìm thấy video: {video_path}")

    caption = resolve_caption(args)
    size = os.path.getsize(video_path)

    print("--- Nội dung sẽ đăng lên TikTok ---")
    print(f"Video   : {video_path} ({size / 1_048_576:.1f} MB)")
    print(f"Privacy : {args.privacy}")
    print(f"Cover   : frame lúc {args.cover_ms} ms")
    print(f"Caption :\n{caption}")
    print("-----------------------------------")

    if args.dry_run:
        return

    cred = load_credentials(args.credentials)
    tok = get_valid_token(cred)
    access_token = tok["access_token"]

    info = query_creator_info(access_token)
    print(f"Tài khoản TikTok: @{info.get('creator_username', '?')}")
    if info.get("creator_username") != EXPECT_USERNAME:
        sys.exit(f"Lỗi: token đang là @{info.get('creator_username')}, KHÔNG phải @{EXPECT_USERNAME}. Dừng, không đăng.")
    allowed = info.get("privacy_level_options", [])
    if allowed and args.privacy not in allowed:
        sys.exit(
            f"privacy '{args.privacy}' không được phép cho tài khoản này. "
            f"Các lựa chọn hợp lệ: {allowed}"
        )
    max_dur = info.get("max_video_post_duration_sec")
    if max_dur:
        print(f"(Giới hạn thời lượng cho phép: {max_dur}s)")

    publish_id, upload_url, chunk_size, total = init_upload(
        access_token,
        caption,
        args.privacy,
        size,
        disable_comment=bool(info.get("comment_disabled", False)),
        disable_duet=bool(info.get("duet_disabled", False)),
        disable_stitch=bool(info.get("stitch_disabled", False)),
        cover_ms=args.cover_ms,
    )
    print(f"publish_id: {publish_id}")
    print("Đang tải video lên TikTok...")
    put_video(upload_url, video_path, size, chunk_size, total)

    print("Đang chờ TikTok xử lý...")
    poll_status(access_token, publish_id)

    print("\n✓ Đã đưa video lên TikTok.")
    if args.privacy == "SELF_ONLY":
        print("✓ Chế độ: RIÊNG TƯ (chỉ bạn xem được — app Trạm AI còn ở Sandbox, chưa audit).")
    print("✓ Mở app TikTok > Hồ sơ để kiểm tra / đổi quyền riêng tư nếu cần.")


if __name__ == "__main__":
    main()
