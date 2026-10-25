---
name: media-skill
description: Chạy trọn quy trình từ nội dung thô + hình ảnh đến khi đăng video lên YouTube + Facebook (TikTok TẠM DỪNG ĐĂNG — vẫn sinh tiktok.md để dành) — sinh video bằng tram-ai-template-video → TỰ ĐỘNG sinh kịch bản đăng (youtube.md, facebook.md, tiktok.md) + Hình thu nhỏ (thumbnail ghép từ 1 trong các ảnh đầu vào + tiêu đề chồng lên, KHÔNG dùng gpt-image-2; tự gắn vào video khi upload YouTube) rồi upload thẳng bằng upload-youtube-video / upload-facebook-video (KHÔNG gọi upload-tiktok-video) — KHÔNG chờ user duyệt video, KHÔNG hỏi xác nhận ở bất kỳ bước nào, chỉ gửi video cho user xem sau khi đã đăng xong. Video dọc 9:16 đăng dạng Short (YouTube) + Reel (Facebook); video ngang 16:9 đăng video dài bình thường. Trigger khi user muốn "làm video rồi đăng đa nền tảng", "tạo và đăng YouTube Facebook", "chạy full pipeline media", "làm video từ nội dung + ảnh này rồi đăng". Input: nội dung/URL/file .txt + hình ảnh.
---

# Multi-Platform Video Pipeline Skill (media-skill)

Skill điều phối (orchestrator) — tham khảo `youtube-skill`, nhưng có 2 điểm
khác:

1. **Sinh video bằng `tram-ai-template-video`** (template động từ text
   **+ hình ảnh** của user), không phải `create-template-video`.
2. **Đăng lên YouTube + Facebook** (TikTok tạm dừng *đăng* — xem khối cảnh báo
   bên dưới): sinh **3 file `.md`** kịch bản đăng (`youtube.md`, `facebook.md`,
   `tiktok.md`) rồi upload bằng `upload-youtube-video`, `upload-facebook-video`
   (KHÔNG gọi `upload-tiktok-video` — `tiktok.md` chỉ sinh để dành sẵn).

Skill này **không tự viết lại logic** của các skill con — chỉ điều phối, gọi
đúng thứ tự, **KHÔNG có bước duyệt video** — video render xong là đăng thẳng.

> ## ⚠️ CHẾ ĐỘ HIỆN TẠI (tạm thời)
>
> 1. **TẠM DỪNG *đăng* TikTok — nhưng VẪN sinh `tiktok.md`.** Bước 4 vẫn tạo
>    file `tiktok.md` (kịch bản + hashtag) như bình thường để dành sẵn; chỉ
>    **KHÔNG gọi `upload-tiktok-video`** ở Bước 6. Đăng công khai chỉ có
>    **YouTube + Facebook**. (Khi cần bật lại đăng TikTok: bỏ khối cảnh báo này
>    và khôi phục bước `upload-tiktok-video` có gạch ngang bên dưới.)
> 2. **KHÔNG chờ user duyệt video, KHÔNG hỏi xác nhận** ở bất kỳ bước nào —
>    video render xong (Bước 1) là đi thẳng sinh kịch bản đăng + đăng luôn lên
>    CẢ 2 nền tảng (YouTube + Facebook). Truyền ý "đăng luôn, không cần hỏi"
>    xuống từng skill con upload. Video chỉ được gửi cho user xem ở Bước 7 (sau
>    khi đã đăng xong), như một thông báo kết quả — không phải bước chờ phản hồi.

## Input

- **Nội dung** (bắt buộc): văn bản dán trực tiếp, URL bài báo, hoặc đường dẫn
  file `.txt` (giống input của `tram-ai-template-video`).
- **Hình ảnh** (bắt buộc, ≥1): danh sách file local theo thứ tự, danh sách URL
  ảnh, một thư mục ảnh, hoặc ảnh đính kèm trong hội thoại.
- **Tỉ lệ khung** (tuỳ chọn): `9:16` hoặc `16:9`. Nếu input chưa nói rõ,
  `tram-ai-template-video` sẽ tự hỏi ở bước của nó. Tỉ lệ quyết định
  **định dạng đăng** ở cả 3 nền tảng:

  | Tỉ lệ | YouTube | Facebook | TikTok |
  | --- | --- | --- | --- |
  | `9:16` (dọc) | **Short** (thêm `#Shorts`) | **Reel** (`/video_reels`) | video thường |
  | `16:9` (ngang) | **video dài** bình thường (không `#Shorts`) | **video thường** (`/videos`) | video thường |

  TikTok luôn đăng (cả 2 tỉ lệ). YouTube/Facebook tự nhận diện định dạng theo
  `aspect` trong `script.json` — không cần chọn thủ công.

Nếu user không đưa hình ảnh → hỏi user hình ảnh; nếu user không có ảnh, gợi ý
dùng `youtube-skill` (chỉ YouTube, không cần ảnh) thay vì skill này.

## Workflow

### Bước 1: Sinh video (tram-ai-template-video)

**Trước khi gọi sub-skill — chọn giọng lồng tiếng theo tông nội dung tổng quan:**

1. Đọc lướt nội dung đầu vào, xác định **tông tổng quan** (thể thao/sôi động ·
   nghiêm túc/điều tra · đời sống/nhẹ nhàng · tin tức trung tính…).
2. Đọc `PROJECTS/OmniVoice/voice_library/note.md` để lấy danh sách giọng + mô tả
   hiện có (đừng hard-code — thư mục có thể thêm giọng mới).
3. Map tông → 1 `voice.name`:

   | Tông nội dung | `voice.name` |
   | --- | --- |
   | Tin tức, phân tích, trung tính (mặc định) | `vira` (nam, tự tin, giọng trung) |
   | Thể thao, giải trí, sôi động, hào hứng | `dori` (nam, hoạt bát, trầm) |
   | Nghiêm túc, điều tra, kịch tính/nặng nề | `jett` (nam, khàn, giọng trầm) |
   | Đời sống, mẹo vặt, nhẹ nhàng/tích cực | `kaci` (nữ, tươi vui, giọng trung) |

Gọi `Skill` `tram-ai-template-video` với **nội dung + hình ảnh** đầu vào,
**kèm chỉ định `voice.name` đã chọn** (nói rõ trong prompt: "set
`voice.name: \"<id>\"` trong script.json"). Nếu là lần tạo lại theo phản hồi
user, giữ nguyên `voice.name` trừ khi user muốn đổi giọng. Skill đó tự sinh
template động
và render `video.mp4` + `voice.mp3` + `script.txt` + `script.json`.

**Kèm 4 chỉ thị bổ sung trong prompt gửi `tram-ai-template-video`:**

**(a) Frame đầu (scene hook) — giọng đọc NHANH HƠN MỘT CHÚT.** Scene đầu tiên
(`scenes[0]`, `type: "hook"`) đọc nhanh hơn phần còn lại một chút để giữ nhịp,
giữ chân người xem; các scene thân + outro giữ tốc độ bình thường (`voice.speed`
toàn cục không đổi — pipeline hiện chưa áp dụng field này). Chỉ thị:

> Sau khi **Step 8** (pipeline) chạy xong lần đầu, **trước Step 9** (gửi video):
> tăng tốc RIÊNG giọng đọc scene hook rồi render lại.
>
> ```bash
> cd <outputDir>
> HOOK_ID=$(python3 -c "import json;print(json.load(open('script.json'))['scenes'][0]['id'])")
> ffmpeg -y -i "voice/scene-$HOOK_ID.mp3" -filter:a "atempo=1.10" -c:a libmp3lame -q:a 2 "voice/scene-$HOOK_ID.fast.mp3"
> mv "voice/scene-$HOOK_ID.fast.mp3" "voice/scene-$HOOK_ID.mp3"
> rm -f voice-raw.mp3 voice.mp3 video-silent.mp4 video.mp4 "clips/scene-$HOOK_ID-fit.mp4"
> npm run pipeline -- <outputDir>/script.json
> ```
>
> Pipeline **tái dùng** mọi `voice/scene-*.mp3` đã có (chỉ scene hook đã bị thay
> bằng bản nhanh hơn) + REUSE clip các scene khác, tự tính lại timing + fit lại
> clip hook + ghép lại `video.mp4`. Chỉ `SendUserFile` ở Step 9 SAU khi render lại.
>
> `atempo=1.10` (nhanh ~10%) là mặc định; chỉ đổi khi user nói rõ — khoảng cho
> phép `1.05`–`1.20`. KHÔNG đụng giọng của bất kỳ scene nào khác.

Lần **tạo lại video** (theo phản hồi user): làm lại đúng bước tăng tốc hook này trên
`outputDir` mới.

**(b) Ảnh có logo/watermark của nguồn khác — CROP bỏ phần đó.** Chỉ thị cho
**Step 4** (đọc hiểu ảnh):

> Với **mỗi** ảnh trong `<outputDir>/source-images/`, khi `Read` để xem: kiểm tra
> có **logo / watermark / bug / chữ ký của kênh hay hãng tin KHÁC** không — logo
> đài truyền hình, tên báo, tên miền, avatar/handle kênh YouTube–TikTok–Facebook,
> `© ...`, dải tin chạy (news ticker) ở chân màn hình, khung branding…
>
> Nếu **có** → CROP bỏ phần đó **ngay tại chỗ** trước khi đi tiếp (Step 5.4 tự
> copy bản đã cắt vào `<TPL>/assets/`, và `compose_thumbnail.py` ở Bước 5 cũng
> dùng bản đã cắt này):
>
> ```bash
> cd <outputDir>
> mkdir -p source-images/_raw
> cp source-images/img-<N>.<ext> source-images/_raw/img-<N>.<ext>   # giữ bản gốc
> # ví dụ: logo ở dải DƯỚI cùng, cao ~12% khung hình → bỏ dải đó
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
> (`source-images/_raw/` nằm ngoài glob `img-*` nên không ảnh hưởng `--pick <N>`
> của `compose_thumbnail.py`.)

**(c) Frame hook (scene đầu) — LUÔN có ảnh NỔI BẬT NHẤT của nội dung làm nền.**
Mặc định `tram-ai-template-video` cho scene hook `layout: "hero"` (nền
gradient trơn, KHÔNG ảnh). Ép đổi: scene hook phải là `layout: "image-full"`,
lấy **một ảnh nổi bật nhất** làm nền toàn khung, headline + body đè lên trên.
Chỉ thị cho **Step 6** (sinh `script.json`):

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

**(d) KHÔNG để video bị "giật" ở cuối mỗi cảnh.** Pipeline render mỗi cảnh "sống"
`data-duration` giây (mặc định 6s) rồi **đóng băng khung cuối** (`tpad`) để kéo
dài theo giọng đọc. Nếu còn chuyển động tại mốc đó — hoặc một animation *kết
thúc* lúc vẫn đang chạy nhanh — mắt người xem đọc thành **cú giật**. Chỉ thị cho
**Step 5** (sinh / chỉnh template động):

> Scaffold `reference/template-scaffold.html` bản hiện tại ĐÃ xử lý: mọi motion
> nền (`hue`, blob `drift1/drift2`) + `kenburns` ảnh biên độ nhỏ, giảm tốc êm
> (`easeOutCubic`) và **dừng hẳn trong ~2,2s** — giữ nguyên, ĐỪNG hoàn tác.
>
> Khi Step 5.3 chỉnh `index.html` hoặc nếu tự viết template mới:
> - KHÔNG đặt animation `infinite` cho bất kỳ phần tử nào (blob, nền, ảnh…).
> - Mọi `@keyframes` phải kết thúc **≤ 2,2s** kể từ đầu cảnh, `both` fill, và
>   easing kết ở trạng thái đứng yên (ease-out, không overshoot).
> - `kenburns` (hoặc mọi hiệu ứng ảnh): thời lượng ≤ 2,2s, zoom ≤ 6%
>   (`scale(1.06)` → `scale(1)`), KHÔNG dài hơn `data-duration`.
> - Chỉ sửa `--bg*` / `--accent*` / canvas / font như hợp đồng — KHÔNG đụng
>   `<script>`, `@keyframes`, hay `animation:` của scaffold.
>
> Sau **Step 8**, kiểm nhanh: trích 2 khung liền nhau quanh mốc đóng băng của
> 1–2 cảnh (`t = <đầu cảnh> + data-duration`) và quanh `t = <đầu cảnh> + 2,5s`;
> chênh lệch pixel phải ~0. Nếu thấy nhảy → sửa animation cho settle sớm hơn rồi
> render lại (xoá `clips/`).

Lần **tạo lại video** (theo phản hồi user): giữ nguyên chỉ thị (d) này.

> OmniVoice serving đọc `voice.name` → `voice_library/<name>.wav`. Nếu vừa sửa
> `serving_omnivoice.py` / thêm giọng mới thì phải **khởi động lại**
> `uv run serving_omnivoice.py` mới có hiệu lực. `curl -s http://127.0.0.1:8123/`
> trả về danh sách `voices` server đang nhận.

**Vị trí `outputDir` — theo phiên/ngày để kiểm soát lịch sử:**

- Lấy `DATE` = ngày hôm nay lúc sinh video, định dạng `YYYY-MM-DD`
  (vd `2026-09-06`).
- `SESSION_DIR = videos/short/<DATE>/`. `mkdir -p` nếu chưa có (mỗi ngày một
  folder mới; nhiều video trong cùng ngày nằm chung folder này).
- `outputDir = videos/short/<DATE>/<slug>-<timestamp>/`.
- `tram-ai-template-video` mặc định tạo folder dưới `videos/_render/`. Sau khi
  skill đó chạy xong, **di chuyển** cả folder `videos/_render/<slug>-<timestamp>/` sang
  `videos/short/<DATE>/<slug>-<timestamp>/` (`mkdir -p videos/short/<DATE>`
  trước, rồi `mv`). Từ đây trở đi **mọi bước dùng `outputDir` mới này**.
  (`templateId` trong `script.json` trỏ tới `templates/_dyn/...` — không bị ảnh
  hưởng khi di chuyển `outputDir` vì clip đã render xong.)

**Ghi nhớ `outputDir`** (đường dẫn `videos/short/...` sau khi đã di chuyển)
cho các bước sau.

**Ghi nhớ `ASPECT`**: đọc `"aspect"` trong `<outputDir>/script.json` (`9:16`
hoặc `16:9`). Giá trị này quyết định định dạng đăng ở Bước 4/6/7 —
`SHORT_FORM = (ASPECT == "9:16")`.

Nếu `tram-ai-template-video` báo lỗi (không lấy được nội dung, 0 ảnh
dùng được, pipeline fail…) → in nguyên lỗi cho user, dừng lại — không tự ý sang
Bước 2.

### Bước 2: Video đã render xong → đi thẳng sang sinh kịch bản đăng

**KHÔNG chờ duyệt, KHÔNG hỏi xác nhận.** `tram-ai-template-video`
(Step 9) đã tự `SendUserFile` bản `video.mp4` vừa render cho user xem — coi đó
là thông báo tiến độ, không phải bước chờ phản hồi. Đi thẳng sang **Bước 3**
ngay sau khi Bước 1 render xong thành công.

Chỉ quay lại **Bước 1** để tạo lại video khi user **chủ động** nhắn phản hồi
(trước hoặc sau khi đã đăng) yêu cầu sửa nội dung/kịch bản/ảnh/giọng đọc/tỉ lệ
khung — khi đó tạo `outputDir` mới (không ghi đè bản cũ) rồi từ đó lặp lại toàn
bộ quy trình (sinh kịch bản đăng + đăng lại) trên video mới, không hỏi lại xác
nhận đăng.

### Bước 3: Sinh youtube.md (create-youtube-content)

Gọi `Skill` `create-youtube-content` với `outputDir` của video vừa render. Skill
đó đọc `script.json` và ghi `<outputDir>/youtube.md` (title + description +
tags + ghim comment), in title + description ra chat.

**Điều chỉnh youtube.md theo `ASPECT` (làm sau khi skill trên chạy xong):**

- Nếu `SHORT_FORM` (`9:16`): đảm bảo có `#shorts` (lowercase) và
  `trendingshorts` — trong hashtag cuối description và trong danh sách tag.
  Giữ description ngắn gọn kiểu Shorts.
- Nếu `16:9` (video dài): **xoá** mọi biến thể `#shorts`/`#Shorts`/
  `trendingshorts` khỏi description và tag; bỏ các câu kiểu "xem hết trong 60
  giây", "lướt tiếp"… Có thể nới description dài hơn (2–4 đoạn) cho hợp video
  dài. Không đổi title/nội dung cốt lõi.

Sửa trực tiếp file `<outputDir>/youtube.md` rồi in lại title + hashtag để user
thấy.

### Bước 4: Sinh facebook.md + tiktok.md

> **TikTok đang tạm dừng *đăng* — nhưng VẪN sinh `tiktok.md`.** Tạo cả
> `facebook.md` lẫn `tiktok.md` theo mô tả bên dưới. Chỉ khác: Bước 6 KHÔNG
> gọi `upload-tiktok-video` (file `tiktok.md` sinh ra để dành sẵn, đăng tay
> hoặc chờ bật lại tự động).

Từ `<outputDir>/youtube.md` (và `script.json` nếu cần), **tự sinh thêm file**
`facebook.md` và `tiktok.md` kịch bản đăng. **Không bịa** số liệu/sự kiện
ngoài script. Giữ đúng định vị kênh **Trạm AI** (gần gũi, tò mò, không giật tít
sai, không thổi phồng — như mô tả trong `create-youtube-content`).

**Theo `ASPECT`:**

- `SHORT_FORM` (`9:16`): `facebook.md` viết cho **Reel** (hook mạnh 1–2 câu,
  ngắn); `tiktok.md` như mô tả bên dưới.
- `16:9` (video dài): `facebook.md` viết cho **video thường** — mô tả có thể
  dài hơn, kể được nhiều ý; **không** dùng `#Shorts`/`#Reel`. `tiktok.md` vẫn
  giữ ngắn gọn (TikTok luôn là feed dọc/ngắn kể cả khi nguồn 16:9).

**`<outputDir>/facebook.md`** — cùng cấu trúc `youtube.md` để
`upload-facebook-video` parse được (title = dòng `#` đầu; description = mục
`## Mô tả (Description)`):

```markdown
# [tiêu đề kiểu Facebook — có thể mềm hơn, ≤ ~100 ký tự]

## Mô tả (Description)
[1–2 câu hook mở đầu, gợi tò mò]

[đoạn tóm tắt 2–4 câu, viết lại tự nhiên theo script — không copy nguyên văn]

Theo dõi Trạm AI để cập nhật trí tuệ nhân tạo mỗi ngày:
👉 YouTube: https://www.youtube.com/@tram-ai
👉 TikTok: https://www.tiktok.com/@tram.ai.vn
👉 Facebook: https://www.facebook.com/1430978420097668

[dòng hashtag: 3–5 hashtag, 2–4 hashtag chủ đề trước, `#TramAI` (tên kênh) đặt
gần cuối cùng. Facebook dùng ít hashtag hơn YouTube — không nhồi #Shorts.]
```

**`<outputDir>/tiktok.md`** — `upload-tiktok-video` ghép TẤT CẢ dòng (bỏ dòng
`## ...`) thành caption, và cắt ở 2200 ký tự. Giữ ngắn gọn, giật, kiểu TikTok:

```markdown
# [caption chính 1–2 câu, hook mạnh nhất của video, có thể 1 emoji]

[tuỳ chọn: 1 câu chốt / lời mời xem hết]

#xuhuong #fyp #[chủ đề1] #[chủ đề2] #TramAI
```

- Dòng `#` đầu tiên là caption chính (script tự bỏ dấu `# `).
- KHÔNG thêm mục `## ...` có nội dung quan trọng (sẽ bị bỏ khi ghép caption).
- Hashtag: **tối đa 5 cái**. **2 tag đầu LUÔN là `#xuhuong #fyp`** (đúng thứ
  tự đó), rồi 1–2 hashtag chủ đề (tiếng Việt không dấu, viết liền:
  `#thansohoc`, `#khamphabanthan`…), và `#TramAI` (tên kênh) đặt **cuối cùng**.
  Nếu tái sử dụng hashtag từ `youtube.md` thì vẫn ép `#xuhuong #fyp` lên đầu,
  `#TramAI` xuống cuối, và cắt tổng còn ≤ 5 cái.

Tự kiểm tra: `youtube.md` + `facebook.md` + `tiktok.md` đều tồn tại trong
`outputDir`; khối CTA của `facebook.md` đúng 3 link YouTube/TikTok/Facebook,
không có link/kênh nào khác; `tiktok.md` có `#xuhuong #fyp` ở đầu dòng hashtag
và `#TramAI` ở cuối; `facebook.md` có `#TramAI` ở gần cuối dòng hashtag (không ở
đầu); không có thông tin bịa ngoài script.

In ngắn gọn ra chat 2 caption/title (YouTube + Facebook) để user xem trước
(`tiktok.md` chỉ để dành, không cần in).

### Bước 5: Sinh Hình thu nhỏ (thumbnail)

**KHÔNG dùng `create-thumbnail-image` / `gpt-image-2` nữa.** Thumbnail của
media-skill được **ghép từ CHÍNH một trong các ảnh đầu vào của video** (ảnh
user đưa ở Bước 1) + **tiêu đề** chồng lên trên, bằng script:

```bash
python3 .claude/skills/tram-ai-skill/scripts/compose_thumbnail.py \
    --dir <outputDir> --pick <N> [--focus "<x>% <y>%"]
```

- `--dir`: `outputDir` — script tự đọc tiêu đề từ `<outputDir>/youtube.md`
  (dòng `#` đầu), `aspect` từ `script.json`, và ghi `<outputDir>/thumbnail.png`
  đúng kích thước (`16:9` → `1920x1088`, `9:16` → `1088x1920`).
- `--pick <N>`: dùng ảnh nguồn thứ N trong `<outputDir>/source-images/`
  (1-based). **Chọn N là ảnh mạnh nhất / rõ chủ thể nhất** (thường là ảnh
  hero hoặc chân dung — xem lại phần "đọc hiểu ảnh" ở `tram-ai-template-video`
  Step 4). Mặc định `--pick 1`.
- `--focus "<x>% <y>%"` (tuỳ chọn): vùng giữ khi crop về đúng tỉ lệ khung, vd
  `"58% 34%"` để giữ mặt/chủ thể lệch phải-trên. Có thể lấy từ `image_focus`
  của scene dùng ảnh đó.
- `--title "..."`: chỉ truyền khi muốn ghi đè tiêu đề mặc định.
- Thêm `--dry-run` để xem trước ảnh nguồn / tiêu đề / kích thước đã resolve.

Thumbnail **chỉ có ảnh nền + tiêu đề** (và thanh accent) — **KHÔNG chèn tên
kênh "Trạm AI"** hay logo. Đừng truyền `--kicker`.

Vì Bước 1 (b) đã crop bỏ logo nguồn khác **ngay trên** `source-images/img-<N>.<ext>`,
thumbnail tự động dùng ảnh đã sạch logo — không cần thao tác thêm.

Chạy **sau Bước 3** (cần `youtube.md` để lấy tiêu đề). Script chỉ tạo file ảnh
local — không phải hành động công khai, không cần hỏi xác nhận user.

Nếu script lỗi (không tìm thấy ảnh nguồn, thiếu Pillow, tiêu đề trống…) → in
nguyên lỗi, vẫn tiếp tục Bước 6 (thumbnail không bắt buộc để upload được).
`upload-youtube-video` vẫn **tự động gắn** `<outputDir>/thumbnail.png` nếu có.

### Bước 5b: Chọn frame ảnh bìa (`COVER_MS`) — cho Facebook

> TikTok đang tạm dừng; `COVER_MS` giờ chỉ còn là **phương án dự phòng cho
> Facebook** khi thiếu `thumbnail.png`. Vẫn tính như dưới đây.

TikTok (và Facebook Reel) mặc định lấy frame ~1000 ms làm ảnh bìa — rơi vào
scene hook. Kể cả khi hook đã có ảnh nền (Bước 1 (c)), frame đó vẫn bị lớp scrim
+ headline đè lên nên không đẹp làm ảnh bìa. media-skill phải chọn một mốc thời
gian rơi vào **scene THÂN CÓ HÌNH ẢNH** (scene `inputs.image` khác rỗng và KHÔNG
phải hook), lấy điểm giữa scene đó; chỉ khi không scene thân nào có ảnh mới lùi
về scene hook. `COVER_MS` này dùng cho **cả `upload-tiktok-video` lẫn
`upload-facebook-video`** (Facebook ưu tiên `thumbnail.png`, chỉ dùng `COVER_MS`
khi thiếu file đó).

Chạy snippet sau (cần `ffprobe`) để tính `COVER_MS`:

```bash
python3 - "<outputDir>" <<'PY'
import json, os, subprocess, sys
d = sys.argv[1]
sc = json.load(open(os.path.join(d, "script.json"), encoding="utf-8"))["scenes"]

def dur(sid):
    for name in (f"clips/scene-{sid}-fit.mp4", f"clips/scene-{sid}.mp4"):
        p = os.path.join(d, name)
        if os.path.exists(p):
            out = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip()
            try:
                return float(out)
            except ValueError:
                return 0.0
    return 0.0

durs = [dur(s["id"]) for s in sc]
# scene THÂN (không phải hook) đầu tiên có hình ảnh
idx = next((i for i, s in enumerate(sc)
            if i > 0 and (s.get("inputs") or {}).get("image")), None)
if idx is None:
    # không scene thân nào có ảnh -> lùi về scene bất kỳ có ảnh (kể cả hook)
    idx = next((i for i, s in enumerate(sc)
                if (s.get("inputs") or {}).get("image")), None)
if idx is None:
    # không có ảnh trong scene nào -> né hook, lấy ~35% tổng thời lượng
    total = sum(durs)
    cover = max(1.5, total * 0.35)
else:
    start = sum(durs[:idx])
    cover = start + max(0.3, durs[idx] / 2)
print(int(cover * 1000))
PY
```

Gán kết quả cho `COVER_MS` (mili giây). Nếu snippet lỗi (thiếu `ffprobe`,
thiếu clip…) → dùng `COVER_MS = 3000` và đi tiếp (không chặn upload).

### Bước 6: Upload lần lượt lên YouTube + Facebook  (~~TikTok~~ — tạm dừng đăng)

Gọi lần lượt 2 skill với cùng `outputDir`. **Đăng luôn, KHÔNG hỏi xác nhận
lại.** Khi gọi mỗi skill con, **nói rõ trong prompt**: "đăng luôn không cần hỏi
xác nhận" để skill con bỏ qua bước hỏi xác nhận cuối của nó (vẫn cho chạy
dry-run để kiểm tra metadata, chỉ bỏ bước hỏi Y/N).

Thứ tự (đổi nếu user muốn):

1. `Skill` `upload-youtube-video` — `outputDir` (đọc `youtube.md`, đăng
   **public**; nếu `<outputDir>/thumbnail.png` đã sinh ở Bước 5, skill này **tự
   động gắn** làm custom thumbnail ngay sau khi upload — không cần truyền gì
   thêm). YouTube tự phân loại **Short** (khi `9:16` + `#Shorts` trong
   `youtube.md`) hay **video dài** (`16:9`) — không cần cờ riêng.
2. `Skill` `upload-facebook-video` — `outputDir` (đọc kịch bản Facebook; truyền
   `--metadata <outputDir>/facebook.md` để dùng đúng file này thay vì
   `youtube.md`; đăng **công khai lên Page**). Script **tự nhận diện** từ
   `script.json`: `9:16` → đăng **Reel** (`/video_reels`), `16:9` → **video
   thường** (`/videos`). Nếu `SHORT_FORM` mà dry-run không hiện
   `Định dạng: Reel` → truyền thêm `--reel`.
   **Ảnh bìa**: script tự lấy `<outputDir>/thumbnail.png` (sinh ở Bước 5) làm
   cover và đặt qua endpoint `/{video_id}/thumbnails`. Khi gọi skill, nói thêm:
   "chạy kèm `--cover-ms <COVER_MS>`" (giá trị Bước 5b) để có phương án dự phòng
   trích frame có hình ảnh nếu `thumbnail.png` thiếu. Kiểm tra dòng
   `Ảnh bìa: ...` trong dry-run KHÔNG phải `tắt`/`không trích được`.
3. ~~`Skill` `upload-tiktok-video`~~ — **TẠM DỪNG ĐĂNG.** KHÔNG gọi skill này.
   File `tiktok.md` đã sinh ở Bước 4 vẫn nằm trong `outputDir` để dành (đăng
   tay hoặc chờ bật lại). (Khi bật lại đăng tự động: `outputDir` đọc
   `tiktok.md`; app chưa audit nên video đăng **RIÊNG TƯ / SELF_ONLY**; đăng
   cho cả `9:16` lẫn `16:9`; truyền `--cover-ms <COVER_MS>`.)

**Xử lý lỗi từng nền tảng độc lập**: nếu 1 skill báo lỗi (token hết hạn, thiếu
credentials, tài khoản chưa nằm trong Target users, quota API…) → in nguyên lỗi
cho user, **vẫn tiếp tục** nền tảng còn lại, rồi tổng hợp ở Bước 7. Không tự ý
"né" lỗi bằng cách khác.

### Bước 7: Báo kết quả tổng hợp

In bảng kết quả 2 nền tảng đã đăng:

```markdown
✓ Video: [video.mp4](videos/short/<DATE>/<slug>-<timestamp>/video.mp4)  (<aspect>)
✓ Thumbnail: [thumbnail.png](videos/short/<DATE>/<slug>-<timestamp>/thumbnail.png)

| Nền tảng | Định dạng | Trạng thái | Link / ID |
| --- | --- | --- | --- |
| YouTube  | Short / video dài | ✓ public (thumbnail: ✓/✗) | https://youtu.be/<id> |
| Facebook | Reel / video thường | ✓ công khai | https://www.facebook.com/<page_id>/videos/<id> |
| TikTok   | — | ⏸ tạm dừng đăng (đã có tiktok.md, chưa đăng) | — |

(Cột "Định dạng": `9:16` → Short + Reel; `16:9` → video dài + video thường.)

Kịch bản: youtube.md · facebook.md · tiktok.md (tiktok.md để dành, chưa đăng)
(trong videos/short/<DATE>/<slug>-<timestamp>/)
```

Nền tảng nào lỗi thì ghi rõ trạng thái lỗi + 1 dòng lý do.

Thêm 1 dòng: `Hook: ảnh nền img-<N> "<caption ngắn>" · đọc nhanh atempo=1.10 ·
motion settle ≤2,2s (không giật cuối cảnh)` (ghi rõ ảnh nổi bật nào đang làm nền
frame hook — Bước 1 (c); nếu phải fallback về `hero` không ảnh thì ghi
`Hook: nền gradient (không có ảnh phù hợp) · …`).
Nếu có ảnh bị crop bỏ logo nguồn khác (Bước 1 (b)): thêm `Ảnh đã crop bỏ logo
nguồn khác: img-2, img-4 (bản gốc ở source-images/_raw/)`.

## Ghi chú

- **TẠM DỪNG ĐĂNG TikTok** (xem khối cảnh báo đầu file): VẪN sinh `tiktok.md`
  ở Bước 4, chỉ KHÔNG gọi `upload-tiktok-video` ở Bước 6. Đăng công khai chỉ
  YouTube + Facebook.
- **KHÔNG có bước duyệt video.** Video render xong (Bước 1) là đi thẳng sinh
  kịch bản đăng + đăng thẳng YouTube + Facebook, KHÔNG hỏi xác nhận lại. Truyền
  "đăng luôn không cần hỏi" xuống từng skill con upload.
- Skill điều phối — gọi đúng các skill con (`tram-ai-template-video`,
  `create-youtube-content`, `upload-youtube-video`, `upload-facebook-video`)
  cho video/script/upload. Riêng **thumbnail** thì media-skill tự lo bằng
  `scripts/compose_thumbnail.py` (ghép ảnh đầu vào + tiêu đề) — KHÔNG gọi
  `create-thumbnail-image`.
- Nếu Bước 1 báo lỗi (không render được video) → dừng, không upload gì.
- **Định dạng đăng theo `aspect` trong `script.json`** (không hỏi lại user):
  `9:16` → YouTube Short + Facebook Reel; `16:9` → YouTube video dài +
  Facebook video thường. Không đổi tỉ lệ video ở khâu đăng — muốn tỉ
  lệ khác thì tạo lại video ở Bước 1.
- Lịch sử lưu theo ngày: `videos/short/<YYYY-MM-DD>/<slug>-<timestamp>/`.
  Tạo folder ngày mới nếu chưa có; nhiều video cùng ngày nằm chung folder ngày
  đó. Mỗi lần tạo lại video theo phản hồi user ra một `<slug>-<timestamp>/`
  mới (trong folder ngày hiện tại), không ghi đè bản cũ.
- Muốn sửa nội dung đăng sau khi đã sinh: sửa `youtube.md` / `facebook.md` /
  `tiktok.md` trong `outputDir` rồi chạy lại skill upload tương ứng — đừng
  chỉnh title/caption thủ công trong bước upload.
- Điều kiện tiên quyết credentials của từng nền tảng nằm trong skill con tương
  ứng (`scripts/*.json`, gitignored). Thiếu file nào thì skill con đó sẽ dừng
  và hướng dẫn — làm theo skill con, quay lại tiếp phần còn lại.
