---
name: media-remote-skill
description: Giống hệt media-skill (chạy trọn quy trình nội dung thô + hình ảnh → video → TỰ ĐỘNG sinh youtube.md/facebook.md/tiktok.md + thumbnail → đăng lên YouTube + Facebook; TikTok TẠM DỪNG ĐĂNG nhưng vẫn sinh tiktok.md để dành; KHÔNG có bước duyệt video, KHÔNG hỏi xác nhận — video render xong là đăng thẳng), KHÁC DUY NHẤT một điểm — phần sinh âm thanh (TTS OmniVoice) gọi tới SERVER TỪ XA qua API (http://14.178.142.29:13562) thay vì OmniVoice chạy local; và TRƯỚC KHI DỰNG luôn tự tìm thêm các bài báo khác viết ĐÚNG về chủ đề đó (VnExpress, Tuổi Trẻ, Thanh Niên, Dân trí…) để làm giàu dữ kiện + hình ảnh (research.md, content-enriched.txt, CREDITS.md). Trigger khi user muốn "làm video rồi đăng đa nền tảng DÙNG server voice từ xa", "chạy media pipeline với TTS remote", "tạo và đăng đa nền tảng, sinh voice qua server", hoặc khi máy hiện tại KHÔNG chạy OmniVoice local nhưng có service omni_voice_mcrs đã deploy. Input: chủ đề ngắn / nội dung / URL / file .txt (+ hình ảnh tuỳ chọn — thiếu ảnh thì tự lấy từ bài liên quan).
---

# Multi-Platform Video Pipeline — Remote TTS (media-remote-skill)

Skill này **giống hệt `media-skill`**. Hãy **đọc và làm theo
`.claude/skills/tram-ai-skill/reference/base/media-skill.md` từ đầu đến cuối** — toàn bộ Input, Workflow
(Bước 1 → 7), phần Ghi chú đều áp dụng y nguyên, **BAO GỒM khối "⚠️ CHẾ ĐỘ HIỆN
TẠI" ở đầu file đó**:

- **TikTok TẠM DỪNG ĐĂNG — nhưng VẪN sinh `tiktok.md`.** Bước 4 vẫn tạo file
  `tiktok.md` để dành sẵn; chỉ KHÔNG gọi `upload-tiktok-video`. Đăng công khai
  chỉ YouTube + Facebook.
- **KHÔNG có bước duyệt video, KHÔNG hỏi xác nhận.** Video render xong (Bước 1)
  là đi thẳng sinh kịch bản đăng + đăng thẳng YouTube + Facebook. Truyền "đăng
  luôn không cần hỏi" xuống từng skill con upload.

**KHÁC BIỆT DUY NHẤT**: phần sinh giọng đọc (OmniVoice TTS) **không dùng server
local** (`http://127.0.0.1:8123`) mà gọi tới **service đã deploy từ xa**:

```
OMNIVOICE_ENDPOINT = http://14.178.142.29:13562
```

> Nếu user chỉ định endpoint khác trong câu lệnh → dùng giá trị user đưa. Ngoài
> ra giữ mặc định trên.

**KHÁC BIỆT THỨ HAI**: trước khi dựng video luôn chạy **Bước 0 — Nghiên cứu mở
rộng** (bên dưới): tìm thêm các bài báo KHÁC viết đúng về chủ đề đó để làm giàu
thông tin + hình ảnh, rồi mới đưa nội dung đã làm giàu vào `tram-ai-template-video`.

Áp dụng các thay đổi sau khi thực thi `media-skill`:

---

## Thay đổi ở "Input" — cho phép chỉ đưa CHỦ ĐỀ, ảnh không bắt buộc

Ghi đè mục Input của `media-skill`:

- **Nội dung** (bắt buộc) — một trong: **chủ đề ngắn** (vd "Bão số 5 đổ bộ Nghệ
  An", "iPhone 18 ra mắt"), URL bài báo, file `.txt`, hoặc văn bản dán trực tiếp.
- **Hình ảnh**: **KHÔNG còn bắt buộc**. User không đưa ảnh → KHÔNG hỏi, Bước 0 tự
  lấy ảnh từ các bài báo liên quan. Chỉ khi Bước 0 xong mà vẫn **0 ảnh dùng được**
  mới để `tram-ai-template-video` Step 3B crawl tiếp; vẫn 0 → báo user và dừng.
- User nói rõ "không tìm thêm" / "chỉ dùng nội dung của tôi" → bỏ qua Bước 0.

---

## Bước 0 (MỚI): Nghiên cứu mở rộng — tìm bài liên quan trên các báo khác

Chạy SAU khi kiểm tra TTS (mục 1a) và TRƯỚC khi gọi `tram-ai-template-video`.
Mục tiêu: video có **chi tiết chính xác hơn** (số liệu, mốc thời gian, tên người,
trích dẫn) và **nhiều ảnh đúng sự kiện hơn** — KHÔNG phải làm video dài hơn.

### 0.1 Lấy nội dung gốc + tạo `outputDir`

- **URL** → `WebFetch` (title, content, ogImage, domain, ngày đăng). Đây là *bài gốc*.
- **`.txt` / văn bản dán** → `Read`/dùng trực tiếp; domain = `"local"`.
- **Chỉ có chủ đề** (≤ ~30 từ, không có thân bài) → chưa có bài gốc; bài liên
  quan tốt nhất tìm được ở 0.3 sẽ làm bài gốc.
- Tạo `outputDir = videos/_render/<slug>-<YYYYMMDD-HHmm>/` (đúng quy ước
  `tram-ai-template-video` Step 1) + `mkdir -p <outputDir>/source-images`.

### 0.2 Rút "dấu vân tay" chủ đề

Ghi (nội bộ) trước khi tìm:
- **Thực thể chính** (2–5): người / tổ chức / sản phẩm / địa danh / tên sự kiện.
- **Mốc thời gian**: ngày xảy ra sự kiện (từ bài gốc, hoặc "mới nhất" nếu chỉ có
  chủ đề — dùng `date` hệ thống làm mốc).
- **Câu hỏi còn thiếu**: 3–5 điều người xem sẽ muốn biết mà nội dung gốc chưa nói
  (con số cụ thể, nguyên nhân, diễn biến mới nhất, phản ứng chính thức, so sánh).

### 0.3 Tìm bài liên quan

`WebSearch` **3–5 truy vấn** (gửi song song trong cùng một lượt), tiếng Việt, ghép
thực thể chính + từ khoá sự kiện, vd:
- `"<thực thể 1>" <thực thể 2> <từ khoá sự kiện>`
- `<chủ đề> mới nhất` / `<chủ đề> <tháng>/<năm>`
- 1 truy vấn nhắm thẳng câu hỏi còn thiếu (vd `<chủ đề> thiệt hại bao nhiêu`)
- Chủ đề quốc tế → thêm 1 truy vấn tiếng Anh để lấy nguồn gốc/ảnh chính chủ.

**Ưu tiên nguồn** (báo chính thống, tên miền khác bài gốc): vnexpress.net,
tuoitre.vn, thanhnien.vn, dantri.com.vn, vietnamnet.vn, znews.vn, vtv.vn,
nhandan.vn, baochinhphu.vn, laodong.vn, tienphong.vn, cafef.vn (kinh tế),
thethao247.vn / bongda.com.vn (thể thao); cổng chính chủ (cơ quan nhà nước, hãng,
CLB); quốc tế: Reuters, AP, BBC, trang chính chủ. **Loại**: trang tổng hợp/copy,
trang rác SEO, diễn đàn, mạng xã hội, bài có tiêu đề câu view không có nguồn.

### 0.4 Cổng "ĐÚNG chủ đề" — kiểm từng bài trước khi dùng

Chọn **3–5 bài**, mỗi bài một tên miền khác nhau. `WebFetch` từng bài với prompt:

> "Trả về: (1) tiêu đề, ngày đăng; (2) mọi DỮ KIỆN cụ thể — số liệu, mốc thời
> gian, địa điểm, tên + chức danh người, trích dẫn nguyên văn ngắn — mỗi dữ kiện
> 1 dòng; (3) URL đầy đủ của mọi ảnh NỘI DUNG trong bài kèm chú thích (caption)
> gốc của ảnh. BỎ QUA logo, icon, avatar tác giả, banner quảng cáo, ảnh của bài
> liên quan/đọc thêm ở cuối trang."

Một bài **chỉ được dùng** khi đạt CẢ 3:
1. Nói về **cùng một sự kiện/chủ thể** — khớp ≥ 2 thực thể chính (không phải sự
   kiện tương tự năm trước, không phải người trùng tên).
2. **Đúng khung thời gian**: tin thời sự → đăng trong ±7 ngày quanh mốc ở 0.2
   (tin nóng/thời tiết: ±2 ngày); chủ đề kiến thức/không thời sự → bỏ điều kiện này.
3. Có ít nhất 1 dữ kiện hoặc 1 ảnh **mới** so với nội dung đã có.

Không đạt → bỏ, lấy bài kế tiếp trong kết quả tìm kiếm. Tối đa ~8 lần `WebFetch`
cho cả Bước 0. Không tìm được bài nào đạt → ghi chú, đi tiếp với nội dung gốc.

### 0.5 Gộp & kiểm chứng dữ kiện

- Dữ kiện chỉ được đưa vào video khi: có trong bài gốc, HOẶC xuất hiện ở ≥ 2 nguồn,
  HOẶC đến từ nguồn chính chủ/cơ quan chức năng.
- Số liệu **lệch nhau** giữa các nguồn → lấy nguồn chính chủ / bài mới nhất; vẫn
  không rõ → nói dạng khoảng ("hơn…", "khoảng…") hoặc bỏ. TUYỆT ĐỐI không tự bịa
  hay nội suy số liệu.
- Chọn **3–6 dữ kiện mới đắt giá nhất** trả lời các câu hỏi còn thiếu ở 0.2 —
  không nhồi hết. Video vẫn phải ngắn gọn như bình thường.
- **Viết lại bằng lời của Trạm AI** — không chép nguyên văn đoạn văn của báo khác
  (trích dẫn nhân vật ngắn thì được giữ, ghi rõ ai nói).

### 0.6 Thu ảnh từ các bài liên quan

- Thứ tự đánh số trong `<outputDir>/source-images/img-<N>.<ext>`:
  **ảnh user đưa trước** → ảnh bài gốc (ogImage + ảnh nội dung) → ảnh bài liên quan.
- Mỗi ảnh: `curl -L --fail -o ...` (không dùng WebFetch cho ảnh), rồi chuẩn hoá /
  lọc đúng như `tram-ai-template-video` Step 3 mục 4 (≥ 20KB, cạnh ngắn
  ≥ 600px, webp→jpg, resize, bỏ trùng — cùng một ảnh nhiều báo dùng lại thì chỉ giữ
  bản nét nhất).
- `Read` từng ảnh xác nhận **đúng sự kiện/đúng người** (so với caption gốc + thực
  thể chính). Ảnh minh hoạ chung chung, ảnh tư liệu cũ không ghi rõ, ảnh đồ hoạ
  quảng cáo → bỏ. Ảnh có logo báo khác → giữ lại, mục **1f** sẽ crop.
- Mục tiêu **4–6 ảnh** tổng cộng (đủ cho 8–12 scene). Đủ thì dừng tải.
- Ghi `<outputDir>/source-images/CREDITS.md`: `img-<N> — <URL trang nguồn> — <tên báo> — <caption gốc>`.

### 0.7 Xuất file nghiên cứu

- `<outputDir>/research.md`: bảng nguồn (tên báo · tiêu đề · ngày · URL · đạt/loại
  + lý do), danh sách dữ kiện đã dùng (mỗi dòng kèm nguồn), dữ kiện mâu thuẫn và
  cách xử lý.
- `<outputDir>/content-enriched.txt`: dòng đầu = tiêu đề; phần còn lại = nội dung
  gốc **đã lồng** 3–6 dữ kiện mới vào đúng mạch (không phải phụ lục cuối bài).

### 0.8 Bàn giao cho `tram-ai-template-video`

Khi gọi sub-skill (mục 1c), **nội dung = `<outputDir>/content-enriched.txt`**,
**ảnh = thư mục `<outputDir>/source-images/`**, và thêm chỉ thị:

> Dùng LUÔN `outputDir` = `<outputDir>` (đã tạo sẵn, KHÔNG tạo thư mục mới).
> `source-images/` đã có ảnh đã lọc + `CREDITS.md` → **Step 3** chỉ kiểm lại, KHÔNG
> tải lại ogImage/ảnh bài gốc. **Step 3B** chỉ chạy cho beat thực sự còn thiếu ảnh,
> nối tiếp số `img-<N>` và nối tiếp `CREDITS.md`. Mọi số liệu trong `script.json`
> phải lấy từ `content-enriched.txt` — không thêm số liệu ngoài file đó.

Ở Bước 3 (`create-youtube-content`): thêm cuối mô tả 1 dòng
`Nguồn tham khảo: <tên báo 1>, <tên báo 2>, …` (tên báo, không dán URL dài).

Lần **tạo lại video** (Bước 2): tái dùng `research.md` + `content-enriched.txt` +
ảnh đã có — KHÔNG nghiên cứu lại, trừ khi user yêu cầu đổi/bổ sung thông tin.

---

## Thay đổi ở "Bước 1: Sinh video (tram-ai-template-video)"

### 1a. Kiểm tra service TTS remote TRƯỚC khi làm gì khác

```bash
curl -s -m 10 http://14.178.142.29:13562/health
```

- Trả về `{"status":"ok","voices":[...],"default":"vira"}` → OK, đi tiếp.
- Không phản hồi / lỗi / không phải `status: ok` → **in nguyên lỗi cho user**,
  báo "service TTS từ xa (omni_voice_mcrs) đang không phản hồi", **dừng lại**.
  Không fallback sang local.

### 1b. Chọn giọng — lấy danh sách giọng từ server, KHÔNG đọc file local

Bỏ bước "đọc `PROJECTS/OmniVoice/voice_library/note.md`". Thay bằng: lấy field
`voices` trong kết quả `/health` ở bước 1a. Bảng map **tông nội dung → `voice.name`
giữ nguyên** như `media-skill`:

| Tông nội dung | `voice.name` |
| --- | --- |
| Tin tức, phân tích, trung tính (mặc định) | `vira` |
| Thể thao, giải trí, sôi động | `dori` |
| Nghiêm túc, điều tra, kịch tính | `jett` |
| Đời sống, mẹo vặt, nhẹ nhàng | `kaci` |

Nếu `voice.name` đã chọn không nằm trong `voices` server trả về → dùng
`default` của server (`vira`).

### 1c. Khi gọi `Skill` `tram-ai-template-video` — BẮT BUỘC ép endpoint remote

Trong prompt gửi cho sub-skill, ngoài nội dung + hình ảnh + `voice.name` như
`media-skill`, **thêm chỉ thị rõ ràng**:

> Ở **Step 8** (chạy pipeline), KHÔNG chạy lệnh trần `npm run pipeline`. Phải
> chạy đúng lệnh sau (có prefix biến môi trường) để TTS gọi server từ xa thay
> vì `127.0.0.1:8123`:
>
> ```bash
> OMNIVOICE_ENDPOINT=http://14.178.142.29:13562 npm run pipeline -- <outputDir>/script.json
> ```
>
> Nếu phải render lại từng scene → giữ nguyên prefix `OMNIVOICE_ENDPOINT=http://14.178.142.29:13562`
> cho mọi lần chạy `npm run pipeline`.

(`.env.local` trong repo pin `OMNIVOICE_ENDPOINT=http://127.0.0.1:8123`; biến
truyền qua shell **override** được vì `dotenv` không ghi đè biến môi trường đã có.)

### 1d. Bỏ ghi chú về restart server local

Không áp dụng đoạn "Nếu vừa sửa `serving_omnivoice.py` / thêm giọng mới thì phải
khởi động lại `uv run serving_omnivoice.py`". Server từ xa do CI/CD quản lý; muốn
thêm giọng phải cập nhật repo `omni_voice_mcrs` (`app/src/tts/voice_library/`) và
redeploy. Kiểm tra giọng khả dụng bằng `curl -s http://14.178.142.29:13562/health`.

### 1e. Frame đầu (scene hook) — giọng đọc NHANH HƠN MỘT CHÚT

> Đây là bản **thay thế** cho `media-skill` Bước 1 (a): logic y hệt, khác duy
> nhất là lệnh re-run pipeline phải có prefix `OMNIVOICE_ENDPOINT=...` (mục 1c).

Scene đầu tiên (`scenes[0]`, `type: "hook"`) phải đọc nhanh hơn phần còn lại một
chút để giữ nhịp và giữ chân người xem. Các scene thân + outro giữ tốc độ bình
thường (`voice.speed` toàn cục không đổi — pipeline hiện chưa áp dụng field này).

Trong prompt gửi `tram-ai-template-video` (mục 1c), thêm chỉ thị:

> Sau khi **Step 8** (pipeline) chạy xong lần đầu, **trước Step 9** (gửi video):
> tăng tốc RIÊNG giọng đọc của scene hook rồi render lại.
>
> ```bash
> cd <outputDir>
> HOOK_ID=$(python3 -c "import json;print(json.load(open('script.json'))['scenes'][0]['id'])")
> ffmpeg -y -i "voice/scene-$HOOK_ID.mp3" -filter:a "atempo=1.10" -c:a libmp3lame -q:a 2 "voice/scene-$HOOK_ID.fast.mp3"
> mv "voice/scene-$HOOK_ID.fast.mp3" "voice/scene-$HOOK_ID.mp3"
> rm -f voice-raw.mp3 voice.mp3 video-silent.mp4 video.mp4 "clips/scene-$HOOK_ID-fit.mp4"
> ```
>
> Rồi chạy lại pipeline (GIỮ prefix endpoint remote):
>
> ```bash
> OMNIVOICE_ENDPOINT=http://14.178.142.29:13562 npm run pipeline -- <outputDir>/script.json
> ```
>
> Pipeline **tái dùng** mọi `voice/scene-*.mp3` đã có (chỉ scene hook đã bị thay
> bằng bản nhanh hơn), tự tính lại timing + fit lại clip hook + ghép lại
> `video.mp4`. Các clip scene khác được REUSE nên bước này nhanh. Chỉ `SendUserFile`
> ở Step 9 SAU khi đã render lại.
>
> `atempo=1.10` (nhanh ~10%) là mặc định. Chỉ đổi khi user nói rõ muốn nhanh/chậm
> hơn — khoảng cho phép `1.05`–`1.20`. KHÔNG đụng giọng của bất kỳ scene nào khác.

Nếu là lần **tạo lại video** (Bước 2): làm lại đúng bước tăng tốc hook này trên
`outputDir` mới.

### 1f. Ảnh có logo/watermark của nguồn khác — CROP bỏ phần đó

Trong prompt gửi `tram-ai-template-video`, thêm chỉ thị cho **Step 4**
(đọc hiểu ảnh):

> Với **mỗi** ảnh trong `<outputDir>/source-images/`, khi `Read` để xem: kiểm tra
> có **logo / watermark / bug / chữ ký của kênh hay hãng tin KHÁC** không — logo
> đài truyền hình, tên báo, tên miền, avatar/handle kênh YouTube–TikTok–Facebook,
> `© ...`, dải tin chạy (news ticker) ở chân màn hình, khung branding…
>
> Nếu **có** → CROP bỏ phần đó **ngay tại chỗ** trước khi đi tiếp (Step 5.4 sẽ tự
> copy bản đã cắt vào `<TPL>/assets/`, và `compose_thumbnail.py` ở Bước 5 cũng
> dùng bản đã cắt này):
>
> ```bash
> cd <outputDir>
> mkdir -p source-images/_raw
> cp source-images/img-<N>.<ext> source-images/_raw/img-<N>.<ext>   # giữ bản gốc
> # ví dụ: logo nằm ở dải DƯỚI cùng, cao ~12% khung hình → bỏ dải đó
> ffmpeg -y -i source-images/_raw/img-<N>.<ext> -vf "crop=iw:ih*0.88:0:0" source-images/img-<N>.<ext>
> ```
>
> Biểu thức `crop=w:h:x:y` theo vị trí logo (dùng `iw`/`ih`, KHÔNG scale lệch):
>
> | Logo nằm ở | `-vf` |
> | --- | --- |
> | dải dưới | `crop=iw:ih*0.88:0:0` |
> | dải trên | `crop=iw:ih*0.88:0:ih*0.12` |
> | cạnh phải | `crop=iw*0.88:ih:0:0` |
> | cạnh trái | `crop=iw*0.88:ih:iw*0.12:0` |
> | 1 góc | crop cả 2 cạnh chạm góc đó |
>
> Lấy dải nhỏ nhất đủ che hết logo (thường 8–15% cạnh đó). Quy tắc:
> - Chủ thể chính phải còn nguyên sau crop. Muốn cắt hết logo mà mất chủ thể →
>   BỎ ảnh đó (đừng dùng).
> - Watermark mờ phủ GIỮA ảnh (không crop sạch được) → hạ ưu tiên, chỉ dùng nếu
>   beat đó không còn ảnh nào khác, đặt `role: context`.
> - Sau crop, cập nhật lại `focus` / `image_focus` cho hợp khung mới.
> - Logo/branding của **chính Trạm AI** thì KHÔNG cắt.
>
> Ảnh KHÔNG có logo nguồn khác → giữ nguyên, xử lý bình thường.
>
> (`source-images/_raw/` nằm ngoài glob `img-*` nên không ảnh hưởng `--pick <N>`
> của `compose_thumbnail.py`.)

### 1g. Frame hook (scene đầu) — LUÔN có ảnh NỔI BẬT NHẤT của nội dung làm nền

> Bản **thay thế** cho `media-skill` Bước 1 (c): logic y hệt, không có khác biệt
> gì liên quan tới TTS remote — chép lại đây cho đủ.

Mặc định `tram-ai-template-video` cho scene hook `layout: "hero"` (nền
gradient trơn, KHÔNG ảnh). Ép đổi: scene hook phải là `layout: "image-full"`,
lấy **một ảnh nổi bật nhất** làm nền toàn khung, headline + body đè lên trên.

Trong prompt gửi `tram-ai-template-video` (mục 1c), thêm chỉ thị cho
**Step 6** (sinh `script.json`):

> `scenes[0]` (`type: "hook"`) đặt `inputs.layout: "image-full"` — KHÔNG dùng
> `hero`. Chọn "ảnh nổi bật nhất" = ảnh có sức nặng hình ảnh lớn nhất và khớp
> nhất với headline hook, theo thứ tự ưu tiên:
> 1. ảnh `role: hero` (Step 4) rõ chủ thể / kịch tính / gây tò mò nhất;
> 2. không có `hero` → ảnh `role: subject` (chân dung nhân vật chính);
> 3. cuối cùng mới tới `role: context`.
>
> KHÔNG chọn ảnh `diagram` / `screenshot` / `decorative` cho hook (chữ nhỏ + lớp
> scrim + headline sẽ che hết thông tin).
>
> Slot hook: `image` = `"assets/img-<N>.jpg"` của ảnh đã chọn, `image_focus` lấy
> từ `focus` Step 4 (đặt vào vùng chủ thể, tránh để headline đè lên mặt),
> `image_alt` = `caption_vi`, cộng `kicker` / `headline` / `body` giật gân như
> hook bình thường (layout `image-full` không có slot `cta` — bỏ `cta`, dồn sức
> nặng vào `headline`). `foot_left = "Trạm AI"`, `foot_right` để trống.
>
> Ảnh đã "tiêu" cho hook thì KHÔNG gán lại cho scene thân khác — TRỪ KHI tổng số
> ảnh dùng được ≤ 2 (khi đó cho phép tái dùng ở đúng 1 scene thân). Các scene
> thân phân bổ ảnh còn lại như bình thường; thiếu ảnh thì dùng
> `text` / `stat` / `quote`.
>
> Nếu **chỉ có 1 ảnh** và nó là `diagram` / `screenshot` chữ kín: giữ hook
> `image-full` nhưng đặt `image_focus` vào vùng ít chữ nhất; nếu chữ phủ kín cả
> ảnh thì mới được giữ `layout: "hero"` và ghi rõ lý do trong chat.

Để hook-frame và thumbnail (Bước 5) nhất quán: ảnh chọn cho hook ở đây NÊN trùng
với ảnh `--pick <N>` của `compose_thumbnail.py` (cùng là "ảnh nổi bật nhất").

Lần **tạo lại video** (Bước 2): làm lại đúng bước ép hook `image-full` này trên
`outputDir` mới.

### 1h. KHÔNG để video bị "giật" ở cuối mỗi cảnh

> Bản **thay thế** cho `media-skill` Bước 1 (d): logic y hệt, không liên quan
> TTS remote.

Pipeline render mỗi cảnh "sống" `data-duration` giây (mặc định 6s) rồi **đóng
băng khung cuối** (`tpad`) để kéo dài theo giọng đọc. Còn chuyển động tại mốc đó
— hoặc animation *kết thúc* lúc đang chạy nhanh — mắt đọc thành **cú giật**.

Trong prompt gửi `tram-ai-template-video` (mục 1c), thêm chỉ thị cho
**Step 5**:

> Scaffold `reference/template-scaffold.html` bản hiện tại ĐÃ xử lý: mọi motion
> nền (`hue`, blob `drift1/drift2`) + `kenburns` ảnh biên độ nhỏ, giảm tốc êm
> (`easeOutCubic`), **dừng hẳn trong ~2,2s** — giữ nguyên, ĐỪNG hoàn tác.
>
> Khi Step 5.3 chỉnh `index.html` / nếu tự viết template mới:
> - KHÔNG đặt animation `infinite` cho bất kỳ phần tử nào.
> - Mọi `@keyframes` kết thúc **≤ 2,2s** kể từ đầu cảnh, `both` fill, easing
>   kết ở trạng thái đứng yên (ease-out, không overshoot).
> - `kenburns` / mọi hiệu ứng ảnh: thời lượng ≤ 2,2s, zoom ≤ 6%, KHÔNG dài hơn
>   `data-duration`.
> - Chỉ sửa `--bg*` / `--accent*` / canvas / font — KHÔNG đụng `<script>`,
>   `@keyframes`, `animation:` của scaffold.
>
> Sau **Step 8** (chạy pipeline với prefix `OMNIVOICE_ENDPOINT=...`), kiểm nhanh:
> trích 2 khung liền nhau quanh `t = <đầu cảnh> + data-duration` và quanh
> `t = <đầu cảnh> + 2,5s` của 1–2 cảnh; chênh lệch pixel phải ~0. Nếu nhảy →
> sửa animation cho settle sớm hơn, xoá `clips/` rồi render lại (giữ prefix
> endpoint remote).

Lần **tạo lại video** (Bước 2): giữ nguyên chỉ thị (d)/1h này.

### 1i. Video THỜI TIẾT — hook BẮT BUỘC có ngày dự báo

Áp dụng khi nội dung đầu vào là bản tin/dự báo thời tiết (tiêu đề hoặc nội
dung có "thời tiết", "dự báo", "áp thấp/bão", nhắc nhiệt độ — mưa — nắng theo
ngày cụ thể, hoặc user nói rõ "video thời tiết"). Các video KHÔNG phải thời
tiết thì **bỏ qua mục này**, giữ nguyên quy tắc cấm ngày tháng mặc định của
`tram-ai-template-video`.

> `tram-ai-template-video` Step 6/Step 7 mặc định **cấm tuyệt đối**
> mọi chuỗi ngày tháng ở mọi slot của mọi scene. Với video thời tiết, **ghi đè
> quy tắc đó CHỈ cho scene hook** — hook phải nêu rõ ngày dự báo, các scene
> thân + outro vẫn cấm ngày tháng như bình thường.

Trong prompt gửi `tram-ai-template-video` (mục 1c), thêm chỉ thị:

> **Xác định ngày dự báo**: lấy từ tiêu đề/nội dung nguồn (vd "Thời tiết hôm
> nay 19/9..." → ngày dự báo = `19/9`). Nếu nguồn không ghi rõ ngày → dùng
> ngày hệ thống hôm nay (`date +"%-d/%-m"`). Đây là ngày **bản tin đang nói
> tới**, không phải ngày giờ render video.
>
> **Ở Step 6 (sinh `script.json`), CHỈ scene hook (`scenes[0]`)**: đặt ngày dự
> báo vào `kicker`, dạng ngắn gọn viết hoa, vd `kicker: "THỜI TIẾT 19/9"` hoặc
> `"DỰ BÁO NGÀY 19/9"` (không thêm năm trừ khi khác năm hệ thống). KHÔNG đặt
> ngày vào `foot_left`/`foot_right` (hai slot này vẫn theo đúng quy tắc cũ:
> `foot_left = "Trạm AI"`, `foot_right` để trống). KHÔNG đặt ngày vào bất kỳ
> slot nào của các scene thân/outro.
>
> `voiceText` của hook đọc ngày ra chữ theo đúng quy tắc TTS tiếng Việt (vd
> `19/9` → `"mười chín tháng chín"`), lồng tự nhiên vào câu mở đầu, không đọc
> kiểu liệt kê khô khan.
>
> **Step 7 (tự kiểm tra)**: câu lệnh grep ngày tháng mặc định
> (`grep -nE '[0-9]{1,2}[/-][0-9]{1,2}[/-]...'`) với video thời tiết sẽ có
> **đúng 1 kết quả** — dòng `kicker` của hook. Coi đó là hợp lệ (không phải
> lỗi cần sửa). Nếu grep trả về **thêm** kết quả ở bất kỳ scene/slot nào khác
> → vẫn phải xoá ngày ở những chỗ đó như quy tắc gốc.

Nếu bài viết đề cập nhiều ngày (vd "hôm nay 19/9" và dự báo thêm "20-21/9") —
hook chỉ lấy đúng **ngày chính của bản tin** (ngày "hôm nay"/gần nhất), không
nhồi cả khoảng ngày vào `kicker` (đoạn dự báo xa hơn nêu ở scene thân bằng
lời văn thường, không cần định dạng ngày).

Ở Bước 7 (báo kết quả) của skill này, thêm 1 dòng khi video là thời tiết:
`Hook hiển thị ngày dự báo: <D/M>`.

Lần **tạo lại video** (Bước 2): xác định lại ngày dự báo theo đúng logic trên
cho `outputDir` mới (đề phòng user yêu cầu đổi sang bản tin ngày khác).

### 1j. `voiceText` — đọc SỐ có dấu `.` / `,` (thập phân, hàng nghìn, phiên bản, mã)

> Bổ sung cho "Quy tắc TTS tiếng Việt" của `tram-ai-template-video`
> Step 6 (quy tắc gốc đã theo quy ước Việt Nam: `,` = thập phân, `.` + 3 chữ số =
> hàng nghìn; mục này bổ sung cách xử lý số nguồn tiếng Anh, mã, giờ, đơn vị).

Trong prompt gửi `tram-ai-template-video` (mục 1c), thêm chỉ thị cho
**Step 6** (viết `voiceText`) và **Step 7** (tự kiểm tra):

> **B1 — Xác định vai trò dấu `.` / `,` THEO NGUỒN, trước khi đổi ra chữ.**
> Báo Việt (VnExpress, Tuổi Trẻ, Dân trí…): `.` = **phân cách hàng nghìn**,
> `,` = **dấu thập phân**. Nguồn tiếng Anh / quốc tế: ngược lại. Mẹo phân biệt:
> sau dấu có **đúng 3 chữ số** và số đó là tiền / dân số / số lượng → hàng
> nghìn; còn lại (1–2 chữ số, %, độ, km, điểm, chỉ số) → thập phân. Còn mơ hồ →
> đối chiếu lại `content-enriched.txt` / nguồn gốc.
>
> | Nguồn ghi | Nghĩa | `voiceText` |
> | --- | --- | --- |
> | `1.500 tỷ` (báo Việt) | 1500 | `một nghìn năm trăm tỷ` (KHÔNG "một chấm năm") |
> | `12.345 người` | 12345 | `mười hai nghìn ba trăm bốn mươi lăm người` |
> | `3,5%` (báo Việt) / `3.5%` (nguồn Anh) | 3,5 | `ba phẩy năm phần trăm` |
> | `1,5 triệu USD` / `USD 1.5 million` | 1,5 triệu | `một triệu rưỡi đô la` hoặc `một phẩy năm triệu đô la` |
>
> **B2 — Đọc số thập phân (`phẩy`).**
> - Phần sau dấu phẩy **1–2 chữ số** → đọc như một số: `4,45` → `bốn phẩy bốn
>   mươi lăm`; `29,9` → `hai mươi chín phẩy chín`.
> - Có **số 0 đứng đầu** → đọc `không`: `1,09` → `một phẩy không chín`;
>   `0,5` → `không phẩy năm`.
> - **≥ 3 chữ số** sau dấu → đọc từng chữ số: `3,142` → `ba phẩy một bốn hai`.
> - **Bỏ số 0 cuối vô nghĩa**: `3,50%` → `ba phẩy năm phần trăm`.
> - Tiền / số lượng lớn ưu tiên **đổi xuống đơn vị nhỏ** cho tự nhiên khi gọn:
>   `1,2 triệu` → `một triệu hai trăm nghìn`; `1,09 tỷ` → `một tỷ không trăm
>   chín mươi triệu` (hoặc `hơn một tỷ` nếu câu chỉ cần ước lượng);
>   `,5` tròn → `rưỡi` (`2,5 tỷ` → `hai tỷ rưỡi`).
>
> **B3 — Dấu chấm KHÔNG phải số đếm → `chấm`.** Phiên bản, tên model, mã:
> `iOS 18.2` → `iOS mười tám chấm hai`; `GPT-5.5` → `GPT năm chấm năm`;
> `v2.0` → `phiên bản hai chấm không`; `Euro 2.0`… (không dùng `phẩy` ở đây).
>
> **B4 — Mã / ký hiệu chữ + số**: đọc rời từng ký tự, số `0` = `không`:
> `Nano S05` → `Nano S không năm`; `VF3` → `VF ba`; `Galaxy S25` → `Galaxy S hai
> mươi lăm`; biển số / số hiệu chuyến bay đọc từng chữ số.
>
> **B5 — Dấu khác trong số**: giờ `7h30` / `7:30` → `bảy giờ ba mươi`; khoảng
> `3-5 ngày` → `ba đến năm ngày`; tỉ số `2-1` → `hai một`; `1/3` → `một phần ba`;
> `°C` → `độ C`; `km/h` → `ki lô mét một giờ`; `m²` → `mét vuông`.
>
> **Step 7 — kiểm tra bắt buộc**: `voiceText` KHÔNG được còn một chữ số nào.
>
> ```bash
> python3 -c "import json,re;[print(s['id'],m) for s in json.load(open('<outputDir>/script.json'))['scenes'] for m in re.findall(r'\S*\d\S*',s['voiceText'])]"
> ```
>
> Phải KHÔNG in ra gì. Còn kết quả → viết lại số đó theo B1–B5 rồi kiểm lại.
> Đồng thời đọc lướt mọi chỗ có `phẩy` / `chấm` trong `voiceText`, đối chiếu
> với số gốc trong `inputs` / `content-enriched.txt`: giá trị phải khớp (bắt lỗi
> `1.500` bị đọc thành `một chấm năm`, hay `3,5` bị đọc thành `ba nghìn năm`).

**Lưới an toàn trong pipeline** (không cần làm gì thêm, chỉ cần biết): trước khi
gửi TTS, `npm run pipeline` tự đổi mọi chữ số còn sót trong `voiceText` ra chữ
bằng `src/tts/vi-number.ts`, **luôn theo quy ước Việt Nam**:

| Trong `voiceText` | Đọc thành |
| --- | --- |
| `4,5` (phẩy = thập phân) | `bốn phẩy năm` |
| `4.500` (chấm + đúng 3 chữ số = hàng nghìn) | `bốn nghìn năm trăm` |
| `30.340,9` | `ba mươi nghìn ba trăm bốn mươi phẩy chín` |
| `3,50%` (bỏ số 0 cuối) | `ba phẩy năm phần trăm` |
| `1.5`, `2.0` (chấm KHÔNG theo sau bởi 3 chữ số) | `một chấm năm`, `hai chấm không` |
| `1,234,567` / `1,234.5` / `25,000` (kiểu Anh rõ ràng) | đọc theo giá trị thật: `một triệu hai trăm…`, `một nghìn… phẩy năm`, `hai mươi lăm nghìn` |
| `24.10.2026`, `24/10/2026` | `hai mươi tư tháng mười năm hai nghìn không trăm hai mươi sáu` |
| `7h30`, `21:05`, `9h` | `bảy giờ ba mươi`, `hai mươi mốt giờ năm`, `chín giờ` |
| `VF3`, `Nano S05`, `0912…` | `VF ba`, `Nano S không năm`, `không chín một hai…` (số có `0` đầu đọc từng chữ số) |

Hệ quả: số kiểu Anh **mơ hồ** (`3.5%`, `1,234` — chỉ một dấu) mà lọt vào
`voiceText` vẫn bị đọc theo quy ước Việt (`ba chấm năm`, `một phẩy hai ba bốn`) → SAI
nếu nguồn là tiếng Anh → B1 vẫn bắt buộc: tự đổi
số nguồn Anh ra chữ (hoặc sang dạng Việt) khi viết. Lưới an toàn không thay
cho bước kiểm tra "không còn chữ số" ở Step 7 — nó chỉ chặn lỗi lọt lưới.

Lần **tạo lại video** (Bước 2): giữ nguyên chỉ thị 1j này.

---

## Thay đổi ở "Bước 5: Sinh Hình thu nhỏ (thumbnail)"

Dùng script trong thư mục skill này (bản copy y hệt của `media-skill`):

```bash
python3 .claude/skills/tram-ai-skill/scripts/compose_thumbnail.py \
    --dir <outputDir> --pick <N> [--focus "<x>% <y>%"]
```

Mọi tham số / hành vi khác giữ nguyên như mô tả ở `media-skill` Bước 5.

Vì mục **1f** đã crop bỏ logo nguồn khác **ngay trên** `source-images/img-<N>.<ext>`,
thumbnail tự động dùng ảnh đã sạch logo — không cần thao tác thêm.

---

## Mọi thứ khác: giữ nguyên `media-skill`

Bước 2 (video render xong đi thẳng sang sinh kịch bản đăng, KHÔNG chờ duyệt,
KHÔNG hỏi xác nhận), Bước 3
(`create-youtube-content`), Bước 4 (sinh `facebook.md` + `tiktok.md` — TikTok
tạm dừng *đăng*, `tiktok.md` vẫn tạo để dành), Bước 5b (`COVER_MS` — chỉ còn
là dự phòng cho Facebook), Bước 6 (upload lần lượt YouTube → Facebook; **KHÔNG**
gọi `upload-tiktok-video`), Bước 7 (báo kết quả — hàng TikTok ghi ⏸ tạm dừng
đăng, đã có `tiktok.md`), và toàn bộ mục **Ghi chú** — thực hiện **đúng như
`.claude/skills/tram-ai-skill/reference/base/media-skill.md`**, không thay đổi.

> **Hashtag `tiktok.md`**: theo đúng `media-skill` Bước 4 — tối đa 5 hashtag,
> **2 tag đầu LUÔN là `#xuhuong #fyp`** (đúng thứ tự), rồi 1–2 hashtag chủ đề,
> `#TramAI` (tên kênh) đặt **cuối cùng**.

Riêng khi báo kết quả ở Bước 7, thêm 1 dòng:

```
TTS: remote — http://14.178.142.29:13562 (omni_voice_mcrs) · hook đọc nhanh atempo=1.10
Hook: ảnh nền img-<N> "<caption ngắn>" (fallback gradient nếu không có ảnh phù hợp)
Motion: settle ≤2,2s mỗi cảnh (không giật cuối cảnh — mục 1h)
```

Luôn thêm 1 dòng tóm tắt Bước 0:
`Nghiên cứu: <K> bài đạt / <M> bài xét (<tên báo, …>) · +<D> dữ kiện · +<I> ảnh — xem research.md`
(bỏ qua Bước 0 thì ghi `Nghiên cứu: bỏ qua (theo yêu cầu user)`).

Nếu có ảnh nào bị crop bỏ logo nguồn khác (mục 1f), thêm 1 dòng liệt kê:
`Ảnh đã crop bỏ logo nguồn khác: img-2, img-4 (bản gốc ở source-images/_raw/)`.
