# Hình gốc trong paper — giải thích từng khối bằng ảnh, bớt chữ

Áp dụng cho **mọi video** (short, long `tin-ai` / `cong-cu` / `chu-de`, long `paper`)
có nhắc tới **một paper cụ thể** (arXiv, hội nghị, tech report, blog kỹ thuật có hình
— vd Hinton 2015, DistilBERT, DeepSeek-R1, "Attention Is All You Need"). Thắng quy
tắc "chỉ đồ hoạ tự vẽ" ở mọi chỗ khác khi mâu thuẫn.

Lý do (user phản hồi 13/11/2026): video decision model / distillation toàn chữ và sơ
đồ tự vẽ, trong khi các paper được nêu có sẵn hình kiến trúc, biểu đồ kết quả dễ
hiểu hơn nhiều.

## 1. Gom hình cho từng paper được nêu

Khi viết `research.md`, liệt kê mọi paper được nêu trong kịch bản (cột: tên, arXiv
id, cảnh dùng). Với mỗi paper:

```bash
P=<scratchpad>/<slug>/papers/<arxiv-id>; mkdir -p $P/src
curl -sL -o $P/src.tar.gz https://arxiv.org/e-print/<arxiv-id>   # hình gốc sạch nhất
tar -xzf $P/src.tar.gz -C $P/src 2>/dev/null || true
find $P/src -iname '*.pdf' -o -iname '*.png' -o -iname '*.jpg'   # thường ở figures/ hoặc fig/
# hình .pdf → png:  pdftoppm -r 200 -png -singlefile <fig>.pdf <out>
# không có nguồn LaTeX → tải PDF, cắt hình từ trang:
curl -sL -o $P/paper.pdf https://arxiv.org/pdf/<arxiv-id>
pdftoppm -r 200 -png -f <trang> -l <trang> $P/paper.pdf $P/page   # rồi PIL crop đúng khung hình
```

- Paper không ở arXiv (tech report, blog hãng) → lấy hình trong PDF/blog chính chủ.
- Trang 1 PDF (`pdftoppm -f 1 -l 1`) làm **thẻ paper** khi nhắc tới paper lần đầu
  (tên, tác giả, năm) — thay cho thẻ chữ tự vẽ.
- Lọc trùng `dedupe_images.py`, phủ nền trắng, rộng ≤ 2400px, đặt vào
  `remotion/public/videos/<slug>/img/`. Mỗi hình + nguồn (paper, số hình) ghi trong
  `CREDITS.md`; trên hình **không** ghi nguồn.
- Xem từng hình bằng Read trước khi dùng: đúng nội dung câu đọc, đọc được ở 1080p.

## 2. Mỗi khối được giải thích = 1 vùng của hình gốc

Khi lời đọc đi qua từng khối của một phương pháp (kiến trúc, pipeline, các bước
huấn luyện, các thành phần), **không** vẽ lại bằng thẻ chữ. Dùng hình gốc:

- **Sơ đồ tổng thể** → khối `fig` với `steps` (`paperKit.tsx`): mỗi bước là
  `[vùng hl theo % ảnh, "cụm từ trong voiceText"]`, vùng tô sáng chạy đúng lúc giọng
  đọc nhắc tới khối đó. 1 cảnh có thể tô lần lượt 3–5 khối.
- **Khối nhỏ cần nhìn rõ** → cắt (PIL crop) phần đó ra ảnh riêng, cảnh sau zoom vào
  ảnh cắt (vd cảnh 1: toàn bộ pipeline DeepSeek-R1 có tô sáng; cảnh 2: chỉ khung
  "distill" phóng to).
- **Kết quả** → biểu đồ/bảng gốc của paper làm bằng chứng, đặt cạnh 1 số lớn tiếng
  Việt chạy động (`stats` / `BigStat`) cho con số chính. Không chép cả bảng thành chữ.
- **Công thức** → ảnh công thức cắt từ paper (hoặc khối `formula`) + 1 dòng giải
  thích bằng lời; không viết thêm đoạn diễn giải trên hình.
- Hình gốc chiếm **≥ 55% khung hình** (16:9: cao ≥ 560px hoặc rộng ≥ 1000px).
  Hình + số lớn cạnh nhau: `{ t: "row", widths: [1.45, 1], items: [fig, { t: "col", items: [stats, stats] }] }`.
  Hình nền tối (biểu đồ blog) vẫn dùng được; toạ độ `hl` đo trên ảnh đã cắt viền
  (vẽ lưới 10% lên ảnh rồi Read để đọc toạ độ), soát lại bằng still giữa cảnh.
- Video mẫu áp dụng quy tắc này: `remotion/src/videos/ai-distill-model-13-11/`
  (hình 5 paper) và `ai-decision-model-13-11/` (biểu đồ gốc từ blog, không có paper).
- Chỉ tự vẽ sơ đồ khi paper **không** có hình cho ý đó (ví dụ minh hoạ tự nghĩ ra,
  so sánh nhiều paper với nhau) — ghi lý do vào `research.md` mục "Ghi chú biên tập".

## 3. Giới hạn chữ trên hình (mọi cảnh, không riêng cảnh paper)

Lời đọc đã giải thích; chữ trên hình chỉ là điểm tựa cho mắt.

| Thành phần | Giới hạn |
| --- | --- |
| Tiêu đề `WH` / `H` | ≤ 10 từ |
| Chữ thân của cả cảnh (bullet, thẻ, ghi chú — không tính nhãn trong hình gốc và số liệu) | ≤ 25 từ |
| `bullets` | ≤ 3 dòng, mỗi dòng ≤ 8 từ — cụm danh từ, không viết cả câu |
| `cards` / `duo` | mỗi thẻ: tiêu đề ≤ 4 từ + ≤ 1 dòng ≤ 8 từ |
| `note` / `FigCaption` | ≤ 12 từ, tối đa 1 cái mỗi cảnh |
| Cảnh có hình gốc | chỉ tiêu đề + tối đa 1 caption; KHÔNG kèm danh sách bullet bên cạnh |

- Không chép lại câu đọc lên hình. Ý nào chỉ là lời dẫn / giải thích thì để giọng đọc.
- Cứ 3 cảnh liên tiếp phải có ≥ 1 cảnh khối chính là hình (ảnh gốc, biểu đồ, số
  lớn chạy động) — không để 3 cảnh liền chỉ có chữ/thẻ chữ.
- Tự kiểm ở bước contact sheet: cảnh nào nhìn "như slide thuyết trình đầy chữ" →
  cắt chữ hoặc thay bằng hình rồi mới render.
