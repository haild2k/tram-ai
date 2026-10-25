---
name: media-long-remote-skill
description: Làm VIDEO DÀI 16:9 (6–10 phút, có chương) dạng TỔNG HỢP + SO SÁNH thông tin nổi bật trong N ngày gần nhất (mặc định 7 ngày) về XE, theo 1 trong 3 LOẠI VIDEO do user chỉ định — Loại 1 "xe xăng" (xe xăng mới trong tuần + so sánh giá cùng phân khúc), Loại 2 "VinFast" (giá mới, thay đổi mới, công nghệ / thiết kế mới của VinFast), Loại 3 "hybrid" (giá xe hybrid, so sánh giá cùng phân khúc, công nghệ hybrid mới). Giọng đọc CỐ ĐỊNH `minh_quan` cho mọi video. Claude tự crawl nhiều nguồn trên mạng (báo chuyên mục, trang chính chủ, số liệu thị trường), lọc đúng khung thời gian, chọn 3–6 mục nổi bật, dựng bảng thông số so sánh có nguồn (research.md), viết kịch bản nhiều chương, dựng template động 16:9 có layout bảng so sánh / đối đầu VS / thẻ thông số / thẻ chương, TTS OmniVoice qua SERVER TỪ XA (http://14.178.142.29:13562), render rồi TỰ ĐỘNG sinh youtube.md (kèm mốc thời gian chương + nguồn) / facebook.md / tiktok.md + thumbnail → LUÔN DỪNG CHỜ USER DUYỆT từng video → chỉ khi user duyệt rõ ràng mới đăng YouTube (video dài) + Facebook (video thường); TikTok TẠM DỪNG ĐĂNG nhưng vẫn sinh tiktok.md. Trigger khi user muốn "làm video xe xăng tuần này", "làm video VinFast", "làm video xe hybrid", "làm video loại 1/2/3", "làm video tổng hợp tin xe tuần này", "video so sánh xe cùng phân khúc", "bản tin tuần dạng so sánh". Input: loại video (1 xe xăng · 2 VinFast · 3 hybrid) (+ tuỳ chọn: phân khúc, số ngày, ảnh/URL).
---

# Long-form Roundup & Compare Pipeline — Remote TTS (media-long-remote-skill)

Anh em của `media-remote-skill`: **cùng hạ tầng** (TTS OmniVoice qua server từ
xa, template động HyperFrames, thumbnail ghép ảnh + tiêu đề, tự đăng YouTube +
Facebook, sinh sẵn `tiktok.md`) — riêng skill này **LUÔN CÓ bước duyệt trước khi đăng** (Bước 11b) — nhưng **khác về bản chất video**:

| | `media-remote-skill` | `media-long-remote-skill` (skill này) |
| --- | --- | --- |
| Đầu vào | 1 bài/nội dung + ảnh | **1 loại video xe** (xăng / VinFast / hybrid) — Claude tự crawl **nhiều nguồn** trong **N ngày gần nhất** |
| Giọng | chọn theo tông | **cố định `minh_quan`** cho mọi video |
| Dạng nội dung | kể 1 tin | **tổng hợp** nhiều tin nổi bật + **so sánh** cùng phân khúc |
| Thời lượng | ~90–120s, 8–12 scene | **6–10 phút, 30–60 scene, chia chương** |
| Tỉ lệ | hỏi 9:16 / 16:9 | **luôn 16:9** (không hỏi) |
| Sinh video | gọi `tram-ai-template-video` | **tự chạy** các bước tương đương (skill con bị giới hạn 8–12 scene) với scaffold riêng `reference/template-scaffold-long.html` |
| Layout thêm | — | `chapter`, `compare` (bảng), `vs` (đối đầu), `spec` (thẻ thông số) |
| Đăng | Short/Reel hoặc video dài | **YouTube video dài** (có chapters) + **Facebook video thường** |

> ## ⚠️ CHẾ ĐỘ HIỆN TẠI (giống `media-skill`)
>
> 1. **TikTok TẠM DỪNG ĐĂNG — nhưng VẪN sinh `tiktok.md`** (teaser ngắn để dành).
>    KHÔNG gọi `upload-tiktok-video`. Đăng công khai chỉ YouTube + Facebook.
> 2. **BẮT BUỘC DUYỆT TỪNG VIDEO TRƯỚC KHI ĐĂNG** (yêu cầu cố định của user).
>    Bước 1–11 vẫn chạy tự động, không hỏi gì (kể cả chọn phân khúc — tự chọn
>    theo research); câu hỏi duy nhất được phép là hỏi **loại video** khi user
>    chưa nói (xem mục "Ba loại video xe"). Sau khi có đủ `video.mp4` +
>    `youtube.md` + `facebook.md` + `tiktok.md` + `thumbnail.png` → **Bước 11b:
>    DỪNG, gửi bản duyệt cho user và CHỜ**. Chỉ sang Bước 12 (upload) khi user
>    duyệt rõ ràng. Làm nhiều video trong một lượt → mỗi video duyệt riêng,
>    không gộp duyệt, không đăng video nào chưa được duyệt.
> 3. **Giọng đọc CỐ ĐỊNH `minh_quan`** (giọng clone trên server từ xa, tốc độ
>    1.0) cho mọi cảnh, mọi loại video. Không chọn giọng theo tông.

```
OMNIVOICE_ENDPOINT = http://14.178.142.29:13562
```

> User chỉ định endpoint khác → dùng giá trị user đưa.

## Input

- **Loại video** (bắt buộc, do user nói): `1` / "xe xăng" · `2` / "VinFast" ·
  `3` / "hybrid" — xem mục **Ba loại video xe** ngay dưới. User chưa nói loại
  nào → hỏi đúng 1 câu ngắn ("Làm loại nào: 1 xe xăng, 2 VinFast hay 3
  hybrid?") rồi dừng chờ; KHÔNG tự đoán, KHÔNG làm cả 3. User nói nhiều loại →
  làm lần lượt từng video, mỗi video qua Bước 11b riêng.
- Tuỳ chọn (không có thì dùng mặc định, KHÔNG hỏi):
    - **Khung thời gian** `DAYS` — mặc định `7` (tính lùi từ hôm nay).
    - **Phân khúc / sản phẩm ưu tiên** — có thì ưu tiên tuyệt đối khi chọn mục nổi bật.
    - **Thị trường** — mặc định Việt Nam (giá VNĐ, xe đang bán tại VN).
    - **Số mục nổi bật** — mặc định 4 (khoảng 3–6).
    - **Thời lượng mục tiêu** — mặc định 6–10 phút.
    - **Ảnh / URL bài** user đưa — ưu tiên dùng trước ảnh crawl.

## Ba loại video xe

Mọi bước (research → dàn ý → ảnh → template → script → pipeline → duyệt → đăng)
giống nhau; loại video chỉ đổi **phạm vi tin**, **cách chọn mục nổi bật**,
**trục so sánh**, màu template và từ khoá đăng. Ghi `TYPE` (`xang` / `vinfast`
/ `hybrid`) và dùng xuyên suốt.

| | Loại 1 — `xang` | Loại 2 — `vinfast` | Loại 3 — `hybrid` |
| --- | --- | --- | --- |
| Nội dung | Xe **xăng / dầu** mới trong tuần (ra mắt, mở bán, về đại lý, bản nâng cấp, giá mới) + **so sánh giá** với xe cùng phân khúc | Tin **VinFast**: **giá xe mới** / ưu đãi / chính sách (pin, sạc, bảo hành), **thay đổi mới** (phiên bản, trang bị, mẫu mới), **công nghệ & thiết kế mới** | **Giá xe hybrid** (HEV, PHEV, mild-hybrid) đang bán tại VN, **so sánh giá cùng phân khúc**, **công nghệ hybrid mới** (hệ truyền động, pin, mức tiêu hao) |
| Lọc mục nổi bật | Chỉ xe dùng động cơ đốt trong thuần. **Loại** xe điện (kể cả VinFast) và xe hybrid — để cho Loại 2 / 3 | Chỉ VinFast (ô tô; xe máy điện VinFast chỉ vào "Tin nhanh") | Chỉ bản hybrid / PHEV / mild-hybrid. Xe có cả bản xăng lẫn hybrid → chỉ xét bản hybrid |
| Đối thủ / trục so sánh | 2–3 xe **xăng** cùng phân khúc, tầm giá ± ~20%; trục chính **giá niêm yết + ưu đãi**, phụ: công suất, tiêu hao, trang bị | (a) **trước ↔ sau** (giá cũ ↔ giá mới, bản cũ ↔ bản mới) và (b) 1–2 đối thủ cùng tầm giá (xe điện hoặc xăng đang bán chạy) | (a) hybrid ↔ hybrid cùng phân khúc, (b) **chênh giá hybrid ↔ bản xăng** cùng mẫu + tiêu hao L/100km (bao lâu "hoà vốn" chỉ khi số liệu có nguồn, không tự ước lượng) |
| Nguồn ưu tiên thêm | trang hãng xe xăng (Toyota, Honda, Mazda, Hyundai, Kia, Ford, Mitsubishi…) | vinfastauto.com, newsroom / thông cáo VinFast, fanpage chính thức, báo lớn | trang hãng có bản hybrid (Toyota, Honda, Lexus, Suzuki, Hyundai, Kia, BYD PHEV…), báo lớn |
| Mục nổi bật khi tuần ít tin | giữ điều kiện dừng chuẩn | tin tuần < 2 mục → **tự mở rộng `DAYS=14` một lần** (ghi rõ ở research.md, lời đọc nói "hai tuần qua"); vẫn thiếu → dừng | được bổ sung mục "**bảng giá hybrid tháng này**" (giá đang áp dụng, có nguồn) làm 1 mục nổi bật khi tin trong tuần < 3 mục |
| Chương đặc thù | như khung chuẩn Bước 2 | "Bảng giá VinFast mới" (`compare` giá cũ/giá mới) · "Công nghệ & thiết kế mới" (`spec`/`split`/`image-full`) | "Bàn cân hybrid <phân khúc>" · "Hybrid hay bản xăng?" (`vs` hybrid ↔ xăng cùng mẫu) |
| Màu template (`--accent1/2`) | xanh thép + cam | xanh dương VinFast + bạc/trắng | xanh lá + cyan |
| Câu mở hook (lời đọc) | "Điểm tin xe xăng tuần này." | "Điểm tin VinFast tuần này." | "Điểm tin xe hybrid tuần này." |
| Kicker hook (hình) | `TIN XE XĂNG TUẦN 27/9 – 3/10` | `VINFAST TUẦN 27/9 – 3/10` | `XE HYBRID TUẦN 27/9 – 3/10` |
| Slug | `xe-xang-tuan-<d-m>` | `vinfast-tuan-<d-m>` | `xe-hybrid-tuan-<d-m>` |
| Mở tiêu đề YouTube / FB | `Tin xe xăng tuần: …` | `VinFast tuần này: …` | `Xe hybrid tuần này: …` |
| Hashtag / tag riêng (thêm vào nhóm bản tin) | `#xexang #giaxe #sosanhxe` · tags `xe xăng mới, giá xe xăng` | `#vinfast #giaxevinfast #xedien` · tags `vinfast, giá xe vinfast, vinfast mới nhất, xe điện vinfast` | `#xehybrid #hybrid #giaxe` · tags `xe hybrid, giá xe hybrid, xe hybrid tiết kiệm xăng, so sánh xe hybrid` |

Loại 2 với chủ đề "giá mới": mọi giá cũ/giá mới phải cùng phiên bản, cùng điều
kiện (có/không pin, có/không ưu đãi) và có nguồn cho CẢ hai số; ưu đãi có thời
hạn → nói rõ "đến hết <tháng>" bằng lời ("đến hết tháng này"), không đọc ngày cụ thể.

## Workflow

### Bước 0: Kiểm tra TTS remote + chọn giọng

```bash
curl -s -m 10 http://14.178.142.29:13562/health
```

- `{"status":"ok","voices":[...,"minh_quan",...]}` → đi tiếp. Lỗi / không phản
  hồi → in nguyên lỗi, báo "service TTS từ xa (omni_voice_mcrs) đang không phản
  hồi", **DỪNG** (không fallback local, không research trước cho tốn công).
- Giọng **luôn là `minh_quan`** (`voice.name = "minh_quan"`, `speed = 1.0`).
  `voices` không có `minh_quan` → báo user "server TTS không còn giọng
  minh_quan", **DỪNG** — KHÔNG tự đổi sang giọng khác / `default`.

Ghi nhớ: `TYPE` (mục Ba loại video xe), `DATE=$(date +%F)`, `SINCE`/`UNTIL` (xem `reference/research.md` §1),
`slug` (theo cột Slug của loại video, ASCII không dấu, ≤40 ký tự, vd `xe-xang-tuan-27-9-3-10`), `timestamp`
`YYYYMMDD-HHmm`. **`outputDir = videos/_render/<slug>-<timestamp>/`** trong lúc dựng;
chuyển sang thư mục lưu trữ `videos/long/<DATE>/` ở Bước 7.

### Bước 1: Research đa nguồn → `research.md`

Làm **đúng `reference/research.md`** (đọc file đó; §2b = truy vấn riêng theo
`TYPE`, lọc mục nổi bật theo hàng "Lọc mục nổi bật" của loại video): khung thời gian, truy vấn,
nguồn ưu tiên, chấm điểm chọn 3–6 mục nổi bật, xác định phân khúc + 2–3 đối thủ,
bảng thông số có chỉ số nguồn `[S#]`, mục Tin nhanh, ảnh ứng viên. Ghi ra
`<outputDir>/research.md`.

- Mọi con số trong video phải có trong `research.md` kèm nguồn. Không có → `—`
  hoặc bỏ, **không bịa, không ước lượng**.
- Điều kiện dừng: < 2 mục nổi bật có ≥ 2 nguồn → báo user + liệt kê những gì tìm
  được, DỪNG (không làm video "độn").
- In ra chat 3–6 dòng: các mục nổi bật đã chọn + phân khúc + đối thủ (thông báo
  tiến độ, KHÔNG chờ phản hồi).

### Bước 2: Dàn ý chương

Khung chuẩn (điều chỉnh theo số mục nổi bật; thêm các "Chương đặc thù" của
loại video ở mục Ba loại video xe):

| # | Chương (`chapter`) | Cảnh | Layout gợi ý |
| --- | --- | --- | --- |
| 0 | Mở đầu | hook + bản đồ so sánh | `image-full` (hook) → `list` ("Hôm nay so với ai", mỗi item = 1 xe chính + các đối thủ sẽ đặt cạnh nó) |
| 1…N | `<Tên mục nổi bật>` | 5–8 cảnh / mục | `chapter` → `image-full` → `spec` → 1–3 × `stat`/`split`/`quote` → `vs` → `compare` → `text` |
| N+1 | Bàn cân phân khúc (nếu ≥ 2 mục cùng phân khúc, hoặc cần bảng tổng) | 2–4 | `chapter` → `compare` (≤4 cột) → `text` |
| N+2 | Tin nhanh | 1–3 | `chapter` → `list` (≤5 tin, mỗi tin 1 dòng) |
| N+3 | Kết luận: ai nên mua gì | 2–3 | `list` ("Nên chọn X nếu…") → `text` → `outro` |

- **30–60 scene**, tổng `voiceText` **~1.100–1.800 từ** (≈ 6–10 phút). Mỗi cảnh
  thân 25–45 từ, 1 ý / cảnh; cảnh `chapter` 10–20 từ.
- Chương "sản phẩm": chuyện gì xảy ra (ra mắt / giá mới / doanh số) → thông số
  chính → điểm nhấn & điểm yếu (cân bằng, có nguồn) → đặt cạnh đối thủ → nhận
  định ngắn "hợp với ai".
- Lời dẫn chuyển chương tự nhiên ("Rời phân khúc C, sang cuộc chơi xe điện cỡ
  nhỏ…"), không lặp khuôn "Tiếp theo là…".
- Nhận định so sánh phải rút từ số liệu (giá/thông số/bảo hành/ưu đãi) — giọng
  khách quan, không "chê" vô căn cứ, không kêu gọi mua; nhãn hàng tài trợ /
  quan điểm cá nhân → không có.

### Bước 3: Ảnh — thu thập, crawl, đọc hiểu, crop logo

Theo **`tram-ai-template-video` Step 3, 3B, 4** (đọc file đó) với các thay đổi:

- Thư mục: `<outputDir>/source-images/img-<N>.<ext>`; nguồn ảnh ghi
  `source-images/CREDITS.md`. Ưu tiên: ảnh user → ảnh trong bài nguồn (đã liệt
  kê ở research.md) → **ảnh chính chủ hãng** (trang sản phẩm / press kit) →
  Wikimedia Commons → báo lớn. Tránh ảnh stock watermark.
- Mục tiêu **15–30 ảnh**: mỗi sản phẩm (cả đối thủ) **≥ 1 ảnh ngoại thất rõ xe**
  (cho `spec` / `vs` / thumbnail cột `compare`); sản phẩm nổi bật thêm 1–3 ảnh
  (nội thất, chi tiết, sự kiện ra mắt). Mỗi ảnh khi `Read` phải xác nhận **đúng
  model + đúng thế hệ/phiên bản** (nhầm đời xe là lỗi nặng) — sai → loại, tìm lại
  (tối đa 2 lần), hết lượt thì cảnh đó dùng layout chữ (`compare` không ảnh,
  `text`, `stat`).
- **Crop logo / watermark nguồn khác**: làm y hệt `media-remote-skill` mục **1f**
  (giữ bản gốc ở `source-images/_raw/`, bảng biểu thức `crop`, quy tắc bỏ ảnh
  nếu cắt mất chủ thể). Logo **hãng xe trên thân xe** là một phần sản phẩm —
  KHÔNG cắt.
- Ghi bảng đọc hiểu ảnh (`caption_vi`, `role`, `focus`, `beat` = sản phẩm/cảnh,
  `tone`) như Step 4.

### Bước 4: Template động 16:9

1. `TPL = templates/_dyn/<slug>-<timestamp>`; `mkdir -p <TPL>/assets`.
2. Copy từ `.claude/skills/tram-ai-skill/reference/long-template/`:
   `template-scaffold-long.html` → `<TPL>/index.html`, `hyperframes.json`,
   `meta.json` (sửa `"id"` = `<slug>-<timestamp>`).
3. **KHÔNG đổi canvas** (đã 1920×1080). Chỉ chỉnh `--bg1 --bg2 --accent1
   --accent2` (theo hàng "Màu template" của loại video) và
   tuỳ chọn font phủ tiếng Việt. KHÔNG sửa `<script>` / `@keyframes` /
   `animation:` (mọi chuyển động đã settle ≤ ~2,2s — chống giật cuối cảnh, như
   `media-remote-skill` mục 1h).
4. Copy ảnh đã chọn vào `<TPL>/assets/img-<N>.jpg` (+ `assets/logo.png` trong `.claude/skills/tram-ai-skill/assets/`
   cho outro).

Hợp đồng slot của mọi layout (kế thừa + 4 layout mới `chapter` / `compare` /
`vs` / `spec`, giới hạn ký tự, số cột/hàng): **`reference/layouts.md`**.

### Bước 5: `script.json`

```json
{
  "version": "1.0",
  "renderer": "hyperframes",
  "aspect": "16:9",
  "metadata": {
    "title": "<tiêu đề video>",
    "source": { "url": "", "domain": "tong-hop", "image": null },
    "channel": "Trạm AI"
  },
  "voice": { "provider": "omnivoice", "speed": 1.0, "name": "minh_quan" },
  "scenes": [ /* 30–60 scene */ ]
}
```

- Mỗi scene: `{ "id", "type", "voiceText", "templateId": "_dyn/<slug>-<timestamp>", "inputs": {...} }`
  + **`"chapter": "<tên chương>"` trên cảnh ĐẦU của mỗi chương** (trường phụ,
  pipeline bỏ qua; `scripts/chapters.py` dùng để tính mốc thời gian). Cảnh
  `scenes[0]` mang `"chapter": "Mở đầu"`. Tên chương ngắn ≤ 40 ký tự, vd
  `"VinFast VF 8 bản mới"`, `"Bàn cân SUV hạng C"`, `"Tin nhanh"`, `"Ai nên mua gì"`.
- `id` dạng `"01"`…`"60"` (đệm 2 chữ số để sắp xếp đúng). `type`: `hook` (cảnh
  đầu) · `body` · `outro` (cảnh cuối).
- **Hook** (`scenes[0]`): BẮT BUỘC `layout: "image-full"` với nền là **ảnh ghép
  (collage) các sản phẩm chính** — mỗi mục nổi bật 1 ô lớn có nhãn tên, KHÔNG
  dùng 1 ảnh đơn. Dựng bằng script (2–6 ảnh; 4 ảnh → lưới 2x2):

  ```bash
  python3 .claude/skills/tram-ai-skill/scripts/compose_collage.py \
      --out <outputDir>/source-images/img-hook.jpg \
      --item "<outputDir>/source-images/img-1.jpg|BMW M2|45% 50%" \
      --item "<outputDir>/source-images/img-5.jpg|Kia Carens Clavis|40% 52%" \
      --item "…|<tên mục 3>|<focus>" --item "…|<tên mục 4>|<focus>"
  cp <outputDir>/source-images/img-hook.jpg <TPL>/assets/
  ```

  - Thứ tự ô = thứ tự chương; mỗi ô dùng ảnh **ngoại thất rõ xe** nhất của mục
    đó (role `hero`/`subject`), `focus` đặt vào thân xe. Nhãn = tên ngắn (≤ 18
    ký tự).
  - Ảnh ghép chừa sẵn **dải tối 440px dưới cùng** (`--text-band`, mặc định)
    cho kicker + headline → chữ không đè lên xe. Vì vậy hook **bỏ slot `body`**
    (chỉ `kicker` + `headline`); nội dung `body` để lời đọc nói.
  - Slot: `image: "assets/img-hook.jpg"`, `image_focus: "50% 50%"`,
    `image_alt` liệt kê tên các xe, `foot_left = "Trạm AI"`, `foot_right` trống.
  - Chỉ có 1 mục có ảnh dùng được → mới quay về 1 ảnh đơn theo
    `media-remote-skill` mục **1g**.
  - Render xong PHẢI xem khung cuối hook (Bước 7): kicker/headline nằm trọn
    trong dải tối, nhãn tên không bị che; lệch thì tăng `--text-band`.

  Headline giật gân
  nhưng đúng sự thật (tin lớn nhất + lời hứa so sánh, vd `"Tuần xe {nóng nhất}
  năm: 4 mẫu mới đấu nhau"`).
  `voiceText` hook = **điểm tin nhanh từng sản phẩm chính**, kiểu đọc bản tin:
  1. Mở: theo hàng "Câu mở hook" của loại video ("Điểm tin xe xăng tuần này." /
     "Điểm tin VinFast tuần này." / "Điểm tin xe hybrid tuần này.").
  2. Mỗi mục nổi bật **đúng 1 câu rất ngắn** (4–8 từ), **theo thứ tự chương**,
     chỉ gồm TÊN XE + ý chính của tin (về Việt Nam / chốt giá / giảm giá / lộ
     diện / ra mắt…), **KHÔNG đọc giá, KHÔNG số liệu** — chi tiết để dành cho
     chương. Vd "BMW M hai về Việt Nam. Kia Carens Clavis chốt giá." — đọc
     dồn dập kiểu điểm tin. Đủ TẤT CẢ mục nổi bật (4 mục → 4 câu).
  3. Chốt 1 câu giữ chân hé lộ phần so sánh, vd "Xe nào đáng tiền nhất trong
     phân khúc? Cùng đặt lên bàn cân."
  Tổng 30–45 từ. Tên xe và ý chính phải khớp `research.md`. (Headline trên
  hình vẫn được dùng con số nổi bật, chỉ lời đọc là không.)
- **Cảnh 2 (ngay sau hook) KHÔNG lặp lại hook**: hook đã điểm tên + ý chính
  từng xe, nên cảnh 2 là **bản đồ so sánh** — mỗi item = 1 xe chính và các đối
  thủ nó sẽ được đặt cạnh (vd "BMW M2 · đấu M3, M4, Civic Type R"); `voiceText`
  nói video sẽ so với ai / so tiêu chí gì (giá, sức mạnh, trang bị), KHÔNG
  nhắc lại "về Việt Nam / chốt giá…". Thêm 1 item "Tin nhanh + gợi ý chọn xe"
  nếu còn chỗ (tối đa 5 item).
- **Ngày tháng**: ngoại lệ DUY NHẤT là `kicker` của hook được ghi khoảng tuần,
  theo hàng "Kicker hook" của loại video, vd `"TIN XE XĂNG TUẦN 27/9 – 3/10"` — ngày CHỈ hiển thị trên hình, **KHÔNG đọc
  ngày ra** trong `voiceText`. Câu mở đầu hook đọc theo "Câu mở hook" của loại video,
  rồi điểm nhanh từng sản phẩm chính (xem mục Hook ở trên). Mọi slot khác của mọi cảnh: KHÔNG ghi ngày
  cụ thể; `voiceText` mọi cảnh cũng không đọc ngày cụ thể — nói "tuần này",
  "tuần qua", "đầu tuần", "cuối tuần". KHÔNG đặt ngày vào `foot_left` /
  `foot_right` / `note`.
- **Footer nguồn**: cảnh dữ liệu (`spec`, `stat`, `quote`) ĐƯỢC đặt
  `foot_right = "Nguồn: <tên nguồn>"`; `compare` ghi nguồn ở `note`. `foot_left`
  = `"Trạm AI"` ở các cảnh có footer.
- **Số trên màn hình khớp tuyệt đối `research.md`** (cùng đơn vị, cùng làm tròn).
- **Outro**: `brand: "Trạm AI"`, `logo: "assets/logo.png"`, `tagline` mời theo
  dõi bản tin tuần sau, `socials[]` 3 kênh Trạm AI (như `tram-ai-template-video`).

#### Quy tắc TTS cho `voiceText` (BẮT BUỘC)

Toàn bộ quy tắc TTS tiếng Việt của `tram-ai-template-video` (số viết ra
chữ, không emoji/URL/ký hiệu `→ & % $ # + =`, kết câu `.`/`?`), cộng thêm cho
nội dung xe / sản phẩm:

| Hiển thị | `voiceText` |
| --- | --- |
| `1,02 tỷ` | `một tỷ không trăm hai mươi triệu đồng` |
| `749 tr` | `bảy trăm bốn mươi chín triệu đồng` |
| `402 hp` | `bốn trăm lẻ hai mã lực` |
| `350 Nm` | `ba trăm năm mươi Niu tơn mét` |
| `471 km` | `bốn trăm bảy mươi mốt ki lô mét` |
| `6,2 L/100km` | `sáu phẩy hai lít trên một trăm ki lô mét` |
| `87,7 kWh` | `tám mươi bảy phẩy bảy ki lô oát giờ` |
| `4,5` | `bốn phẩy năm` (dấu phẩy LUÔN là phần thập phân) |
| `4.500`, `70.085` | `bốn nghìn năm trăm`, `bảy mươi nghìn không trăm tám mươi lăm` (dấu chấm + 3 chữ số = hàng nghìn) |
| `30.340,9 tỷ` | `ba mươi nghìn ba trăm bốn mươi phẩy chín tỷ` |
| `VF 8`, `CX-5`, `CR-V` | `VF tám`, `CX năm`, `CR V` |
| `2.0L`, `1.5 Turbo` | `hai chấm không lít`, `một chấm năm tuốc bô` |
| `ADAS`, `SUV`, `MPV` | giữ nguyên chữ cái (`ADAS`, `SUV`) |

`voiceText` cảnh `compare` KHÔNG đọc cả bảng — chỉ 2–3 khác biệt lớn nhất + chốt.

Quy ước số kiểu Việt Nam (áp dụng cả khi viết `voiceText` lẫn lưới an toàn):
- Dấu **phẩy `,` LUÔN là phần thập phân** → đọc "phẩy": `4,5` → "bốn phẩy năm",
  `6,39` → "sáu phẩy ba mươi chín", `13,08` → "mười ba phẩy không tám" (phần
  thập phân ≤ 2 chữ số không bắt đầu bằng 0 đọc như số, còn lại đọc từng chữ số).
- Dấu **chấm `.` + đúng 3 chữ số là dấu tách hàng nghìn**: `4.500` → "bốn nghìn
  năm trăm", `1.234.567` → "một triệu hai trăm ba mươi tư nghìn năm trăm sáu
  mươi bảy".
- Dấu chấm theo sau KHÔNG phải đúng 3 chữ số → đọc "chấm" (phiên bản, dung
  tích máy): `1.5` → "một chấm năm", `2.0` → "hai chấm không".
- `%` ngay sau số → "phần trăm".
- Bỏ số 0 cuối vô nghĩa sau dấu phẩy: `3,50%` → "ba phẩy năm phần trăm".
- Mã / ký hiệu chữ + số, giờ, khoảng, đơn vị (`Nano S05`, `7h30`, `3-5 ngày`,
  `km/h`, `m²`…): đọc theo `media-remote-skill` mục **1j** (B4, B5).
- Số kiểu Anh **rõ ràng** (`1,234,567`, `1,234.5`, `25,000`) lưới an toàn tự đọc
  đúng giá trị; số kiểu Anh **mơ hồ** (`3.5%`, `1,234` — chỉ một dấu) bị hiểu theo
  quy ước Việt → phải tự đổi theo nghĩa thật khi viết.
- Lưới an toàn còn tự xử lý: ngày `24.10.2026` → "hai mươi tư tháng mười năm…",
  giờ `7h30` / `21:05` → "bảy giờ ba mươi", mã dính chữ `VF3` → "VF ba", số có
  `0` đầu (`S05`, số điện thoại) đọc từng chữ số.

Lưới an toàn: pipeline tự chuẩn hoá số còn sót trong `voiceText` theo đúng quy
ước trên trước khi gửi TTS (`src/tts/vi-number.ts`, gọi trong
`src/render/template-pipeline.ts`; test ở `src/tts/vi-number.test.ts`). Vẫn
phải viết số ra chữ như bảng trên — đừng dựa vào lưới an toàn (vd "1,02 tỷ" nên
viết "một tỷ không trăm hai mươi triệu đồng" cho tự nhiên hơn "một phẩy không
hai tỷ").

### Bước 6: Tự kiểm tra (sửa thầm tối đa 2 lần)

- `aspect = "16:9"`; 30–60 scene (schema pipeline cho tối đa 80); `scenes[0]`
  hook `image-full`, cảnh cuối `outro`; `id` không trùng.
- Có `chapter` ở `scenes[0]` + đầu mỗi chương; ≥ 3 chương; mỗi chương dự kiến
  ≥ 10s (≥ 2 cảnh hoặc 1 cảnh ≥ 30 từ).
- Mọi `templateId` = `_dyn/<slug>-<timestamp>`; mọi `image` (kể cả trong
  `columns[]`, `left`/`right`) trỏ tới file có thật trong `<TPL>/assets/`.
- `layout` ∈ danh sách `reference/layouts.md`; giới hạn cột/hàng/ký tự đúng;
  `compare` có `note` nguồn; `vs` cả 2 bên có ảnh.
- Mỗi con số trong `inputs` + `voiceText` tra được trong `research.md`.
- `voiceText` đúng quy tắc TTS (grep nhanh: không còn chữ số `[0-9]`, không
  `%`, `→`, emoji): `python3 -c "import json,re;[print(s['id'],m) for s in json.load(open('<outputDir>/script.json'))['scenes'] for m in re.findall(r'[0-9%→&\$#+=]',s['voiceText'])]"`
  phải không in gì (tên model như "CX năm" đã viết chữ).
- Ngày tháng: `grep -nE '[0-9]{1,2}/[0-9]{1,2}' <outputDir>/script.json` chỉ
  được ra dòng `kicker` của hook (và không dòng nào khác).
- Ảnh không có logo/watermark nguồn khác (đã crop ở Bước 3).

### Bước 7: Chạy pipeline (TTS remote) + tăng tốc hook

Chạy từ **gốc repo**:

```bash
OMNIVOICE_ENDPOINT=http://14.178.142.29:13562 npm run pipeline -- <outputDir>/script.json
```

- Video dài render lâu (~15–20s/scene → 40 scene ≈ 10–15 phút). Dùng Bash
  `timeout: 600000`; nếu có nguy cơ quá 10 phút → `run_in_background: true` và
  chờ thông báo hoàn tất (không poll). Clip + voice **idempotent** — chạy lại lệnh
  là tiếp tục từ chỗ dừng.
- Lỗi 1 scene → sửa `inputs` / ảnh của scene đó, xoá
  `<outputDir>/clips/scene-<id>.mp4`, chạy lại (giữ prefix endpoint).
- Sau lần chạy đầu: **tăng tốc riêng giọng hook** `atempo=1.10` rồi render lại —
  y hệt `media-remote-skill` mục **1e** (giữ prefix endpoint remote).
- Kiểm tra chống giật (như mục **1h**): trích 2 khung liền nhau quanh
  `t = <đầu cảnh> + 2,5s` của 1 cảnh `compare` và 1 cảnh `spec`; chênh lệch ~0.
- Xem nhanh (Read) khung cuối của 2–3 cảnh dữ liệu (`compare`, `spec`) để chắc
  chữ không tràn / không bị cắt:
  `ffmpeg -y -loglevel error -sseof -0.1 -i <outputDir>/clips/scene-<id>.mp4 -frames:v 1 /tmp/…/scene-<id>.png`
  → tràn thì rút gọn chữ / bớt hàng, xoá clip, render lại.

Xong → **chuyển thư mục lưu trữ**:

```bash
mkdir -p videos/long/<DATE>
mv videos/_render/<slug>-<timestamp> videos/long/<DATE>/
```

Từ đây `outputDir = videos/long/<DATE>/<slug>-<timestamp>/`.
`ASPECT = "16:9"` → `SHORT_FORM = false` cho mọi bước sau.

Pipeline lỗi không sửa được → in nguyên lỗi, DỪNG, không đăng gì.

### Bước 8: Mốc thời gian chương

```bash
python3 .claude/skills/tram-ai-skill/scripts/chapters.py --dir <outputDir>
```

Script tính mốc từ thời lượng thật của `clips/scene-*-fit.mp4` (khớp video cuối),
ghi `<outputDir>/chapters.txt`, tự gộp chương < 10s, cảnh báo nếu < 3 chương.
Chưa chèn vào `.md` ở bước này (Bước 9–10 mới có file).

### Bước 9: `youtube.md` (video dài)

1. Gọi `Skill` `create-youtube-content` với `outputDir`.
2. Chỉnh theo `media-skill` Bước 3 nhánh **16:9** (xoá mọi `#shorts` /
   `trendingshorts`, bỏ câu kiểu "xem trong 60 giây", description 2–4 đoạn).
3. Thêm cho video tổng hợp:
    - **Tiêu đề** BẮT BUỘC nêu **đủ tên TẤT CẢ sản phẩm chính** (các mục nổi
      bật = các ô trong ảnh ghép hook), theo thứ tự chương, mở bằng cụm "Mở
      tiêu đề" của loại video. Mẫu: `Tin xe xăng tuần: <Xe 1>, <Xe 2>, <Xe 3>, <Xe 4> – <móc ngắn>`,
      vd `Tin xe xăng tuần: BMW M2, Kia Carens Clavis, Mazda CX-90, MG5 mới – ai đáng tiền?`,
      `VinFast tuần này: VF 3 giảm giá, VF 6 bản mới, VF 8 nâng cấp – lợi bao nhiêu?`.
      **Ghi đè giới hạn 65 ký tự của `create-youtube-content`: cho phép tới 100
      ký tự** (giới hạn YouTube). Quá 100 → rút gọn tên (bỏ tên hãng nếu model
      đủ nhận diện: "Carens Clavis", "CX-90") rồi mới bỏ phần móc; KHÔNG được
      bỏ tên xe nào. Không giật tít sai.
    - Đoạn mở description tóm 3–4 mục nổi bật.
    - Khối **"📚 Nguồn tham khảo:"** — 4–8 nguồn chính (tên báo/hãng + URL) lấy từ
      `research.md`, đặt TRƯỚC khối "Theo dõi Trạm AI".
    - Dòng lưu ý: "Giá mang tính tham khảo, chưa gồm chi phí lăn bánh; vui lòng
      kiểm tra với đại lý." (với chủ đề xe; chủ đề khác viết tương đương).
    - **Từ khoá tìm kiếm của dạng bản tin tuần** (người xem hay gõ) — dùng
      cho cả hashtag lẫn Tags (chủ đề khác thay "xe/ô tô" bằng chủ đề tương ứng,
      vd "tin điện thoại mới nhất"):
        - Hashtag (lowercase, không dấu): `#tinxe #tinxetuan #tinoto
          #tinxemoinhat #xemoi #giaxe #giaxeoto #sosanhxe #otovietnam`
        - Tags: `tin xe tuần, tin xe, tin ô tô, tin xe mới nhất, tin ô tô mới
          nhất, tin xe hôm nay, xe mới ra mắt, giá xe ô tô mới nhất, so sánh xe`
          + tên từng model + phân khúc.
        - Cộng thêm hashtag / tag riêng của loại video (hàng cuối bảng Ba
          loại video xe); thiếu chỗ thì bỏ bớt hashtag chung, giữ hashtag riêng.
    - Dòng hashtag YouTube: `#trending #xuhuongyoutube #trend` → các hashtag
      bản tin ở trên → `#tramai` cuối; **tổng ≤ 15 hashtag** (YouTube bỏ qua
      TOÀN BỘ hashtag nếu quá 15). Tags ≤ 480 ký tự: thiếu chỗ thì bớt tên
      model trước, giữ nhóm từ khoá bản tin.
4. Chèn mốc thời gian:

   ```bash
   python3 .claude/skills/tram-ai-skill/scripts/chapters.py --dir <outputDir> --inject youtube.md
   ```

   (chèn khối `⏱ Mốc thời gian:` ngay trước "Theo dõi Trạm AI" trong mục Mô tả;
   chạy lại an toàn, không bị nhân đôi).
5. Kiểm tra mục Mô tả ≤ 5.000 ký tự (giới hạn YouTube) — dài quá thì rút bớt nguồn
   / đoạn văn, KHÔNG cắt khối mốc thời gian.

### Bước 10: `facebook.md` + `tiktok.md`

Theo `media-skill` Bước 4 nhánh **16:9** (facebook.md = video thường, mô tả dài
hơn được, không `#Shorts`/`#Reel`; khối CTA đúng 3 link; hashtag 3–5 cái,
`#TramAI` gần cuối — ưu tiên hashtag tìm kiếm của bản tin, vd `#tinxe #tinoto
#tinxemoinhat #TramAI #giaxe`). Tiêu đề `facebook.md` cũng phải nêu **đủ tên
tất cả sản phẩm chính** như tiêu đề YouTube (≤ ~100 ký tự). Thêm: chèn mốc thời gian vào facebook.md

```bash
python3 .claude/skills/tram-ai-skill/scripts/chapters.py --dir <outputDir> --inject facebook.md
```

`tiktok.md` = **teaser ngắn** (1 câu hook mạnh nhất về cuộc so tài + lời mời xem
bản đầy đủ trên YouTube), hashtag ≤ 5: `#xuhuong #fyp` đầu tiên, 1–2 tag chủ đề
(ưu tiên từ khoá bản tin, vd `#tinxe #tinoto`), `#TramAI` cuối cùng. Chỉ để dành, không đăng.

### Bước 11: Thumbnail

```bash
python3 .claude/skills/tram-ai-skill/scripts/compose_thumbnail.py \
    --dir <outputDir> --pick <N> [--focus "<x>% <y>%"]
```

Như `media-skill` Bước 5 (ảnh nền + tiêu đề, 1920×1088, không chèn "Trạm AI", không
`--kicker`). Nền thumbnail = **chính ảnh ghép của hook**: truyền
`--image <outputDir>/source-images/img-hook.jpg` thay cho `--pick` (tiêu đề tự
nằm trong dải tối phía dưới). Tiêu đề quá dài
cho thumbnail → truyền `--title` bản rút gọn ≤ ~45 ký tự (vd `VF 8 MỚI ĐẤU CX-5,
CR-V: AI THẮNG?`). Lỗi → in lỗi, vẫn đi tiếp Bước 11b.

### Bước 11b: DUYỆT — dừng chờ user (bắt buộc với mọi video)

**KHÔNG upload gì ở bước này.** Gửi bản duyệt rồi kết thúc lượt, chờ user trả lời:

```markdown
🔎 Bản duyệt — CHƯA ĐĂNG — Loại <1 xe xăng | 2 VinFast | 3 hybrid>
Video: [video.mp4](<outputDir>/video.mp4)  (16:9 · <mm:ss> · <S> cảnh · <C> chương)
Thumbnail: [thumbnail.png](<outputDir>/thumbnail.png)
Research: [research.md](<outputDir>/research.md) — <K> nguồn · <SINCE> → <UNTIL>

YouTube — tiêu đề: <title>   ·   Facebook — tiêu đề: <title>
Chương: (dán chapters.txt)
Mục nổi bật + bảng so sánh: <SP1> vs …, <SP2> vs …
⚠ Số liệu chưa xác nhận từ hãng (đã gắn nhãn trong video): <liệt kê>
⚠ Nguồn mâu thuẫn đã xử lý: <liệt kê>

Trả lời "duyệt" / "đăng" để đăng YouTube + Facebook, hoặc ghi rõ cần sửa gì.
```

Kèm 1 ảnh tổng hợp khung cuối các cảnh dữ liệu (`compare`/`spec`/`vs`) đã
trích ở Bước 7 để user soát nhanh, nếu có.

Xử lý phản hồi:
- **Duyệt rõ ràng** ("duyệt", "ok đăng", "đăng đi"…) → sang Bước 12.
- **Yêu cầu sửa** → sửa ngay trên `outputDir` hiện tại (chưa đăng nên không cần
  thư mục mới): sửa `research.md` / `script.json` / template / `.md`; cảnh đổi
  chữ hiển thị → xoá `clips/scene-<id>.mp4` + `-fit.mp4`; cảnh đổi `voiceText`
  → xoá thêm `voice/scene-<id>.mp3` (nếu là hook thì làm lại bước atempo); xoá
  `voice-raw.mp3 voice.mp3 video-silent.mp4 video.mp4`, chạy lại pipeline
  **từ thư mục gốc repo** ngay trên `videos/long/<DATE>/<slug>-<timestamp>/`
  (pipeline tìm SFX theo gốc repo nên outputDir ở đâu cũng được). Sau đó chạy lại
  Bước 8 (chapters, `--inject` lại) + Bước 11 nếu cần → **quay lại Bước 11b**
  gửi bản duyệt mới.
- Không rõ ý / im lặng / chỉ khen chung chung → KHÔNG đăng; hỏi lại một câu
  ngắn "Đăng luôn chứ?".

### Bước 12: `COVER_MS` + Upload YouTube → Facebook (chỉ sau khi đã duyệt)

- Tính `COVER_MS` bằng snippet ở `media-skill` Bước 5b (dự phòng ảnh bìa
  Facebook khi thiếu `thumbnail.png`).
- User đã duyệt ở Bước 11b → upload, khi gọi skill con nói rõ "user đã duyệt, đăng luôn không cần hỏi lại" — y hệt `media-skill` Bước 6:
    1. `Skill` `upload-youtube-video` — `outputDir`, public, tự gắn `thumbnail.png`.
       16:9 + không `#Shorts` → **video dài**; chapters tự nhận từ mốc trong mô tả.
    2. `Skill` `upload-facebook-video` — `--metadata <outputDir>/facebook.md`,
       `--cover-ms <COVER_MS>`; dry-run phải hiện `Định dạng: Video thường (ngang 16:9)`.
       Video > 1 GB → upload thường sẽ lỗi: báo user (giảm bitrate bằng
       `ffmpeg -i video.mp4 -c:v libx264 -crf 26 -c:a copy video-small.mp4` rồi
       đăng bản nhỏ) — chỉ làm khi thật sự vượt 1 GB.
    3. ~~`upload-tiktok-video`~~ — TẠM DỪNG.
- Lỗi 1 nền tảng → in nguyên lỗi, vẫn làm nền tảng còn lại.

### Bước 13: Báo kết quả

```markdown
✓ Video: [video.mp4](videos/long/<DATE>/<slug>-<timestamp>/video.mp4)  (16:9 · <mm:ss> · <S> cảnh · <C> chương)
✓ Thumbnail: [thumbnail.png](…/thumbnail.png)
✓ Research: [research.md](…/research.md) — <K> nguồn · khung <SINCE> → <UNTIL>

| Nền tảng | Định dạng | Trạng thái | Link / ID |
| --- | --- | --- | --- |
| YouTube  | video dài + chapters | ✓ public (thumbnail: ✓/✗) | https://youtu.be/<id> |
| Facebook | video thường | ✓ công khai | https://www.facebook.com/<page_id>/videos/<id> |
| TikTok   | — | ⏸ tạm dừng đăng (đã có tiktok.md) | — |

Mục nổi bật: <SP1> · <SP2> · <SP3> …   ·   Bảng so sánh: <phân khúc A>, <phân khúc B>
Chương: (dán nội dung chapters.txt)
Loại video: <1 xe xăng | 2 VinFast | 3 hybrid>
TTS: remote — http://14.178.142.29:13562 · giọng minh_quan · hook atempo=1.10
Hook: ảnh nền img-<N> "<caption ngắn>"
Ảnh: <tổng> (user: A · nguồn bài: B · crawl: C) — nguồn ở source-images/CREDITS.md
```

Có ảnh đã crop logo → thêm dòng `Ảnh đã crop bỏ logo nguồn khác: img-…`.
Nền tảng lỗi → ghi trạng thái lỗi + 1 dòng lý do.

## Ghi chú

- Khác `media-remote-skill` ở chỗ **không gọi `tram-ai-template-video`**:
  skill con đó cố định 8–12 scene và hỏi tỉ lệ. Skill này tự làm các bước tương
  đương (nội dung → ảnh → template → script → pipeline) và chỉ **mượn quy tắc**
  của nó (chuẩn hoá ảnh, crawl ảnh, quy tắc TTS, slot layout kế thừa).
- Schema pipeline (`src/render/template-script-schema.ts`) cho tối đa **80 scene**
  (nâng từ 12 cho skill này); các skill ngắn vẫn tự giới hạn 8–12.
- `templates/_dyn/` và `videos/` đều đã gitignore.
- Lưu trữ: `videos/long/<YYYY-MM-DD>/<slug>-<timestamp>/` gồm
  `video.mp4`, `voice.mp3`, `script.txt`, `script.json`, `research.md`,
  `chapters.txt`, `youtube.md`, `facebook.md`, `tiktok.md`, `thumbnail.png`,
  `source-images/` (+ `CREDITS.md`, `_raw/`).
- User nhắn sửa sau khi đăng (sai số liệu, đổi so sánh…) → sửa `research.md` +
  `script.json` trong **outputDir mới** (copy bản cũ về `videos/_render/<slug>-<timestamp mới>/`, xong chuyển vào `videos/long/<DATE>/`),
  xoá `clips/` + `voice/` của các cảnh đổi chữ, chạy lại từ Bước 6. Không ghi đè
  bản cũ; không tự xoá video đã đăng (chỉ làm khi user yêu cầu).
- Đây là nội dung tổng hợp có trích nguồn: không chép nguyên văn đoạn dài của
  báo; diễn đạt lại + ghi nguồn. Ảnh crawl luôn có dòng nguồn trong `CREDITS.md`.
