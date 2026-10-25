# Hợp đồng layout — `template-scaffold-long.html` (16:9, 1920×1080)

Scaffold dài = scaffold của `tram-ai-template-video` **+ 4 layout mới**
cho video tổng hợp / so sánh. Canvas đã là **1920×1080 gốc** — KHÔNG đổi canvas.
Chỉ được chỉnh: bảng màu `--bg1 --bg2 --accent1 --accent2` trong khối `#root`,
và (tuỳ chọn) cặp font Google phủ tiếng Việt. KHÔNG sửa `<script>`, `@keyframes`,
`animation:`. Mọi entrance đã settle ≤ ~1,9s (không giật cuối cảnh).

Ảnh luôn là đường dẫn tương đối `assets/img-<N>.jpg` (file đã copy vào `<TPL>/assets/`).

## Layout kế thừa (giữ nguyên slot như `tram-ai-template-video`)

| layout | dùng trong video dài khi |
| --- | --- |
| `image-full` | **hook** (bắt buộc), cảnh "chuyện gì vừa xảy ra" có ảnh mạnh |
| `split` | ảnh nội thất / màn hình / chi tiết + 1 ý giải thích |
| `text` | nhận định, chốt ý cuối chương |
| `stat` | 1 con số nổi bật (giá, doanh số, tầm hoạt động…) |
| `list` | mục lục đầu video, "tin nhanh khác", "ai nên mua gì" (≤5 item) |
| `quote` | phát biểu của hãng / chuyên gia / đánh giá báo (có `attr` = nguồn) |
| `outro` | cảnh cuối (logo + socials Trạm AI) |
| `hero` | chỉ dùng khi hook không có ảnh nào phù hợp (ghi lý do) |

## Layout mới

### `chapter` — thẻ mở chương

```json
{ "layout": "chapter", "index": "02", "kicker": "Phần 2",
  "headline": "Cuộc chiến {SUV hạng C}",
  "body": "Ba cái tên nóng nhất tuần, đặt lên bàn cân giá, sức mạnh và trang bị.",
  "foot_left": "Trạm AI" }
```

- `index`: 2 chữ số `"01"`…`"09"`. `headline` ≤ ~36 ký tự. `body` ≤ 1 câu.
- Cảnh `chapter` mở mỗi chương; `voiceText` ngắn (10–20 từ) dẫn vào chương.

### `compare` — bảng so sánh 2–4 cột

```json
{ "layout": "compare", "kicker": "SUV hạng C · Bảng so sánh",
  "headline": "Ai {đáng tiền} nhất?",
  "columns": [
    { "name": "VinFast VF 8", "tag": "Điện",   "image": "assets/img-3.jpg", "image_focus": "50% 60%" },
    { "name": "Mazda CX-5",   "tag": "Xăng",   "image": "assets/img-7.jpg" },
    { "name": "Honda CR-V",   "tag": "Hybrid", "image": "assets/img-9.jpg" }
  ],
  "rows": [
    { "label": "Giá niêm yết", "values": ["1,02 tỷ", "749 tr", "1,03 tỷ"], "best": 1 },
    { "label": "Công suất",    "values": ["402 hp", "188 hp", "204 hp"],  "best": 0 },
    { "label": "Tầm hoạt động","values": ["471 km", "—", "—"] },
    { "label": "Bảo hành",     "values": ["10 năm", "5 năm", "5 năm"],    "best": [0] }
  ],
  "note": "Nguồn: trang hãng, VnExpress · giá tham khảo, chưa gồm lăn bánh",
  "foot_left": "Trạm AI" }
```

- `columns`: 2–4 cột. `name` ≤ ~16 ký tự, `tag` (tuỳ chọn) ≤ ~10 ký tự (nhiên
  liệu / phiên bản). `image` tuỳ chọn — có ít nhất 1 cột có ảnh thì hiện hàng ảnh
  thumbnail; khi có ảnh, **tối đa 5 hàng**; không ảnh thì tối đa 6 hàng.
- `rows[].values`: đúng thứ tự `columns`, mỗi ô ≤ ~12 ký tự (viết gọn: `1,02 tỷ`,
  `749 tr`, `402 hp`, `471 km`, `6,2 L/100km`). Thiếu dữ liệu → `"—"` (KHÔNG bịa).
- `rows[].best`: chỉ số cột (0-based) hoặc mảng chỉ số → ô được tô accent + ★.
  Chỉ đánh `best` khi so sánh **khách quan** được (giá thấp hơn, công suất cao
  hơn, bảo hành dài hơn…). Tiêu chí chủ quan / hoà → bỏ `best`.
- `note`: dòng nguồn + lưu ý (giá tham khảo, thời điểm). BẮT BUỘC có nguồn.
- `voiceText` cảnh compare KHÔNG đọc lại cả bảng — chỉ đọc 2–3 điểm khác biệt
  đáng chú ý nhất + kết luận ngắn.

### `vs` — đối đầu 2 sản phẩm

```json
{ "layout": "vs", "kicker": "Đối đầu tuần này",
  "left":  { "image": "assets/img-3.jpg", "image_focus": "40% 60%", "name": "VinFast VF 8", "sub": "từ 1,02 tỷ" },
  "right": { "image": "assets/img-7.jpg", "name": "Mazda CX-5", "sub": "từ 749 triệu" } }
```

- Mỗi bên BẮT BUỘC có `image` (ảnh ngoại thất rõ xe, không chữ). `name` ≤ ~18
  ký tự, `sub` ≤ ~22 ký tự (giá / điểm nhấn). `badge` tuỳ chọn thay chữ `VS`.
- Không có `headline` / `foot_*` (ảnh phủ kín 2 nửa). Dùng ngay trước cảnh
  `compare` của cặp đó để "set up" cuộc so tài.

### `spec` — thẻ thông số 1 sản phẩm

```json
{ "layout": "spec", "image": "assets/img-3.jpg", "image_focus": "50% 55%",
  "badge": "Mới ra mắt", "kicker": "SUV hạng C",
  "headline": "VinFast {VF 8} Premium",
  "specs": [
    { "label": "Giá niêm yết", "value": "1,02 tỷ" },
    { "label": "Động cơ", "value": "2 mô-tơ điện" },
    { "label": "Công suất", "value": "402 hp" },
    { "label": "Tầm hoạt động", "value": "471 km" },
    { "label": "Bảo hành", "value": "10 năm" }
  ],
  "foot_left": "Trạm AI", "foot_right": "Nguồn: VinFast" }
```

- Ảnh chiếm nửa trái; nửa phải: `badge` (tuỳ chọn: `Mới ra mắt`, `Giảm giá`,
  `Bản nâng cấp`, `Sắp về VN`…), `kicker` (phân khúc), `headline` (tên xe ≤ ~26
  ký tự), `specs` ≤ 6 dòng, `value` ≤ ~18 ký tự.
- `foot_right` = `"Nguồn: <tên nguồn chính>"` (cảnh dữ liệu ĐƯỢC ghi nguồn ở
  footer; vẫn cấm ngày tháng).

## Nhịp layout gợi ý cho 1 chương "sản phẩm nổi bật"

`chapter` → `image-full` (chuyện gì xảy ra) → `spec` → `stat`/`split`/`quote`
(1–3 cảnh điểm nhấn) → `vs` → `compare` → `text` (nhận định chốt chương).

Không để 2 cảnh cùng layout ảnh lớn (`image-full`/`vs`) đứng liền nhau; cùng một
ảnh không làm hình chính ở 2 cảnh liên tiếp (ảnh thumbnail nhỏ trong `compare`
thì được tái dùng).
