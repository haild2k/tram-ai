# Research đa nguồn cho video dài Trạm AI (khung N ngày gần nhất)

Mục tiêu: `<outputDir>/research.md` đủ để viết kịch bản **không phải đoán** bất
kỳ con số nào. Mọi số liệu lên màn hình / vào lời đọc phải truy được về ≥ 1 URL
trong file này. (Bản chuyển thể của `tram-ai-skill/reference/research-ai.md`
cho chủ đề AI — cấu trúc file đầu ra giữ nguyên.)

## 1. Khung thời gian

```bash
UNTIL=$(date +%F)
SINCE=$(date -d "-${DAYS:-7} days" +%F)
```

- "Tin trong tuần" = **ngày công bố ∈ [SINCE, UNTIL]** (ngày trên bài blog chính
  chủ / `datePublished`). Không xác định được ngày → chỉ dùng làm bối cảnh.
- Thông số / giá của **đối thủ** được lấy từ nguồn cũ hơn khung thời gian, nhưng
  phải là giá / phiên bản **đang áp dụng** tại `UNTIL` (ưu tiên trang pricing / docs
  chính chủ, ghi "giá tại thời điểm <UNTIL>").

## 2. Thu thập (vòng rộng) — 6–12 truy vấn, ≥ một nửa tiếng Anh

- **`tin-ai`**: `AI news this week`, `new AI model release <Month> <YYYY>`,
  `<OpenAI|Anthropic|Google|Meta|xAI|DeepSeek|Mistral|Alibaba Qwen> announces`,
  `AI model benchmark <model>`, `tin AI mới nhất tuần này`, `trí tuệ nhân tạo ra mắt tháng <M>`.
- **`cong-cu`**: `best AI <nhóm> tools <YYYY> comparison`, `<tool> pricing`,
  `<tool> new feature <Month> <YYYY>`, `so sánh <tool A> và <tool B>`,
  `<nhóm> AI miễn phí tiếng Việt`.
- **`chu-de`**: `<chủ đề tiếng Anh> news <Month> <YYYY>`, `<chủ đề> latest`,
  `<chủ đề tiếng Việt> mới nhất`, + 1–2 truy vấn nhắm số liệu (thị phần, khảo sát,
  báo cáo).

| Loại nguồn | Nguồn |
| --- | --- |
| Chính chủ (số liệu, benchmark, giá — nguồn chính) | openai.com (blog, pricing, model docs), anthropic.com (news, pricing), blog.google · deepmind.google · ai.google.dev, ai.meta.com, microsoft.com / blogs, nvidia.com/newsroom, x.ai, mistral.ai, deepseek.com, qwenlm / alibabacloud, huggingface.co (model card), arXiv (technical report) |
| Báo công nghệ quốc tế | theverge.com, techcrunch.com, arstechnica.com, wired.com, reuters.com/technology, bloomberg.com, venturebeat.com, the-decoder.com |
| Bảng xếp hạng / đo lường độc lập | lmarena.ai (Chatbot Arena), artificialanalysis.ai, epoch.ai, paperswithcode / benchmark chính thức |
| Báo Việt (bối cảnh VN, giá VNĐ, có ở VN không) | vnexpress.net/so-hoa, genk.vn, ictnews.vietnamnet.vn, znews.vn/cong-nghe, tuoitre.vn/nhip-song-so, dantri.com.vn/cong-nghe |

`WebFetch` từng bài: tiêu đề, **ngày đăng**, dữ kiện cụ thể (mỗi dòng 1 dữ kiện),
URL ảnh nội dung + caption. Không dùng bài PR / affiliate làm nguồn duy nhất cho
nhận định; không dùng thread mạng xã hội trừ tài khoản chính thức của hãng.

## 3. Chọn mục NỔI BẬT (3–6, mặc định 4)

| Tiêu chí | Điểm |
| --- | --- |
| Số nguồn độc lập đưa tin trong khung | +1 / nguồn (tối đa +4) |
| Ra mắt / phát hành chính thức (dùng được ngay hoặc có ngày cụ thể) | +3 |
| Ảnh hưởng người dùng phổ thông / người Việt (miễn phí, có tiếng Việt, có ở VN) | +2 |
| Thay đổi giá / gói lớn (miễn phí hoá, giảm ≥ 20%, gói mới) | +2 |
| Có đối thủ rõ ràng để so sánh bằng số liệu | +2 |
| Chỉ là tin đồn / rò rỉ / demo chưa phát hành | −2 (vẫn có thể vào "Tin nhanh" có nhãn) |

Lấy top N; user chỉ định sản phẩm / chủ đề → ưu tiên tuyệt đối. Còn lại → **Tin
nhanh** (3–5 dòng).

**Điều kiện dừng**: < 2 mục nổi bật có ≥ 2 nguồn → báo user "chưa đủ tin có nguồn
để làm video so sánh", liệt kê những gì tìm được, DỪNG.

## 4. Nhóm + đối thủ

Mỗi mục: **nhóm** (LLM đa năng · mô hình lập trình · tạo ảnh · tạo video · giọng
nói · tìm kiếm AI · AI trên thiết bị · chip AI…) + **2–3 đối thủ đang cung cấp
thật**, cùng hạng (flagship ↔ flagship, bản nhỏ ↔ bản nhỏ, miễn phí ↔ miễn phí).
Nhiều mục cùng nhóm → gộp 1 bảng.

## 5. Bảng so sánh

Mỗi nhóm 1 bảng, cột = sản phẩm, hàng = 5–8 tiêu chí có dữ liệu cho đa số cột
(lên màn hình 4–6):

- LLM / chatbot: ngày phát hành · cửa sổ ngữ cảnh (token) · giá API vào / ra (USD
  / 1M token) · gói thuê bao người dùng (USD / tháng) · benchmark chính thức (ghi tên
  bài test) · đa phương thức (ảnh / giọng / video) · có ở Việt Nam / tiếng Việt.
- Công cụ tạo ảnh / video: độ phân giải / thời lượng tối đa · giá gói · giới hạn bản
  miễn phí · bản quyền thương mại · nền tảng.

Quy tắc số liệu:
- Mỗi ô có chỉ số nguồn `[S#]`. Chính chủ > bảng xếp hạng độc lập > báo.
- Benchmark do hãng tự công bố → ghi "(hãng công bố)"; điểm khác cấu hình
  (pass@1 vs pass@k, có / không dùng công cụ) → không đặt chung hàng.
- Mâu thuẫn → ghi cả hai, dùng chính chủ, chú thích. Không có → `—`.
- "Dự kiến", "rò rỉ", "theo tin đồn" → gắn nhãn; KHÔNG đưa vào `compare` như số
  chính thức.
- Đơn vị nhất quán trong 1 hàng (không trộn token với từ, USD với VNĐ).

## 6. Định dạng `research.md`

```markdown
# Research — <chủ đề> · <SINCE> → <UNTIL> · TYPE=<tin-ai|cong-cu|chu-de>

## Nguồn
- [S1] <tiêu đề> — <domain> — <ngày đăng> — <URL>

## Mục nổi bật (đã chấm điểm)
1. **<tên>** — <nhóm> — điểm <x> — <1–2 câu: chuyện gì xảy ra> [S1][S4]
   - Điểm nhấn: … [S1]
   - Đối thủ: <A>, <B>, <C>

## Bảng so sánh — <nhóm>
| Tiêu chí | <SP1> | <SP2> | <SP3> |
| --- | --- | --- | --- |
| Giá API vào/ra | $3 / $15 [S2] | $2,5 / $10 [S7] | — |
Ghi chú mâu thuẫn / nhãn "hãng công bố", "dự kiến": …

## Tin nhanh
- <tin> [S9]

## Ảnh ứng viên
- <sản phẩm> — <URL ảnh> — <trang nguồn> — <license nếu biết>

## Nhận định (rút từ dữ liệu, không bịa)
- Nên dùng gì: …
```

Viết xong `research.md` mới sang dàn ý. Kịch bản chỉ dùng thông tin trong file này.
