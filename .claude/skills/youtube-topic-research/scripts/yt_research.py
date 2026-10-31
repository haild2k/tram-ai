#!/usr/bin/env python3
"""Thu thập + chấm điểm dữ liệu YouTube cho skill youtube-topic-research.

Subcommands:
  channel  <url>... --limit 60 --out ch.json     video gần nhất + view + hệ số outlier (x lần median)
  search   <query>... --limit 40 --out s.json    tìm kiếm, gom theo kênh (tìm đối thủ/kênh nguồn mới)
  demand   <query>... --out d.json               nhu cầu: top video khớp từ khoá cho từng query
  score    --candidates c.json --out ranked.json chạy demand EN/VI cho từng ứng viên rồi chấm điểm 0-100
  detail   <video_url>... --out v.json           metadata đầy đủ (ngày đăng, like, comment, view/ngày)
  saturation --ranked ranked.json --top 10 --days 30
                                                 top N: tìm lại theo ngày đăng, đếm kênh làm gần đây, trừ điểm → final_score

Chạy bằng venv của skill:  .claude/skills/youtube-topic-research/.venv/bin/python <script> ...
"""
import argparse, json, math, os, re, statistics, sys, unicodedata
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime
from urllib.parse import urlencode

try:
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass
import yt_dlp

BASE_OPTS = {"quiet": True, "no_warnings": True, "extract_flat": "in_playlist", "skip_download": True}


def extract(url, lang=None, **extra):
    opts = dict(BASE_OPTS, **extra)
    if lang:
        opts["extractor_args"] = {"youtube": {"lang": [lang]}}
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=False) or {}
    except Exception as ex:  # một nguồn lỗi không được làm hỏng cả lượt
        print(f"[warn] {url}: {ex}", file=sys.stderr)
        return {}


def save(obj, path):
    if path:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
        print(f"[saved] {path}", file=sys.stderr)


def norm(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").replace("đ", "d")
    return re.findall(r"[a-z0-9]+", s)


# Kênh của mình: không tính là đối thủ / nhu cầu khi đo chủ đề
HOME = "Trạm AI"
VI_CHARS = set("ăâđêôơưàằầèềìòồờùừỳáắấéếíóốớúứýảẳẩẻểỉỏổởủửỷãẵẫẽễĩõỗỡũữỹạặậẹệịọộợụựỵ")


def is_vi(title):
    """Tiêu đề tiếng Việt? Tên AI là tiếng Anh nên query Việt hay khớp cả video nước ngoài."""
    return bool(VI_CHARS & set((title or "").lower()))


STOP = set("the a an of to in is are do did does why how what when who and or for with you your we our on at "
           "vi sao tai sao nhu the nao co khong la cua cho mot nhung cac va thi ma da duoc nguoi".split())


def relevance(query, title, parts=False):
    """Độ khớp query–tiêu đề (0-1) = ½ tỉ lệ từ có nghĩa + ½ tỉ lệ cặp từ liền nhau.
    Cặp từ cần thiết cho tiếng Việt: từ đơn ("con", "người") khớp lung tung, cặp ("con người không") thì không.
    parts=True trả thêm tỉ lệ từ có nghĩa (uni) để lọc chặt hơn."""
    qt, tt = norm(query), norm(title)
    q = [w for w in qt if w not in STOP] or qt
    if not q:
        return (0, 0) if parts else 0
    uni = sum(1 for w in q if w in set(tt)) / len(q)
    qb = list(zip(qt, qt[1:]))
    bi = sum(1 for b in qb if b in set(zip(tt, tt[1:]))) / len(qb) if qb else uni
    rel = 0.5 * uni + 0.5 * bi
    return (rel, uni) if parts else rel


# ---------------- channel ----------------
def channel_url(u):
    u = u.strip().rstrip("/")
    if not u.startswith("http"):
        u = "https://www.youtube.com/" + (u if u.startswith("@") else "@" + u)
    return u if re.search(r"/(videos|shorts|streams)$", u) else u + "/videos"


def fetch_channel(url, limit):
    url = channel_url(url)
    # Bản mặc định cho view chính xác; bản lang=vi cho tiêu đề gốc tiếng Việt
    # (lang=vi làm yt-dlp mất đơn vị "N" nên KHÔNG dùng view của nó).
    with ThreadPoolExecutor(2) as ex:
        f_en = ex.submit(extract, url, None, playlistend=limit)
        f_vi = ex.submit(extract, url, "vi", playlistend=limit)
        en, vi = f_en.result(), f_vi.result()
    vi_titles = {e.get("id"): e.get("title") for e in vi.get("entries") or []}
    vids = []
    for i, e in enumerate((en.get("entries") or [])[:limit]):
        vids.append(dict(id=e.get("id"), url=e.get("url"), rank_recent=i,
                         title=vi_titles.get(e.get("id")) or e.get("title"),
                         title_en=e.get("title"), views=e.get("view_count"),
                         minutes=round((e.get("duration") or 0) / 60, 1)))
    views = [v["views"] for v in vids if v["views"]]
    med = statistics.median(views) if views else 0
    for v in vids:
        v["x"] = round(v["views"] / med, 2) if v["views"] and med else None
    long_v = [v["views"] for v in vids if v["views"] and v["minutes"] >= 20]
    short_v = [v["views"] for v in vids if v["views"] and v["minutes"] < 20]
    return dict(channel=en.get("channel"), url=url, subs=en.get("channel_follower_count"),
                n=len(vids), median=med,
                median_ge20m=statistics.median(long_v) if long_v else None,
                median_lt20m=statistics.median(short_v) if short_v else None,
                outliers=sorted([v for v in vids if (v["x"] or 0) >= 3], key=lambda v: -v["x"]),
                videos=vids)


def cmd_channel(a):
    out = []
    with ThreadPoolExecutor(4) as ex:
        for c in ex.map(lambda u: fetch_channel(u, a.limit), a.urls):
            out.append(c)
            print(f"\n## {c['channel']} | subs {c['subs']} | n={c['n']} | median {c['median']:,.0f}"
                  f" | ≥20m {c['median_ge20m']} | <20m {c['median_lt20m']}")
            for v in c["outliers"][:a.top]:
                print(f"  {v['x']:5.1f}x {v['views']:>11,} | {v['minutes']}m | {v['title']}")
    save(out, a.out)


# ---------------- search / demand ----------------
def fetch_search(q, limit, lang=None):
    # lang="vi": lấy tiêu đề gốc — mặc định YouTube trả bản tự dịch sang tiếng Anh, làm sai độ khớp query Việt
    d = extract(f"ytsearch{limit}:{q}", lang)
    return [dict(id=e.get("id"), url=e.get("url"), title=e.get("title"), channel=e.get("channel"),
                 channel_url=e.get("channel_url"), views=e.get("view_count") or 0,
                 minutes=round((e.get("duration") or 0) / 60, 1), relevance=round(relevance(q, e.get("title")), 2))
            for e in d.get("entries") or [] if e.get("channel") != HOME]


def cmd_search(a):
    res, chans = {}, {}
    with ThreadPoolExecutor(6) as ex:
        for q, items in zip(a.queries, ex.map(lambda q: fetch_search(q, a.limit), a.queries)):
            res[q] = items
            for it in items:
                c = chans.setdefault(it["channel"] or "?", dict(url=it["channel_url"], hits=0, views=0, top=[]))
                c["hits"] += 1; c["views"] += it["views"]; c["top"].append((it["views"], it["title"], it["minutes"]))
    ranked = sorted(chans.items(), key=lambda kv: -kv[1]["hits"] * math.log10(kv[1]["views"] + 10))
    for name, c in ranked[:a.top]:
        print(f"\n## {name} | hits {c['hits']} | {c['url']}")
        for v, t, m in sorted(set(c["top"]), reverse=True)[:3]:
            print(f"   {v:>11,} | {m}m | {t}")
    save(dict(queries=res, channels=[dict(channel=k, **v) for k, v in ranked]), a.out)


def demand_one(q, limit=15, min_rel=0.5, lang=None):
    items = [i for i in fetch_search(q, limit, lang) if i["relevance"] >= min_rel]
    if lang == "vi":
        items = [i for i in items if is_vi(i["title"])]
    items.sort(key=lambda i: -i["views"])
    top = items[:3]
    return dict(query=q, max_views=top[0]["views"] if top else 0, n_relevant=len(items),
                n_100k=sum(1 for i in items if i["views"] >= 100_000), top=top)


def cmd_demand(a):
    with ThreadPoolExecutor(6) as ex:
        out = list(ex.map(lambda q: demand_one(q, a.limit, a.min_rel), a.queries))
    for d in out:
        print(f"\n[{d['query']}] max {d['max_views']:,} | khớp {d['n_relevant']} | ≥100K {d['n_100k']}")
        for i in d["top"]:
            print(f"   {i['views']:>11,} | {i['channel']} | {i['title'][:80]}")
    save(out, a.out)


# ---------------- score ----------------
def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


WEIGHTS = dict(demand=0.25, gap=0.20, fit=0.20, angle=0.10, feasibility=0.10, freshness=0.15)


def cmd_score(a):
    cands = json.load(open(a.candidates, encoding="utf-8"))
    def qs(c, lang):  # query chính + các cách gõ khác (en_alt / vi_alt)
        return [q for q in [c.get(f"{lang}_query")] + c.get(f"{lang}_alt", []) if q]

    def best(c, lang):  # gộp kết quả mọi cách gõ: lấy top theo view, bỏ trùng video
        items = {i["id"]: i for q in qs(c, lang) for i in dem[q]["top"]}
        top = sorted(items.values(), key=lambda i: -i["views"])[:3]
        return dict(max_views=top[0]["views"] if top else 0, top=top,
                    n_100k=max([dem[q]["n_100k"] for q in qs(c, lang)] or [0]))

    queries = sorted({q for c in cands for lang in ("en", "vi") for q in qs(c, lang)})
    with ThreadPoolExecutor(6) as ex:
        vi_qs = {q for c in cands for q in qs(c, "vi")}
        dem = dict(zip(queries, ex.map(lambda q: demand_one(q, a.limit, a.min_rel, "vi" if q in vi_qs else None), queries)))
    for c in cands:
        en, vi = best(c, "en"), best(c, "vi")
        # demand: 100K → 0, ~20M → 5 (thang log)
        demand = 5 * clamp((math.log10(en["max_views"] + 1) - 5) / 2.3)
        # gap: kênh Việt càng ít video mạnh về chủ đề này càng cao. VN max 10K → 5, 1M → 0
        gap = 5 * (1 - clamp((math.log10(vi["max_views"] + 1) - 4) / 2))
        sub = dict(demand=round(demand, 2), gap=round(gap, 2),
                   fit=float(c.get("fit", 3)), angle=float(c.get("angle", 3)),
                   feasibility=float(c.get("feasibility", 3)), freshness=float(c.get("freshness", 3)))
        c["subscores"] = sub
        c["score"] = round(20 * sum(WEIGHTS[k] * sub[k] for k in WEIGHTS), 1)
        c["evidence"] = dict(en_max=en["max_views"], en_top=en["top"], vi_max=vi["max_views"],
                             vi_n_100k=vi.get("n_100k", 0), vi_top=vi["top"])
    cands.sort(key=lambda c: -c["score"])
    print(f"{'#':>2} {'điểm':>5} | {'cầu':>4} {'trống':>5} {'hợp':>4} {'VN':>4} {'dễ':>4} {'mới':>4} | EN max | VN max | chủ đề")
    for i, c in enumerate(cands, 1):
        s = c["subscores"]
        print(f"{i:>2} {c['score']:>5} | {s['demand']:>4} {s['gap']:>5} {s['fit']:>4} {s['angle']:>4} {s['feasibility']:>4} {s['freshness']:>4}"
              f" | {c['evidence']['en_max']:>11,} | {c['evidence']['vi_max']:>9,} | {c['topic']}")
    save(dict(weights=WEIGHTS, generated=datetime.now().isoformat(timespec="seconds"), ranked=cands), a.out)


# ---------------- detail ----------------
def fetch_detail(u):
    d = extract(u, extract_flat=False)
    if not d:
        return None
    up = d.get("upload_date")
    age = (date.today() - datetime.strptime(up, "%Y%m%d").date()).days if up else None
    v = d.get("view_count") or 0
    return dict(id=d.get("id"), title=d.get("title"), channel=d.get("channel"), upload_date=up,
                age_days=age, views=v, views_per_day=round(v / max(age or 1, 1)),
                likes=d.get("like_count"), comments=d.get("comment_count"),
                tags=d.get("tags"), minutes=round((d.get("duration") or 0) / 60, 1))


def recent_videos(q, days, limit, min_rel, lang=None):
    """Video khớp chủ đề đăng trong `days` ngày gần nhất (tìm theo ngày đăng mới nhất)."""
    # Chặt hơn demand: query ≤5 từ có nghĩa phải khớp đủ, cứ thêm 5 từ được thiếu 1 —
    # để "người tiền sử làm gì khi trời mưa" không lọt vào chủ đề "người tiền sử làm gì ban đêm"
    nq = len([w for w in norm(q) if w not in STOP]) or 1
    need = 1 - ((nq - 1) // 5) / nq
    hits = [i for i in fetch_search_sorted(q, limit, lang) if i["relevance"] >= min_rel and i["uni"] >= need - 1e-9][:15]
    with ThreadPoolExecutor(4) as ex:
        det = [d for d in ex.map(lambda i: fetch_detail(f"https://www.youtube.com/watch?v={i['id']}"), hits) if d]
    return [d for d in det if d["age_days"] is not None and d["age_days"] <= days]


def fetch_search_sorted(q, limit, lang=None):
    # sp=CAI%3D = sắp xếp theo ngày đăng (yt-dlp bản mới bỏ "ytsearchdate:")
    url = "https://www.youtube.com/results?" + urlencode({"search_query": q, "sp": "CAI="})
    d = extract(url, lang, playlistend=limit)
    out = []
    for e in d.get("entries") or []:
        if len(e.get("id") or "") != 11:  # bỏ kênh/playlist lẫn trong kết quả, chỉ giữ video
            continue
        if e.get("channel") == HOME or (lang == "vi" and not is_vi(e.get("title"))):
            continue
        rel, uni = relevance(q, e.get("title"), parts=True)
        out.append(dict(id=e["id"], title=e.get("title"), relevance=round(rel, 2), uni=round(uni, 2)))
    return out


def cmd_saturation(a):
    data = json.load(open(a.ranked, encoding="utf-8"))
    ranked = data["ranked"]
    top = ranked[:a.top]
    for c in top:
        vi_qs = [q for q in [c.get("vi_query")] + c.get("vi_alt", []) if q]
        en_qs = [c["en_query"]] if c.get("en_query") else []
        seen, vi_recent, en_recent = set(), [], []
        for qs, bucket, lang in ((vi_qs, vi_recent, "vi"), (en_qs, en_recent, None)):
            for q in qs:
                for v in recent_videos(q, a.days, a.limit, a.min_rel, lang):
                    if v["id"] not in seen:
                        seen.add(v["id"]); bucket.append(v)
        # Kênh tí hon không phải cạnh tranh; video ≤3 ngày chưa kịp có view nên vẫn tính
        vi_ch = {v["channel"] for v in vi_recent if v["views"] >= a.min_views or v["age_days"] <= 3}
        strong = [v for v in vi_recent if v["views"] >= a.strong_views]
        # Phạt: mỗi kênh Việt làm gần đây -6 (tối đa -24), có bản Việt gần đây đã thắng (≥ strong_views) thêm -12
        penalty = min(6 * len(vi_ch), 24) + (12 if strong else 0)
        level = "bão hoà" if penalty >= 24 else "đã có người làm" if penalty >= 6 else "còn trống"
        c["saturation"] = dict(days=a.days, level=level, penalty=penalty, vi_recent_channels=sorted(vi_ch),
                               vi_recent=sorted(vi_recent, key=lambda v: -v["views"]),
                               en_recent_count=len(en_recent),
                               en_recent=sorted(en_recent, key=lambda v: -v["views"])[:5])
        c["final_score"] = round(c["score"] - penalty, 1)
    for c in ranked[a.top:]:
        c.setdefault("final_score", c["score"])
    top.sort(key=lambda c: -c["final_score"])
    data["ranked"] = top + ranked[a.top:]
    print(f"Độ bão hoà {a.days} ngày gần nhất (top {a.top}):")
    for i, c in enumerate(top, 1):
        s = c["saturation"]
        print(f"\n{i}. {c['final_score']:>5} (gốc {c['score']}, -{s['penalty']}) [{s['level']}] {c['topic']}")
        print(f"   VN gần đây: {len(s['vi_recent'])} video / {len(s['vi_recent_channels'])} kênh | EN gần đây: {s['en_recent_count']}")
        for v in s["vi_recent"][:4]:
            print(f"     VN {v['views']:>9,} | {v['age_days']}d | {v['channel']} | {v['title'][:70]}")
        for v in s["en_recent"][:2]:
            print(f"     EN {v['views']:>9,} | {v['age_days']}d | {v['channel']} | {v['title'][:70]}")
    save(data, a.out or a.ranked)


def cmd_detail(a):
    with ThreadPoolExecutor(4) as ex:
        out = [r for r in ex.map(fetch_detail, a.urls) if r]
    for r in sorted(out, key=lambda r: -r["views_per_day"]):
        print(f"{r['views_per_day']:>8,}/ngày | {r['views']:>11,} | {r['age_days']}d | {r['comments']} cmt | {r['title']}")
    save(out, a.out)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("channel"); s.add_argument("urls", nargs="+"); s.add_argument("--limit", type=int, default=60)
    s.add_argument("--top", type=int, default=12); s.add_argument("--out")
    s = sp.add_parser("search"); s.add_argument("queries", nargs="+"); s.add_argument("--limit", type=int, default=40)
    s.add_argument("--top", type=int, default=20); s.add_argument("--out")
    s = sp.add_parser("demand"); s.add_argument("queries", nargs="+"); s.add_argument("--limit", type=int, default=15)
    s.add_argument("--min-rel", type=float, default=0.5); s.add_argument("--out")
    s = sp.add_parser("score"); s.add_argument("--candidates", required=True); s.add_argument("--limit", type=int, default=15)
    s.add_argument("--min-rel", type=float, default=0.5); s.add_argument("--out")
    s = sp.add_parser("detail"); s.add_argument("urls", nargs="+"); s.add_argument("--out")
    s = sp.add_parser("saturation"); s.add_argument("--ranked", required=True); s.add_argument("--top", type=int, default=10)
    s.add_argument("--days", type=int, default=30); s.add_argument("--limit", type=int, default=30)
    s.add_argument("--min-rel", type=float, default=0.6); s.add_argument("--strong-views", type=int, default=20_000)
    s.add_argument("--min-views", type=int, default=500)
    s.add_argument("--out")
    a = p.parse_args()
    dict(channel=cmd_channel, search=cmd_search, demand=cmd_demand, score=cmd_score, detail=cmd_detail,
         saturation=cmd_saturation)[a.cmd](a)


if __name__ == "__main__":
    main()
