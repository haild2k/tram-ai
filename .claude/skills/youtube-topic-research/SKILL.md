---
name: youtube-topic-research
description: Nghiên cứu và XẾP HẠNG chủ đề video đáng làm nhất cho kênh TRẠM AI (tin AI, giải thích công nghệ, so sánh công cụ, giải thích paper). Skill gom dữ liệu từ kênh Trạm AI, đối thủ Việt, kênh AI tiếng Anh để Việt hoá, tìm kiếm YouTube, các trang tin AI (VnExpress, VietNamNet, OpenAI News, Báo Mới, CafeF) và lọc tin AI mới trong mục "Công nghệ" của các báo lớn (Tuổi Trẻ, VnExpress, Thanh Niên, Dân trí, ZNews, Genk) cho chủ đề short và tín hiệu web (arXiv/Hugging Face, Reddit) rồi chấm điểm 0–100 kèm bằng chứng số liệu, gán định dạng SHORT / LONG cho từng chủ đề. Trigger khi user muốn "tìm chủ đề Trạm AI", "lọc tin AI trên báo", "tin AI mới hôm nay", "báo hôm nay có tin AI gì", "research chủ đề", "chủ đề AI nào đang hot", "tuần này nên làm video gì", "nên làm video gì tiếp", "phân tích đối thủ kênh AI", "lên danh sách chủ đề tháng này". Output gồm research/{ngày}/tram-ai/report.md (top chủ đề + bằng chứng + góc làm) và ranked.json; cuối cùng hiện SELECT BOX cho user chọn chủ đề rồi chuyển sang tram-ai-skill để làm video và đăng.
model: claude-sonnet-5-5
---

# youtube-topic-research

Skill trả lời câu hỏi **"video tiếp theo của Trạm AI nên làm gì?"** bằng số liệu, không bằng cảm tính.
Mỗi chủ đề đề xuất phải có bằng chứng: video cùng chủ đề đã đạt bao nhiêu view, ở đâu, kênh Việt
đã làm chưa, và vì sao làm lúc này.

Skill tự nó không dựng hay đăng video. Sau khi user chọn chủ đề ở select box (Bước 7), skill gọi
`tram-ai-skill` để dựng và đăng.

## Công cụ

Script: `.claude/skills/youtube-topic-research/scripts/yt_research.py`. Script dùng yt-dlp, không cần
API key. **Luôn chạy bằng venv của skill**, và khai báo hàm `yt` ở đầu mỗi lệnh Bash vì shell không giữ
hàm giữa các lần gọi. Dùng hàm chứ không dùng biến `PY="…"`, vì zsh không tách từ trong `$PY`:

```bash
SK=.claude/skills/youtube-topic-research
[ -x $SK/.venv/bin/python ] || $SK/setup.sh      # lần đầu, hoặc chạy lại khi yt-dlp lỗi để nâng cấp
yt() { $SK/.venv/bin/python $SK/scripts/yt_research.py "$@"; }
```

| Lệnh | Việc làm |
|---|---|
| `yt channel <url\|@handle>... --limit 60 --out f.json` | Lấy video gần nhất của kênh. Tính view, median, hệ số outlier `x` (số lần so với median), median video ≥20 phút và <20 phút. URL kết thúc bằng `/shorts` thì quét tab Shorts |
| `yt search "<q>"... --limit 40 --out f.json` | Tìm kiếm rồi gom theo kênh để **phát hiện kênh mới** |
| `yt demand "<q>"... --out f.json` | Đo nhu cầu: top video khớp từ khoá (đã lọc độ liên quan) |
| `yt score --candidates c.json --out ranked.json` | Đo nhu cầu EN và VI cho từng ứng viên rồi chấm điểm |
| `yt detail <video_url>... --out f.json` | Lấy ngày đăng, like, comment, **view/ngày** để đo độ "nóng" |
| `yt saturation --ranked ranked.json --top 10 --days 30` | Tìm lại top N theo ngày đăng, đếm kênh Việt đã làm gần đây, trừ điểm thành `final_score` |

Script thứ hai `scripts/news_scan.py` lọc tin AI trong mục **Công nghệ** của các báo lớn. Script chỉ dùng
thư viện chuẩn, chạy bằng `python3` hệ thống, không cần venv:

```bash
python3 $SK/scripts/news_scan.py --days 3 --out research/<ngày>/tram-ai/raw/news_scan.json
```

| Tuỳ chọn | Việc làm |
|---|---|
| `--days N` | Chỉ giữ bài trong N ngày gần nhất (mặc định 3) |
| `--sites tuoitre vnexpress` | Chỉ quét báo có tên/RSS chứa chuỗi này |
| `--cluster 0.3` | Ngưỡng gộp tin trùng giữa các báo (Jaccard tiêu đề). Tăng nếu gộp nhầm, giảm nếu sót |

Script đọc RSS của từng mục, giữ bài có từ khoá AI ở tiêu đề hoặc mô tả, gộp bài cùng sự kiện ở nhiều báo
thành **cụm** (`n_sites` = số báo đã đăng), đánh dấu `maybe_noise` cho bài có vẻ chỉ nhắc AI cho có. Kết quả
ghi ra `news_scan.json` và `news_scan.md` cùng chỗ, stdout in bản tóm tắt: trạng thái từng nguồn và danh
sách cụm, nhiều báo xếp trước.

Danh sách kênh nằm ở `.claude/skills/youtube-topic-research/watchlist.json`, ngách `tram-ai`.
Mỗi kênh có `role`: `home` là Trạm AI, `vn` là đối thủ Việt, `source` là kênh tiếng Anh để Việt hoá.
Trang tin dùng để tìm chủ đề short nằm ở `news_sources` cùng ngách. Thêm trang mới vào đó, không sửa quy trình.
Mục Công nghệ của các báo lớn nằm ở `tech_sections` (mỗi mục có `name`, `url`, `rss`). Muốn thêm báo thì
thêm 1 dòng có link RSS, kiểm tra bằng `news_scan.py --sites <tên>`.

## Input

- **Phạm vi**: mặc định tất cả định dạng. User có thể giới hạn, ví dụ "chỉ short", "chủ đề paper",
  "so sánh công cụ".
- **Số chủ đề cần ra**: mặc định top 10.
- **Có soi sâu không**: `anthropic-skills:deep-research` chạy nhiều subagent, tốn nhiều lượt dùng.
  **Mặc định KHÔNG dùng.** Chỉ dùng khi user đồng ý rõ ràng.
- **Model**: skill chạy bằng Sonnet 5.5 (`model: claude-sonnet-5-5` ở frontmatter) để tiết kiệm token.
  Nếu cần gọi subagent (Agent tool), luôn truyền `model: "sonnet"`, không dùng Opus.

- **Chế độ tin nhanh**: khi user chỉ muốn "lọc tin AI trên báo", "hôm nay có tin AI gì", tức là muốn tìm
  chủ đề **short** để làm ngay. Chỉ chạy Bước 0 → Bước 3a → Bước 4 (8–16 ứng viên `short`) → Bước 5
  (`score`) → Bước 5b với `--days 14 --top` bằng số ứng viên → Bước 7. Bỏ qua Bước 1, 2, 3b và `report.md`
  đầy đủ, chỉ ghi `report.md` ngắn (bảng ứng viên + điểm + nguồn báo).

User đã nói đủ thì làm luôn, không hỏi lại.

## Định dạng video của Trạm AI

Mỗi ứng viên phải gán đúng một `format`, vì định dạng quyết định cách chấm điểm và skill làm tiếp:

| `format` | Là gì | Ghi chú khi chọn |
|---|---|---|
| `short` | 9:16, 90–120 giây, 1 tin / 1 chủ đề | Tin vừa ra. Đăng trong 1–3 ngày thì mới có giá trị |
| `long-1` | Tổng hợp tin AI trong N ngày | Gom 3–6 tin cùng tuần |
| `long-2` | So sánh công cụ AI | Cần số liệu, giá, benchmark có nguồn |
| `long-3` | Chủ đề AI tự chọn, gồm series "Tất cả … trong N phút" | Nội dung bền, không phụ thuộc ngày đăng |
| `long-paper` | Giải thích 1 paper, tiêu đề Việt `[Giải thích] <tên paper>` · Anh `[Explained] <tên paper>` | Có link arXiv / Hugging Face / GitHub |

## Thư mục output

`research/<YYYY-MM-DD>/tram-ai/` (đã gitignore):
```
raw/channels.json   raw/search.json   raw/news_scan.json   raw/news_scan.md   raw/news.md
raw/web.md          raw/detail.json
candidates.json     ranked.json       report.md            selected.json
```
Mọi dữ liệu thu được phải **lưu ra file ngay**, không giữ dữ liệu lớn trong hội thoại.

## Quy trình

### Bước 0: Chủ đề đã làm

Liệt kê video đã sản xuất để loại trùng, kể cả video chưa đăng:

```bash
ls videos/tram-ai/short/*/ videos/tram-ai/long/*/
```

### Bước 1: Quét kênh (nguồn A)

```bash
yt channel <mọi url trong watchlist> --limit 60 --out research/.../raw/channels.json
```

Sau khi quét, kiểm tra tên kênh trong output có đúng kênh định lấy không. Handle `@xxx` có thể trỏ
nhầm kênh. Nếu sai, tìm URL `channel/UC…` qua lệnh `search` rồi sửa `watchlist.json`.

Từ `channels.json`, Claude tự phân tích các điểm sau:
1. **Kênh home**: Trạm AI còn mới, chỉ vài video và view rất thấp, nên median của kênh **chưa có ý nghĩa
   thống kê**. Chưa rút công thức từ số của kênh này. Lấy công thức tiêu đề từ đối thủ `vn` trước. Khi
   home có từ 30 video mỗi loại trở lên thì mới chia công thức theo số của chính kênh.
2. **Danh sách đã làm**: tiêu đề của home cộng với Bước 0, và tiêu đề của đối thủ vn. Dùng để **loại trùng**
   ở Bước 4.
3. **Công thức của đối thủ vn**: chia tiêu đề thành nhóm, tính median từng nhóm. Ví dụ "Tất cả … trong
   N phút", "Hướng dẫn … từ A đến Z", "Điểm tin tuần". Ghi thêm độ dài nào thắng (`median_ge20m` /
   `median_lt20m`).
4. **Outlier của kênh source** (x ≥ 3): đề tài đã được chứng minh. Kênh Việt **chưa** làm đề tài nào thì
   đề tài đó là ứng viên mạnh nhất.
5. **Tuổi của outlier**: dữ liệu kênh không có ngày đăng, chỉ có `rank_recent` (0 là mới nhất). Tin AI
   nguội rất nhanh, nên với outlier dạng tin tức chỉ xét video có `rank_recent` nhỏ, rồi dùng `detail`
   lấy ngày đăng thật trước khi dùng làm bằng chứng. Tin quá 14 ngày chỉ còn dùng cho `long-3` nếu
   đề tài có giá trị lâu dài.

### Bước 2: Phát hiện kênh mới (nguồn B)

Chạy `search` với `seed_queries_en` + `seed_queries_vi`, cộng thêm 3–5 truy vấn Claude tự nghĩ từ outlier
ở Bước 1. Kênh xuất hiện nhiều lần và đúng mảng AI thì quét thêm bằng `channel`, rồi **thêm vào
`watchlist.json`** để lần sau dùng luôn. Bỏ qua kênh báo đài tổng hợp (VTV24, VTC News…) vì chúng không
phải đối thủ cùng định dạng.

### Bước 3a: Trang tin AI cho short (nguồn C)

Bắt buộc khi phạm vi có `short`. Làm 2 việc:

**1. Lọc mục Công nghệ của các báo lớn** (nhanh, làm trước):

```bash
python3 $SK/scripts/news_scan.py --days 3 --out research/<ngày>/tram-ai/raw/news_scan.json
```

Đọc stdout, nguồn nào báo `LỖI` hoặc `RSS không có bài mới` thì mở `url` của mục đó bằng WebFetch để thay.
Sau đó đọc `news_scan.md` và tự lọc lại: bỏ cụm `maybe_noise`, bài review sản phẩm chỉ có "chip AI", bài PR
doanh nghiệp, hội thảo, trao giải. Cụm từ 2 báo trở lên là tín hiệu mạnh. Với cụm còn lại, mở bài gốc khi cần
thêm chi tiết.

**2. Đọc các trang tin AI chuyên mục.** Đọc **mọi** trang trong `news_sources` của `watchlist.json` bằng WebFetch.
Trang có `fetch_url` thì đọc địa chỉ đó bằng `curl`. Trang nào lỗi thì ghi rõ vào `raw/news.md` rồi đọc tiếp
trang khác, không bỏ qua trong im lặng.

Với mỗi trang, và các cụm còn giữ ở việc 1, lấy các bài trong **3 ngày gần nhất** và ghi vào `raw/news.md`: tiêu đề, link, ngày đăng,
nguồn, tóm tắt 1 câu. Cần chú ý:
- Bài chưa rõ ngày đăng thì mở bài để lấy ngày. Không suy ngày từ thứ tự trên trang.
- Bỏ bài chỉ nhắc đến AI, ví dụ tin chứng khoán, phát biểu của doanh nhân, quảng cáo sản phẩm hoặc bài PR.
- Tin xuất hiện ở từ 2 trang trở lên là tín hiệu mạnh: gộp lại, ghi số trang đã đăng vào `why_now`.
- Báo Việt thường dịch lại tin nước ngoài. Trước khi đưa vào ứng viên, tìm **nguồn gốc** (blog hãng, paper,
  báo cáo) và ghi vào `source`. Chỉ có một báo đưa, không tìm được nguồn gốc thì ghi "chưa xác nhận" và cho
  `feasibility` tối đa 2.
- Tin Việt Nam hoặc tin có góc Việt Nam rõ thì ưu tiên, vì kênh source tiếng Anh không làm được và `angle` cao.

Không làm short từ tin quá 3 ngày, trừ khi tin vẫn đang có diễn biến mới.

### Bước 3b: Tín hiệu web khác (nguồn D)

Dùng WebSearch, ghi tóm tắt kèm link vào `raw/web.md`:
- **Tin AI trong 7–14 ngày** cho `long-1`: mô hình và sản phẩm mới, giá API, công ty, chính sách. Nên đọc trực
  tiếp blog của hãng (OpenAI, Anthropic, Google, Meta, DeepSeek…). Tin đồn hoặc rò rỉ phải ghi "chưa xác nhận".
- **Paper đang được chú ý**: Hugging Face Daily Papers, arXiv, GitHub trending. Đây là nguồn cho
  `long-paper`.
- **Câu hỏi người ta thật sự hỏi**: r/LocalLLaMA, r/ChatGPT, r/ClaudeAI, r/MachineLearning, Hacker News.
  Câu hỏi có nhiều upvote là ứng viên tốt.
- **Sự kiện sắp tới**: hội nghị (NeurIPS, Google I/O, OpenAI DevDay…), ngày ra mắt đã công bố.

Skill bổ trợ khi đã chốt chủ đề: `anthropic-skills:deep-research` để soi kỹ 1–3 chủ đề top cuối, chỉ
dùng khi user đồng ý.

### Bước 4: Lập danh sách ứng viên (20–40 chủ đề)

Ứng viên đến từ 5 nguồn:
1. **Việt hoá** outlier của kênh source mà kênh Việt chưa làm.
2. **Mở rộng series** theo công thức đang thắng, ví dụ đã có "Tất cả các loại Attention" và "Toàn bộ hàm
   kích hoạt" thì làm tiếp "Tất cả các loại Embedding", "Tất cả các hàm loss".
3. **Góc Việt Nam** cho một đề tài quốc tế: giá tính theo tiền Việt, mô hình xử lý tiếng Việt ra sao,
   người Việt dùng công cụ này được không, quy định tại Việt Nam.
4. **Móc tin mới** từ Bước 3a (ứng viên `short`) và Bước 3b (`long-1`).
5. **Paper** có kết quả đáng chú ý từ Bước 3b.

Ứng viên `short` dạng tin tức phải đến từ `raw/news.md` hoặc có bài báo trong đó xác nhận.

**Loại** chủ đề đã có trong "danh sách đã làm". Chủ đề quá giống nhau thì gộp. Mọi tiêu đề và hook phải
theo định vị của Trạm AI trong `tram-ai-skill`: khách quan, không thổi phồng, không giật tít sai.

Ghi vào `candidates.json`:
```json
[{"topic": "Tất Cả Các Loại Embedding Trong AI Trong 12 Phút",
  "format": "long-3",
  "en_query": "embeddings explained",
  "vi_query": "embedding là gì",
  "vi_alt": ["giải thích embedding", "vector embedding", "embedding trong ai"],
  "fit": 5, "angle": 3, "feasibility": 5, "freshness": 3, "global": true,
  "source": "series Tất cả … (Việt Nguyễn AI) + IBM Technology",
  "why_now": "", "hook": "Mọi mô hình AI đều biến chữ thành số trước khi hiểu được chúng..."}]
```
`global` (true/false) chỉ đánh dấu chủ đề có hợp để làm thêm bản tiếng Anh cho kênh Tram AI Channel hay
không: `true` khi khán giả quốc tế cũng quan tâm (hãng/model quốc tế, khái niệm AI chung, công cụ dùng toàn
cầu), `false` khi chủ đề riêng cho người Việt (doanh nghiệp, luật, sự kiện, dịch vụ chỉ ở Việt Nam). Tiêu chí
chi tiết ở `tram-ai-skill` mục **Bản video tiếng Anh**. Cờ này **không tính vào điểm** và không đổi cách tìm/
xếp hạng: việc tìm chủ đề vẫn ưu tiên khán giả Việt, không tìm riêng cho kênh tiếng Anh.

Viết `en_query` / `vi_query` như cách người xem gõ tìm kiếm. Viết ngắn gọn, đúng ý chính, không nhồi chữ.
**`vi_query` phải có dấu tiếng Việt**, vì script chỉ tính video có tiêu đề tiếng Việt khi đo kênh Việt.
Với tên riêng tiếng Anh, thêm từ Việt như "là gì", "hướng dẫn", "so sánh".

Claude chấm 4 điểm định tính theo thang 1–5:
| Điểm | 5 | 3 | 1 |
|---|---|---|---|
| `fit`: hợp Trạm AI | đúng định vị và công thức đang thắng của đối thủ | đúng mảng AI nhưng công thức trung bình | lệch mảng (hướng dẫn kiếm tiền, nội dung bán khoá học) |
| `angle`: góc Việt / độc đáo | có góc Việt Nam rõ hoặc số liệu mà bản EN không có | dịch lại nhưng có ví dụ gần gũi | chỉ dịch lại |
| `feasibility`: dễ làm | nguồn chính thức đủ, dễ minh hoạ bằng biểu đồ và số liệu | phải gom nhiều nguồn | thiếu nguồn xác nhận, chủ yếu tin đồn |
| `freshness`: độ mới | tin trong 3 ngày, hoặc có lý do rõ để làm tuần này | trong 2 tuần, hoặc nội dung bền (`long-3`, `long-paper`) | tin cũ đã nguội |

### Bước 5: Chấm điểm và kiểm chứng

```bash
yt score --candidates research/.../candidates.json --out research/.../ranked.json
```

Script tính 2 điểm tự động trên thang 0–5:
- `demand`: video EN liên quan nhiều view nhất. 100K view được 0 điểm, khoảng 20M được 5 điểm (thang log).
- `gap`: video tiếng Việt liên quan nhiều view nhất. Kênh Việt càng yếu ở chủ đề này điểm càng cao: VN ≤10K
  được 5 điểm, ≥1M được 0 điểm.

Tổng điểm = 20 × (0.25·demand + 0.20·gap + 0.20·fit + 0.10·angle + 0.10·feasibility + 0.15·freshness).
Điểm cuối cùng để xếp hạng là `final_score` = tổng điểm − phạt bão hoà (Bước 5b).

**Bắt buộc kiểm chứng `evidence`** trong `ranked.json` trước khi tin điểm số:
- Video trong `en_top` / `vi_top` có thật sự **cùng chủ đề** không? Khớp nhầm thì sửa query rồi chạy lại.
  Tên AI dễ khớp nhầm, ví dụ "Claude" (AI) với người tên Claude, "Gemini" với cung hoàng đạo, "Transformer"
  với phim.
- Tin vừa ra chưa kịp có video nhiều view nên `demand` thấp giả. Với `short`, đối chiếu thêm `views_per_day`
  của video EN mới nhất bằng `detail`, rồi ghi nhận định vào báo cáo.
- `long-paper` có `demand` thấp là bình thường. So sánh các paper với nhau, không so với tin tức.
- `vi_max` cao nhưng là video cũ của kênh lớn? Chủ đề vẫn làm được nếu có góc mới. Ghi chú lại.

### Bước 5b: Kiểm tra bão hoà gần đây (BẮT BUỘC trước khi báo cáo)

Tin AI được nhiều kênh làm lại chỉ sau vài ngày, nên phải tìm lại **theo ngày đăng** cho các chủ đề đứng đầu:

```bash
yt saturation --ranked research/.../ranked.json --top 10 --days 30
```

- Lệnh tìm lại mọi cách gõ `vi_query` + `vi_alt` và `en_query`, sắp xếp theo ngày đăng mới nhất. Sau đó
  lấy ngày đăng thật của các video khớp chủ đề và đếm những video đăng trong `--days` ngày. Video của Trạm
  AI không bị tính.
- Dùng `--days 14` khi xét riêng `short`, `--days 90` khi xét riêng `long-3` và `long-paper`.
- Mức trừ điểm:
  - Mỗi **kênh Việt** đã làm chủ đề này gần đây: −6 điểm, tối đa −24. Chỉ tính video từ 500 view trở lên
    (`--min-views`) hoặc đăng trong 3 ngày, vì mảng AI có rất nhiều kênh tí hon không phải cạnh tranh thật.
  - Có bản Việt gần đây đạt từ 20K view trở lên: trừ thêm −12.
- Kết quả là `final_score`, kèm nhãn `còn trống` / `đã có người làm` / `bão hoà`. **Chủ đề `bão hoà`
  không đưa vào top**, chỉ ghi vào danh sách "đừng làm" kèm tên các kênh đã làm.
- Kiểm tra top 10 (không chỉ top 5) để sau khi loại chủ đề bão hoà vẫn còn đủ chủ đề. Nếu top 10 vẫn
  thiếu, chạy `--top` lớn hơn. Lệnh chạy khoảng 30–60 giây cho mỗi chủ đề, nên với nhiều chủ đề hãy cho
  chạy nền.
- **Mỗi chủ đề phải có từ 3 cách gõ `vi_alt` trở lên.** Bộ lọc khớp chặt, nên nếu chỉ có một cách gõ thì
  sẽ sót video đối thủ. Ví dụ "so sánh ChatGPT và Claude" sẽ bỏ sót "ChatGPT hay Claude".
- Đọc lại danh sách `vi_recent` để loại video khớp nhầm, ví dụ khoá học quảng cáo, short không cùng góc.
  Sau đó tự điều chỉnh nhận định.

Đo độ "nóng" bằng `detail` cho 5–10 outlier gần đây nhất của các kênh (lấy URL từ `channels.json`).
`views_per_day` cao nghĩa là chủ đề đang lên. Chủ đề cùng họ với video đang nóng được cộng điểm ở phần
nhận xét, không sửa công thức.

### Bước 6: Báo cáo

Viết `report.md` gồm các phần:
1. **Tóm tắt 3–5 phát hiện chính.** Phát hiện nào cũng phải có số, ví dụ "công thức 'Tất cả … trong N phút'
   có median 54K, gấp 14 lần median kênh".
2. **Bảng top N** gồm điểm, định dạng, chủ đề, bằng chứng EN (view + kênh + link), tình trạng VN, lý do
   làm lúc này và cột **Bản EN** (✓ toàn cầu / — riêng VN, theo cờ `global`).
3. **Chi tiết từng chủ đề top**:
   - 2 phương án tiêu đề theo công thức đang thắng, đúng giới hạn ký tự của `tram-ai-skill`.
   - Câu mở đầu (hook) và cú lật.
   - Nguồn chính cần dùng, ưu tiên nguồn gốc của hãng hoặc paper.
   - Gợi ý thumbnail.
4. **Danh sách "đừng làm"**: chủ đề nhu cầu thấp, đã bão hoà ở VN, hoặc thuộc công thức đang thua.
5. **Kênh mới phát hiện** đã thêm vào watchlist.

Trong chat, trình bày top 5 ngắn gọn kèm số liệu, rồi sang Bước 7.

### Bước 7: Select box chọn chủ đề → làm video → đăng

Sau khi có kết quả, **luôn** cho user chọn bằng tool `AskUserQuestion` (select box), không hỏi bằng chữ.
Tool này nằm ở danh sách tool trì hoãn thì nạp trước bằng `ToolSearch` (`select:AskUserQuestion`).

Cách dựng câu hỏi (tool giới hạn 2–4 lựa chọn mỗi câu, tối đa 4 câu mỗi lần gọi; ô "Other" có sẵn để user
gõ chủ đề khác):
- Lấy các chủ đề có `final_score` cao nhất, **bỏ chủ đề `bão hoà`**. Chia thành nhóm 4: câu 1 là 4 chủ đề
  `short` tốt nhất, câu 2 là 4 chủ đề `short` kế tiếp hoặc 4 chủ đề `long-*` tốt nhất. Nhóm nào không đủ 2
  chủ đề thì gộp vào nhóm khác hoặc bỏ. Tối đa 4 câu (16 chủ đề).
- `multiSelect: true` để user chọn nhiều chủ đề một lần.
- `header` ngắn ≤12 ký tự, ví dụ `Short 1–4`, `Short 5–8`, `Video dài`.
- `label` của mỗi lựa chọn: tiêu đề video đề xuất rút gọn (1–5 từ là lý tưởng, tối đa khoảng 8 từ). Ghi
  `(Đề xuất)` sau chủ đề #1.
- `description`: `final_score` · `format` · số báo đã đăng / bằng chứng EN · tình trạng VN · ngày tin.
  Ví dụ: `82đ · short · 3 báo (Tuổi Trẻ, VnExpress, Dân trí) · VN còn trống · tin 07/11`.
- Thêm 1 câu cuối (`header`: `Làm tiếp`, single select) nếu cần hỏi cách làm: `Làm video và đăng ngay`
  (mặc định), `Chỉ dựng, chưa đăng`, `Soi sâu bằng deep-research trước`.

Sau khi user chọn:
1. Ghi lựa chọn vào `research/<ngày>/tram-ai/selected.json` (topic, format, hook, source, link bài báo, global).
2. Với **từng** chủ đề đã chọn, gọi skill `tram-ai-skill` qua tool `Skill`, truyền `topic`, `format`, `hook`,
   link bài gốc và nguồn gốc (`source`). Làm **tuần tự** từng video, không render song song (render song
   song + upload bị kill vì thiếu RAM). `tram-ai-skill` tự quyết việc đăng: `short` dựng xong là đăng luôn
   lên YouTube + Facebook; `long-*` dừng chờ user duyệt kịch bản rồi mới đăng.
3. User chọn "Chỉ dựng, chưa đăng" thì báo `tram-ai-skill` dừng trước bước đăng. User chọn "Soi sâu" thì
   chạy `anthropic-skills:deep-research` cho các chủ đề đó trước, rồi hiện lại select box.
4. User chọn "Other" và gõ chủ đề khác thì coi đó là chủ đề muốn làm, chuyển thẳng sang `tram-ai-skill`.
5. Làm xong, báo lại link video đã đăng của từng chủ đề.

## Lưu ý kỹ thuật

- **Không đọc view từ bản `lang=vi` của trang kênh**, vì nó bỏ mất chữ "N" (nghìn). Lệnh `channel` đã tự
  ghép view chuẩn với tiêu đề tiếng Việt. Trang tìm kiếm thì `lang=vi` cho view đúng.
- Tìm kiếm mặc định trả tiêu đề video Việt **đã tự dịch sang tiếng Anh**, làm sai độ khớp. Script đã dùng
  `lang=vi` cho `vi_query`.
- Video có tiêu đề hoàn toàn tiếng Anh, không có chữ có dấu, sẽ không được tính là video Việt.
- `lang=vi` cũng trả tiêu đề YouTube tự dịch của video nước ngoài có bản dịch, ví dụ bài nói của Andrej Karpathy
  (4,3M view) hiện thành tiêu đề tiếng Việt. Kiểm tra tên kênh trong `vi_top` / `vi_recent`, đừng chỉ nhìn tiêu đề.
- View từ danh sách kênh là số **làm tròn** (vd 198K). Cần số chính xác thì dùng `detail`.
- Video vừa đăng hoặc đang công chiếu có `views = null` và không tính vào median.
- Video dài thắng có thể chỉ trùng với giai đoạn kênh đang lớn lên, nên **chưa phải quan hệ nhân quả**.
  Ghi rõ điều này khi kết luận về độ dài video.
- Gặp lỗi SSL hoặc `Unable to extract` thì chạy lại `setup.sh` để nâng cấp yt-dlp.
- Mỗi lần quét không quá 15 kênh và 40 truy vấn để tránh bị YouTube chặn tạm thời. Watchlist có hơn 15 kênh thì chia làm 2 lần quét.
