"""Validate the generated site's local links, SEO metadata and playable media."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
SERVICES = json.loads((HERE / "services.json").read_text(encoding="utf-8"))
failures = []
warnings = []
checked = 0
canonical_urls = {}


def local_target(url, page):
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None, parsed.fragment
    candidate = ROOT / unquote(parsed.path.lstrip("/")) if parsed.path.startswith("/") else page.parent / unquote(parsed.path)
    if candidate.is_dir():
        candidate /= "index.html"
    return candidate, parsed.fragment


paths = [p for p in ROOT.rglob("*.html") if not any(part.startswith(".") or part in {"node_modules", "docs", "assets", "tests", "src", "public"} for part in p.relative_to(ROOT).parts)]
for path in paths:
    text = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(text, "html.parser")
    relative = path.relative_to(ROOT).as_posix()
    if soup.find("meta", attrs={"http-equiv": re.compile("refresh", re.I)}):
        continue
    checked += 1
    for required, result in [("title", soup.title), ("description", soup.find("meta", attrs={"name": "description"})), ("viewport", soup.find("meta", attrs={"name": "viewport"})), ("canonical", soup.find("link", rel="canonical"))]:
        if not result:
            failures.append(f"{relative}: missing {required}")
    if len(soup.find_all("h1")) != 1:
        failures.append(f"{relative}: expected one H1")
    if re.search(r"\?{3,}|\ufffd", soup.get_text()):
        failures.append(f"{relative}: corrupted visible text")
    canonical = soup.find("link", rel="canonical")
    if canonical:
        url = canonical["href"]
        if url in canonical_urls:
            failures.append(f"{relative}: duplicate canonical {url}")
        canonical_urls[url] = relative
        expected = "https://empid.com/" + relative.replace("index.html", "")
        if url != expected:
            failures.append(f"{relative}: canonical points to {url}, expected {expected}")
        for og in soup.select('meta[property="og:url"]'):
            if og.get("content") != url:
                failures.append(f"{relative}: canonical/OG URL mismatch")
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            json.loads(script.get_text())
        except json.JSONDecodeError as error:
            failures.append(f"{relative}: invalid JSON-LD {error}")
    for element in soup.select("a[href], img[src], script[src], link[href], source[src], track[src], video[poster]"):
        attribute = "poster" if element.name == "video" else "href" if element.name in {"a", "link"} else "src"
        url = element.get(attribute, "")
        target, fragment = local_target(url, path)
        if target and not target.is_file():
            failures.append(f"{relative}: missing local target {url}")
        if fragment and not urlsplit(url).scheme and not urlsplit(url).netloc:
            document = BeautifulSoup(target.read_text(encoding="utf-8"), "html.parser") if target and target.is_file() and target.suffix == ".html" else soup if not target else None
            if document and not document.find(id=fragment):
                warnings.append(f"{relative}: fragment {url} may be provided dynamically")
    for image in soup.select('img[src*="/assets/service-guides/"]'):
        if not all(image.get(attr) for attr in ["alt", "width", "height"]):
            failures.append(f"{relative}: guide image missing alt/dimensions")

for service in SERVICES:
    directory = ROOT / "assets/service-guides" / service["slug"]
    video = directory / "guide.mp4"
    info = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-i", str(video), "-f", "null", "-"], capture_output=True, text=True)
    if info.returncode:
        failures.append(f'{service["slug"]}: video decode failed')
    if not re.search(r"Duration: 00:00:24\.00", info.stderr):
        failures.append(f'{service["slug"]}: video duration differs from schema')
    if "Audio:" in info.stderr:
        failures.append(f'{service["slug"]}: unexpected audio track')
    if "1920x1080" not in info.stderr:
        failures.append(f'{service["slug"]}: unexpected video dimensions')
    page = ROOT / "videos" / service["slug"] / "index.html"
    soup = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
    payload = json.loads(soup.select_one('script[type="application/ld+json"]').get_text())
    if payload.get("@type") != "VideoObject" or payload.get("duration") != "PT24S":
        failures.append(f'{service["slug"]}: video schema missing/mismatched')
    if len(soup.select("video source")) != 1 or len(soup.select("ol li")) != 3:
        failures.append(f'{service["slug"]}: video/transcript incomplete')

for filename in ["sitemap.xml", "video-sitemap.xml"]:
    root = ET.parse(ROOT / filename).getroot()
    locations = [element.text for element in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    if len(locations) != len(set(locations)):
        failures.append(f"{filename}: duplicate URLs")
    for url in locations:
        target = ROOT / urlsplit(url).path.lstrip("/")
        if target.is_dir():
            target /= "index.html"
        if not target.is_file():
            failures.append(f"{filename}: missing page {url}")
report = {"public_pages_checked": checked, "services": len(SERVICES), "videos_decoded": len(SERVICES), "failures": failures, "warnings": sorted(set(warnings))}
(HERE / "validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(1 if failures else 0)
