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
| Outro `brand` / `logo` | `"Trạm AI"` / `"assets/logo.png"` — copy `.claude/skills/tram-ai-skill/assets/logo.png` vào `<TPL>/assets/logo.png` |
| Outro `tagline` | mời theo dõi để cập nhật AI mỗi ngày (short) / bản tin AI tuần sau (long) |
| Outro `socials[]` | `{plat:"YouTube",handle:"youtube.com/@tram-ai"}`, `{plat:"TikTok",handle:"tiktok.com/@tram.ai.vn"}`, `{plat:"Facebook",handle:"Trạm AI"}` |
| Màu template (`--bg1 --bg2 --accent1 --accent2`) | `#0e1230` · `#1d1d4f` · `#6f8cff` (xanh tím mạch điện) · `#f2b254` (vàng ánh đèn) — lấy từ logo |
| Thumbnail | `scripts/compose_thumbnail.py` của skill này (thanh accent vàng Trạm AI) |
| Hashtag tên kênh | `#tramai` (YouTube lowercase) · `#TramAI` (Facebook/TikTok) |
| Ảnh có logo/branding của **chính Trạm AI** | KHÔNG crop |

Khối CTA cuối description (YouTube + Facebook) — đúng nguyên văn, đúng 3 link:

```
Theo dõi Trạm AI để cập nhật trí tuệ nhân tạo mỗi ngày:
👉 YouTube: https://www.youtube.com/@tram-ai
👉 TikTok: https://www.tiktok.com/@tram.ai.vn
👉 Facebook: https://www.facebook.com/1430978420097668
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
- Hashtag (lowercase, không dấu): short `#shorts #trending #xuhuongyoutube #trend #trendingshorts`
  → 2–4 tag chủ đề (`#ai #trituenhantao #chatgpt #congngheai`…) → `#tramai` cuối.
  Long: bỏ mọi `#shorts`/`trendingshorts`; `#trending #xuhuongyoutube #trend` →
  tag bản tin (`#tinai #tinaituan #trituenhantao #congngheai #ai`) → `#tramai`;
  **tổng ≤ 15**.
- Tags 12–20, lowercase, ≤ 480 ký tự; luôn có `trending, xuhuongyoutube, trend`
  (+ `trendingshorts` nếu short), `trạm ai` gần cuối; từ khoá người Việt hay gõ:
  `tin ai, trí tuệ nhân tạo, ai mới nhất, công cụ ai, chatgpt, ai là gì` + tên
  mô hình/sản phẩm trong video.

**`facebook.md`** — cùng cấu trúc (`#` title + `## Mô tả (Description)`):
short = Reel (hook 1–2 câu, ngắn); long = video thường (dài hơn, có mốc chương).
Hashtag 3–5: chủ đề trước, `#TramAI` gần cuối. CTA đúng khối Trạm AI.

**`tiktok.md`** — caption = mọi dòng không bắt đầu bằng `## `, ≤ 2200 ký tự:

```markdown
# <hook mạnh nhất, ≤ 150 ký tự, tối đa 1 emoji>

<tuỳ chọn 1 câu chốt; long: "Bản đầy đủ có trên YouTube Trạm AI.">

#xuhuong #fyp #<chủ đề1> #<chủ đề2> #TramAI
```

Tối đa 5 hashtag, `#xuhuong #fyp` đầu tiên, `#TramAI` cuối cùng.

Tự kiểm tra: 3 file tồn tại; CTA đúng 3 link Trạm AI, không có link/kênh nào
khác; hashtag đúng thứ tự.

## Output bổ sung cho tiếng Anh

Mặc định skill vẫn tạo nội dung chính bằng tiếng Việt cho kênh Trạm AI. Khi cần
phục vụ thêm cho tiếng Anh, output phải bổ sung các file sau trong cùng `outputDir`:

- `subtitles_en.srt` — phụ đề tiếng Anh đầy đủ của video
- `audio_en.mp3` — audio giọng nói tiếng Anh tương ứng với nội dung video

Các file này có thể được sinh đồng thời với bản Việt, nhưng không được thay thế
nội dung chính tiếng Việt. Mục tiêu cuối là có đủ tài liệu để cài đặt lên
YouTube Studio theo mục dưới đây.

### Cài đặt vào YouTube Studio

Sau khi đã có file `subtitles_en.srt` và file âm thanh `audio_en.mp3`:

1. Vào **YouTube Studio** > Chọn video đã đăng/chuẩn bị đăng.
2. Bên thanh công cụ trái, chọn **Phụ đề (Subtitles)**: Thêm ngôn ngữ **Tiếng Anh**.
3. Nhập bản dịch **Tiêu đề & Mô tả**.
4. Nhấn **Tải tệp lên (Upload file)** > Chọn file `subtitles_en.srt`.
5. Trong phần chỉnh sửa video, tìm mục **Bản âm thanh (Audio tracks)**: Nhấn **Thêm (Add)** > Chọn ngôn ngữ là **Tiếng Anh (English)**.
6. Tải file `audio_en.mp3` lên.

Mục tiêu cuối của skill là đảm bảo video chính tiếng Việt vẫn chạy đúng trên kênh,
đồng thời có sẵn bản phụ đề và bản âm thanh tiếng Anh để cài đặt vào YouTube Studio
một cách nhanh chóng và đúng chuẩn.

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
