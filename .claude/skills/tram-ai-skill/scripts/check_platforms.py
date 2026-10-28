#!/usr/bin/env python3
"""Kiểm tra nhanh (chỉ đọc, KHÔNG đăng gì) credentials Trạm AI trên 3 nền tảng.

  python3 .claude/skills/tram-ai-skill/scripts/check_platforms.py

In 1 dòng / nền tảng: ✓ sẵn sàng hoặc ✗ + lý do. Exit code = số nền tảng lỗi.
Credentials: $TRAM_AI_CREDS (mặc định <repo>/credentials).
"""
import datetime
import json
import os
import pickle
import subprocess
import sys

import requests

CREDS = os.environ.get("TRAM_AI_CREDS", os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../../credentials")))
HERE = os.path.dirname(os.path.abspath(__file__))
YT_CHANNEL = "UC-OcFyd7wjGQ69ur92o6Rzg"
FB_PAGE = "1430978420097668"
G = "https://graph.facebook.com/v21.0"


def youtube():
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    p = os.path.join(CREDS, "youtube_token.pickle")
    creds = pickle.load(open(p, "rb"))
    if not creds.valid:
        creds.refresh(Request())
        pickle.dump(creds, open(p, "wb"))
    items = build("youtube", "v3", credentials=creds).channels().list(
        part="snippet", mine=True).execute().get("items", [])
    ids = {c["id"]: c["snippet"]["title"] for c in items}
    if YT_CHANNEL not in ids:
        raise RuntimeError(f"token đang là kênh {ids}, không phải Trạm AI")
    return f"kênh {ids[YT_CHANNEL]} ({YT_CHANNEL})"


def facebook():
    c = json.load(open(os.path.join(CREDS, "facebook_credentials.json")))
    target = c.get("target_page_id", FB_PAGE)
    if c.get("page_access_token"):
        tok = c["page_access_token"]
        page = requests.get(f"{G}/me", params={"access_token": tok, "fields": "id,name"}, timeout=30).json()
        if "error" in page:
            raise RuntimeError(page["error"].get("message"))
        if page.get("id") != target:
            raise RuntimeError(f"page_access_token thuộc Page khác ({page.get('name')})")
    else:
        tok = c["user_access_token"]
        pages = requests.get(f"{G}/me/accounts", params={"access_token": tok}, timeout=30).json()
        if "error" in pages:
            raise RuntimeError(pages["error"].get("message"))
        page = next((p for p in pages.get("data", []) if p["id"] == target), None)
        if not page:
            raise RuntimeError("token không quản lý Page Trạm AI")
    d = requests.get(f"{G}/debug_token", params={"input_token": tok, "access_token": tok},
                     timeout=30).json().get("data", {})
    if "pages_manage_posts" not in d.get("scopes", []):
        raise RuntimeError("token thiếu quyền pages_manage_posts")
    # expires_at = 0 nghĩa là token không hết hạn; khi đó giới hạn thật là data_access_expires_at
    exp = d.get("expires_at") or d.get("data_access_expires_at") or 0
    left = (datetime.datetime.fromtimestamp(exp) - datetime.datetime.now()).days if exp else None
    warn = f" ⚠ còn {left} ngày — gia hạn sớm" if left is not None and left < 10 else ""
    return f"Page {page['name']} · token hết hạn {datetime.date.fromtimestamp(exp) if exp else 'không'}{warn}"


def tiktok():
    r = subprocess.run([sys.executable, os.path.join(HERE, "upload_tiktok.py"), "--check"],
                       capture_output=True, text=True, timeout=60)
    out = (r.stdout + r.stderr).strip().splitlines()
    if r.returncode != 0 or not out or not out[-1].startswith("✓"):
        raise RuntimeError(" ".join(out[-3:]) or f"exit {r.returncode}")
    return out[-1].lstrip("✓ ").strip()


def main():
    bad = 0
    for name, fn in (("YouTube", youtube), ("Facebook", facebook), ("TikTok", tiktok)):
        try:
            print(f"✓ {name:8} {fn()}")
        except Exception as e:  # noqa: BLE001 — báo lỗi từng nền tảng, không dừng cả loạt
            bad += 1
            print(f"✗ {name:8} {type(e).__name__}: {e}")
    sys.exit(bad)


if __name__ == "__main__":
    main()
