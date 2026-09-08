"""One-time asset fetcher for the EcoPromise AI demo.

Downloads free-license photos from Wikimedia Commons and vendors Chart.js.
Writes ATTRIBUTION.md so the hackathon repo ships with proper credits.
Run from the project root:  python tools/fetch_assets.py
"""
import io
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "assets" / "img"
VENDOR_DIR = ROOT / "assets" / "vendor"
IMG_DIR.mkdir(parents=True, exist_ok=True)
VENDOR_DIR.mkdir(parents=True, exist_ok=True)

UA = {"User-Agent": "EcoPromiseAI-demo/1.0 (hackathon static site; asset fetch)"}

THEMES = [
    # (file prefix, search query, how many to keep)
    ("tree", "tree planting seedlings reforestation", 9),
    ("mangrove", "mangrove planting restoration", 7),
    ("waste", "recycling bins waste separation", 6),
]

CHART_JS = "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"


def fetch(url, timeout=40):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def search_commons(query, limit=30):
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size",
        "iiurlwidth": "900",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    data = json.loads(fetch(url))
    pages = data.get("query", {}).get("pages", {})
    results = []
    for page in pages.values():
        ii = (page.get("imageinfo") or [None])[0]
        if not ii:
            continue
        title = page.get("title", "")
        if not re.search(r"\.(jpe?g)$", title, re.I):
            continue
        em = ii.get("extmetadata", {})
        def meta(key):
            v = em.get(key, {}).get("value", "") or ""
            return re.sub(r"<[^>]+>", "", v).strip()
        results.append({
            "title": title,
            "thumb": ii.get("thumburl") or ii.get("url"),
            "page": ii.get("descriptionurl", ""),
            "artist": meta("Artist") or "Unknown",
            "license": meta("LicenseShortName") or "See Commons page",
            "w": ii.get("width", 0),
            "h": ii.get("height", 0),
        })
    results.sort(key=lambda r: r["title"])
    return results


def keep_image(blob):
    """Accept only real photos: sane dimensions, not tiny, not extreme aspect."""
    try:
        im = Image.open(io.BytesIO(blob))
        im.load()
    except Exception:
        return None
    w, h = im.size
    if w < 500 or h < 350:
        return None
    if not (0.5 <= w / h <= 2.3):
        return None
    return (w, h)


def main():
    attribution = []
    counts = {}
    for prefix, query, quota in THEMES:
        got = 0
        candidates = search_commons(query)
        print(f"[{prefix}] {len(candidates)} candidates for: {query}")
        for cand in candidates:
            if got >= quota:
                break
            try:
                blob = fetch(cand["thumb"])
            except Exception as exc:
                print(f"  skip (download fail) {cand['title']}: {exc}")
                continue
            if len(blob) < 20_000:
                print(f"  skip (tiny) {cand['title']}")
                continue
            dims = keep_image(blob)
            if not dims:
                print(f"  skip (dims) {cand['title']}")
                continue
            got += 1
            name = f"{prefix}-{got:02d}.jpg"
            (IMG_DIR / name).write_bytes(blob)
            attribution.append({
                "file": f"assets/img/{name}",
                "title": cand["title"],
                "author": cand["artist"][:200],
                "license": cand["license"],
                "source": cand["page"],
                "dims": f"{dims[0]}x{dims[1]}",
            })
            print(f"  kept {name} <- {cand['title']}")
        counts[prefix] = got
        if got < quota:
            print(f"WARNING: only {got}/{quota} for theme {prefix}")

    print("counts:", counts)

    # Vendored chart.js
    chart_blob = fetch(CHART_JS)
    (VENDOR_DIR / "chart.umd.js").write_bytes(chart_blob)
    print(f"chart.umd.js: {len(chart_blob)} bytes")

    lines = [
        "# Photo attributions",
        "",
        "All photos are from Wikimedia Commons under the license listed on each source page.",
        "",
    ]
    for a in attribution:
        lines.append(f"- `{a['file']}` — {a['title']} by {a['author']}, {a['license']}. {a['source']} ({a['dims']})")
    (ROOT / "ATTRIBUTION.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"ATTRIBUTION.md written with {len(attribution)} photos")


if __name__ == "__main__":
    sys.exit(main())
