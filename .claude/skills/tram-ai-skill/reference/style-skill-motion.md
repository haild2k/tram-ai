# Style `skill-motion` — ĐÃ DỰNG (từ Tập 2, 09/11/2026)

Style mới cho series "Skill cho AI Agent", thay cho style `course` (nhiều chữ, mỗi cảnh
15–24 giây đứng yên). Rút ra từ video mẫu `videos/refer/Download.mp4` (9:16, 51 giây,
giải thích Skill · MCP · Subagent). Style `course` giữ làm dự phòng (xem `series-skill.md`).

## 0. Cách dùng (đã dựng)

| Bước | Lệnh / file |
|---|---|
| Kit | `remotion/src/tram/motionKit.tsx` (`defineMotion`, 19 loại vật thể: `window checklist skillcard terminal file flow icon quote versus stat image chat grid pages look button timeline bars cta`) |
| Spec | `remotion/src/videos/skill-<tên>-m/spec.json`: `{meta, slug, img, beats:[{id, chapter?, title:[l1,l2], accent?, v:{kind,…}, caps:[{at?,t}], voice:{vi,en}}]}`. Mẫu: Tập 2 `skill-frontend-design-m` |
| Kiểm + script.json | `python3 scripts/motion_build.py <slug> [--studio <O>]` |
| Giọng | `python3 scripts/tts.py <slug>` · `python3 scripts/tts.py <slug>-en` |
| Mốc từng từ | `python3 scripts/align_cues.py <slug>` (whisper.cpp 1.7.6 CPU + `large-v3-turbo`, ≈5 phút/ngôn ngữ; cache `whisper_tokens.json`, đổi giọng thì thêm `--retranscribe`) |
| index.tsx | `defineMotion({id, spec, lang, durations, cues, next, thumb:{badge,name,line1,icons,foot}})` → đăng ký trong `src/series.tsx` |
| Render | như `course`, `finalize.py <slug> <O> 16:9`; phần còn lại (chương, studio, bản Anh, đăng) y hệt `series-skill.md` |
| Âm thanh | `public/sfx/*.wav` (`scripts/make_sfx.py`), icon `public/icons3d/*.png` (Fluent Emoji 3D, MIT) |

Quy tắc viết beat: 1 beat = 1 ý, lời đọc 12–25 từ (3–7 giây), tiêu đề mỗi dòng ≤ 22 ký tự,
caption ≤ 5 từ, mỗi chương mở bằng beat có `chapter`. Cụm `at` phải có nguyên văn trong lời đọc
(phân biệt hoa thường). Minh hoạ tự dựng (vd ví dụ thông báo lỗi) ghi rõ "minh hoạ".

## 1. Phân tích video mẫu

### Nhịp

| Chỉ số | Video mẫu | Style `course` hiện tại |
|---|---|---|
| Thời lượng 1 màn hình | ≈4 giây (12 màn / 51 giây) | 4–24 giây, phần lớn 14–20 giây |
| Đổi chữ dưới đáy (caption) | 1,5–2,5 giây/lần (≈25 caption) | không có |
| Có chuyển động mới | mỗi ≈0,5 giây | 1 lần mỗi gạch đầu dòng (3–5 lần/cảnh) |
| Chữ trên 1 màn | tiêu đề ≤ 6 từ + caption ≤ 5 từ + 3–4 dòng ngắn trong mock | tiêu đề + 3–4 gạch đầu dòng 8–15 từ |

### Mạch kể (áp dụng được cho mọi skill)

1. **Câu hỏi móc** (0–4,5 giây): "SKILL · MCP · SUBAGENT?" + icon bay vào + caption "RỐI 3 KHÁI NIỆM?".
2. **Nhớ nhanh**: một bảng 3 dòng tóm tắt cả video trước (Skill = cách làm…).
3. **Từng bước "BƯỚC n/3"**, mỗi bước 3 màn:
   - Định nghĩa bằng **ẩn dụ**: "SKILL = QUY TRÌNH CHUẨN", "MCP = CỔNG CẮM".
   - **Demo** trên giao diện giả: thẻ skill có nút "Dùng skill", con trỏ bấm; checklist tick lần lượt.
   - **Chỗ còn thiếu** tạo căng thẳng cho bước sau: "THIẾU KẾT NỐI · Có skill nhưng không có MCP" → "LÚC NÀY CẦN MCP".
4. **Ghép cả ba**: bảng tổng hợp sáng lần lượt từng dòng.
5. **Demo cuối**: cửa sổ chat, người dùng gõ "Làm báo cáo tuần", trạng thái "Đang chạy", 3 việc tick xong.
6. **CTA**: câu hỏi cho bình luận + lưu video + theo dõi.

### Hình

- Nền gần đen, **một quầng sáng ấm** (cam) ở giữa, bụi sao li ti trôi, viền tối (vignette).
- **Bố cục cố định 3 tầng**, căn giữa:
  - trên: pill "BƯỚC 1/3 ●○○" + tiêu đề 2 dòng VIẾT HOA rất đậm (một dòng trắng, một dòng màu nhấn);
  - giữa: **đúng một vật thể** minh hoạ;
  - dưới: caption pill viền phát sáng, viết hoa, đổi theo lời đọc.
- Vật thể minh hoạ là **giao diện giả** chứ không phải chữ:
  - cửa sổ có 3 chấm màu (bảng, checklist);
  - thẻ skill có nút và con trỏ chuột;
  - hàng ô icon nối mũi tên (AI → MCP → Hệ thống);
  - một icon lớn bị gạch chéo;
  - cửa sổ chat có bong bóng gõ chữ;
  - pill sóng âm kèm câu trích dẫn đang gõ.
- Icon kiểu 3D/emoji (mảnh ghép, phích cắm, não, robot, tài liệu).
- Một họ font sans hình học, rất đậm cho tiêu đề và caption.

### Chuyển động

- Đổi màn: tiêu đề cũ **mờ nhoè + mờ dần**, tiêu đề mới hiện từ nhoè sang nét (blur 12px → 0).
- Phần tử vào lần lượt (stagger 0,15–0,3 giây), bật nảy nhẹ (spring).
- Hành động có nghĩa:
  - checkbox tick đúng lúc lời đọc nhắc;
  - con trỏ di chuyển rồi bấm nút (nút lún xuống, phát sáng);
  - chữ gõ từng ký tự;
  - spinner quay khi "đang chạy";
  - gạch chéo vẽ dần;
  - mũi tên nối tới ô kế tiếp.
- Ô đang được nói tới thì sáng viền, các ô khác mờ đi.

## 2. Thiết kế `skill-motion` cho Trạm AI (16:9, video dài)

### Nguyên tắc

1. **1 màn = 1 ý = 3–6 giây.** Video 7 phút có khoảng 80–110 màn (beat), gom thành chương như cũ.
2. **Mỗi màn có 1 vật thể minh hoạ**, ưu tiên mô phỏng thao tác thật của skill (lệnh terminal, SKILL.md, agent chạy) thay vì gạch đầu dòng.
3. **Caption pill** dưới đáy: 2–5 từ, đổi theo từng cụm lời đọc. Đây là "phụ đề từ khoá", không chép nguyên câu.
4. **Mỗi chương** theo mạch: ẩn dụ → demo → chỗ thiếu / bẫy → sang chương sau.
5. Mở đầu bằng câu hỏi + "nhớ nhanh" (tóm tắt cả video trong 1 bảng). Kết bằng demo tổng và câu hỏi cho bình luận.

### Bảng màu

Giữ nhận diện Trạm AI nhưng làm ấm và tối hơn:
- nền `#07091a`;
- quầng sáng vàng cam `#f2b254` → `#ff7a2f`;
- màu phụ xanh `#6f8cff`;
- màu thành công `#3ddc97`;
- màu cảnh báo `#ff5a5a`.

Có thể đổi sang bảng cam như video mẫu nếu user muốn.

### Bố cục 16:9 (1920×1080)

```
┌──────────────────────────────────────────────┐
│            [ PHẦN 2/8 ●●○○○○○○ ]             │  pill tiến độ
│            MCP =                             │  tiêu đề 2 dòng, 84–96px
│            CỔNG CẮM                          │  (dòng nhấn màu vàng cam)
│                                              │
│      ┌──────── vật thể minh hoạ ────────┐    │  rộng tối đa 1100px
│      │  cửa sổ / flow / terminal / chat │    │
│      └──────────────────────────────────┘    │
│                                              │
│          ( KẾT NỐI THẲNG VÀO HỆ THỐNG )      │  caption pill, 40px
└──────────────────────────────────────────────┘
```

Màn có vật thể rộng (so sánh 2 cột, terminal dài) thì đặt tiêu đề sang trái, vật thể sang phải.

### Thư viện vật thể (scene "visual" kind)

| kind | Dùng cho | Chuyển động |
|---|---|---|
| `window` | bảng / danh sách trong cửa sổ 3 chấm | dòng sáng lần lượt theo cue |
| `checklist` | các bước của quy trình | tick từng ô theo cue |
| `skillcard` | thẻ skill (icon, tên, quy trình, nút) | con trỏ bay tới, bấm nút |
| `terminal` | lệnh cài, lệnh của skill | gõ lệnh, in output từng dòng |
| `file` | trích SKILL.md / frontmatter | cuộn, tô sáng dòng đang nói |
| `flow` | ô icon nối mũi tên | ô và mũi tên hiện lần lượt |
| `icon` | 1 icon lớn, có thể gạch chéo / tick | vẽ gạch chéo, nảy |
| `chat` | agent làm việc: user gõ, trạng thái, việc xong | gõ chữ, spinner, tick |
| `versus` | 2 thẻ trái/phải ✗ / ✓ | thẻ trượt vào, dấu đóng dấu |
| `stat` | 1 con số lớn | số chạy từ 0 |
| `quote` | pill sóng âm + câu trích | sóng âm chạy, chữ gõ |
| `image` | ảnh thật (OG, ảnh chụp trang) trong khung | zoom chậm + tô sáng vùng |

### Spec (dự kiến)

Mỗi chương có nhiều beat. Mỗi beat có lời đọc riêng, nên TTS và độ dài tính theo beat:

```json
{"id": "mcp_def", "chapter": {"vi": "MCP", "en": "MCP"}, "step": "2/3",
 "title": {"vi": ["MCP =", "CỔNG CẮM"], "en": ["MCP =", "A PLUG"]},
 "visual": {"kind": "flow", "items": [{"icon": "robot", "label": "AI"}, {"icon": "plug", "label": "MCP"}, {"icon": "server", "label": {"vi": "Hệ thống", "en": "System"}}]},
 "captions": [{"at": {"vi": "kết nối thẳng", "en": "plugs straight"}, "t": {"vi": "KẾT NỐI THẲNG VÀO HỆ THỐNG", "en": "PLUGS STRAIGHT INTO SYSTEMS"}}],
 "voice": {"vi": "...", "en": "..."}}
```

Cue lấy theo **mốc từng từ** của giọng đọc (whisper), không ước lượng theo vị trí ký tự
như style `course`. Màn đổi nhanh nên lệch 0,5 giây là thấy ngay.

### Âm thanh

- Hiệu ứng nhỏ:
  - whoosh khi đổi màn;
  - pop khi phần tử hiện;
  - click khi con trỏ bấm;
  - tick khi checkbox;
  - tiếng gõ phím khi terminal hoặc chat gõ.
- Nhạc nền nhẹ dưới giọng, khoảng −24 dB, tự hạ khi có giọng.

## 3. Đã cài (09/11/2026)

| Thứ | Để làm gì | Cài |
|---|---|---|
| `@remotion/install-whisper-cpp@4.0.539` + `@remotion/captions@4.0.539` | mốc thời gian từng từ của giọng TTS (cue và caption khớp lời) | `npm i` trong `remotion/` (tải whisper.cpp + model, ≈1,5 GB) |
| `@remotion/noise@4.0.539` | bụi sao trôi, quầng sáng "thở" | `npm i` |
| `@remotion/motion-blur@4.0.539` (tuỳ chọn) | nhoè chuyển động khi vật thể bay vào | `npm i` |
| `lucide-react` | icon giao diện (chuột, tick, file, terminal…) | `npm i` |
| Bộ icon 3D Microsoft Fluent Emoji (MIT) | icon kiểu 3D như mẫu (mảnh ghép, phích cắm, não, robot) | tải PNG cần dùng vào `public/icons/`, không cần cài |
| Skill `remotion-best-practices` (remotion-dev) | quy tắc chuẩn của Remotion cho animation, caption, audio | `npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices` |
| Hiệu ứng âm thanh + nhạc nền | xem mục Âm thanh | user cung cấp, hoặc tự tổng hợp SFX bằng numpy (không vướng bản quyền) |
