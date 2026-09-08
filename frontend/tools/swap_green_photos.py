"""Replace low-vegetation demo photos with greener ones.

Uses the same HSV vegetation heuristic as js/verify.js (64x64 downscale) to
pre-vet candidates before they enter the demo, so the on-page relevance
check passes on genuine field photos.
"""
import io
import colorsys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
UA = {"User-Agent": "EcoPromiseAI-demo/1.0 (hackathon static site; asset fetch)"}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def veg_ratio(blob):
    im = Image.open(io.BytesIO(blob)).convert("RGB").resize((64, 64))
    green = 0
    for r, g, b in im.getdata():
        rf, gf, bf = r / 255, g / 255, b / 255
        mx, mn = max(rf, gf, bf), min(rf, gf, bf)
        v = mx
        s = (mx - mn) / mx if mx > 0 else 0
        if mx != mn:
            if mx == rf:
                h = 60 * (((gf - bf) / (mx - mn)) % 6)
            elif mx == gf:
                h = 60 * ((bf - rf) / (mx - mn) + 2)
            else:
                h = 60 * ((rf - gf) / (mx - mn) + 4)
            if h < 0:
                h += 360
        else:
            h = 0
        if 60 <= h <= 170 and s >= 0.18 and v >= 0.12:
            green += 1
    return green / 4096


def candidates(query, limit=25):
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}", "gsrnamespace": "6",
        "gsrlimit": str(limit), "prop": "imageinfo",
        "iiprop": "url|extmetadata|size", "iiurlwidth": "900",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    pages = __import__("json").loads(fetch(url)).get("query", {}).get("pages", {})
    out = []
    for page in pages.values():
        ii = (page.get("imageinfo") or [None])[0]
        if not ii or not page.get("title", "").lower().endswith((".jpg", ".jpeg")):
            continue
        em = ii.get("extmetadata", {})
        artist = em.get("Artist", {}).get("value", "Unknown")
        import re
        artist = re.sub(r"<[^>]+>", "", artist).strip()
        out.append({
            "title": page["title"],
            "thumb": ii.get("thumburl") or ii.get("url"),
            "page": ii.get("descriptionurl", ""),
            "artist": artist,
            "license": em.get("LicenseShortName", {}).get("value", "See Commons page"),
        })
    out.sort(key=lambda r: r["title"])
    return out


# files to replace and the queries to hunt with
WANTED = {
    "tree-02.jpg": ["tree sapling planting hands", "planting tree seedling soil green", "tree nursery seedlings rows"],
    "tree-03.jpg": ["young tree sapling green leaves", "planted sapling park", "tree seedling growth"],
    "tree-04.jpg": ["volunteers planting trees", "tree planting campaign", "afforestation planting"],
    "tree-05.jpg": ["tree plantation rows", "reforestation site", "planted trees field"],
    "tree-06.jpg": ["tree seedling nursery bags", "saplings nursery", "forest seedlings"],
    "mangrove-02.jpg": ["mangrove seedlings", "mangrove propagules planting", "mangrove nursery"],
    "mangrove-04.jpg": ["mangrove forest green", "mangrove trees roots", "mangrove swamp green"],
    "mangrove-05.jpg": ["mangrove planting", "mangrove restoration seedlings", "planting mangrove seedling"],
    "mangrove-06.jpg": ["mangrove forest canopy", "mangrove green leaves", "mangrove wetland"],
    "mangrove-07.jpg": ["mangrove sapling", "mangrove conservation", "mangrove habitat"],
}

MIN_VEG = 0.12
used_pages = set()
log = []
for target, queries in WANTED.items():
    done = False
    for q in queries:
        if done:
            break
        for cand in candidates(q):
            if done or cand["page"] in used_pages:
                continue
            try:
                blob = fetch(cand["thumb"])
            except Exception as exc:
                print(f"  dl fail {cand['title']}: {exc}")
                continue
            if len(blob) < 20000:
                continue
            try:
                vr = veg_ratio(blob)
            except Exception:
                continue
            im = Image.open(io.BytesIO(blob))
            w, h = im.size
            if w < 500 or h < 350 or not (0.5 <= w / h <= 2.3):
                continue
            if vr < MIN_VEG:
                print(f"  low veg {vr:.2f} <- {cand['title']}")
                continue
            (IMG / target).write_bytes(blob)
            used_pages.add(cand["page"])
            log.append(f"- `assets/img/{target}` - {cand['title']} by {cand['artist']}, {cand['license']}. {cand['page']} (veg {vr:.0%})")
            print(f"REPLACED {target} (veg {vr:.0%}) <- {cand['title']}")
            done = True
    if not done:
        print(f"WARNING: no green enough replacement found for {target}")

with open(ROOT / "ATTRIBUTION.md", "a", encoding="utf-8") as f:
    f.write("\n## Replacement photos (second pass)\n\n" + "\n".join(log) + "\n")
print("done")
