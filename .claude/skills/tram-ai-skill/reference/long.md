# Chế độ LONG — 16:9, 6–10 phút, tổng hợp + so sánh AI, DUYỆT rồi mới đăng

Dựa trên **`.claude/skills/tram-ai-skill/reference/base/media-long-remote-skill.md`**. Đọc file đó và làm
**đúng Bước 0 → 13** (TTS `minh_quan` qua server từ xa, research đa nguồn, dàn ý
chương, ảnh + crop logo, template động 16:9 `template-scaffold-long.html`, layout
`chapter` / `compare` / `vs` / `spec` trong `reference/layouts.md` của skill đó,
`script.json` 30–60 scene, tự kiểm tra, pipeline + hook atempo, chapters, thumbnail,
**Bước 11b DUYỆT**) — **với các thay đổi dưới đây** (thay đổi thắng khi mâu thuẫn):

- Mục "Ba loại video **xe**" → thay bằng **Ba loại video AI** bên dưới; mọi chỗ
  nói "xe / phân khúc / đối thủ / giá lăn bánh / đại lý" hiểu theo nghĩa AI ở
  bảng này.
- Research → làm theo **[research-ai.md](research-ai.md)** (thay
  `tram-ai-skill/reference/research-ai.md`).
- Thương hiệu, nơi lưu, kịch bản đăng, đăng 3 nền tảng, báo kết quả → theo
  `SKILL.md` của skill này (KHÔNG gọi `create-youtube-content` / `upload-*-video`
  nhắc trong base, **CÓ** đăng TikTok).

## Ba loại video AI

Ghi `TYPE` (`tin-ai` / `cong-cu` / `chu-de`). User chưa nói loại nào → hỏi đúng 1
câu: "Làm loại nào: 1 tin AI tuần, 2 so sánh công cụ AI, hay 3 chủ đề AI (nêu chủ
đề)?" rồi dừng chờ. Mọi tham số khác (`DAYS=7`, số mục nổi bật 4, thời lượng) dùng
mặc định, không hỏi.

| | Loại 1 — `tin-ai` | Loại 2 — `cong-cu` | Loại 3 — `chu-de` |
| --- | --- | --- | --- |
| Nội dung | Tin AI nổi bật trong `DAYS` ngày: **mô hình / sản phẩm mới**, nâng cấp lớn, giá mới, thương vụ, chính sách — mỗi tin đặt cạnh đối thủ gần nhất | **So sánh các công cụ AI cùng nhóm** (chatbot · tạo ảnh · tạo video · lập trình · giọng nói · tìm kiếm…) — có cập nhật mới trong `DAYS` ngày làm cớ | **Chủ đề AI user nêu** (vd "AI agent", "AI trong giáo dục", "AI chạy trên điện thoại") — tổng hợp tin trong `DAYS` ngày + so sánh các lựa chọn |
| Chọn mục nổi bật | Chấm điểm research-ai §3; chỉ tin **đã ra mắt / công bố chính thức**; tin đồn → "Tin nhanh" có nhãn | Nhóm công cụ có ≥ 1 cập nhật trong tuần; chọn 3–5 công cụ phổ biến nhất nhóm đó (có bản dùng được ở Việt Nam ưu tiên) | Mục liên quan chủ đề, ≥ 2 nguồn; `DAYS` < 2 mục → tự mở rộng `DAYS=30` một lần (ghi rõ, lời đọc nói "tháng qua") |
| Trục so sánh | benchmark chính thức (cùng bài test, cùng điều kiện), cửa sổ ngữ cảnh, giá API (USD / 1 triệu token vào–ra), gói thuê bao, đa phương thức, có dùng ở VN không | giá gói (miễn phí / trả phí / tháng), giới hạn bản miễn phí, tính năng chính, chất lượng đầu ra (chỉ khi có đánh giá có nguồn), hỗ trợ tiếng Việt, nền tảng (web / app) | tuỳ chủ đề — chọn 4–6 tiêu chí có dữ liệu cho đa số cột |
| Câu mở hook (lời đọc) | "Điểm tin AI tuần này." | "Công cụ AI nào đáng dùng nhất lúc này?" | "Chuyện gì đang xảy ra với <chủ đề>?" |
| Kicker hook (hình) | `TIN AI TUẦN 18/10 – 24/10` | `SO SÁNH AI <NHÓM> · TUẦN 18/10 – 24/10` | `<CHỦ ĐỀ VIẾT HOA> · 18/10 – 24/10` |
| Slug | `tin-ai-tuan-<d-m>` | `so-sanh-ai-<nhom>-<d-m>` | `ai-<chu-de>-<d-m>` |
| Mở tiêu đề YouTube / FB | `Tin AI tuần: …` | `So sánh AI <nhóm>: …` | `<Chủ đề>: …` |
| Hashtag / tag riêng | `#tinai #tinaituan #aimoi` · tags `tin ai tuần, tin ai mới nhất, ai mới ra mắt` | `#congcuai #sosanhai #aitool` · tags `công cụ ai, so sánh ai, ai miễn phí, ai tốt nhất` | 2–3 hashtag theo chủ đề · tags theo chủ đề |

Giá: luôn ghi **đơn vị gốc** (USD) + kỳ hạn (tháng / năm / 1 triệu token); quy
đổi VNĐ chỉ khi nguồn có giá VNĐ chính thức (vd gói bán tại VN) — không tự quy đổi
theo tỷ giá. Benchmark: chỉ so khi **cùng tên bài test và cùng cấu hình** (vd
cùng "SWE-bench Verified"); khác điều kiện → không đặt chung 1 hàng `compare`.

## Thay đổi theo từng bước của `media-long-remote-skill`

- **Bước 0**: `check_platforms.py` (SKILL.md) chạy trước TTS check. Giọng vẫn cố
  định `minh_quan`. `outputDir = videos/_render/<slug>-<timestamp>/`.
- **Bước 2 (dàn ý)**: khung chuẩn giữ nguyên; chương "sản phẩm" = chuyện gì mới
  → thông số / điểm số chính → làm được gì cho người dùng Việt → đặt cạnh đối thủ
  → "hợp với ai". Chương N+1 "Bàn cân <nhóm>", N+2 "Tin nhanh", N+3 "Nên dùng gì".
  Nhận định khách quan, rút từ số liệu; không "chê" vô căn cứ, không kêu gọi đăng ký
  dịch vụ nào.
- **Bước 3 (ảnh)**: mục tiêu 12–25 ảnh. Sản phẩm AI ít ảnh "ngoại thất" → mỗi mục
  ưu tiên: ảnh chính chủ (ảnh bìa bài công bố, ảnh giao diện sản phẩm, ảnh sự
  kiện / lãnh đạo hãng, biểu đồ benchmark chính thức) → ảnh báo lớn → Wikimedia
  (logo / chân dung). Ảnh giao diện (`screenshot`) chỉ cho `split` / `spec`, không
  cho hook. Phải đúng **phiên bản** (ảnh GPT-4o cho tin GPT-5 là lỗi nặng). Crop
  logo **báo / kênh khác**; logo hãng AI là chủ thể → giữ.
- **Bước 4 (template)**: 4 biến màu Trạm AI (`--bg1:#0e1230; --bg2:#1d1d4f;
  --accent1:#6f8cff; --accent2:#f2b254`); `cp .claude/skills/tram-ai-skill/assets/logo-round.png <TPL>/assets/logo.png`
- **Bước 5 (`script.json`)**: `metadata.channel = "Trạm AI"`; `foot_left = "Trạm AI"`;
  outro theo bảng Thương hiệu (`logo: "assets/logo.png"`, tagline mời xem bản tin
  AI tuần sau). Hook = ảnh ghép (`compose_collage.py` **của skill này**) các mục
  nổi bật; `voiceText` hook = câu mở theo loại + mỗi mục 1 câu 4–8 từ (TÊN + ý
  chính, không số) + 1 câu hé lộ phần so sánh. Quy tắc TTS: của
  `media-long-remote-skill` + bảng **thuật ngữ AI** trong [short.md](short.md).
  `compare.note` = `Nguồn: <tên 1>, <tên 2>` (ngắn).
- **Bước 7**: sau pipeline → `mv` sang `videos/tram-ai/long/<DATE>/`.
- **Bước 8**: `python3 .claude/skills/tram-ai-skill/scripts/chapters.py --dir <outputDir>`
  (bản copy nhận mốc CTA "Theo dõi Trạm AI").
- **Bước 9–10**: viết `youtube.md` / `facebook.md` / `tiktok.md` theo SKILL.md mục
  **Kịch bản đăng** (title ≤ 100 ký tự, nêu đủ tên mục nổi bật theo thứ tự chương;
  dòng `Nguồn tham khảo:` ≤ 3 tên; lưu ý cuối mô tả: "Giá và tính năng có thể thay
  đổi theo khu vực; kiểm tra trang chính thức trước khi đăng ký."), rồi
  `chapters.py --dir <outputDir> --inject youtube.md --inject facebook.md`.
  Mô tả YouTube ≤ 5.000 ký tự.
- **Bước 11**: `python3 .claude/skills/tram-ai-skill/scripts/compose_thumbnail.py --dir <outputDir> --image <outputDir>/source-images/img-hook.jpg [--title "<≤45 ký tự>"]`.
- **Bước 11b (DUYỆT)**: giữ nguyên mẫu bản duyệt, đổi dòng cuối thành
  `Trả lời "duyệt" / "đăng" để đăng YouTube + Facebook + TikTok, hoặc ghi rõ cần sửa gì.`
  KHÔNG đăng gì trước khi user duyệt rõ ràng.
- **Bước 12**: đăng theo SKILL.md mục **Đăng 3 nền tảng** (YouTube video dài có
  chapters → Facebook video thường → TikTok). COVER_MS như `media-skill` Bước 5b.
- **Bước 13**: bảng kết quả SKILL.md + các dòng: `Mục nổi bật`, `Bảng so sánh`,
  `Chương`, `Loại video: <1 tin AI tuần | 2 so sánh công cụ AI | 3 chủ đề: …>`,
  `TTS: remote · minh_quan · hook atempo=1.10`, `Hook`, `Ảnh`.
