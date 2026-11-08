#!/usr/bin/env python3
"""Lọc tin AI mới trong mục "Công nghệ" của các báo lớn (Tuổi Trẻ, VnExpress, Thanh Niên, Dân trí...).

Đọc RSS khai báo ở watchlist.json -> niches.<niche>.tech_sections, giữ bài trong N ngày gần nhất có
nhắc đến AI (tiêu đề + mô tả), gộp tin trùng giữa các báo thành 1 cụm (cụm đăng ở nhiều báo = tín hiệu
mạnh), rồi ghi ra JSON + Markdown. Chỉ dùng thư viện chuẩn của Python.

  python3 news_scan.py --days 3 --out research/<ngày>/tram-ai/raw/news_scan.json
"""
import argparse, html, json, os, re, sys, unicodedata, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
WATCHLIST = os.path.join(HERE, "..", "watchlist.json")
VN = timezone(timedelta(hours=7))
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

# Từ khoá AI. Từ ngắn dễ khớp nhầm ("AI" trong "ai cũng") chỉ khớp đúng chữ hoa, có ranh giới từ.
AI_CASE = [r"\bAI\b", r"\bA\.I\.", r"\bAGI\b", r"\bLLM", r"\bGPT", r"\bxAI\b", r"\bGenAI\b"]
AI_TERMS = [
    "trí tuệ nhân tạo", "chatgpt", "openai", "gemini", "claude", "anthropic", "copilot", "chatbot",
    "mô hình ngôn ngữ", "học máy", "machine learning", "deep learning", "học sâu", "deepfake",
    "grok", "deepseek", "llama", "qwen", "mistral", "perplexity", "midjourney", "sora", "veo ",
    "agent ai", "tác tử", "trợ lý ảo", "nvidia", "sam altman", "hugging face", "robot hình người",
    "siêu máy tính", "trung tâm dữ liệu", "chip ai", "generative",
]
# Bài chỉ nhắc AI cho có: đánh dấu để Claude cân nhắc, không tự xoá.
NOISE_TERMS = ["chứng khoán", "cổ phiếu", "vn-index", "khuyến mãi", "giảm giá", "ưu đãi", "tuyển dụng",
               "hội thảo", "lễ ký kết", "trao giải", "xổ số", "bóng đá"]
STOP = set("va cua cho voi trong la cac nhung mot de duoc khi tu den nay do co khong se da dang bi ra "
           "len ve tai theo hon nhat moi nguoi viec gi sao the nao vi tren duoi sau truoc ai".split())


def strip_accents(s):
    s = unicodedata.normalize("NFD", s.replace("đ", "d").replace("Đ", "D"))
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def clean(s):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return re.sub(r"\s+", " ", s).strip()


def parse_date(s):
    s = (s or "").strip()
    if not s:
        return None
    try:
        d = parsedate_to_datetime(re.sub(r"GMT([+-]\d+)$", r"\1", s))
        if d:
            return d if d.tzinfo else d.replace(tzinfo=VN)
    except Exception:
        pass
    # "Sun, 08 Nov 26 07:19:58 +0700" (năm 2 chữ số) đã được parsedate xử lý; dưới đây là các kiểu khác
    for f in ("%m/%d/%Y %I:%M:%S %p", "%d/%m/%Y %H:%M:%S", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S",
              "%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z"):
        try:
            d = datetime.strptime(s, f)
            return d if d.tzinfo else d.replace(tzinfo=VN)
        except ValueError:
            continue
    return None


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml,*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def read_feed(src):
    raw = fetch(src["rss"])
    raw = raw.replace(b"\x00", b"")
    root = ET.fromstring(raw)
    items = []
    for it in root.iter("item"):
        g = lambda tag: (it.findtext(tag) or "")
        items.append({"title": clean(g("title")), "link": clean(g("link")) or clean(g("guid")),
                      "desc": clean(g("description"))[:400], "date": parse_date(g("pubDate"))})
    return items


def ai_hits(text):
    hits = [p.strip("\\b").replace("\\", "") for p in AI_CASE if re.search(p, text)]
    low = text.lower()
    hits += [t.strip() for t in AI_TERMS if t in low]
    return hits


def tokens(title):
    w = re.findall(r"[a-z0-9]+", strip_accents(title.lower()))
    return {x for x in w if len(x) > 1 and x not in STOP}


def cluster(arts, thr):
    """Gộp bài cùng sự kiện ở các báo khác nhau (Jaccard trên từ của tiêu đề)."""
    groups = []
    for a in arts:
        t = tokens(a["title"])
        best, score = None, 0.0
        for g in groups:
            j = len(t & g["_tok"]) / max(1, len(t | g["_tok"]))
            if j > score:
                best, score = g, j
        if best and score >= thr:
            best["articles"].append(a)
            best["_tok"] |= t
        else:
            groups.append({"_tok": set(t), "articles": [a]})
    out = []
    for g in groups:
        arts_g = sorted(g["articles"], key=lambda x: x["published"], reverse=True)
        sites = sorted({x["site"] for x in arts_g})
        hits = sorted({h for x in arts_g for h in x["ai_hits"]})
        out.append({"headline": arts_g[0]["title"], "sites": sites, "n_sites": len(sites),
                    "latest": arts_g[0]["published"], "ai_hits": hits,
                    "maybe_noise": all(x["maybe_noise"] for x in arts_g), "articles": arts_g})
    # sort: không-noise trước, nhiều báo trước, nhiều từ khoá trước; cùng mức thì mới nhất trước
    out.sort(key=lambda c: (c["maybe_noise"], -c["n_sites"], -len(c["ai_hits"]), -_ts(c["latest"])))
    return out


def _ts(iso):
    return datetime.fromisoformat(iso).timestamp()


def to_md(res):
    L = [f"# Tin AI từ mục Công nghệ các báo lớn",
         f"Quét lúc {res['scanned_at']} · {res['days']} ngày gần nhất · {res['n_ai']} bài AI / "
         f"{res['n_total']} bài · {len(res['clusters'])} cụm tin", ""]
    L.append("## Nguồn")
    for s in res["sources"]:
        L.append(f"- {s['name']}: {s['status']}" + (f" ({s['n_recent']} bài trong kỳ, {s['n_ai']} bài AI)"
                                                       if s['status'] == 'ok' else ""))
    L.append("\n## Cụm tin (nhiều báo đăng xếp trước; `noise?` = có thể chỉ nhắc AI cho có)")
    for i, c in enumerate(res["clusters"], 1):
        flag = " · noise?" if c["maybe_noise"] else ""
        L.append(f"\n### {i}. {c['headline']}")
        L.append(f"{c['n_sites']} báo: {', '.join(c['sites'])} · mới nhất {c['latest'][:16]} · "
                 f"từ khoá: {', '.join(c['ai_hits'])}{flag}")
        for a in c["articles"]:
            L.append(f"- [{a['site']}] {a['title']} — {a['published'][:16]} — {a['link']}")
        if c["articles"][0]["desc"]:
            L.append(f"  > {c['articles'][0]['desc'][:250]}")
    return "\n".join(L) + "\n"


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--days", type=float, default=3, help="chỉ giữ bài trong N ngày gần nhất (mặc định 3)")
    p.add_argument("--niche", default="tram-ai")
    p.add_argument("--sites", nargs="*", help="chỉ quét các báo có tên chứa chuỗi này (vd: tuoitre vnexpress)")
    p.add_argument("--cluster", type=float, default=0.3, help="ngưỡng Jaccard để gộp tin trùng")
    p.add_argument("--out", help="file JSON; file .md cùng tên được ghi kèm")
    a = p.parse_args()

    srcs = json.load(open(WATCHLIST, encoding="utf-8"))["niches"][a.niche].get("tech_sections", [])
    if a.sites:
        srcs = [s for s in srcs if any(k.lower() in (s["name"] + s["rss"]).lower() for k in a.sites)]
    now = datetime.now(VN)
    since = now - timedelta(days=a.days)

    def run(s):
        try:
            return s, read_feed(s), None
        except Exception as e:
            return s, [], f"{type(e).__name__}: {e}"

    with ThreadPoolExecutor(8) as ex:
        results = list(ex.map(run, srcs))

    arts, seen, sources, n_total = [], set(), [], 0
    for s, items, err in results:
        if err:
            sources.append({"name": s["name"], "rss": s["rss"], "status": f"LỖI {err}"})
            print(f"[!] {s['name']}: {err}", file=sys.stderr)
            continue
        recent = [x for x in items if x["date"] and x["date"] >= since]
        stale = items and not recent and all(x["date"] for x in items)
        n_ai = 0
        n_total += len(recent)
        for x in recent:
            if x["link"] in seen:
                continue
            hits = ai_hits(x["title"] + " " + x["desc"])
            if not hits:
                continue
            seen.add(x["link"])
            n_ai += 1
            low = (x["title"] + " " + x["desc"]).lower()
            arts.append({"site": s["name"], "title": x["title"], "link": x["link"], "desc": x["desc"],
                         "published": x["date"].astimezone(VN).isoformat(), "ai_hits": hits,
                         "maybe_noise": any(t in low for t in NOISE_TERMS) and len(hits) <= 1})
        status = "ok" if not stale else "ok (RSS không có bài mới — có thể feed đã ngừng cập nhật)"
        undated = sum(1 for x in items if not x["date"])
        if undated:
            status += f" · {undated} bài không đọc được ngày"
        sources.append({"name": s["name"], "rss": s["rss"], "status": status,
                        "n_items": len(items), "n_recent": len(recent), "n_ai": n_ai})

    res = {"scanned_at": now.isoformat(timespec="minutes"), "days": a.days, "n_total": n_total,
           "n_ai": len(arts), "sources": sources}
    res["clusters"] = cluster(arts, a.cluster)
    for c in res["clusters"]:
        c.pop("_tok", None)

    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        json.dump(res, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        md = os.path.splitext(a.out)[0] + ".md"
        open(md, "w", encoding="utf-8").write(to_md(res))
        print(f"Đã ghi {a.out} và {md}", file=sys.stderr)
    # In bản ngắn ra stdout để Claude đọc nhanh
    for s in sources:
        print(f"# {s['name']}: {s['status']}" + (f" · {s.get('n_ai', 0)}/{s.get('n_recent', 0)} bài AI"
                                                if s["status"].startswith("ok") else ""))
    for i, c in enumerate(res["clusters"], 1):
        flag = " [noise?]" if c["maybe_noise"] else ""
        print(f"{i:>2}. ({c['n_sites']} báo) {c['headline']} — {c['latest'][:10]}{flag}")


if __name__ == "__main__":
    main()
