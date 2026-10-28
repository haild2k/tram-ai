# Chế độ SHORT — 9:16, 1 tin / 1 chủ đề AI, đăng luôn

Dựa trên **`.claude/skills/tram-ai-skill/reference/base/media-remote-skill.md`** (và `media-skill` mà nó
kế thừa). Đọc file đó, làm **đúng thứ tự và mọi chỉ thị** của nó — Bước 0
(nghiên cứu mở rộng), 1a–1j (TTS remote, giọng, ép endpoint, hook đọc nhanh, crop
logo nguồn khác, hook `image-full`, chống giật, đọc số), thumbnail, COVER_MS —
**với các thay đổi dưới đây** (thay đổi thắng khi mâu thuẫn). Thương hiệu luôn
theo bảng **Thương hiệu** của `SKILL.md` skill này.

## Input

- Chủ đề ngắn (vd "OpenAI ra GPT-6", "Gemini miễn phí cho sinh viên"), URL bài
  báo, file `.txt`, hoặc nội dung dán. Ảnh tuỳ chọn (thiếu thì Bước 0 tự lấy).
- **Tỉ lệ luôn `9:16`** — KHÔNG hỏi. Chỉ làm 16:9 khi user nói rõ "ngang 16:9"
  (khi đó YouTube video thường + Facebook video thường).
- Chủ đề không liên quan AI / công nghệ AI → hỏi lại user 1 câu có đúng muốn đăng
  lên Trạm AI không (kênh chuyên AI), rồi dừng chờ.

## Bước 0 (thay `media-remote-skill` Bước 0.3 — nguồn ưu tiên cho tin AI)

Giữ nguyên quy trình 0.1–0.8 (dấu vân tay chủ đề, cổng "đúng chủ đề", gộp &
kiểm chứng dữ kiện, ảnh, `research.md`, `content-enriched.txt`, `CREDITS.md`).
Chỉ đổi truy vấn + nguồn:

- `WebSearch` 3–5 truy vấn song song: 2 tiếng Việt (`<sản phẩm/công ty> <sự kiện>`,
  `<chủ đề> mới nhất`) + **≥ 2 tiếng Anh** (`<model> release`, `<company> announces <x>`),
  vì tin AI gốc gần như luôn tiếng Anh.
- **Nguồn ưu tiên**:
  - Chính chủ (luôn ưu tiên cho số liệu, benchmark, giá): blog / newsroom / docs
    của hãng — openai.com, anthropic.com, blog.google / deepmind.google,
    ai.meta.com, microsoft.com, nvidia.com, x.ai, mistral.ai, deepseek.com,
    huggingface.co, model card / technical report / arXiv.
  - Báo công nghệ quốc tế: theverge.com, techcrunch.com, arstechnica.com,
    wired.com, reuters.com/technology, bloomberg.com/technology, venturebeat.com.
  - Báo Việt: vnexpress.net/so-hoa, genk.vn, ictnews.vietnamnet.vn, znews.vn/cong-nghe,
    tuoitre.vn/nhip-song-so, dantri.com.vn/cong-nghe, thanhnien.vn/cong-nghe.
- **Loại**: bài "tổng hợp prompt", trang SEO, thread mạng xã hội không phải tài
  khoản chính thức, ảnh chụp màn hình benchmark không rõ nguồn.
- Khung thời gian tin AI: ±3 ngày quanh mốc (tin AI cũ đi rất nhanh).
- Ảnh: ưu tiên ảnh chính chủ (ảnh sản phẩm, ảnh sự kiện, ảnh lãnh đạo hãng,
  biểu đồ benchmark chính thức), rồi ảnh báo lớn. **Không** dùng ảnh AI-generated
  trông như ảnh thật cho tin thời sự. Logo hãng AI (OpenAI, Gemini…) trong ảnh
  sản phẩm là một phần chủ thể — KHÔNG crop; chỉ crop logo/watermark của **báo
  / kênh khác**.
- Viết lại bằng lời của Trạm AI.

## Bước 1 — chỉ thị gửi `tram-ai-template-video` (bổ sung cho 1c–1j)

Ngoài toàn bộ chỉ thị 1c–1j của `media-remote-skill`, thêm:

> - `aspect = "9:16"` (KHÔNG hỏi Step 2).
> - `metadata.channel = "Trạm AI"`. Mọi `foot_left = "Trạm AI"`.
> - **Step 5** (template): sau khi copy scaffold, đổi đúng 4 biến màu:
>   `--bg1:#0e1230; --bg2:#1d1d4f; --accent1:#6f8cff; --accent2:#f2b254;`
>   rồi `cp .claude/skills/tram-ai-skill/assets/logo-round.png <TPL>/assets/logo.png`.
> - **Outro**: `brand: "Trạm AI"`, `logo: "assets/logo.png"`, `tagline` mời theo
>   dõi Trạm AI để cập nhật AI mỗi ngày, `socials` = 3 kênh Trạm AI (bảng Thương
>   hiệu). KHÔNG dùng `assets/logo.svg`.
> - Giọng: **luôn `voice.name: "minh_quan"`** — bỏ qua bảng tông của
>   `media-remote-skill` 1b (xem bảng Thương hiệu của `SKILL.md`).
> - **Quy tắc TTS cho thuật ngữ AI** (bổ sung 1j):
>
>   | Hiển thị | `voiceText` |
>   | --- | --- |
>   | `GPT-5`, `GPT-4o`, `o3` | `GPT năm`, `GPT bốn o`, `o ba` |
>   | `Claude Opus 4.5`, `Gemini 2.5 Pro` | `Claude Opus bốn chấm năm`, `Gemini hai chấm năm Pro` |
>   | `Llama 3.1 405B` | `Llama ba chấm một, bốn trăm lẻ năm tỷ tham số` |
>   | `1M token`, `200K token` | `một triệu token`, `hai trăm nghìn token` |
>   | `$20/tháng`, `$2,5/1M token` | `hai mươi đô mỗi tháng`, `hai phẩy năm đô cho một triệu token` |
>   | `H100`, `B200` | `H một trăm`, `B hai trăm` |
>   | `AI`, `LLM`, `API`, `GPU` | giữ nguyên chữ cái |
>   | `88,7%` trên `MMLU` | `tám mươi tám phẩy bảy phần trăm trên bài kiểm tra MMLU` |
>
>   Số benchmark từ nguồn tiếng Anh (`88.7%`) → đổi sang dạng Việt khi viết
>   (`88,7%` hiển thị, `tám mươi tám phẩy bảy` khi đọc) — theo 1j B1.

## Sau Bước 1

1. `mv videos/_render/<slug>-<timestamp> videos/tram-ai/short/<DATE>/` (`mkdir -p`
   trước). Từ đây `outputDir` = thư mục mới.
2. Viết `youtube.md` / `facebook.md` / `tiktok.md` theo `SKILL.md` mục **Kịch bản
   đăng** (KHÔNG gọi `create-youtube-content`).
3. Thumbnail: `python3 .claude/skills/tram-ai-skill/scripts/compose_thumbnail.py --dir <outputDir> --pick <N> [--focus "<x>% <y>%"]`
   (N = ảnh đã dùng cho hook). Lỗi → in lỗi, vẫn đi tiếp.
4. `COVER_MS` theo `media-skill` Bước 5b.
4b. Bộ file YouTube Studio (`youtube-studio/`: phụ đề VI/EN + `audio_en.mp3`)
   theo `SKILL.md` mục **Bộ file YouTube Studio**.
5. Đăng **luôn, không hỏi**: YouTube → Facebook → TikTok theo `SKILL.md` mục **Đăng
   3 nền tảng**.
6. Báo kết quả theo `SKILL.md`, thêm các dòng tóm tắt của `media-remote-skill`
   Bước 7 (TTS remote · hook · motion · Nghiên cứu · ảnh đã crop).

## Tạo lại theo phản hồi user

Như `media-skill` Bước 2: outputDir mới (không ghi đè), tái dùng `research.md` +
`content-enriched.txt` + ảnh, đăng lại cả 3 nền tảng không hỏi. Không tự xoá video
đã đăng.
