---
name: tram-ai-template-video
description: (Kênh Trạm AI — thường được tram-ai-skill gọi) Tạo video (9:16 HOẶC 16:9) từ một TEMPLATE ĐỘNG tự sinh theo phong cách "Animation" của Claude Design — đầu vào là nội dung text, kèm hình ảnh nếu có (truyền theo thứ tự hoặc URL). Claude ưu tiên dùng ảnh từ đầu vào (ảnh truyền + ảnh trong bài/URL); frame nào còn thiếu ảnh thì tự CRAWL thêm ảnh phù hợp trên web. Claude tự đọc/hiểu nội dung từng ảnh rồi đặt vào đúng vị trí ảnh trong template. Voice dùng OmniVoice. Trigger khi user muốn "tạo video từ ảnh + nội dung", "làm video có hình ảnh của tôi", "video template động", "dựng video kèm ảnh minh hoạ", "tạo video 16:9 từ bài viết + ảnh", "tạo video có tự tìm ảnh minh hoạ". Hỏi chọn ngang/dọc nếu chưa cung cấp. Output: video.mp4 + voice.mp3 + script.txt.
---

# Trạm AI Template Video (template động)

Skill dựng video của project Trạm AI: thay vì chọn template có sẵn, skill này **tự sinh một
template động** (một thư mục HTML animation duy nhất, nhiều "layout mode") rồi
nhồi cả **text lẫn hình ảnh của user** vào các slot. Template lấy cảm hứng từ
kiểu "Animation" của Claude Design: nền gradient chuyển động, blob trôi, chữ
xuất hiện so le, ảnh Ken Burns — mọi chuyển động **kết thúc trước ~3.5s** rồi giữ
khung cuối (pipeline đóng băng frame cuối để kéo dài theo giọng đọc).

Pipeline render / TTS / ghép **không đổi** — vẫn là `npm run pipeline -- <outputDir>/script.json`
với `renderer: "hyperframes"`.

## Input

- **Nội dung** (bắt buộc): URL bài báo, đường dẫn `.txt`, hoặc text dán trực tiếp.
- **Hình ảnh** (TUỲ CHỌN — không có cũng chạy được): một hoặc nhiều dạng
    - danh sách đường dẫn file local **theo thứ tự** (`./a.jpg ./b.png ...`),
    - danh sách **URL ảnh**,
    - một thư mục chứa ảnh (lấy theo thứ tự tên file),
    - ảnh user đính kèm trong hội thoại.

  **Thứ tự ưu tiên nguồn ảnh** (skill tự lo, không hỏi user):
  1. Ảnh user truyền trực tiếp (mọi dạng ở trên).
  2. Ảnh moi được từ nguồn bài khi input là URL (`ogImage` + ảnh nội dung trong bài).
  3. Ảnh **crawl thêm trên web** cho những frame vẫn còn thiếu ảnh (Step 3B).

  Nếu user nói rõ "không tự tìm ảnh" / "chỉ dùng ảnh của tôi" → bỏ qua Step 3B,
  frame thiếu ảnh chuyển sang layout chữ.
- **Tỉ lệ khung** (tuỳ chọn): `9:16`/`dọc`/`shorts`/`tiktok` hoặc `16:9`/`ngang`/`youtube`.
  Nếu input KHÔNG nói rõ → **Step 2 hỏi**.

## Workflow (theo đúng thứ tự)

### Step 1: Lấy nội dung + tạo output dir

Lấy nội dung:

- **URL** → `WebFetch` (title, content ~500–1500 từ, ogImage, domain). Fail → bảo user lưu `.txt`. Stop.
- **`.txt`** → `Read`; title = dòng đầu (≤80 ký tự), content = phần còn lại.
- **Text dán trực tiếp** → title = câu/dòng đầu, content = toàn bộ; domain = `"local"`.
- slug = ASCII không dấu (đ→d), ≤40 ký tự; timestamp = `YYYYMMDD-HHmm`;
  `outputDir = videos/_render/<slug>-<timestamp>/`; `mkdir -p`.

### Step 2: Chốt tỉ lệ khung (hỏi nếu chưa có)

Nếu input chưa nói rõ ngang/dọc → dùng `AskUserQuestion`:
- "Video dọc 9:16 (TikTok / Shorts / Reels)" → `aspect = "9:16"`, canvas `1080×1920`
- "Video ngang 16:9 (YouTube / Facebook)" → `aspect = "16:9"`, canvas `1920×1080`

Ghi nhớ `aspect` + `W`×`H` để dùng ở Step 5.

### Step 3: Thu thập + chuẩn hoá ảnh từ đầu vào

1. `mkdir -p <outputDir>/source-images`.
2. **Ảnh user cung cấp** — với mỗi ảnh, **theo đúng thứ tự user cung cấp**, lưu về
   `<outputDir>/source-images/img-<N>.<ext>` (N bắt đầu từ 1):
    - **URL** → `curl -L --fail -o <path> "<url>"` (KHÔNG dùng WebFetch cho ảnh).
      Lỗi tải → báo user URL nào hỏng, bỏ qua ảnh đó (không stop nếu còn ảnh khác).
    - **File local / thư mục** → copy vào.
    - **Ảnh đính kèm** → lưu ra file.
3. **Ảnh từ nguồn bài** (chỉ khi input là URL) — lấy thêm, đánh số nối tiếp:
    - `ogImage` ở Step 1 (nếu có) → `curl -L --fail`.
    - `WebFetch` lại URL bài với prompt: "Liệt kê URL đầy đủ của mọi ảnh NỘI DUNG
      trong bài (ảnh minh hoạ, ảnh sự kiện, chân dung, biểu đồ) kèm 1 câu mô tả mỗi
      ảnh. BỎ QUA logo, icon, avatar tác giả, banner quảng cáo, tracking pixel."
      → `curl -L --fail` từng URL.
4. **Chuẩn hoá / lọc** mọi ảnh vừa tải (áp dụng cho cả Step 3B):
    - Giữ khi `file <path>` báo JPEG/PNG/WebP, dung lượng ≥ 20KB, cạnh ngắn ≥ 600px
      (`ffprobe -v error -select_streams v:0 -show_entries stream=width,height` hoặc `identify`).
    - `.webp` → `.jpg`: `ffmpeg -y -i in.webp out.jpg`. Ảnh > 1600px cạnh dài → resize
      `ffmpeg -y -i in.jpg -vf scale=1600:-2 out.jpg`.
    - Bỏ ảnh trùng, ảnh hỏng, ảnh dính watermark stock (Getty/Shutterstock/Alamy).
5. **KHÔNG stop** nếu 0 ảnh dùng được — chuyển sang Step 3B để crawl. (Chỉ khi user
   yêu cầu rõ "chỉ dùng ảnh của tôi" và không có ảnh nào thì mới stop và gợi ý
   báo user không có ảnh.)

### Step 3B: Crawl bổ sung ảnh khi frame thiếu

Chạy sau khi đã **phác nhanh dàn ý scene** (các `beat`, xem Step 6): xác định
những beat/scene NỘI DUNG cần ảnh minh hoạ mà chưa có ảnh khớp từ Step 3.

Mục tiêu: đủ ảnh để **các scene ảnh xen kẽ đều đặn** — thường **4–6 ảnh** cho
8–12 scene. `NEED` = (số ảnh mong muốn) − (số ảnh hợp lệ từ Step 3). Nếu `NEED ≤ 0`
→ bỏ qua Step 3B.

Với **mỗi beat còn thiếu ảnh** (dừng khi đủ `NEED` ảnh hợp lệ):

1. **Dựng truy vấn** từ từ khoá chính của beat + thực thể trong bài (tên người /
   tổ chức / sản phẩm / địa danh / sự kiện). `WebSearch` truy vấn đó.
2. **Ưu tiên nguồn an toàn bản quyền & đúng chủ đề**:
    - `commons.wikimedia.org`, `*.wikipedia.org` — ảnh tư liệu, thực thể, địa danh.
    - Trang **chính chủ** (website hãng/cơ quan, phòng báo chí, báo lớn uy tín) cho
      ảnh sản phẩm / nhân vật / sự kiện cụ thể.
3. `WebFetch` trang phù hợp với prompt: "Trả về URL ảnh GỐC độ phân giải cao
   (`.jpg`/`.png`/`.webp`, cạnh ngắn ≥ 800px) minh hoạ cho: <beat>. Không lấy ảnh
   watermark, không thumbnail, không sprite/icon."
4. `curl -L --fail -o <outputDir>/source-images/img-<N>.<ext>` (N nối tiếp Step 3).
   Chạy bước **chuẩn hoá / lọc** ở Step 3 mục 4.
5. Ghi nguồn vào `<outputDir>/source-images/CREDITS.md` — mỗi dòng:
   `img-<N> — <URL trang nguồn> — <license nếu biết>`.
6. Mỗi beat thử tối đa **2 vòng** tìm kiếm. Vẫn không có ảnh đạt → scene đó chuyển
   layout `text` / `stat` / `quote` (KHÔNG chặn pipeline).

**An toàn nội dung**: loại ảnh bạo lực/máu me/nhạy cảm/không phù hợp thương hiệu
"Trạm AI"; không dùng ảnh minh hoạ AI trông giả tạo cho tin thời sự.

### Step 4: Đọc hiểu từng ảnh

Với **mỗi** `img-<N>` (gồm cả ảnh moi từ nguồn bài và ảnh crawl ở Step 3B),
dùng `Read` để xem ảnh, rồi ghi lại (nội bộ) một bảng:

| field | mô tả |
| --- | --- |
| `caption_vi` | 1 câu tiếng Việt mô tả ảnh có gì (dùng làm `image_alt`) |
| `role` | `hero` (ảnh chủ đề mạnh) · `context` (minh hoạ bối cảnh) · `subject` (chân dung/vật thể) · `diagram` (biểu đồ/sơ đồ/screenshot) · `decorative` |
| `focus` | vùng cần giữ khi crop: `center` / `top` / `bottom` / `left` / `right` / `"50% 30%"` … → map sang CSS `object-position` |
| `beat` | ý/đoạn nào trong nội dung ảnh này minh hoạ rõ nhất |
| `tone` | 2 màu hex gợi ý (accent) rút ra từ ảnh, nếu muốn phối màu theo ảnh |

Nếu ảnh là **diagram/screenshot chữ nhỏ** → ưu tiên layout `split` (ảnh không bị chữ đè),
KHÔNG dùng `image-full` (scrim + headline sẽ che mất thông tin).

**Với ảnh crawl (Step 3B)**: nếu sau khi xem thấy ảnh KHÔNG khớp beat, sai thực thể
(nhầm người/sản phẩm), chất lượng kém, hoặc có watermark → **loại**, quay lại Step 3B
tìm ảnh khác cho beat đó (tối đa 2 lần). Hết lượt vẫn không đạt → scene đó dùng layout chữ.

### Step 5: Sinh template động

1. `TPL = templates/_dyn/<slug>-<timestamp>`; `mkdir -p <TPL>/assets`.
2. Copy 3 file từ `.claude/skills/tram-ai-template-video/reference/`:
    - `template-scaffold.html` → `<TPL>/index.html`
    - `hyperframes.json` → `<TPL>/hyperframes.json`
    - `meta.json` → `<TPL>/meta.json` (sửa `"id"` thành `<slug>-<timestamp>`)
3. **Chỉnh `<TPL>/index.html`** — CHỈ 3 nhóm thay đổi:
    - **Canvas theo aspect**: nếu `16:9` thì đổi hết `1080`→`1920` và `1920`→`1080`
      ở: thẻ `<meta name="viewport">`, `html,body{width/height}`, `#root{width/height}`,
      và `data-width`/`data-height` trên `#root`. (9:16 thì giữ nguyên.)
    - **Bảng màu**: trong khối `#root { --bg1 … --body }` chỉnh `--bg1`,`--bg2`,
      `--accent1`,`--accent2` cho hợp tông nội dung (tin công nghệ: xanh/tím điện;
      tài chính: xanh lá/vàng; đời sống: cam/hồng ấm…). Có thể lấy từ `tone` của ảnh hero.
    - **Font** (tuỳ chọn): đổi cặp Google Fonts nếu muốn — phải phủ tiếng Việt
      (Be Vietnam Pro / Lora / Inter Tight / Manrope / Space Grotesk là an toàn).
   **KHÔNG sửa** phần `<script>`, các `@keyframes`, hay cấu trúc layout — chúng đã chạy đúng.
4. Copy các ảnh đã dùng vào `<TPL>/assets/` với tên gọn (`img-1.jpg` …). Mỗi scene
   tham chiếu ảnh bằng đường dẫn **tương đối** `assets/img-<N>.jpg` (đã kiểm chứng chạy được).

> Muốn "vibe" động/hiện đại hơn nữa: có thể dùng skill `design` (Claude Design)
> để prototype look & feel, nhưng **sản phẩm cuối phải là 1 file HTML tĩnh
> self-contained** đặt tại `<TPL>/index.html` theo đúng hợp đồng biến ở dưới
> (đọc `data-composition-variables` qua `window.__hyperframes.getVariables()`,
> có `#root` với `data-composition-id="main"` + `data-width/height/duration`,
> mọi animation là CSS `@keyframes` hữu hạn và lặng khung cuối). Scaffold có sẵn
> là đường an toàn — chỉ đi hướng tự viết khi user yêu cầu rõ.

### Layout mode + slot (hợp đồng biến của scaffold)

Mỗi scene đặt `inputs.layout` = 1 trong các mode sau. Slot không dùng thì bỏ.

| layout | dùng khi | slot chính |
| --- | --- | --- |
| `hero` | scene mở đầu (hook) | `kicker`, `headline`, `body`, `cta` |
| `image-full` | ảnh đẹp/mạnh làm nền, chữ đè phía dưới | `image`, `image_focus`, `image_alt`, `kicker`, `headline`, `body` |
| `split` | ảnh + chữ tách khối (ảnh diagram/screenshot/sản phẩm) | `image`, `image_focus`, `image_alt`, `kicker`, `headline`, `body` |
| `text` | câu chốt / nhận định, không ảnh | `kicker`, `headline`, `body` (có gạch accent) |
| `quote` | trích dẫn / phát biểu | `quote`, `attr` |
| `stat` | 1 con số / benchmark | `kicker`, `figure`, `figure_label`, `body` |
| `list` | danh sách 2–5 ý | `kicker`, `headline`, `items[]` mỗi item `{icon,title,desc}` |
| `outro` | scene cuối | `logo` (tuỳ chọn), `brand`, `tagline`, `url` và/hoặc `socials[]` |

Slot phụ (mọi layout): `accent_from`/`accent_to` (2 hex đổi màu nhấn riêng scene),
`bg_from`/`bg_to` (đổi nền riêng scene), `foot_left`/`foot_right` (nhãn góc dưới).
Ở scene **hook**: `foot_left` = `"Trạm AI"`, để trống `foot_right`.
**KHÔNG bao giờ** đặt ngày tháng (mọi dạng: `dd/mm/yyyy`, `dd-mm-yyyy`, `yyyy-mm-dd`,
`ngày D tháng M`…) vào `foot_left`/`foot_right` — hay bất kỳ slot nào — của **bất kỳ
scene nào**. Video không hiển thị ngày. (Scaffold cũng tự lọc: giá trị footer trông
giống ngày sẽ bị bỏ trắng khi render — nhưng đừng dựa vào đó, cứ để trống ngay từ
`script.json`.)

Quy tắc slot:
- `headline`: ≤ ~44 ký tự, ~2 dòng ngắn. Bọc 1–2 từ trong `{…}` để tô gradient nhấn,
  vd `"AI vừa {vượt mặt} lập trình viên"`. Tự động co nếu 1 từ quá dài.
- `image`: **luôn** là `"assets/img-<N>.jpg"` (khớp file đã copy ở Step 5.4).
- `image_focus`: lấy từ `focus` ở Step 4 (`center`/`top`/`"50% 30%"`…).
- `logo` (chỉ layout `outro`): đường dẫn **tương đối** tới file logo đã copy vào
  `<TPL>/assets/` (vd `"assets/logo.png"`). Có `logo` thì frame cuối hiện logo kênh
  thay cho khối gradient mặc định. Nếu user đưa đường dẫn logo → copy vào `<TPL>/assets/`.
  Logo kênh Trạm AI: `assets/logo-round.png` trong `.claude/skills/tram-ai-skill/assets/` (logo tròn, nền ngoài hình tròn trong suốt) — copy thành `<TPL>/assets/logo.png`.
- `figure`: giữ định dạng số đẹp cho MÀN HÌNH (`"82%"`, `"5.5"`, `"1M"`).
- `items[].icon`: 1 emoji hợp ý (✅ ⚠️ 🚫 📈 💡 🔒 🚀 …).

### Step 6: Sinh script.json

`Write` ra `<outputDir>/script.json`:

```json
{
  "version": "1.0",
  "renderer": "hyperframes",
  "aspect": "<9:16 hoặc 16:9 theo Step 2>",
  "metadata": {
    "title": "...",
    "source": { "url": "<url hoặc ''>", "domain": "<domain>", "image": null },
    "channel": "Trạm AI"
  },
  "voice": { "provider": "omnivoice", "speed": 1.0, "name": "<chọn theo tông nội dung>" },
  "scenes": [ /* 8–12 scene */ ]
}
```

- **`voice.name`** = **luôn `"minh_quan"`** (kênh Trạm AI chỉ dùng giọng này, mọi
  tông nội dung). KHÔNG chọn giọng khác (`vira`/`dori`/`jett`/`kaci`…), kể cả khi
  tài liệu nền hay orchestrator gợi ý theo tông.

- Mỗi scene: `{ "id", "type", "voiceText", "templateId": "_dyn/<slug>-<timestamp>", "inputs": { "layout": "...", ... } }`.
  **Mọi scene dùng chung một `templateId`** (thư mục động vừa tạo) — chỉ khác `inputs`.
- `scenes[0].type = "hook"` (thường `layout: "hero"`), scene cuối `type = "outro"` (`layout: "outro"`).
- **Hook (scene đầu) phải GIẬT GÂN, tóm đúng nội dung chính để giữ chân người xem**:
  headline nêu bật con số / nghịch lý / kịch tính lớn nhất của bài (bọc phần sốc nhất
  trong `{…}`), `body` 1–2 câu đẩy cao kịch tính, `voiceText` mở bằng chi tiết mạnh
  nhất rồi kết bằng một câu hỏi/lời hứa ("Vì sao…?", "Giải mã ngay"). `cta` ngắn,
  gợi tò mò. KHÔNG mở bằng câu dẫn chung chung ("Hôm nay chúng ta cùng tìm hiểu…").
  Giật gân nhưng KHÔNG bịa — mọi con số/tuyên bố phải có trong nguồn.
- **8–12 scene**, tổng `voiceText` ~270–360 từ (~90–120s). Mỗi body scene ~25–40 từ,
  mỗi scene chỉ 1 ý — 1 đoạn 2 ý thì tách 2 scene. Mục tiêu mỗi cảnh ~6–10s.
- **Phân bổ ảnh**: gán mỗi ảnh cho scene mà `beat` của nó khớp nhất (Step 4).
  Nhiều ảnh hơn số scene hợp lý → chọn ảnh tốt nhất, bỏ ảnh yếu (hoặc thêm 1 scene
  `list`/`image-full`). Ít ảnh hơn → **quay lại Step 3B crawl thêm cho các beat
  chưa có ảnh** (mục tiêu ~1 scene ảnh xen kẽ 1 scene chữ); crawl xong vẫn thiếu thì
  các scene còn lại dùng `text`/`stat`/`quote`.
  Đừng để 2 scene ảnh nằm sát nhau nếu tránh được — xen kẽ scene chữ cho nhịp.
- Ảnh dùng trong video là ưu tiên: (1) ảnh user truyền → (2) ảnh từ nguồn bài →
  (3) ảnh crawl. Khi 2 ảnh cùng minh hoạ 1 beat, giữ ảnh ở bậc ưu tiên cao hơn.
- outro: `brand` = `"Trạm AI"`, `logo` = `"assets/logo.png"`. Kênh mạng xã hội Trạm AI
  (đưa vào `socials[]`, mỗi phần tử `{plat, handle}`):
    - `{ "plat": "YouTube", "handle": "youtube.com/@tram-ai" }`
    - `{ "plat": "TikTok", "handle": "tiktok.com/@tram.ai.vn" }`
    - `{ "plat": "Facebook", "handle": "Trạm AI" }`

### ⚠️ Quy tắc TTS tiếng Việt cho `voiceText` (BẮT BUỘC)

`voiceText` do OmniVoice đọc. **Viết mọi con số ra CHỮ tiếng Việt** trong `voiceText`
(vd `82,7%` → `tám mươi hai phẩy bảy phần trăm`; `4,5` → `bốn phẩy năm`; `4.500` → `bốn nghìn năm trăm`;
`GPT 5.5` → `GPT năm chấm năm`;
`2x` → `gấp đôi`; `$5` → `năm đô`; `iOS 18.2` → `iOS mười tám chấm hai`).
`voiceText` **KHÔNG** emoji/icon, **KHÔNG** URL, **KHÔNG** ký hiệu `→ & % $ # + =`.
Kết câu bằng `.` hoặc `?`. Brand (Apple, OpenAI, TikTok) giữ nguyên.
`inputs` (chữ hiển thị) thì ĐƯỢC dùng emoji + giữ định dạng số đẹp — tách biệt hoàn toàn.
(Bảng đầy đủ: [reference/tts-rules.md](reference/tts-rules.md).)

### Step 7: Tự kiểm tra (sửa thầm tối đa 2 lần)

- `scenes[0].type = "hook"`, scene cuối `type = "outro"`; 8–12 scene.
- Mọi `templateId` = đúng thư mục `_dyn/...` vừa tạo; `<TPL>/index.html` tồn tại.
- Mọi `inputs.image` trỏ tới file **có thật** trong `<TPL>/assets/` (đã qua chuẩn
  hoá Step 3 mục 4: đúng định dạng ảnh, cạnh ngắn ≥ 600px).
- Ảnh crawl (Step 3B) đã được `Read` xác nhận đúng beat + an toàn nội dung; mọi ảnh
  crawl có dòng nguồn trong `<outputDir>/source-images/CREDITS.md`.
- Có ít nhất vài scene ảnh xen kẽ (trừ khi user yêu cầu "chỉ dùng ảnh của tôi" và
  không đủ ảnh); không có 2 scene ảnh dính liền nếu tránh được.
- `<TPL>/index.html` đã đổi canvas đúng aspect (grep `data-width`).
- `layout` của mỗi scene ∈ danh sách; slot bắt buộc của layout đó đã có.
- `voiceText`: số đã viết ra chữ, KHÔNG emoji/URL/ký hiệu.
- `headline` ≤ ~2 dòng ngắn; emoji (nếu có) chỉ nằm trong `inputs`.
- KHÔNG scene nào chứa chuỗi ngày (`dd/mm/yyyy`, `dd-mm-yyyy`, `yyyy-mm-dd`, `ngày D tháng M`…)
  ở bất kỳ slot nào (`foot_left`, `foot_right`, `body`, `kicker`, `cta`…). Grep cả `script.json`:
  `grep -nE '[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|ngày [0-9]' script.json`
  phải KHÔNG có kết quả. Scene hook đặc biệt: `foot_right` để trống.

### Step 8: Chạy pipeline

Bash **foreground**, stream output:

```bash
npm run pipeline -- <outputDir>/script.json
```

Lỗi render 1 scene → kiểm tra `inputs`/đường dẫn ảnh của scene đó trong `script.json`,
xoá `<outputDir>/clips/scene-<id>.mp4` rồi chạy lại (clip idempotent).

Ảnh của 1 scene hỏng/không hiện (kể cả ảnh crawl) → crawl lại 1 ảnh khác cho beat đó
(Step 3B, tối đa 2 lần) hoặc chuyển scene sang layout chữ; cập nhật `script.json` +
`<TPL>/assets/` rồi render lại scene.

### Step 9: Gửi video cho user duyệt + báo kết quả

**LUÔN** gửi `<outputDir>/video.mp4` qua `SendUserFile` (status `"normal"`,
caption ngắn nêu tên video + tỉ lệ + thời lượng) ngay khi render xong — không
phụ thuộc user đang ở thiết bị nào. Đây là bản để user xem và duyệt.

Rồi in kết quả:

```markdown
✓ Video: [video.mp4](videos/_render/<slug>/video.mp4)  (<aspect>)
✓ Audio: [voice.mp3](videos/_render/<slug>/voice.mp3) — cho CapCut
✓ Script: [script.txt](videos/_render/<slug>/script.txt) — cho CapCut auto-caption
Template động: templates/_dyn/<slug>-<timestamp>/
Ảnh dùng: N (từ đầu vào: A · từ nguồn bài: B · crawl thêm: C)   ·   Tổng thời lượng: XX.Xs
```

Có ảnh crawl → thêm 1 dòng: `Nguồn ảnh crawl: videos/_render/<slug>/source-images/CREDITS.md`.

Nếu skill này được gọi độc lập (không qua orchestrator): hỏi user có ưng video
không, chưa ưng thì sửa `script.json`/template rồi render lại (Step 8). Nếu
được gọi từ `tram-ai-skill`: dừng ở đây, để orchestrator lo bước
duyệt.

## Ghi chú

- `templates/_dyn/` đã được `.gitignore` — template động là sản phẩm dùng một lần,
  đi kèm `outputDir`. Muốn render lại sau khi sửa: xoá `videos/_render/<slug>/clips/`.
- Render mỗi scene ~15–20s (Chromium). Ảnh nặng → resize trước (`ffmpeg -i in.jpg -vf scale=1600:-2 out.jpg`) cho nhanh.
- Ảnh không hiện trong clip: kiểm tra `<TPL>/assets/img-<N>.jpg` tồn tại và `inputs.image` = `"assets/img-<N>.jpg"` (tương đối, không có `/` đầu). Cùng lắm nhúng data-URI vào `index.html`.
- Scaffold `reference/template-scaffold.html` là bản đã test cả 9:16 lẫn 16:9 với các layout hero / image-full / split / quote / stat. Giữ `<script>` nguyên vẹn.
- **Crawl ảnh (Step 3B)**: mọi ảnh tải về nằm trong `<outputDir>/source-images/`,
  ảnh crawl luôn có dòng nguồn trong `source-images/CREDITS.md`. Ưu tiên nguồn
  bản quyền mở (Wikimedia Commons / Wikipedia) và trang chính chủ; tránh ảnh
  watermark stock. Không crawl được thì frame đó chuyển layout chữ — KHÔNG chặn video.
- Muốn tắt crawl: user nói "chỉ dùng ảnh của tôi" / "đừng tự tìm ảnh" → bỏ Step 3B.
