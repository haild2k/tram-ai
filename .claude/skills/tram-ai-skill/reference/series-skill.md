# Series "Skill cho AI Agent" — pipeline (style `course` dự phòng, `skill-motion` chính)

Video dài 16:9, mỗi tập giải thích 1 skill. Bảng dưới là pipeline style `course` (Tập 1).
Từ Tập 2 dùng style **`skill-motion`** sinh động hơn: xem [style-skill-motion.md](style-skill-motion.md)
mục 0 (thay bước 1, 3, 5 bằng spec beat + `motion_build.py` + `align_cues.py`; các bước khác giữ nguyên). Đăng/duyệt theo [long.md](long.md) (Bước 11b: DỪNG chờ user duyệt).

## Quy tắc series

- File theo dõi: `videos/tram-ai/series/agent-skills.md` (hàng chờ + bảng "Đã làm").
  Đọc trước khi làm, đăng xong thì thêm 1 dòng.
- Trước khi làm: kiểm tra kênh @tram-ai (yt-dlp `--flat-playlist`) và `Root.tsx`,
  vì video có thể đã dựng ở máy khác.
- Nghiên cứu **ngoài GitHub**: skills.sh (lượt cài, kiểm định bảo mật), linkly.ai/skills
  (hạng Best 100, điểm WIS), blog hãng, bài đánh giá bên thứ ba. Xem cả lịch sử commit
  của SKILL.md (phiên bản thay đổi thế nào).
- Từ Tập 2: **không giải thích lại "skill là gì"**, chỉ nhắc 1 câu "xem Tập 1".
- Tiêu đề: `<tên-skill> skill: <lợi ích>` (KHÔNG mở bằng "Giải thích skill …");
  EN: `<name> skill: <benefit>`.
- Chủ đề toàn cầu → luôn làm bản Anh cho Tram AI Channel.

## Các bước

| # | Việc | Lệnh / file |
|---|---|---|
| 1 | Viết spec song ngữ vi/en (khoảng 27–30 cảnh) | `remotion/src/videos/skill-<tên>/spec.json` (meta.title, slug, img, scenes) |
| 2 | Ảnh minh hoạ (thẻ OG GitHub, ảnh chia sẻ bài viết) | `remotion/public/videos/skill-<tên>/img/` + `CREDITS.md` |
| 3 | Kiểm spec, sinh `script.json` vi và `-en` | `python3 scripts/course_build.py skill-<tên>` |
| 4 | TTS `minh_quan` (hook atempo 1,10) cho cả 2 bản | `python3 scripts/tts.py skill-<tên>` · `python3 scripts/tts.py skill-<tên>-en` |
| 5 | `index.tsx` (`defineCourse` ×2, `thumb`, `next`) + đăng ký vào entry riêng | `remotion/src/series.tsx` |
| 6 | Bundle, soát khung từng cảnh (`remotion still`) | `npx remotion bundle src/series.tsx --out-dir <SP>/bundle` |
| 7 | Render vi + en + 2 thumbnail, finalize | `npx remotion render <bundle> <Id> <O>/video.mp4 --codec=h264 --crf=18` · `scripts/finalize.py skill-<tên> <O>` |
| 8 | Kịch bản đăng, mốc chương, YouTube Studio | `chapters.py --inject youtube.md --inject facebook.md` · `course_build.py --studio <O>` · `make_youtube_studio.py --no-voice` |
| 9 | Bản Anh | viết `youtube_en.md`, `facebook_en.md` → `mux_video_en.py --dir <O> --slug skill-<tên>-en --rendered` → **thêm lại dòng `References:`** vào `youtube_channel_en.md` (script làm rơi) |
| 10 | Dry-run 3 nơi → DỪNG chờ duyệt → đăng | `upload_youtube.py` · `upload_facebook.py` · `upload_youtube.py --channel en` + `youtube_i18n.py --channel en` |
| 11 | Dọn (chạy `--dry-run` trước, script xoá cả video.mp4) + ghi tracker | `cleanup_output.py --dir <O> --dry-run` |

## Ghi chú kỹ thuật

- `src/videos/` bị gitignore và `Root.tsx` import video chỉ có ở máy khác, nên render
  qua entry `src/series.tsx` (thêm composition tập mới vào đó).
- Cụm `at` phải xuất hiện **nguyên văn, đúng hoa thường** trong lời đọc đúng ngôn ngữ;
  lời đọc không chứa chữ số.
- `**in đậm**` không được vắt qua `\n` (sẽ hiện nguyên dấu `**`).
- Không dùng `~` (render như dấu trừ), dùng `≈`. Số trong bảng phải song ngữ (`3.000` / `3,000`).
- Lesson cảnh mở phần: đặt `numLabel` {PHẦN/PART} và `srcLabel` {Nguồn:/Source:}.
- Giọng lỗi một đoạn: xoá `public/videos/<slug>/voice/<id>.raw.mp3` của cảnh đó, chạy
  lại `tts.py` (chỉ sinh cảnh thiếu), bundle + render lại.
