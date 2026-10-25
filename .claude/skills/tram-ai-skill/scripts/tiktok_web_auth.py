#!/usr/bin/env python3
"""Đăng nhập TikTok kiểu WEB (không PKCE) cho Trạm AI (@tram.ai.vn).
Redirect = trang github.io trong tiktok_credentials.json; trang đó hiện URL có ?code=… để copy.
  python3 tiktok_web_auth.py url              -> in link đăng nhập
  python3 tiktok_web_auth.py complete '<URL>' -> đổi code lấy token, lưu tiktok_token.json
"""
import json, os, secrets, sys, time, urllib.parse, requests
D = os.path.join(os.environ.get("TRAM_AI_CREDS", "/home/haild/haild/Core/Scripts/upload_mxh/tram-ai"), "tiktok")
cred = json.load(open(os.path.join(D, "tiktok_credentials.json")))
PENDING = os.path.join(D, ".tiktok_web_pending.json")
SCOPES = "user.info.basic,video.publish"
if sys.argv[1] == "url":
    state = secrets.token_urlsafe(16)
    json.dump({"state": state}, open(PENDING, "w"))
    print("https://www.tiktok.com/v2/auth/authorize/?" + urllib.parse.urlencode({
        "client_key": cred["client_key"], "response_type": "code", "scope": SCOPES,
        "redirect_uri": cred["redirect_uri"], "state": state}))
else:
    q = urllib.parse.parse_qs(urllib.parse.urlparse(sys.argv[2]).query)
    if "error" in q: sys.exit(f"TikTok báo lỗi: {q}")
    if q.get("state", [""])[0] != json.load(open(PENDING))["state"]: sys.exit("state không khớp")
    r = requests.post("https://open.tiktokapis.com/v2/oauth/token/", headers={"Content-Type": "application/x-www-form-urlencoded"}, data={
        "client_key": cred["client_key"], "client_secret": cred["client_secret"], "code": q["code"][0],
        "grant_type": "authorization_code", "redirect_uri": cred["redirect_uri"]}).json()
    if "access_token" not in r: sys.exit(f"Lỗi đổi token: {r}")
    r["obtained_at"] = int(time.time())
    p = os.path.join(D, "tiktok_token.json"); json.dump(r, open(p, "w"), indent=2); os.chmod(p, 0o600)
    os.remove(PENDING)
    print("OK scope:", r.get("scope"), "open_id:", r.get("open_id", "")[:8] + "…")
