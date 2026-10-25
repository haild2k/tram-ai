# Quy tắc TTS tiếng Việt cho `voiceText` (bảng đầy đủ)

Trích từ skill gốc `create-template-video` (repo AI-auto-generate-video) — áp dụng cho mọi `voiceText` của Trạm AI.


`voiceText` được OmniVoice (TTS tiếng Việt) đọc to. **Số và ký
hiệu bị đọc theo nghĩa đen** — vd "5.5" có thể thành "năm rưỡi" (sai cho số phiên
bản). Vì vậy **luôn viết số ra chữ tiếng Việt trong `voiceText`**. Còn `inputs`
(chữ hiển thị trên màn hình) thì GIỮ định dạng số đẹp kiểu Việt ("5.5" cho phiên bản, "82,7%", "4.500").

Bảng đầy đủ (áp dụng cho `voiceText`):

| Dạng số                  | SAI (TTS đọc nhầm)             | ĐÚNG (viết ra chữ)                                          |
| ------------------------ | ------------------------------ | ---------------------------------------------------------- |
| Phiên bản thập phân      | `GPT 5.5` → "năm rưỡi"         | `GPT năm chấm năm`                                         |
| Số liệu thập phân        | `82,7%` (phẩy = thập phân)     | `tám mươi hai phẩy bảy phần trăm`                          |
| Thập phân ngắn           | `4,5`                          | `bốn phẩy năm`                                             |
| Hàng nghìn               | `4.500` (chấm + 3 chữ số)      | `bốn nghìn năm trăm`                                       |
| Phiên bản số nguyên      | `iPhone 17`                    | `iPhone mười bảy` (hoặc `iPhone 17` cũng được)             |
| Phiên bản có chấm        | `iOS 18.2`                     | `iOS mười tám chấm hai`                                    |
| Thông số kỹ thuật        | `200MP`                        | `hai trăm megapixel`                                       |
| Pin                      | `5000mAh`                      | `năm nghìn miliampe giờ`                                   |
| Token                    | `1M tokens`                    | `một triệu token`                                         |
| Giá VND                  | `21 triệu đồng`                | `hai mươi mốt triệu đồng`                                  |
| Giá USD                  | `$5`                           | `năm đô la` (hoặc `năm đô`)                                |
| Bội số                   | `2x`                           | `gấp đôi` (tự nhiên hơn "hai lần")                         |
| Phần trăm                | `30%`                          | `ba mươi phần trăm`                                        |
| Thời gian                | `60 giây`                      | `sáu mươi giây`                                            |
| Tỉ lệ                    | `3:1`                          | `ba trên một` / `ba so với một`                           |

- Quy ước số kiểu Việt Nam (KHÔNG tuỳ chọn): dấu **phẩy `,` luôn là thập phân → đọc `phẩy`** (`4,5` → `bốn phẩy năm`, `3,50%` → `ba phẩy năm phần trăm`); dấu **chấm `.` + đúng 3 chữ số là hàng nghìn** (`4.500` → `bốn nghìn năm trăm`); chỉ dùng `chấm` cho phiên bản / dung tích máy (`iOS 18.2`, `2.0L`). Số từ nguồn tiếng Anh (`82.7%`, `1,234`) phải tự đổi theo nghĩa thật trước khi viết.
- Lưới an toàn: pipeline tự đổi chữ số còn sót trong `voiceText` theo đúng quy ước trên (`src/tts/vi-number.ts`) — vẫn phải viết số ra chữ, đừng dựa vào lưới này.
- Acronym tiếng Anh: `AI`/`GPT` thường OK; nếu đọc sai thì viết phiên âm `ây ai` / `gí pi tí`, `API` → `ây pi ai`.
- **`voiceText` TUYỆT ĐỐI KHÔNG có emoji/icon, không có URL** và không có `→ & % $ # + =` (giọng đọc sạch). Brand (Apple, OpenAI, TikTok) giữ nguyên. Kết câu bằng `.` hoặc `?` để có ngắt nghỉ tự nhiên.
- **`inputs` (chữ HIỂN THỊ trên màn hình) ĐƯỢC PHÉP dùng emoji/icon** để sinh động (🔥 🚀 ✨ ⚡ 📈 ⚠️ → …) — render màu OK. Giữ định dạng số đẹp ("5.5", "82%"). Tách biệt hoàn toàn với voiceText.
  - Dùng emoji **vừa phải** (0–1 icon mỗi field, đặt ở nhãn/headline/CTA ngắn — vd kicker "🔥 Tin nóng", cta "Theo dõi ngay →"). ĐỪNG nhét emoji vào chữ lớn pop từng ký tự (vd `hero` của build-minimal) vì sẽ vỡ animation.

