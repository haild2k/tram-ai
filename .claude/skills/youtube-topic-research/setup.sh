#!/usr/bin/env bash
# Tạo venv riêng cho skill (yt-dlp + certifi). Chạy lại để nâng cấp yt-dlp khi YouTube đổi giao diện.
set -e
cd "$(dirname "$0")"
[ -x .venv/bin/python ] || python3 -m venv .venv
.venv/bin/pip install -q -U yt-dlp certifi
.venv/bin/python -c "import yt_dlp;print('yt-dlp', yt_dlp.version.__version__)"
