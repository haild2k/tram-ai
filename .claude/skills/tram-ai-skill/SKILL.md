---
name: tram-ai-skill
description: Sản xuất video tiếng Việt cho kênh TRẠM AI (tin tức + giải thích về trí tuệ nhân tạo) rồi đăng lên CẢ 3 nền tảng YouTube + Facebook + TikTok, dùng credentials RIÊNG của Trạm AI. Chữ hiển thị trên slide/hình + lời đọc bằng TIẾNG VIỆT. Đăng xong bản Việt thì dựng tiếp bản video tiếng Anh (chữ trên hình + giọng đọc tiếng Anh) rồi đăng lên kênh YouTube TRAM AI CHANNEL (@tram-ai-channel). Bản Việt vẫn có phụ đề + tiêu đề/mô tả tiếng Anh. Hai chế độ — SHORT 9:16 (~90–120s, 1 tin/1 chủ đề AI: nghiên cứu mở rộng nhiều báo → dựng theo 1 trong 2 style: "remotion" (motion graphics Remotion, MẶC ĐỊNH) hoặc "template" (template động HyperFrames, khi user nói "style template") → TTS server từ xa → tự đăng luôn, không duyệt) và LONG 16:9 (không giới hạn thời lượng, có chương, tổng hợp + so sánh tin AI trong N ngày; research đa nguồn → bảng so sánh → kịch bản nhiều chương → DỪNG CHỜ DUYỆT → mới đăng). Logo, màu, footer, outro, CTA, hashtag theo thương hiệu Trạm AI. Trigger khi user muốn "làm video Trạm AI", "đăng kênh Trạm AI", "làm short AI", "video tin AI", "tin AI tuần này", "làm video dài Trạm AI", "so sánh công cụ AI", "tram ai skill". Input: chủ đề / URL / nội dung (short) hoặc loại video dài (1 tin AI tuần · 2 so sánh công cụ AI · 3 chủ đề AI tự chọn).
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
| **LONG · paper** | user đưa link arXiv / Hugging Face Papers / GitHub của 1 paper, nói "giải thích paper", "loại 4" | [reference/long-paper.md](reference/long-paper.md) (+ `long.md` cho đăng/duyệt) — style remotion 16:9 | **Bắt buộc** — dừng chờ user duyệt |

Mơ hồ (vd chỉ "làm video Trạm AI về GPT-6") → SHORT. Đọc file reference của
chế độ đã chọn **từ đầu đến cuối** rồi mới làm; các mục bên dưới áp dụng cho cả
hai chế độ và **thắng** tài liệu nền khi mâu thuẫn — đặc biệt: tài liệu nền ghi
"TikTok tạm dừng đăng" / gọi `create-youtube-content`, `upload-youtube-video`,
`upload-facebook-video`, `upload-tiktok-video` → ở project này **bỏ qua**, dùng
mục **Kịch bản đăng** + **Đăng 3 nền tảng** bên dưới (CÓ đăng TikTok).

## Thứ tự mỗi lần chạy — Việt trước, Anh sau

Mỗi video đi qua 2 giai đoạn, luôn theo thứ tự này, cả short lẫn long:

1. **Tiếng Việt → kênh Trạm AI**: dựng `video.mp4` rồi đăng YouTube @tram-ai +
   Facebook + TikTok (mục **Đăng 3 nền tảng**).
2. **Tiếng Anh → kênh Tram AI Channel**: chỉ sau khi giai đoạn 1 đã chạy hết, dựng
   `video_en.mp4` rồi đăng YouTube @tram-ai-channel (mục **Bản video tiếng Anh**).
   Không đăng bản Anh lên Facebook/TikTok.

Một nền tảng ở giai đoạn 1 lỗi vẫn đi tiếp giai đoạn 2; giai đoạn 2 lỗi không ảnh
hưởng các bài đã đăng. Long: user duyệt **1 lần** ở Bước 11b, lần duyệt đó áp dụng
cho cả 2 giai đoạn.

## Style dựng video (SHORT)

| Style | Khi nào | Dựng bằng | Làm theo |
| --- | --- | --- | --- |
| **remotion** (mặc định) | user không nói style, hoặc nói "style remotion" / "phong cách remotion" | project `remotion/` — motion graphics "editorial data": số liệu chạy động, biểu đồ gốc làm bằng chứng, ảnh lồng trong khung, KHÔNG thanh trên / footer | [reference/style-remotion.md](reference/style-remotion.md) thay Bước 1 của `short.md` |
| **template** | user nói rõ "style template" / "template động" / "kiểu HyperFrames" | skill con `tram-ai-template-video` (template HyperFrames động, ảnh full-frame, footer + chữ chạy) | [reference/short.md](reference/short.md) Bước 1 |

Hai style dùng chung mọi bước còn lại (nghiên cứu, thương hiệu, kịch bản đăng,
YouTube Studio, đăng 3 nền tảng). Ghi style đã dùng vào `script.json`
(`metadata.style`) và dòng tóm tắt khi báo kết quả.

## Ngôn ngữ — chữ trên slide TIẾNG VIỆT

| Thành phần | Ngôn ngữ |
| --- | --- |
| **Chữ hiển thị trên hình** (mọi slide / cảnh, cả short lẫn long, cả 2 style) | **Tiếng Việt** |
| Lời đọc `voiceText` (giọng `minh_quan`) | Tiếng Việt |
| Phụ đề `youtube-studio/` | phụ đề VI + EN, kịch bản đọc tiếng Anh `en_tts` (mục **Bộ file YouTube Studio**) |
| `video_en.mp4` (kênh Tram AI Channel) | chữ trên hình + lời đọc **tiếng Anh**, viết `Tram AI` không dấu |
| Kịch bản đăng `youtube.md` / `facebook.md` / `tiktok.md` + `_en` | như mục **Kịch bản đăng** |

Quy tắc khi viết chữ trên hình (slot `inputs` của style template / chuỗi JSX trong
`Scenes.tsx` của style remotion):

- Tiếng Việt có dấu, gọn, **cùng ý + cùng số liệu** với `voiceText` của cảnh đó.
  Giữ nguyên tên riêng / sản phẩm / mô hình / paper và thuật ngữ quen dùng
  (`AI`, `agent`, `benchmark`, `token`…).
- Số kiểu Việt: `88,7%`, `117.000`, `20 USD/tháng`, `1 triệu token`, `gấp 2`.
- Nguồn trên hình: `Nguồn: <tên>`; nhãn ảnh/biểu đồ gốc `… — <nguồn>`.
- Outro `tagline` tiếng Việt (vd `Theo dõi để cập nhật AI mỗi ngày`).

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

## Credentials (`credentials/` trong project — gitignore, KHÔNG commit)

Thư mục mặc định `<repo>/credentials` (override bằng `TRAM_AI_CREDS`):

| Nền tảng | File | Tài khoản | Ghi chú |
| --- | --- | --- | --- |
| YouTube | `youtube_client_secret.json`, `youtube_token.pickle` | kênh **Trạm AI** `UC-OcFyd7wjGQ69ur92o6Rzg` (@tram-ai) | app Google đã publish → refresh token không hết hạn 7 ngày |
| Facebook | `facebook_credentials.json` | Page **Trạm AI** `1430978420097668` | `page_access_token` (Page token không hết hạn, quyền data hết hạn ~26/01/2027) — script ưu tiên trường này; `user_access_token` chỉ là dự phòng |
| YouTube tiếng Anh | `youtube_client_secret.json` (dùng chung), `youtube_en_token.pickle` | kênh **Tram AI Channel** `UCArsbAuJWz26CVbkYJAk7EA` (@tram-ai-channel) | token riêng, mỗi token chỉ dùng được cho 1 kênh |
| TikTok | `tiktok/tiktok_credentials.json`, `tiktok/tiktok_token.json` | **@tram.ai.vn** | app ở **Sandbox** → chỉ đăng **SELF_ONLY** (riêng tư) tới khi TikTok duyệt app |

**Bước 0 của mọi lần chạy** (trước cả research, mất ~5s):

```bash
python3 .claude/skills/tram-ai-skill/scripts/check_platforms.py
```

- Cả 4 dòng `✓` (YouTube, YouTubeEN, Facebook, TikTok) → đi tiếp.
- Có dòng `✗` → báo user dòng đó, **vẫn làm video** và đăng các nền tảng còn
  lại; nền tảng lỗi ghi ✗ ở bảng kết quả. Cách sửa:
  - YouTube lỗi token → đăng nhập lại: chạy thật (không `--dry-run`)
    `upload_youtube.py --dir <outputDir>` ở chế độ nền; script mở trang chờ ở
    cổng 8090 và in link Google → gửi link cho user mở trên máy này, chọn
    **kênh Trạm AI**. Script tự chặn nếu đăng nhập nhầm kênh khác.
  - YouTubeEN lỗi token → `upload_youtube.py --channel en --login` ở chế độ nền, gửi
    link cho user, chọn **Tram AI Channel**. Vẫn làm và đăng bản Việt, dựng `video_en.mp4`,
    chỉ dừng ở bước đăng bản Anh và ghi ✗ ở bảng kết quả.
  - Facebook hết hạn / thiếu quyền → xin user User Token mới (Graph API Explorer,
    app **Trạm AI**, chọn *User Token*, quyền `pages_show_list pages_manage_posts
    pages_read_engagement`), đổi sang token dài hạn bằng `fb_exchange_token` với
    `app_id` + `secret_key` trong `node.md`, ghi vào `facebook_credentials.json`.
    User đưa thẳng token → kiểm bằng `debug_token`: `type: PAGE` của Page Trạm AI
    → ghi vào `page_access_token`; `type: USER` → ghi vào `user_access_token`.
  - TikTok hết hạn → `python3 .claude/skills/tram-ai-skill/scripts/tiktok_web_auth.py url`
    → user mở (ẩn danh, tài khoản tram.ai.vn) → dán URL trang callback →
    `tiktok_web_auth.py complete '<URL>'`. (TikTok KHÔNG nhận redirect localhost.)

## Lưu trữ

`videos/tram-ai/short/<YYYY-MM-DD>/<slug>-<timestamp>/` và
`videos/tram-ai/long/<YYYY-MM-DD>/<slug>-<timestamp>/` (dựng tạm ở
`videos/_render/…` như pipeline gốc rồi `mv` sang). `videos/` đã gitignore.

## Kịch bản đăng (cả hai chế độ)

Skill tự viết 5 file trong `outputDir`, chỉ từ `script.json` (+ `research.md` cho
số liệu), không bịa: `youtube.md`, `facebook.md`, `tiktok.md` (tiếng Việt — dùng
để đăng) + `youtube_en.md`, `facebook_en.md` (bản tiếng Anh ánh xạ 1-1, xem cuối mục).

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

`facebook.md` và `tiktok.md` là **văn bản thuần, copy dán thẳng lên nền tảng
được** (user hay đăng tay): KHÔNG `#` trước tiêu đề, KHÔNG tiêu đề mục `## …`,
dấu `#` chỉ dùng cho hashtag.

**`facebook.md`** — dòng 1 = tiêu đề; dòng trống; phần còn lại = mô tả
(`upload_facebook.py` và `chapters.py --inject` đọc đúng dạng này):

```text
<tiêu đề, không có # đầu dòng>

<hook 1–2 câu>

<long: 1–2 đoạn tóm tắt + mốc chương do chapters.py chèn>

Nguồn tham khảo: <tên 1>, <tên 2>

<khối CTA Trạm AI>

#<chủ đề> #<hãng> #TramAI
```

short = Reel (hook 1–2 câu, ngắn); long = video thường (dài hơn, có mốc chương).
Hashtag 3–5: chủ đề trước, `#TramAI` gần cuối. CTA đúng khối Trạm AI.

**`tiktok.md`** — toàn bộ file là caption, ≤ 2200 ký tự:

```text
<hook mạnh nhất, ≤ 150 ký tự, tối đa 1 emoji — không có # đầu dòng>

<tuỳ chọn 1 câu chốt; long: "Bản đầy đủ có trên YouTube Trạm AI.">

#<sản phẩm> #<hãng> #<chủ đề> #TramAI
```

3–5 hashtag cụ thể theo nội dung (KHÔNG `#xuhuong #fyp` hay tag chung chung khác),
`#TramAI` cuối cùng.

**`youtube_en.md` · `facebook_en.md`** — bản tiếng Anh, viết **sau** khi đã chạy
`chapters.py --inject` cho 2 file tiếng Việt. Ánh xạ 1-1 từ file Việt tương ứng:
**cùng định dạng** (`youtube_en.md` giữ `# <title>` + các mục `##` với tên mục y
nguyên để script parse được; `facebook_en.md` văn bản thuần như `facebook.md`),
**cùng số đoạn, cùng thứ tự, cùng số liệu** — chỉ dịch, không thêm/bớt ý.
- Tiêu đề: dịch sát nghĩa (giữ tên riêng / tên sản phẩm / tên paper nguyên văn;
  tiêu đề đã tiếng Anh như `[Explained] <tên paper>` thì giữ y hệt).
- Số theo kiểu Anh: `26,62%` → `26.62%`, `117.000` → `117,000`, ngày `1/1–29/3/2024`
  → `Jan 1 – Mar 29, 2024`.
- Mốc chương: `⏱ Mốc thời gian:` → `⏱ Chapters:`, giữ nguyên mốc giờ, dịch tên chương.
- `Nguồn tham khảo:` → `References:`; CTA:
  ```
  Follow Tram AI for daily updates on artificial intelligence:
  👉 YouTube: https://www.youtube.com/@tram-ai-channel
  👉 TikTok: https://www.tiktok.com/@tram.ai.vn
  👉 Facebook: https://www.facebook.com/tram.ai.channel
  ```
- Hashtag: cùng số lượng, bản tiếng Anh tương ứng (`#trituenhantao` → `#artificialintelligence`,
  `#tinai` → `#ainews`, `#giaithichpaper` → `#paperexplained`); tên sản phẩm/hãng và
  `#tramai` / `#TramAI` giữ nguyên.
- `youtube_en.md`: `## Tags` = từ khoá tiếng Anh người xem thật sự gõ (bỏ câu tìm kiếm
  tiếng Việt, thay bằng câu tiếng Anh tương ứng); `## Ghim comment gợi ý` dịch câu hỏi.

Tự kiểm tra: 5 file tồn tại; CTA đúng 3 link Trạm AI (bản `_en` trỏ YouTube sang
@tram-ai-channel), không có link/kênh nào khác; hashtag đúng thứ tự; bản `_en` khớp bản Việt về số đoạn, số liệu, mốc chương.

## Bộ file YouTube Studio (phụ đề + kịch bản tiếng Anh) — LUÔN sinh

> **Video tiếng Việt chưa lồng tiếng Anh**: chỉ sinh phụ đề VI/EN + kịch bản đọc
> tiếng Anh (`en_tts`), KHÔNG gọi TTS tiếng Anh, không có `audio_en.mp3` / `voice_en/`.
> Khi user bật lồng tiếng → làm theo mục "Khi bật lồng tiếng EN" cuối phần này.
> Khác với `video_en.mp4` riêng cho kênh Tram AI Channel (mục **Bản video tiếng Anh**).

Video đăng bằng tiếng Việt, nhưng YouTube có thêm phụ đề + tiêu đề/mô tả tiếng
Anh. Sau khi render xong (short lẫn long), luôn sinh thư mục con
`<outputDir>/youtube-studio/`:

| File | Nội dung |
| --- | --- |
| `scenes.json` | nguồn: list `{id, vi, en, en_tts}` mỗi cảnh — `vi` phụ đề Việt (số dạng đẹp, KHÔNG dùng `voiceText` đọc-ra-chữ), `en` phụ đề Anh, `en_tts` kịch bản đọc tiếng Anh |
| `subtitles_vi.srt` · `subtitles_en.srt` | phụ đề có mốc thời gian, khớp lời Việt từng cảnh |
| `README.md` | hướng dẫn phần làm tay trong YouTube Studio (bên dưới) |

Cách làm: viết `scenes.json` (dịch sát nghĩa, không thêm số liệu ngoài
`script.json`). `en_tts` = kịch bản đọc rút gọn từ `en` cho vừa cảnh, sẵn cho lúc
bật lồng tiếng: số viết ra chữ (`93.23` → `ninety-three point two three`),
`Trạm AI` → `Tram AI`, ≤ `3,2 × (durationSec − 0,4)` từ (`durationSec` trong
`script.json`). Rồi chạy:

```bash
python3 .claude/skills/tram-ai-skill/scripts/make_youtube_studio.py --dir <outputDir> --no-voice
```

Script đo mốc cảnh từ `clips/scene-*-fit.mp4` và độ dài lời Việt
`voice/scene-<id>.mp3`, sinh 2 file `.srt` (phụ đề Anh dùng cùng mốc lời Việt).

Sau khi đăng YouTube, phụ đề VI/EN + tiêu đề/mô tả Anh được **tải tự động** bằng
`youtube_i18n.py` (mục **Đăng 3 nền tảng**). `README.md` ghi cách làm tay khi script
đó lỗi: Phụ đề → Tiếng Việt → Tải tệp lên → *Có thời gian* → `subtitles_vi.srt`;
**Thêm ngôn ngữ** → Tiếng Anh: `subtitles_en.srt` + tiêu đề/mô tả từ `../youtube_en.md`.

Khi bật lồng tiếng EN (chỉ khi user yêu cầu rõ): chạy với `--with-voice` thay cho `--no-voice` → script gọi TTS `minh_quan` cho
`en_tts`, fit ≤ ×1,2 (thoát mã 1 + `CẢNH BÁO <id>` nếu cần hơn → rút gọn `en_tts`,
xoá `voice_en/scene-<id>.raw.mp3`, chạy lại), ghép `audio_en.mp3`. API YouTube KHÔNG
cho tải bản âm thanh → README thêm bước: Chỉnh sửa video → **Bản âm thanh** → Thêm →
Tiếng Anh → `audio_en.mp3`; báo kết quả nhắc user bước này.

## Bản video tiếng Anh — `video_en.mp4` → kênh Tram AI Channel (LUÔN làm, sau khi đăng bản Việt)

Style `template` chưa có pipeline tiếng Anh → bỏ qua giai đoạn này, ghi rõ ở báo kết
quả. Style `remotion` (kể cả short, long, paper): bản tiếng Anh là **một file trong CHUNG thư mục với video tiếng Việt** (`<outputDir>/video_en.mp4`),
KHÔNG tạo thư mục `…-en-<timestamp>` riêng. Dựng hẳn lại cả chữ trên hình + giọng đọc
(không phải chỉ thay tiếng), theo mẫu `remotion/src/videos/ai-ham-kich-hoat-30-10-en/`:

1. `src/videos/<slug>-en/`: `script.json` (lời đọc Anh đầy đủ, số viết ra chữ, `Tram AI`),
   `cues.json` (`{cảnh: {cụm Việt: cụm Anh}}`, cụm Anh phải có trong lời đọc), `index.tsx`
   (`LangProvider value="en"`, outro + thumbnail Anh; outro truyền `socials={SOCIALS_EN}` để hiện
   kênh `youtube.com/@tram-ai-channel`); đăng ký composition trong `Root.tsx`. Short 9:16: `defineShort`
   nhận `outro`, dùng `<Outro brand="Tram AI" tagline="…" socials={SOCIALS_EN} />` từ `tram/ui.tsx`.
2. `python3 scripts/tts.py <slug>-en` (giọng `minh_quan`).
3. `Scenes.tsx` của bản Việt: thêm `useLang` — `c.L(vi, en)`, `c.tr()` cho chữ trong mảng, `c.f()`
   cho số; thiếu cue/chữ Anh phải báo lỗi. Thêm xong đối chiếu vài khung bản Việt (không đổi).
4. Chụp khung cuối từng cảnh soát tràn chữ → render chuỗi ảnh → `check_frames.py` → ghép:
   ```bash
   python3 .claude/skills/tram-ai-skill/scripts/mux_video_en.py --dir <outputDir> \
       --slug <slug>-en --seq <thư mục ảnh>
   ```
   Ra `video_en.mp4`, `chapters_en.txt`, `subtitles_video_en.srt`, `youtube_channel_en.md`
   (= `youtube_en.md` + mốc chương của `video_en.mp4`); thumbnail lưu `thumbnail_en.png`.
5. Đăng lên Tram AI Channel — dry-run trước, soát đúng kênh, mốc chương và số phút trong tiêu đề
   (bản Anh thường dài khác bản Việt, sửa trong `youtube_channel_en.md` nếu lệch) rồi chạy thật:
   ```bash
   T=.claude/skills/tram-ai-skill/scripts
   python3 $T/upload_youtube.py --channel en --dir <outputDir> --dry-run
   python3 $T/upload_youtube.py --channel en --dir <outputDir>
   python3 $T/youtube_i18n.py --channel en --dir <outputDir> --video-id <VIDEO_ID_EN>
   ```
   Lệnh đầu tiên dùng `video_en.mp4` + `youtube_channel_en.md` + `thumbnail_en.png`, public,
   tự chặn nếu sai kênh. Lệnh cuối chỉ tải `subtitles_video_en.srt`.

Timeline bản Anh riêng nên **`youtube_en.md` / `facebook_en.md` / `youtube-studio/subtitles_en.srt`
khớp `video.mp4`, không khớp `video_en.mp4`** — chúng chỉ dùng cho bản tiếng Anh gắn trên video Việt.
Đăng Tram AI Channel luôn dùng `youtube_channel_en.md` + `subtitles_video_en.srt`.

## Đăng 3 nền tảng (sau Bước 0 ✓; long chỉ sau khi user duyệt)

Chạy từ gốc repo, lần lượt, **mỗi lệnh chạy `--dry-run` trước** để soát metadata,
rồi chạy thật. Lỗi 1 nền tảng → in nguyên lỗi, vẫn đăng nền tảng còn lại.

```bash
T=.claude/skills/tram-ai-skill/scripts
# 1. YouTube — public, tự gắn thumbnail.png, tự kiểm tra đúng kênh Trạm AI
python3 $T/upload_youtube.py --dir <outputDir> --dry-run
python3 $T/upload_youtube.py --dir <outputDir>
# 1b. YouTube tiếng Anh — phụ đề VI/EN + tiêu đề/mô tả Anh (localizations.en) cho video vừa đăng
python3 $T/youtube_i18n.py --dir <outputDir> --video-id <VIDEO_ID> --dry-run
python3 $T/youtube_i18n.py --dir <outputDir> --video-id <VIDEO_ID>
#    (token thiếu quyền youtube.force-ssl → script in link Google, gửi user đồng ý 1 lần, chọn kênh Trạm AI)
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
  app Sandbox" ở bảng kết quả). Lưu ý: danh sách privacy có thể hiện
  `PUBLIC_TO_EVERYONE` dù app **chưa audit** — khi đó `video/init` trả lỗi
  `unaudited_client_can_only_post_to_private_accounts` (với **mọi** `--privacy`,
  kể cả `SELF_ONLY`): app chưa audit chỉ đăng được khi **tài khoản** TikTok để
  chế độ riêng tư → không thử lại; ghi ✗ + lý do, gợi ý user hoặc chuyển
  @tram.ai.vn sang tài khoản riêng tư rồi chạy lại, hoặc đăng tay từ app TikTok.
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

YouTube tiếng Anh: phụ đề VI ✓/✗ · phụ đề EN ✓/✗ · tiêu đề/mô tả EN ✓/✗

✓ Video tiếng Anh: [video_en.mp4](<outputDir>/video_en.mp4)  (<aspect> · <mm:ss>)
| Tram AI Channel | Short / video dài | ✓ public (thumbnail ✓/✗ · phụ đề ✓/✗) / ✗ <lý do> | https://youtu.be/<id> |
```

Cộng các dòng tóm tắt riêng của từng chế độ (xem reference).

## Ghi chú

- Tài liệu nền `reference/base/*.md` giữ gần nguyên bản gốc (đã đổi thương hiệu
  + đường dẫn) để dễ đối chiếu khi bản gốc cập nhật — sửa quy tắc riêng của Trạm AI
  ở `SKILL.md` / `short.md` / `long.md`, không sửa base.
- Scripts trong `scripts/`: `check_platforms.py` (kiểm tra), `mux_video_en.py` (ghép bản tiếng Anh), `check_frames.py`
  (style remotion: dò + render lại khung hỏng trong chuỗi ảnh trước khi ghép — chống
  giật/nháy màn hình), `upload_youtube.py`
  (bản copy trỏ creds Trạm AI + chặn sai kênh, `--channel en` cho Tram AI Channel, category 28 Khoa học & Công nghệ),
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
