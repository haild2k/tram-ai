# Chế độ LONG · Loại 4 `paper` — giải thích paper trending, 16:9, style remotion

Video dài giải thích **một paper** (thường kèm repo GitHub) cho người không chuyên
nhưng **đủ sâu**: người xem nắm được kiến trúc chung, từng thành phần, thí nghiệm,
kết quả và hạn chế. Video mẫu đã duyệt: `remotion/src/videos/paper-tradingagents/`
(composition `PaperTradingAgents`, ~9:25, 54 cảnh, 13 chương).

Trigger: user đưa link arXiv / Hugging Face Papers / GitHub của một paper, hoặc nói
"giải thích paper", "video paper". Style mặc định **remotion** (template HyperFrames
không hợp với sơ đồ dày chữ). Quy trình đăng, thương hiệu, kịch bản đăng, YouTube
Studio, **DUYỆT trước khi đăng** — như `long.md` / `SKILL.md`.

## 1. Nguồn — đọc gốc, không đọc tóm tắt

```bash
R=<scratchpad>/<slug>; mkdir -p $R/dl
curl -sL -o $R/dl/paper.pdf https://arxiv.org/pdf/<id>
curl -sL -o $R/dl/src.tar.gz https://arxiv.org/e-print/<id>   # LaTeX gốc: chữ sạch + hình gốc
git clone --depth 1 <repo> $R/dl/repo
curl -s https://api.github.com/repos/<owner>/<repo>           # sao, fork, license
curl -sL https://huggingface.co/papers/<id>                     # upvote, ngày đăng
```

- Đọc **toàn bộ** LaTeX (intro, method, experiments, results, chú thích chân trang,
  phụ lục) — số liệu lấy từ bảng `.tex`. Chú thích chân trang hay chứa hạn chế
  tác giả tự thừa nhận → đưa vào chương "Đọc kỹ".
- README + vài file cốt lõi của repo (graph/config) cho chương "Mã nguồn hôm nay";
  ghi rõ chỗ repo hiện tại **khác** paper (mô hình, cấu hình, bản sửa lỗi).
- Đối chiếu chữ ↔ bảng: chỗ nào paper nói khác bảng (vd "không vượt 2%" nhưng bảng
  có 2,11%) → theo bảng, ghi vào `research.md` mục "Ghi chú biên tập".

## 2. Ảnh — gom, lọc trùng, đặt đúng chỗ giải thích

1. Hình paper: `figures/*.pdf` → `pdftoppm -r 200 -png -singlefile`; ảnh png có sẵn
   copy nguyên. Ảnh repo: `assets/**`. Trang 1 PDF (`pdftoppm -f 1 -l 1`) làm thẻ paper.
2. Lọc trùng: `python3 -I .claude/skills/tram-ai-skill/scripts/dedupe_images.py <dir> --out <uniq>`
   (dHash sau khi phủ nền trắng + cắt viền; README hay là PNG nền trong suốt).
   Sau đó **xem contact sheet** và loại thủ công bản cùng nội dung khác bố cục
   (vd hình 4 thẻ xếp ngang ↔ lưới 2×2) — giữ bản hợp khung 16:9 hơn.
3. Chuẩn hoá vào `remotion/public/videos/<slug>/img/`: phủ nền trắng, rộng ≤ 2400px;
   **cắt** các phần của hình lớn để zoom khi nói tới từng phần (vd 4 góc của hình đội
   phân tích, nửa "Decision" của hình trader).
4. Mỗi hình chỉ xuất hiện ở cảnh **đang nói đúng phần đó**; sơ đồ tổng thể dùng
   `Figure` với `hl` (vùng tô sáng, toạ độ % theo ảnh) chạy theo lời đọc.
   Mọi hình gốc có `FigCaption` "… — <tên paper / README repo>".

## 3. Dàn ý chuẩn (8–11 phút, 45–60 cảnh, 10–14 chương)

| Chương | Nội dung | Cảnh |
| --- | --- | --- |
| Mở đầu | hook (câu hỏi lớn + 3 số nổi bật) · lộ trình · thẻ paper (tác giả, nơi, ngày, upvote) | 3 |
| Bài toán | bối cảnh · cách cũ & giới hạn · khoảng trống paper nhắm tới | 3–5 |
| Kiến trúc tổng thể | sơ đồ tổng · dòng chảy (tô sáng từng khối) · các thành phần · cơ chế chung | 3–4 |
| Mỗi thành phần chính (1 chương / thành phần) | vai trò · đầu vào · đầu ra · ví dụ cụ thể trong paper | 2–6 / chương |
| Chi tiết kỹ thuật | giao thức / mô hình nền / chi phí | 2–4 |
| Thí nghiệm | thiết lập · dữ liệu · đối chứng · thước đo (giải thích công thức bằng lời) | 4 |
| Kết quả | biểu đồ tiếng Việt chạy động từ bảng + biểu đồ gốc làm bằng chứng | 3–6 |
| Đọc kỹ trước khi tin | hạn chế tác giả thừa nhận + hạn chế phương pháp (có nguồn) | 2–3 |
| Mã nguồn hôm nay | số liệu repo · kiến trúc code · cách chạy · khác biệt so với paper | 3–6 |
| Tổng kết | 3 ý đáng học · câu hỏi mở · outro | 3 |

Field `"chapter"` trên cảnh đầu mỗi chương (`chapters.py` đọc). Kicker hiển thị số
chương: `<WK n="03">ĐỘI PHÂN TÍCH</WK>`. Thuật ngữ tiếng Anh giữ nguyên + giải
thích 1 vế lần đầu; tên mô hình/hàm trong code để monospace.

## 4. Dựng (thay Bước 1 của style-remotion cho 16:9)

- `script.json` có `metadata.type = "paper"`; `voiceText` theo quy tắc TTS
  (`short.md`); tiếng Việt ~4,2 từ/giây → 2.000–2.500 từ cho 8–10 phút.
- `cd remotion && python3 scripts/tts.py <slug>` (chạy nền, ~5 phút cho 50 cảnh).
- Khối dựng 16:9: `src/tram/wide.tsx` (`WStage`, `WK`, `WH`, `Card`, `Bullet`, `Pill`,
  `Figure` + `hl`, `FigCaption`, `BigStat`, `RightArrow`, `OutroWide`) và
  `src/tram/TramLong.tsx` (`defineLong` → 1920×1080). Mốc animation theo lời đọc:
  hook `useCue(id)` trong `Scenes.tsx` của video mẫu — `on("cụm từ")` bật đúng lúc
  giọng đọc tới cụm từ đó (theo vị trí ký tự × độ dài giọng).
- Cỡ chữ 16:9: tiêu đề 58–74px, thân ≥ 30px, chú thích 22–24px; lề ngang 110px.
- Thumbnail: `Still` 1280×720 riêng (`Thumb.tsx`), không dùng `compose_thumbnail.py`.
- Kiểm: `npx tsc --noEmit && npx eslint src`; `npx remotion bundle --out-dir <b>`
  rồi `npx remotion still <b> <Id> … --frame=<cuối mỗi cảnh>` (xargs -P 4), ghép
  contact sheet 9 khung/tấm, Read soát tràn chữ / chồng nhãn / ảnh sai.
- Render: `npx remotion render <Id> <outputDir>/video.mp4 --codec=h264 --crf=18`
  (outputDir `videos/tram-ai/long/<DATE>/<slug>-<timestamp>/`), rồi
  `python3 scripts/finalize.py <slug> <outputDir> 16:9`, `chapters.py --dir … --inject youtube.md --inject facebook.md`.

## 5. Kịch bản đăng riêng cho loại `paper`

- Slug `paper-<tên-ngắn>`. **Tiêu đề (YouTube, Facebook, dòng đầu TikTok, `metadata.title`)
  = `[Explained] <tên paper NGUYÊN VĂN tiếng Anh>`** — không dịch, không thêm ý,
  vd `[Explained] TradingAgents: Multi-Agents LLM Financial Trading Framework`.
  Thumbnail cũng vậy: nhãn `EXPLAINED` + tên paper nguyên văn (+ arXiv id, số sao repo).
- Mô tả YouTube: 3–4 đoạn (vấn đề → kiến trúc → kết quả có số → repo) + câu
  "nghiên cứu học thuật…" nếu chủ đề nhạy cảm (tài chính, y tế).
- `Nguồn tham khảo: arXiv, GitHub <org>, Hugging Face Papers`.
- Hashtag: `#<tênpaper> #<chủ đề> #giaithichpaper #trituenhantao #tramai`;
  tags thêm `giải thích paper ai, arxiv <id>, <tên paper> là gì`.
- `research.md`: bảng **mọi** số liệu dùng trong video ↔ vị trí trong paper/README;
  mục "Ghi chú biên tập" (mâu thuẫn đã xử lý, ví dụ minh hoạ tự viết, ảnh đã loại trùng).
