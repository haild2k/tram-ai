---
name: tram-ai-skill
description: Sản xuất video tiếng Việt cho kênh TRẠM AI (tin tức + giải thích về trí tuệ nhân tạo) rồi đăng lên CẢ 3 nền tảng YouTube + Facebook + TikTok, dùng credentials RIÊNG của Trạm AI. Đồng thời hỗ trợ tạo phiên bản tiếng Anh bằng phụ đề .srt và voice audio để phục vụ upload lên YouTube Studio. Hai chế độ — SHORT 9:16 (~90–120s, 1 tin/1 chủ đề AI: nghiên cứu mở rộng nhiều báo → template động → TTS server từ xa → tự đăng luôn, không duyệt) và LONG 16:9 (6–10 phút, có chương, tổng hợp + so sánh tin AI trong N ngày; research đa nguồn → bảng so sánh → kịch bản nhiều chương → DỪNG CHỜ DUYỆT → mới đăng). Logo, màu, footer, outro, CTA, hashtag theo thương hiệu Trạm AI. Trigger khi user muốn "làm video Trạm AI", "đăng kênh Trạm AI", "làm short AI", "video tin AI", "tin AI tuần này", "làm video dài Trạm AI", "so sánh công cụ AI", "tram ai skill". Input: chủ đề / URL / nội dung (short) hoặc loại video dài (1 tin AI tuần · 2 so sánh công cụ AI · 3 chủ đề AI tự chọn).
---

# Trạm AI — sản xuất + đăng 3 nền tảng (tram-ai-skill)

Skill điều phối cho kênh **Trạm AI** — project riêng, chỉ phục vụ kênh này.
Quy trình dựng video lấy từ 3 tài liệu nền trong [reference/base/](reference/base/)
(`media-skill.md`, `media-remote-skill.md`, `media-long-remote-skill.md` — bản đã
đổi thương hiệu sang Trạm AI) + skill con `tram-ai-template-video`:

| Chế độ | Khi nào | Làm theo | Duyệt trước khi đăng |
| --- | --- | --- | --- |
| **SHORT** (mặc định) | 1 tin / 1 chủ đề / 1 URL, user không nói "video dài" | [reference/short.md](reference/short.md) (nền: `base/media-remote-skill.md`) | **Không** — render xong đăng luôn |
| **LONG** | user nói "video dài", "tổng hợp tuần", "so sánh", "loại 1/2/3" | [reference/long.md](reference/long.md) (nền: `base/media-long-remote-skill.md`) | **Bắt buộc** — dừng chờ user duyệt |

Mơ hồ (vd chỉ "làm video Trạm AI về GPT-6") → SHORT. Đọc file reference của
chế độ đã chọn **từ đầu đến cuối** rồi mới làm; các mục bên dưới áp dụng cho cả
hai chế độ và **thắng** tài liệu nền khi mâu thuẫn — đặc biệt: tài liệu nền ghi
"TikTok tạm dừng đăng" / gọi `create-youtube-content`, `upload-youtube-video`,
`upload-facebook-video`, `upload-tiktok-video` → ở project này **bỏ qua**, dùng
mục **Kịch bản đăng** + **Đăng 3 nền tảng** bên dưới (CÓ đăng TikTok).

## Kênh & định vị

- **Trạm AI** — "trạm dừng" để người Việt cập nhật và hiểu về trí tuệ nhân tạo:
  tin AI mới (mô hình, sản phẩm, công ty, chính sách), giải thích công nghệ,
  so sánh công cụ, ứng dụng AI vào học tập / công việc.
- Giọng: rõ ràng, khách quan, dễ hiểu với người không chuyên. Thuật ngữ tiếng
  Anh giữ nguyên nhưng giải thích 1 vế ngắn lần đầu xuất hiện ("mô hình ngôn
  ngữ lớn, tức LLM"). **Không** thổi phồng ("AI sắp thay thế tất cả"), không giật
  tít sai, không quảng cáo/kêu gọi mua; benchmark và giá phải có nguồn.
- Mọi số liệu (điểm benchmark, giá, ngày ra mắt, tham số) chỉ lấy từ nguồn đã
  ghi (`research.md` / `content-enriched.txt`). Tin đồn / rò rỉ → nói rõ "chưa
  xác nhận".

## Thương hiệu

| Chỗ dùng | Giá trị Trạm AI |
| --- | --- |
| `metadata.channel` trong `script.json` | `"Trạm AI"` |
| `foot_left` (hook + cảnh có footer) | `"Trạm AI"` |
| Outro `brand` / `logo` | `"Trạm AI"` / `"assets/logo.png"` — copy `.claude/skills/tram-ai-skill/assets/logo-round.png` (logo tròn, nền ngoài hình tròn đã xoá — trong suốt) vào `<TPL>/assets/logo.png`. KHÔNG dùng `assets/logo.png` gốc (nền vuông) cho outro |
| Outro `tagline` | mời theo dõi để cập nhật AI mỗi ngày (short) / bản tin AI tuần sau (long) |
| Outro `socials[]` | `{plat:"YouTube",handle:"youtube.com/@tram-ai"}`, `{plat:"TikTok",handle:"tiktok.com/@tram.ai.vn"}`, `{plat:"Facebook",handle:"Trạm AI"}` |
| Màu template (`--bg1 --bg2 --accent1 --accent2`) | `#0e1230` · `#1d1d4f` · `#6f8cff` (xanh tím mạch điện) · `#f2b254` (vàng ánh đèn) — lấy từ logo |
| Giọng đọc TTS (`voice.name`) | **luôn `minh_quan`** — cả short lẫn long, mọi tông nội dung. KHÔNG chọn giọng theo bảng tông của tài liệu nền (`vira`/`dori`/`jett`/`kaci`). Server `/health` không có `minh_quan` → báo user và dừng, không tự đổi giọng khác |
| Thumbnail | `scripts/compose_thumbnail.py` của skill này (thanh accent vàng Trạm AI) |
| Hashtag tên kênh | `#tramai` (YouTube lowercase) · `#TramAI` (Facebook/TikTok) |
| Ảnh có logo/branding của **chính Trạm AI** | KHÔNG crop |

Khối CTA cuối description (YouTube + Facebook) — đúng nguyên văn, đúng 3 link:

```
Theo dõi Trạm AI để cập nhật trí tuệ nhân tạo mỗi ngày:
👉 YouTube: https://www.youtube.com/@tram-ai
👉 TikTok: https://www.tiktok.com/@tram.ai.vn
👉 Facebook: https://www.facebook.com/tram.ai.channel
```

(Câu mở có thể đổi cho hợp ngữ cảnh; dòng bắt đầu bằng `Theo dõi Trạm AI` phải
giữ — `scripts/chapters.py --inject` chèn mốc thời gian ngay trước dòng này.)

**Nguồn tham khảo — giữ tối thiểu**: footer cảnh chỉ `Nguồn: <tên>`, mô tả
YouTube/Facebook chỉ 1 dòng `Nguồn tham khảo: <tên 1>, <tên 2>, <tên 3>` (tên
báo/hãng, không URL, ≤ 3 tên). Danh sách nguồn đầy đủ chỉ nằm trong `research.md`.

## Credentials (ngoài repo — KHÔNG commit)

Thư mục `TRAM_AI_CREDS = /home/haild/haild/Core/Scripts/upload_mxh/tram-ai`:

| Nền tảng | File | Tài khoản | Ghi chú |
| --- | --- | --- | --- |
| YouTube | `youtube_client_secret.json`, `youtube_token.pickle` | kênh **Trạm AI** `UC-OcFyd7wjGQ69ur92o6Rzg` (@tram-ai) | app Google đã publish → refresh token không hết hạn 7 ngày |
| Facebook | `facebook_credentials.json` | Page **Trạm AI** `1430978420097668` | user token dài hạn, quyền data hết hạn ~22/01/2027 |
| TikTok | `tiktok/tiktok_credentials.json`, `tiktok/tiktok_token.json` | **@tram.ai.vn** | app ở **Sandbox** → chỉ đăng **SELF_ONLY** (riêng tư) tới khi TikTok duyệt app |

**Bước 0 của mọi lần chạy** (trước cả research, mất ~5s):

```bash
python3 .claude/skills/tram-ai-skill/scripts/check_platforms.py
```

- Cả 3 dòng `✓` → đi tiếp.
- Có dòng `✗` → báo user dòng đó, **vẫn làm video** và đăng các nền tảng còn
  lại; nền tảng lỗi ghi ✗ ở bảng kết quả. Cách sửa:
  - YouTube lỗi token → đăng nhập lại: chạy thật (không `--dry-run`)
    `upload_youtube.py --dir <outputDir>` ở chế độ nền; script mở trang chờ ở
    cổng 8090 và in link Google → gửi link cho user mở trên máy này, chọn
    **kênh Trạm AI**. Script tự chặn nếu đăng nhập nhầm kênh khác.
  - Facebook hết hạn / thiếu quyền → xin user User Token mới (Graph API Explorer,
    app **Trạm AI**, chọn *User Token*, quyền `pages_show_list pages_manage_posts
    pages_read_engagement`), đổi sang token dài hạn bằng `fb_exchange_token` với
    `app_id` + `secret_key` trong `node.md`, ghi vào `facebook_credentials.json`.
  - TikTok hết hạn → `python3 .claude/skills/tram-ai-skill/scripts/tiktok_web_auth.py url`
    → user mở (ẩn danh, tài khoản tram.ai.vn) → dán URL trang callback →
    `tiktok_web_auth.py complete '<URL>'`. (TikTok KHÔNG nhận redirect localhost.)

## Lưu trữ

`videos/tram-ai/short/<YYYY-MM-DD>/<slug>-<timestamp>/` và
`videos/tram-ai/long/<YYYY-MM-DD>/<slug>-<timestamp>/` (dựng tạm ở
`videos/_render/…` như pipeline gốc rồi `mv` sang). `videos/` đã gitignore.

## Kịch bản đăng (cả hai chế độ)

Skill tự viết 3
file trong `outputDir`, chỉ từ `script.json` (+ `research.md` cho số liệu), không bịa.

**`youtube.md`** (parse bởi `upload_youtube.py`: title = dòng `#` đầu, mục
`## Mô tả (Description)`, `## Tags`):

```markdown
# <title>

## Mô tả (Description)
<1–2 câu hook>

<tóm tắt 2–4 câu (short) / 2–4 đoạn (long), viết lại tự nhiên>

Nguồn tham khảo: <tên 1>, <tên 2>, <tên 3>

<khối CTA Trạm AI ở trên>

<dòng hashtag>

## Tags
<tag1, tag2, …>

## Ghim comment gợi ý
<1 câu hỏi mở, vd "Bạn đang dùng công cụ AI nào nhiều nhất?">
```

- Title: short ≤ 65 ký tự; long ≤ 100 ký tự và nêu đủ tên các mục nổi bật.
- **CẤM tag/hashtag chung chung, không gắn với nội dung** (ở cả 3 nền tảng):
  `#shorts #trending #xuhuongyoutube #trend #trendingshorts #xuhuong #fyp #viral
  #foryou #reels`… và mọi biến thể. Chúng không giúp người xem tìm đúng video.
  Thắng mọi chỉ thị "luôn có `#shorts` / `trendingshorts` / `#xuhuong #fyp`" của
  tài liệu nền. (YouTube tự nhận Short theo khung dọc ≤ 3 phút; không cần `#shorts`.)
- Hashtag (lowercase, không dấu), **3–6 cái, cụ thể theo nội dung**: tên sản
  phẩm/mô hình (`#gpt61terra`), hãng (`#openai`), sản phẩm liên quan (`#chatgpt`),
  1–2 chủ đề rộng hơn nhưng vẫn đúng mảng (`#trituenhantao`, `#tinai`) →
  `#tramai` cuối. Long: tag bản tin (`#tinai #tinaituan`) + tên các mục nổi bật;
  **tổng ≤ 10**.
- Tags 12–20, lowercase, ≤ 480 ký tự, **chỉ từ khoá cụ thể** người xem thật sự
  gõ để tìm nội dung này: tên mô hình/sản phẩm (nhiều cách viết: `gpt-6.1 terra,
  gpt 6.1 terra`), hãng, tính năng chính trong video (`computer use, giá api`),
  câu tìm kiếm tiếng Việt (`gpt-6.1 terra là gì, openai ra mô hình mới`), mảng
  chủ đề (`tin ai, trí tuệ nhân tạo`) → `trạm ai, tram ai` cuối.

**`facebook.md`** — cùng cấu trúc (`#` title + `## Mô tả (Description)`):
short = Reel (hook 1–2 câu, ngắn); long = video thường (dài hơn, có mốc chương).
Hashtag 3–5: chủ đề trước, `#TramAI` gần cuối. CTA đúng khối Trạm AI.

**`tiktok.md`** — caption = mọi dòng không bắt đầu bằng `## `, ≤ 2200 ký tự:

```markdown
# <hook mạnh nhất, ≤ 150 ký tự, tối đa 1 emoji>

<tuỳ chọn 1 câu chốt; long: "Bản đầy đủ có trên YouTube Trạm AI.">

#<sản phẩm> #<hãng> #<chủ đề> #TramAI
```

3–5 hashtag cụ thể theo nội dung (KHÔNG `#xuhuong #fyp` hay tag chung chung khác),
`#TramAI` cuối cùng.

Tự kiểm tra: 3 file tồn tại; CTA đúng 3 link Trạm AI, không có link/kênh nào
khác; hashtag đúng thứ tự.

## Bộ file YouTube Studio (phụ đề VI/EN + giọng EN) — LUÔN sinh

Video đăng bằng tiếng Việt, nhưng YouTube có thêm phụ đề + bản âm thanh tiếng
Anh. Sau khi render xong (short lẫn long), luôn sinh thư mục con
`<outputDir>/youtube-studio/`:

| File | Nội dung |
| --- | --- |
| `scenes.json` | nguồn: list `{id, vi, en, en_tts}` mỗi cảnh — `vi` phụ đề Việt (số dạng đẹp, KHÔNG dùng `voiceText` đọc-ra-chữ), `en` phụ đề Anh, `en_tts` lời đọc Anh (số viết ra chữ, `Trạm AI` → `Tram AI`) |
| `subtitles_vi.srt` · `subtitles_en.srt` | phụ đề có mốc thời gian, khớp từng cảnh |
| `audio_en.mp3` | giọng đọc tiếng Anh, giọng `minh_quan`, dài đúng bằng `video.mp4` |
| `metadata_en.md` | tiêu đề (`#`) + mô tả tiếng Anh (dịch `youtube.md`, giữ khối CTA 3 link, hashtag tiếng Anh cụ thể) |
| `README.md` | hướng dẫn upload YouTube Studio (bên dưới) |
| `voice_en/` | lời Anh từng cảnh (trung gian) |

Cách làm: viết `scenes.json` (dịch sát nghĩa, không thêm số liệu ngoài
`script.json`); `en_tts` phải **ngắn hơn** lời Việt — tiếng Anh ~3,2 từ/giây,
mỗi cảnh ≤ `3,2 × (thời lượng cảnh − 0,4)` từ. Rồi chạy:

```bash
python3 .claude/skills/tram-ai-skill/scripts/make_youtube_studio.py --dir <outputDir>
```

Script đo mốc cảnh từ `clips/scene-*-fit.mp4`, gọi TTS remote (`minh_quan`), đặt
lời Anh đúng đầu mỗi cảnh, tăng tốc nhẹ (≤ ×1,2) nếu hơi dài, ghép thành
`audio_en.mp3` và sinh 2 file `.srt`. Thoát mã 1 + `CẢNH BÁO <id>` khi cảnh nào
cần > ×1,2 → rút gọn `en_tts` cảnh đó rồi chạy lại (TTS cũ được cache trong
`voice_en/*.raw.mp3`; xoá file raw của cảnh đã sửa để sinh lại).

Upload trong YouTube Studio (ghi vào `README.md`):
1. Phụ đề → dòng **Tiếng Việt** → Tải tệp lên → *Có thời gian* → `subtitles_vi.srt`.
2. **Thêm ngôn ngữ** → Tiếng Anh: tải `subtitles_en.srt`; dán tiêu đề + mô tả từ `metadata_en.md`.
3. Chỉnh sửa video → **Bản âm thanh** → Thêm → Tiếng Anh → `audio_en.mp3`.

## Đăng 3 nền tảng (sau Bước 0 ✓; long chỉ sau khi user duyệt)

Chạy từ gốc repo, lần lượt, **mỗi lệnh chạy `--dry-run` trước** để soát metadata,
rồi chạy thật. Lỗi 1 nền tảng → in nguyên lỗi, vẫn đăng nền tảng còn lại.

```bash
T=.claude/skills/tram-ai-skill/scripts
# 1. YouTube — public, tự gắn thumbnail.png, tự kiểm tra đúng kênh Trạm AI
python3 $T/upload_youtube.py --dir <outputDir> --dry-run
python3 $T/upload_youtube.py --dir <outputDir>
# 2. Facebook — Page Trạm AI; 9:16 tự thành Reel, 16:9 video thường
python3 $T/upload_facebook.py --dir <outputDir> --metadata <outputDir>/facebook.md \
    --cover-ms <COVER_MS> --dry-run
#    (bỏ --dry-run để đăng thật; 9:16 mà dry-run không hiện "Định dạng: Reel" → thêm --reel)
# 3. TikTok — @tram.ai.vn, caption từ tiktok.md
python3 $T/upload_tiktok.py --dir <outputDir> --cover-ms <COVER_MS> --privacy SELF_ONLY --dry-run
python3 $T/upload_tiktok.py --dir <outputDir> --cover-ms <COVER_MS> --privacy SELF_ONLY
```

- `COVER_MS`: tính bằng snippet ở `base/media-skill.md` Bước 5b (frame giữa cảnh thân
  đầu tiên có ảnh); lỗi → `3000`.
- **TikTok privacy**: chạy `upload_tiktok.py --check`; khi danh sách privacy cho
  phép có `PUBLIC_TO_EVERYONE` (app đã được TikTok duyệt) → đổi sang
  `--privacy PUBLIC_TO_EVERYONE`; còn chưa có → `SELF_ONLY` (ghi rõ "riêng tư —
  app Sandbox" ở bảng kết quả).
- TikTok trả `FAILED` lý do `spam_risk` → **không đăng lại liên tục**; báo user,
  gợi ý đăng tay video đó từ app TikTok (tài khoản mới hay bị chặn khi đăng qua API).
- Long 16:9 trên TikTok: đăng nguyên video (giới hạn tài khoản 3600s); video
  > 1 GB → bỏ qua TikTok, ghi lý do.

## Báo kết quả (cả hai chế độ)

```markdown
✓ Video: [video.mp4](<outputDir>/video.mp4)  (<aspect> · <mm:ss>)
✓ Thumbnail: [thumbnail.png](<outputDir>/thumbnail.png)

| Nền tảng | Định dạng | Trạng thái | Link / ID |
| --- | --- | --- | --- |
| YouTube  | Short / video dài | ✓ public (thumbnail ✓/✗) | https://youtu.be/<id> |
| Facebook | Reel / video thường | ✓ công khai | https://www.facebook.com/1430978420097668/videos/<id> |
| TikTok   | video | ✓ riêng tư (Sandbox) / ✓ công khai / ✗ <lý do> | publish_id <id> |
```

Cộng các dòng tóm tắt riêng của từng chế độ (xem reference).

## Ghi chú

- Tài liệu nền `reference/base/*.md` giữ gần nguyên bản gốc (đã đổi thương hiệu
  + đường dẫn) để dễ đối chiếu khi bản gốc cập nhật — sửa quy tắc riêng của Trạm AI
  ở `SKILL.md` / `short.md` / `long.md`, không sửa base.
- Scripts trong `scripts/`: `check_platforms.py` (kiểm tra), `upload_youtube.py`
  (bản copy trỏ creds Trạm AI + chặn sai kênh, category 28 Khoa học & Công nghệ),
  `upload_tiktok.py` + `tiktok_web_auth.py` (bản copy trỏ creds Trạm AI, luồng web,
  chặn sai tài khoản), `compose_thumbnail.py` / `compose_collage.py` /
  `chapters.py` (đổi màu + mốc CTA Trạm AI), `upload_facebook.py` (mặc định
  credentials Page Trạm AI).
- Trang công khai cho OAuth (privacy, terms, TikTok callback):
  `https://haild2k.github.io/tram-ai/` — chính là các file `*.html` + file xác minh
  `tiktok*.txt` ở gốc repo này (GitHub Pages). **Không đổi tên / xoá** chúng: Google
  OAuth và TikTok (redirect + URL verification) đang trỏ vào.
- Gửi duyệt TikTok (để đăng công khai) cần video demo quay trên Sandbox với giao
  diện web; chưa làm — khi user yêu cầu mới làm.
