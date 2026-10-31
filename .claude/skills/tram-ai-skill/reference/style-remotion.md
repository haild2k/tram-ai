# Style REMOTION — short 9:16 motion graphics kiểu "editorial data"

Style dựng bằng **Remotion** (project `remotion/` ở gốc repo), thay cho template
HyperFrames của `tram-ai-template-video` (style **template**). Đây là style **MẶC ĐỊNH**
cho short — dùng mọi lần user không nói rõ "style template" (kể cả khi nói "style
remotion", "phong cách remotion", "kiểu video Anthropic 86%"…). Video mẫu
đã duyệt: `remotion/src/videos/agents-judgment-calls/` (composition
`AgentsJudgmentCalls`, đăng 28/10/2026).

Mọi quy tắc của `short.md` vẫn áp dụng (Bước 0 nghiên cứu, nguồn ưu tiên, quy
tắc TTS thuật ngữ AI, thương hiệu, giọng `minh_quan`, kịch bản đăng, YouTube
Studio, đăng 3 nền tảng). File này chỉ **thay Bước 1** (dựng video).

## Nhận diện style

- Nền tối gradient `#0e1230 → #1d1d4f`, lưới mảnh mờ, 2 quầng sáng (xanh tím
  `#6f8cff`, vàng `#f2b254`) trôi chậm, lớp hạt nhiễu — `src/tram/Chrome.tsx`.
- **KHÔNG** có thanh trên (logo kênh, tiến độ cảnh) và **KHÔNG** có footer dưới
  (tên kênh, nguồn). Thương hiệu chỉ xuất hiện ở outro.
- Font Be Vietnam Pro. Mỗi cảnh: `Kicker` (vạch màu + nhãn in hoa) → tiêu đề
  `H` lớn (84–92px, từ khoá tô `Hl` vàng) → 1 khối trọng tâm (số đếm chạy, biểu
  đồ cột/thanh, sơ đồ luồng, danh sách thẻ…).
- Số liệu chính luôn là đồ hoạ tiếng Việt chạy động (`count()`, cột mọc lên,
  thanh chạy); biểu đồ/sơ đồ gốc (tiếng Anh) chỉ đặt kèm làm bằng chứng, có
  `Caption` "… — <nguồn>" ngay dưới.
- Chuyển cảnh: fade 10 frame. Hook đọc nhanh ×1,10.
- Outro chuẩn (`Outro` trong `src/tram/ui.tsx`, tự nối): logo tròn, "Trạm AI",
  tagline, 3 thẻ kênh hiện **đủ URL** (`facebook.com/tram.ai.channel`).

## Ảnh — lồng đủ ảnh phù hợp

- Mỗi cảnh có dữ kiện cụ thể nên có ≥ 1 ảnh khớp đúng nội dung câu đọc; cảnh
  danh sách (gợi ý, lưu ý) có thể chỉ đồ hoạ.
- Thứ tự nguồn: ảnh/biểu đồ trong bài chính chủ → og:image trang sản phẩm của
  hãng → Wikimedia Commons (API `commons.wikimedia.org/w/api.php`, ghi giấy phép)
  → ảnh báo lớn. Không ảnh AI-generated cho tin thời sự.
- Ảnh minh hoạ một **ngành/khái niệm** (ngân hàng, bệnh viện…) KHÔNG được để lộ
  thương hiệu cụ thể (dễ hiểu nhầm hãng đó liên quan) → chọn ảnh chung hoặc crop
  bỏ biển hiệu, logo trên màn hình, watermark, dấu thời gian (PIL `crop`).
- Ảnh giấy phép CC BY / CC BY-SA → truyền `credit="Wikimedia · CC BY-SA"` cho
  `Photo` (nhãn nhỏ góc ảnh) và ghi đủ trong `CREDITS.md`.
- Ảnh đặt ở `remotion/public/videos/<slug>/img/`. Hook: ảnh phủ nửa trên, mask
  mờ dần xuống nền (xem `Hook` của video mẫu).

## Cấu trúc code

```
remotion/
  src/tram/theme.ts        màu, font, enter()/rise() — dùng chung
  src/tram/Chrome.tsx      Background
  src/tram/ui.tsx          Stage, Kicker, H, Hl, count, Photo, Caption, Chip,
                           HBar, Stat, FlowBox, Arrow, Outro
  src/tram/TramShort.tsx   timeline() + defineShort() (TransitionSeries + giọng)
  src/videos/<slug>/       script.json · durations.json · Scenes.tsx · index.tsx
  public/videos/<slug>/    voice/ · img/
  public/logo.png          logo tròn Trạm AI
  scripts/tts.py           sinh giọng + durations.json
  scripts/finalize.py      chuẩn bị outputDir (voice/, clips/ giữ chỗ, script.json)
```

## Bước 1 (style remotion) — làm theo thứ tự

1. **Kịch bản** `remotion/src/videos/<slug>/script.json`:
   `{metadata:{channel:"Trạm AI",title,source,url}, scenes:[{id,voiceText}…]}`.
   8–10 cảnh, cảnh đầu là hook, cảnh cuối **luôn** `{"id":"outro","voiceText":"Theo dõi Trạm AI để cập nhật trí tuệ nhân tạo mỗi ngày."}`.
   `voiceText` viết số ra chữ theo quy tắc TTS của `short.md`. Tổng giọng 75–110s.
2. **Giọng**: `cd remotion && python3 scripts/tts.py <slug>` (kiểm `/health`,
   `minh_quan`, hook ×1,10, loudnorm, ghi `durations.json`). Sửa lời 1 cảnh →
   xoá `public/videos/<slug>/voice/<id>.raw.mp3` rồi chạy lại.
3. **Ảnh**: tải + crop vào `public/videos/<slug>/img/`, xem từng ảnh bằng Read.
4. **Cảnh** `src/videos/<slug>/Scenes.tsx`: mỗi cảnh 1 component dùng khối của
   `ui.tsx`; mốc `enter(frame, fps, giây)` khớp lúc giọng đọc nhắc tới thứ đó.
   Ảnh: `` const IMG = "videos/<slug>/img" `` → `` <Photo src={`${IMG}/x.jpg`} … /> ``.
   Quy tắc: an toàn 84px hai bên; chữ thân ≥ 40px; chủ động `<br />` để không
   rớt 1 từ xuống dòng; không emoji (Chrome headless thiếu font); animation chỉ
   bằng `useCurrentFrame` + `interpolate` (không CSS transition).
5. **Đăng ký**: `src/videos/<slug>/index.tsx` gọi
   `defineShort({id, slug, voiceSec: durations, scenes:[…không gồm outro…]})`,
   thêm `<X />` vào `src/Root.tsx`.
6. **Kiểm**: `npx tsc --noEmit && npx eslint src`; render 10 khung (gần cuối mỗi
   cảnh) `npx remotion render <Id> <dir> --frames=a,b,… --image-format=jpeg`, ghép
   contact sheet, Read để soát tràn chữ / chồng lấn / ảnh sai.
7. **Render**: outputDir `videos/tram-ai/short/<DATE>/<slug>-<timestamp>/`:
   ```bash
   npx remotion render <Id> <outputDir>/video.mp4 --codec=h264 --crf=18
   npx remotion still <Id> <outputDir>/thumbnail.png --frame=150   # hook đã hiện đủ số chính
   python3 scripts/finalize.py <slug> <outputDir>
   ```
   (Không dùng `compose_thumbnail.py`: thumbnail là khung hook.)

   **Máy macOS < 15** (vd máy dựng hiện tại macOS 13): chrome-headless-shell đi kèm
   treo ở "Waiting for root component to load", và ffmpeg/compositor của Remotion
   build cho macOS 15 nên `render` ra mp4 lỗi `EPIPE`. Cách làm:
   - Mọi lệnh `render` / `still` / `compositions` thêm
     `--browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.
   - Video: render chuỗi ảnh `npx remotion render <Id> <seqDir> --sequence --image-format=jpeg --jpeg-quality=92 --muted --concurrency=3 --browser-executable=…`.
     **`--concurrency=3`, không cao hơn**: máy dựng (i5 4 nhân, GPU tích hợp) chạy 6 luồng
     thì Chrome thỉnh thoảng chụp hỏng khung (ô đen, hoặc khung bị lặp thành lưới
     ảnh nhỏ) → video "giật/nháy" 1 frame; 3 luồng sạch và còn nhanh hơn. Không dùng
     `--gl=swangle` (quá chậm → timeout `delayRender`).
   - **Luôn soát khung hỏng trước khi ghép** (lỗi ngẫu nhiên, 3 luồng vẫn có thể dính):
     `python3 .claude/skills/tram-ai-skill/scripts/check_frames.py <seqDir> --fix --comp <Id> --browser-executable="…"`
     (thêm `--entry <bundleDir>` nếu đã `remotion bundle` để render lại nhanh hơn).
     Script tìm khung khác cả khung trước lẫn sau trong khi 2 khung đó giống nhau,
     render lại đúng các khung đó rồi kiểm lại; thoát mã 1 nếu còn sót → báo user.
   - Chạy `finalize.py` trước (để có `startSec`), rồi ghép bằng ffmpeg hệ thống:
     tiếng = `voice/scene-<id>.mp3` mỗi cảnh `adelay` đúng `startSec` → `amix=normalize=0`
     → `atrim` đúng thời lượng; hình `-framerate 30 -i <seqDir>/element-%04d.jpeg`,
     `libx264 -crf 18 -pix_fmt yuv420p`, `aac 192k`, `-movflags +faststart`.
   - Node hệ thống 18 thấp hơn yêu cầu (≥ 20.19) nhưng vẫn chạy được; có sẵn Node 23
     ở `/usr/local/opt/node@23/bin`.
   - `src/videos/` bị gitignore → `src/Root.tsx` chỉ import video có trên máy đang dựng.
8. Viết `research.md`, `CREDITS.md` (mọi ảnh + giấy phép) vào outputDir, rồi làm
   tiếp `short.md` mục **Sau Bước 1** từ bước 2 (bỏ bước 1 `mv` và bước 3
   thumbnail). `COVER_MS = 4000` (hook). `make_youtube_studio.py` chạy bình
   thường nhờ `clips/` giữ chỗ do `finalize.py` tạo.
