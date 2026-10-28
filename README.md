# Trạm AI

Project sản xuất + đăng video cho kênh **Trạm AI** (tin tức và giải thích về trí
tuệ nhân tạo) lên YouTube, Facebook, TikTok — chạy bằng Claude Code skill.

## Trang công khai (GitHub Pages — KHÔNG đổi tên / xoá)

Google OAuth và TikTok (redirect URI + URL verification) đang trỏ vào các file ở
gốc repo:

- Trang chủ: https://haild2k.github.io/tram-ai/ (`index.html`)
- Chính sách bảo mật: https://haild2k.github.io/tram-ai/privacy.html
- Điều khoản dịch vụ: https://haild2k.github.io/tram-ai/terms.html
- TikTok OAuth callback: https://haild2k.github.io/tram-ai/tiktok-callback.html
- File xác minh TikTok: `tiktok0Lc3bqjcn5qbJjDN4woOpTVpdn7Mwrzc.txt`

## Dựng video

```bash
npm ci                 # Node 22, ffmpeg, Python 3 + pip install -r .claude/skills/tram-ai-skill/scripts/requirements.txt
cp .env.example .env.local
```

Trong Claude Code, mở project này rồi nói:

- **Short 9:16** (đăng luôn): `Làm video Trạm AI về <chủ đề / URL>`
- **Long 16:9** (duyệt rồi mới đăng): `Làm video dài Trạm AI loại 1 | 2 | 3`
  — 1 tin AI tuần · 2 so sánh công cụ AI · 3 chủ đề AI tự chọn

Chi tiết: [.claude/skills/tram-ai-skill/SKILL.md](.claude/skills/tram-ai-skill/SKILL.md).

| Thư mục | Nội dung |
| --- | --- |
| `.claude/skills/tram-ai-skill/` | skill điều phối (short/long), scripts upload + thumbnail + chapters, logo |
| `.claude/skills/tram-ai-template-video/` | skill dựng template động HyperFrames |
| `src/` | pipeline `npm run pipeline -- <outputDir>/script.json` (TTS OmniVoice → render → ghép) |
| `videos/tram-ai/{short,long}/<ngày>/` | video đã dựng (gitignore) |
| `templates/_dyn/` | template sinh theo từng video (gitignore) |

## Credentials

Đặt trong `credentials/` ở gốc project (đã gitignore — **không commit**); override bằng
`TRAM_AI_CREDS=<thư mục>`. Gồm `youtube_client_secret.json`, `youtube_token.pickle`,
`facebook_credentials.json`, `tiktok/tiktok_credentials.json`, `tiktok/tiktok_token.json`. Kiểm tra:

```bash
python3 .claude/skills/tram-ai-skill/scripts/check_platforms.py
```

TTS dùng server OmniVoice từ xa `http://14.178.142.29:13562` (giọng `vira`,
`minh_quan`…). Hiệu ứng âm thanh (SFX) tuỳ chọn: `npm run sfx:download`.
