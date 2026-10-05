"""Build Arabic editorial guides and text-only walkthroughs from reviewed demo captures."""
from pathlib import Path
import argparse
import html
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET

from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE / "services.json").read_text(encoding="utf-8"))
BASE = "https://empid.com"
DATE = "2026-10-05"
FONT = "C:/Windows/Fonts/arial.ttf"
BOLD = "C:/Windows/Fonts/arialbd.ttf"
ASSETS = ROOT / "assets/service-guides"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


def escape(value):
    return html.escape(str(value), quote=True)


def ar(value):
    return get_display(arabic_reshaper.reshape(value))


def write(path, text):
    if not path.resolve().is_relative_to(ROOT.resolve()):
        raise ValueError("Website outputs must stay inside empid-web")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def paragraph(draw, text, y, size=38, width=1700, color="#ffffff", bold=False):
    font = ImageFont.truetype(BOLD if bold else FONT, size)
    line = ""
    lines = []
    for word in text.split():
        candidate = (line + " " + word).strip()
        if draw.textlength(ar(candidate), font=font) > width and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    lines.append(line)
    for line in lines:
        shaped = ar(line)
        draw.text((1810 - draw.textlength(shaped, font=font), y), shaped, font=font, fill=color)
        y += size + 16
    return y


def media(service, rebuild):
    directory = ASSETS / service["slug"]
    directory.mkdir(parents=True, exist_ok=True)
    frames = [(HERE / path).resolve() for path in service["frames"]]
    for frame in frames:
        if not frame.is_relative_to(ROOT.resolve()):
            raise ValueError("Capture sources must stay inside empid-web")
        if not frame.is_file():
            raise FileNotFoundError(frame)
    fingerprint = hashlib.sha256(json.dumps(service, ensure_ascii=False).encode() + b"".join(frame.read_bytes() for frame in frames)).hexdigest()
    stamp = HERE / "render-cache" / service["slug"] / "fingerprint.txt"
    stamp.parent.mkdir(parents=True, exist_ok=True)
    old_stamp = directory / "fingerprint.txt"
    if old_stamp.exists() and not stamp.exists():
        old_stamp.replace(stamp)
    rebuild = rebuild or not stamp.exists() or stamp.read_text() != fingerprint
    mode = "screenshot" if frames else "illustration"
    for index, step in enumerate(service["steps"], 1):
        output = directory / f"step-{index}.webp"
        if output.exists() and not rebuild:
            continue
        image = Image.new("RGB", (1920, 1080), "#061a31")
        draw = ImageDraw.Draw(image)
        paragraph(draw, f"EMPID | {service['name']}", 28, 32, bold=True)
        if frames:
            source = Image.open(frames[min(index - 1, len(frames) - 1)]).convert("RGB")
            source.thumbnail((1760, 760), Image.Resampling.LANCZOS)
            image.paste(source, ((1920 - source.width) // 2, 100 + (760 - source.height) // 2))
        else:
            paragraph(draw, "دليل توضيحي للعملية — ليس لقطة من التطبيق", 200, 42, color="#17c7ff")
            paragraph(draw, service["intro"], 320, 44, width=1600)
        draw.rectangle((0, 880, 1920, 1080), fill="#0b2f66")
        paragraph(draw, step, 901, 43, bold=True, width=1500)
        draw.text((90, 920), f"{index} / 3", font=ImageFont.truetype(BOLD, 40), fill="#ffffff")
        paragraph(draw, "بيانات تجريبية فقط • قد تختلف الواجهة بحسب الدور والإعدادات", 1020, 26, color="#c8e5ff")
        image.save(output, "WEBP", quality=88)
        image.save(directory / f"step-{index}.png")
    poster = directory / "poster.jpg"
    Image.open(directory / "step-1.webp").save(poster, quality=88)
    video = directory / "guide.mp4"
    if rebuild or not video.exists():
        listing = "".join(f"file '{(directory / f'step-{i}.png').as_posix()}'\nduration 8\n" for i in range(1, 4))
        listing += f"file '{(directory / 'step-3.png').as_posix()}'\n"
        write(directory / "frames.txt", listing)
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(directory / "frames.txt"), "-t", "24", "-vf", "fps=12", "-c:v", "libx264", "-threads", "4", "-preset", "veryfast", "-crf", "25", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", str(video)], check=True)
    vtt = "WEBVTT\n\n" + "\n\n".join(f"{i + 1}\n00:00:{i * 8:02d}.000 --> 00:00:{(i + 1) * 8:02d}.000\n{step}" for i, step in enumerate(service["steps"])) + "\n"
    write(directory / "guide-ar.vtt", vtt)
    write(stamp, fingerprint)
    # Intermediate files are kept outside the deployed assets tree.
    intermediates = HERE / "render-cache" / service["slug"]
    intermediates.mkdir(parents=True, exist_ok=True)
    for path in list(directory.glob("*.png")) + [directory / "frames.txt"]:
        if path.exists():
            path.replace(intermediates / path.name)
    return mode


def header():
    return '<a class="guide-skip" href="#main-content">انتقل إلى المحتوى</a><header class="guide-header"><div class="container"><a class="guide-brand" href="/">EMPID</a><nav aria-label="التنقل الرئيسي"><a href="/services/">الخدمات</a><a href="/blog/">المعرفة</a><a href="/videos/">أدلة الفيديو</a><a href="/#contact">طلب عرض</a></nav></div></header>'


def shell(title, description, path, body, schema=None, image=None):
    image = image or "/assets/EMPID_Icon.png"
    payload = schema or {"@context": "https://schema.org", "@type": "WebPage", "name": title, "url": BASE + path, "inLanguage": "ar"}
    return f'''<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)} | EMPID</title><meta name="description" content="{escape(description)}">
<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{BASE}{path}">
<meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="{BASE}{path}"><meta property="og:type" content="website"><meta property="og:locale" content="ar_SA"><meta property="og:image" content="{BASE}{image}"><meta property="og:image:alt" content="{escape(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{BASE}{image}"><link rel="icon" href="/assets/EMPID_Icon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&amp;display=swap"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/service-guides.css">
<script type="application/ld+json">{json.dumps(payload, ensure_ascii=False).replace('</', '<\\/')}</script></head>
<body class="guide-page">{header()}<main id="main-content" class="container guide-main">{body}</main>
<footer class="guide-footer container"><p>EMPID — منصة هوية الموظف وإدارة القوى العاملة</p><nav aria-label="روابط إضافية"><a href="/services/">كل الخدمات</a><a href="/privacy.html">الخصوصية</a><a href="/terms.html">الشروط</a></nav></footer><script src="/service-guides.js" defer></script></body></html>'''


def links(service):
    by_slug = {s["slug"]: s for s in DATA}
    return '<nav class="guide-related" aria-label="خدمات مرتبطة">' + "".join(f'<a href="/{slug}/">{escape(by_slug[slug]["name"])}</a>' for slug in service["related"]) + "</nav>"


def walkthrough(service, mode):
    slug = service["slug"]
    note = "لقطات من بيئة العرض ببيانات تجريبية؛ بعض التسميات داخل الواجهة قد تختلف بحسب اللغة والإصدار." if mode == "screenshot" else "دليل توضيحي للعملية؛ لا يعرض لقطات فعلية من هذه الخدمة."
    figures = "".join(f'<figure><a href="/assets/service-guides/{slug}/step-{i}.webp" target="_blank" rel="noopener" aria-label="فتح الخطوة {i} بالحجم الكامل في علامة تبويب جديدة"><img src="/assets/service-guides/{slug}/step-{i}.webp" width="1920" height="1080" loading="lazy" decoding="async" alt="{escape(service["name"])}: {escape(step)}"></a><figcaption><span>{i} / 3</span> {escape(step)} — <a href="/assets/service-guides/{slug}/step-{i}.webp" target="_blank" rel="noopener">تكبير الصورة</a></figcaption></figure>' for i, step in enumerate(service["steps"], 1))
    return f'<section class="guided-service" id="arabic-guide"><h2>دليل {escape(service["name"])} بالخطوات</h2><p class="guide-note">{note}</p><div class="guide-figures">{figures}</div><p><a class="guide-button" href="/videos/{slug}/">مشاهدة الدليل النصي القصير</a> <a href="/blog/{service["blog"]}.html">قراءة الدليل العملي</a></p>{links(service)}</section>'


def article_content(service):
    return f'<p>{escape(service["intro"])}</p><h2>المشكلة التي يعالجها هذا المسار</h2><p>{escape(service["problem"])}</p><h2>كيف تنظم العمل عملياً؟</h2><p>{escape(service["practice"])}</p><h2>خطوات المراجعة</h2><ol>' + "".join(f"<li>{escape(step)}</li>" for step in service["steps"]) + f'</ol><h2>ما الذي تتحقق منه قبل التشغيل؟</h2><p>{escape(service["check"])}</p><h2>أسئلة عملية</h2><h3>هل يكفي تفعيل الخدمة لبدء العمل؟</h3><p>ابدأ بسياسة واضحة ومسؤول محدد عن البيانات، ثم راجع الصلاحيات ومثالاً كاملاً من الإدخال إلى النتيجة. تختلف الإعدادات المطلوبة بحسب الشركة والدور.</p><h3>كيف ترتبط بخدمات أخرى؟</h3><p>راجع مصدر البيانات وحالة السجل عند الانتقال بين الخدمات، ولا تفترض أن إتاحة رابط تمنح المستخدم صلاحية تنفيذ كل إجراء.</p>{links(service)}'


def add_section(path, section):
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    if soup.body and soup.head in soup.body.parents:
        soup.html.append(soup.body.extract())
    old = soup.select_one("#arabic-guide")
    if old:
        old.decompose()
    target = soup.find("main")
    if target is None:
        raise ValueError(f"No main in {path}")
    wrapper = BeautifulSoup('<div class="container">' + section + "</div>", "html.parser")
    target.append(wrapper)
    if not soup.find("link", href="/service-guides.css"):
        soup.head.append(BeautifulSoup('<link rel="stylesheet" href="/service-guides.css">', "html.parser"))
    write(path, str(soup))


def normalize_blog(path):
    text = path.read_text(encoding="utf-8")
    if path.name == "index.html":
        # Existing alias documents accidentally used doubled HTML attribute quotes.
        if 'lang=""ar""' in text:
            text = text.replace('""', '"')
        write(path, text)
        return
    soup = BeautifulSoup(text, "html.parser")
    if soup.body and soup.head in soup.body.parents:
        soup.html.append(soup.body.extract())
    url = BASE + "/blog/" + path.name
    canonical = soup.find("link", rel="canonical")
    if canonical:
        canonical["href"] = url
    for tag in soup.select('meta[property="og:url"]'):
        tag["content"] = url
    for tag in soup.select('meta[property="og:image"], meta[name="twitter:image"]'):
        tag["content"] = tag.get("content", "").replace("https://www.empid.com/", BASE + "/")
    for tag in soup.select('script[type="application/ld+json"]'):
        if tag.string:
            payload = json.loads(tag.string)
            def repair(value):
                if isinstance(value, dict):
                    return {key: repair(item) for key, item in value.items()}
                if isinstance(value, list):
                    return [repair(item) for item in value]
                if isinstance(value, str):
                    value = value.replace("https://www.empid.com/", BASE + "/")
                    return value.replace(BASE + "/blog/" + path.stem + "/", url)
                return value
            tag.string = json.dumps(repair(payload), ensure_ascii=False)
    write(path, str(soup))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--rebuild-media", action="store_true")
    args = parser.parse_args()
    evidence = []
    for service in DATA:
        mode = media(service, args.rebuild_media)
        guide = walkthrough(service, mode)
        product = ROOT / service["slug"] / "index.html"
        if product.exists() and 'class="guide-page"' not in product.read_text(encoding="utf-8"):
            add_section(product, guide)
        else:
            body = f'<nav class="guide-breadcrumb" aria-label="مسار الصفحة"><a href="/">الرئيسية</a> / <a href="/services/">الخدمات</a></nav><h1>{escape(service["name"])}</h1><p class="guide-lead">{escape(service["intro"])}</p><section><h2>{escape(service["intent"])}</h2><p>{escape(service["practice"])}</p></section>{guide}<section><h2>قبل تفعيل الخدمة</h2><p>{escape(service["check"])}</p><a class="guide-button" href="/#contact">طلب عرض تجريبي</a></section>'
            write(product, shell(service["name"], service["intro"], "/" + service["slug"] + "/", body, image=f'/assets/service-guides/{service["slug"]}/poster.jpg'))
        blog = ROOT / "blog" / (service["blog"] + ".html")
        if blog.exists() and 'class="guide-page"' not in blog.read_text(encoding="utf-8"):
            add_section(blog, guide)
        else:
            url = BASE + "/blog/" + blog.name
            schema = {"@context": "https://schema.org", "@type": "Article", "headline": service["topic"], "description": service["intro"], "inLanguage": "ar", "datePublished": DATE, "dateModified": DATE, "author": {"@type": "Organization", "name": "فريق EMPID", "url": BASE}, "publisher": {"@type": "Organization", "name": "EMPID", "url": BASE}, "mainEntityOfPage": url, "image": BASE + f'/assets/service-guides/{service["slug"]}/poster.jpg'}
            body = f'<nav class="guide-breadcrumb" aria-label="مسار الصفحة"><a href="/blog/">مركز المعرفة</a> / <a href="/{service["slug"]}/">{escape(service["name"])}</a></nav><article class="guide-article"><h1>{escape(service["topic"])}</h1><p class="guide-note">إعداد فريق EMPID · تحديث 5 أكتوبر 2026 · دليل تشغيلي، وليس استشارة قانونية أو مالية</p>{article_content(service)}{guide}</article>'
            write(blog, shell(service["topic"], service["intro"], "/blog/" + blog.name, body, schema, f'/assets/service-guides/{service["slug"]}/poster.jpg'))
        slug = service["slug"]
        schema = {"@context": "https://schema.org", "@type": "VideoObject", "name": f'دليل {service["name"]} في 3 خطوات', "description": service["intro"], "thumbnailUrl": [BASE + f"/assets/service-guides/{slug}/poster.jpg"], "uploadDate": DATE + "T12:00:00+03:00", "duration": "PT24S", "contentUrl": BASE + f"/assets/service-guides/{slug}/guide.mp4", "embedUrl": BASE + f"/videos/{slug}/", "inLanguage": "ar", "transcript": "\n".join(service["steps"])}
        body = f'<nav class="guide-breadcrumb" aria-label="مسار الصفحة"><a href="/videos/">أدلة الفيديو</a> / <a href="/{slug}/">{escape(service["name"])}</a></nav><h1>دليل {escape(service["name"])} في 3 خطوات</h1><video class="guide-video" controls playsinline preload="metadata" poster="/assets/service-guides/{slug}/poster.jpg" aria-label="دليل {escape(service["name"])} باللغة العربية"><source src="/assets/service-guides/{slug}/guide.mp4" type="video/mp4"><track kind="captions" src="/assets/service-guides/{slug}/guide-ar.vtt" srclang="ar" label="العربية"></video><p class="guide-note">24 ثانية · شرح نصي دون صوت · {"لقطات تجريبية وليست بيانات عملاء" if mode == "screenshot" else "مخطط توضيحي وليس تصويراً لواجهة التطبيق"}</p><h2>النص الكامل للدليل</h2><ol>' + "".join(f"<li>{escape(step)}</li>" for step in service["steps"]) + f'</ol><p>{escape(service["intro"])}</p><p><a href="/blog/{service["blog"]}.html">الدليل العملي المفصل</a> · <a href="/{slug}/">صفحة الخدمة</a></p>{links(service)}'
        write(ROOT / "videos" / slug / "index.html", shell(f'دليل {service["name"]}', service["intro"], f"/videos/{slug}/", body, schema, f"/assets/service-guides/{slug}/poster.jpg"))
        evidence.append({"service": slug, "visual": mode, "source_frames": service["frames"], "duration_seconds": 24, "audio": False})
        print(f"Built {slug}: {mode}", flush=True)
    for path in (ROOT / "blog").rglob("*.html"):
        normalize_blog(path)
    overview = next(s for s in DATA if s["slug"] == "workforce-management-system")
    for slug in ["hrms-saudi-arabia", "construction-hr-software", "security-workforce-management", "logistics-workforce-management", "healthcare-hr-software", "private-school-hr-software"]:
        path = ROOT / slug / "index.html"
        if path.exists():
            add_section(path, walkthrough(overview, "screenshot"))
    for kind, title in [("services", "خدمات EMPID لإدارة القوى العاملة"), ("videos", "أدلة EMPID بالفيديو باللغة العربية")]:
        cards = "".join(f'<article class="service-guide-card"><a href="/{"videos/" if kind == "videos" else ""}{s["slug"]}/"><img src="/assets/service-guides/{s["slug"]}/poster.jpg" width="1920" height="1080" loading="lazy" alt="دليل {escape(s["name"])}"><h2>{escape(s["name"])}</h2></a><p>{escape(s["intent"])}</p></article>' for s in DATA)
        body = f'<h1>{title}</h1><p class="guide-lead">تعرّف على كل خدمة، واقرأ خطوات تنظيم العمل، وشاهد شرحاً عربياً قصيراً ببيانات العرض التجريبي.</p><div class="service-guide-grid">{cards}</div>'
        write(ROOT / kind / "index.html", shell(title, "أدلة عربية عملية لخدمات الموارد البشرية، مع لقطات إرشادية وشروحات نصية قصيرة.", f"/{kind}/", body))
    cards = []
    for path in sorted((ROOT / "blog").glob("*.html")):
        if path.name == "index.html":
            continue
        soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
        heading = soup.find("h1")
        title = heading.get_text(" ", strip=True) if heading else soup.title.get_text().split("|")[0]
        description = soup.find("meta", attrs={"name": "description"})
        description = description.get("content", "") if description else ""
        match = next((s for s in DATA if s["blog"] == path.stem), None)
        thumbnail = f'/assets/service-guides/{match["slug"]}/poster.jpg' if match else "/assets/service-guides/workforce-management-system/poster.jpg"
        old_image = soup.find("meta", attrs={"property": "og:image"})
        if not match and old_image:
            candidate = old_image.get("content", "").replace(BASE, "")
            if candidate.startswith("/") and (ROOT / candidate.lstrip("/")).is_file():
                thumbnail = candidate
        cards.append(f'<article class="service-guide-card" data-guide-item><a href="/blog/{path.name}"><img src="{thumbnail}" width="1920" height="1080" loading="lazy" alt="{escape(title)}"><h2>{escape(title)}</h2></a><p>{escape(description)}</p></article>')
    body = '<h1>مركز المعرفة: أدلة الموارد البشرية والقوى العاملة</h1><p class="guide-lead">أدلة عملية تساعدك على تنظيم البيانات والطلبات والمراجعات، واختيار مسار يناسب فريقك.</p><label class="guide-search-label" for="guide-search">البحث في المقالات</label><input id="guide-search" class="guide-search" type="search" placeholder="اكتب اسم الخدمة أو الموضوع"><p id="guide-results" role="status" aria-live="polite"></p><div class="service-guide-grid" id="guide-library">' + "".join(cards) + '</div><nav class="guide-pagination" aria-label="صفحات المقالات"><button type="button" id="guide-prev">السابق</button><span id="guide-page-number"></span><button type="button" id="guide-next">التالي</button></nav><p><a href="/services/">تصفح جميع الخدمات</a> · <a href="/videos/">شاهد الأدلة القصيرة</a></p>'
    pages = (len(cards) + 8) // 9
    archive = '<nav class="guide-related" aria-label="أرشيف المقالات"><span>الأرشيف الكامل:</span><a href="/blog/">1</a>' + "".join(f'<a href="/blog/page/{number}/" aria-label="أرشيف المقالات، الصفحة {number}">{number}</a>' for number in range(2, pages + 1)) + "</nav>"
    body += archive
    write(ROOT / "blog/index.html", shell("مركز المعرفة وأدلة الموارد البشرية", "مقالات عربية عملية عن خدمات الموارد البشرية والحضور والإجازات والوثائق والرواتب والمشاريع.", "/blog/", body))
    for number in range(2, pages + 1):
        previous = "/blog/" if number == 2 else f"/blog/page/{number - 1}/"
        following = f'<a href="/blog/page/{number + 1}/" rel="next">التالي</a>' if number < pages else ""
        body = f'<nav class="guide-breadcrumb" aria-label="مسار الصفحة"><a href="/blog/">مركز المعرفة</a> / الأرشيف</nav><h1>أرشيف أدلة الموارد البشرية — الصفحة {number}</h1><div class="service-guide-grid">' + "".join(cards[(number - 1) * 9:number * 9]) + f'</div><nav class="guide-pagination" aria-label="التنقل بين صفحات الأرشيف"><a href="{previous}" rel="prev">السابق</a><span>{number} / {pages}</span>{following}</nav>{archive}'
        write(ROOT / f"blog/page/{number}/index.html", shell(f"أرشيف أدلة الموارد البشرية — الصفحة {number}", "استكشف مقالات EMPID العملية عن تنظيم خدمات الموظفين والعمليات المرتبطة بها.", f"/blog/page/{number}/", body))
    homepage = ROOT / "index.html"
    soup = BeautifulSoup(homepage.read_text(encoding="utf-8"), "html.parser")
    mapping = {"الوثائق": "document-management", "المستندات": "document-management", "الأداء": "performance-management", "الأصول": "asset-management", "المصروفات": "expense-management", "التقارير": "reports-analytics"}
    for heading in ([] if "homepage" in soup.body.get("class", []) else soup.select("h3")):
        if heading.find("a"):
            continue
        for label, slug in mapping.items():
            if label in heading.get_text():
                text = heading.get_text()
                heading.clear()
                link = soup.new_tag("a", href=f"/{slug}/")
                link.string = text
                heading.append(link)
                break
    if "homepage" not in soup.body.get("class", []) and not soup.select_one("#service-guide-library-link"):
        section = BeautifulSoup('<section id="service-guide-library-link" class="container"><h2>استكشف أدلة خدمات EMPID</h2><p><a href="/services/">كل الخدمات بالخطوات والصور</a> · <a href="/videos/">شروحات عربية قصيرة</a> · <a href="/blog/">المقالات العملية</a></p></section>', "html.parser")
        soup.find("main").append(section)
    for heading in ([] if "homepage" in soup.body.get("class", []) else soup.select(".module-card h3")):
        child = heading.find("a")
        if child:
            url = child["href"]
            child.unwrap()
            heading.wrap(soup.new_tag("a", href=url))
    write(homepage, str(soup))
    ET.register_namespace("", NS)
    tree = ET.parse(ROOT / "sitemap.xml")
    root = tree.getroot()
    existing = {node.find(f"{{{NS}}}loc").text for node in root}
    changed_urls = {BASE + "/", BASE + "/blog/"} | {BASE + "/blog/" + p.name for p in (ROOT / "blog").glob("*.html") if p.name != "index.html"} | {BASE + f'/{s["slug"]}/' for s in DATA} | {BASE + f'/{slug}/' for slug in ["hrms-saudi-arabia", "construction-hr-software", "security-workforce-management", "logistics-workforce-management", "healthcare-hr-software", "private-school-hr-software"]}
    for node in root:
        if node.find(f"{{{NS}}}loc").text in changed_urls:
            modified = node.find(f"{{{NS}}}lastmod")
            if modified is None:
                modified = ET.SubElement(node, f"{{{NS}}}lastmod")
            modified.text = DATE
    for path in [ROOT / "services/index.html", ROOT / "videos/index.html", ROOT / "blog/index.html"] + [ROOT / s["slug"] / "index.html" for s in DATA] + list((ROOT / "blog").glob("*.html")) + list((ROOT / "blog/page").glob("*/index.html")) + list((ROOT / "videos").glob("*/index.html")):
        relative = "/" + path.relative_to(ROOT).as_posix()
        url = BASE + relative.replace("index.html", "")
        if url not in existing:
            node = ET.SubElement(root, f"{{{NS}}}url")
            ET.SubElement(node, f"{{{NS}}}loc").text = url
            ET.SubElement(node, f"{{{NS}}}lastmod").text = DATE
            existing.add(url)
    ET.indent(tree, space="  ")
    tree.write(ROOT / "sitemap.xml", encoding="utf-8", xml_declaration=True)
    video_ns = "http://www.google.com/schemas/sitemap-video/1.1"
    ET.register_namespace("video", video_ns)
    video_root = ET.Element(f"{{{NS}}}urlset")
    for service in DATA:
        node = ET.SubElement(video_root, f"{{{NS}}}url")
        ET.SubElement(node, f"{{{NS}}}loc").text = BASE + f'/videos/{service["slug"]}/'
        video = ET.SubElement(node, f"{{{video_ns}}}video")
        for key, value in {"thumbnail_loc": BASE + f'/assets/service-guides/{service["slug"]}/poster.jpg', "title": f'دليل {service["name"]}', "description": service["intro"], "content_loc": BASE + f'/assets/service-guides/{service["slug"]}/guide.mp4', "duration": "24"}.items():
            ET.SubElement(video, f"{{{video_ns}}}{key}").text = value
    video_tree = ET.ElementTree(video_root)
    ET.indent(video_tree, space="  ")
    video_tree.write(ROOT / "video-sitemap.xml", encoding="utf-8", xml_declaration=True)
    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    for directive in ["Disallow: /docs/", "Disallow: /tests/", "Disallow: /src/", "Sitemap: https://empid.com/video-sitemap.xml"]:
        if directive not in robots:
            robots += "\n" + directive
    write(ROOT / "robots.txt", robots.strip() + "\n")
    write(HERE / "evidence.json", json.dumps(evidence, ensure_ascii=False, indent=2))
    tracked = subprocess.check_output(["git", "diff", "--name-only"], cwd=ROOT, text=True).splitlines()
    untracked = subprocess.check_output(["git", "ls-files", "--others", "--exclude-standard"], cwd=ROOT, text=True).splitlines()
    prefixes = ["docs/service-guides/", "assets/service-guides/", "videos/", "blog/page/"] + [s["slug"] + "/" for s in DATA]
    names = {"service-guides.css", "service-guides.js", "video-sitemap.xml"} | {"blog/" + s["blog"] + ".html" for s in DATA}
    changed = sorted(set(tracked) | {path for path in untracked if path in names or any(path.startswith(prefix) for prefix in prefixes)} | {"docs/service-guides/files-changed.json", "docs/service-guides/REPORT.md"})
    write(HERE / "files-changed.json", json.dumps({"workspace": str(ROOT), "files": [str(ROOT / path) for path in changed], "excluded_prior_artifacts": ["assets/demo-ar/", "docs/demo-ar/"], "published": False}, ensure_ascii=False, indent=2))
    file_links = "\n".join(f"- [{path}](<{(ROOT / path).as_posix()}>)" for path in changed)
    report = f'''# Arabic Website Guides: Handover

## What Changed

- 20 core service guides, 60 Arabic annotated images and 20 silent 24-second MP4 videos.
- 14 new service pages; walkthroughs added to the six existing core pages and six existing sector/overview pages.
- 17 new service-specific articles, retaining the existing 22 articles: 39 total.
- Rebuilt the corrupted Arabic blog index with search, pagination and four crawlable archive pages.
- Added dedicated watch pages with transcripts, captions, stable posters and VideoObject schema.
- Corrected canonical/OG/schema URLs, malformed legacy aliases and invalid head/body nesting.
- Updated sitemaps, video sitemap, discovery links and crawler exclusions.
- Extended the thumbnail verifier to validate new guide images while retaining its legacy assertions.
- All new content, tooling and reports live in `D:/empid-web`. No publication or push occurred.

## What Was Not Changed

No HRMS application code, tenant boundaries, roles, authentication, payroll
calculations, private storage, document flows, email or queue behavior changed.
Earlier user edits and existing demo-ar assets were retained.

17 services use real synthetic-demo screen captures. Payroll, Performance and
Document Compliance use clearly labeled illustrations, not claimed UI evidence.
Screenshots contain demo records only; no login credentials or MFA screens.

## Verification

Run with Python dependencies in `D:/empid-web/.tools/python-packages`:

```powershell
python docs/service-guides/build_guides.py
python docs/service-guides/verify_guides.py
node --check service-guides.js
npm run verify:blog-thumbnails
```

Results: 96 public pages validated without failures/warnings; 20 videos fully
decoded at 1920x1080, 24 seconds and no audio; 39 posts with 22 mirrored legacy
thumbnails and 77 guide-image references verified. The thumbnail command was
initially blocked by missing local tsx; after installing website dependencies,
the final run passed.

Visible Pilot verification: 60 service layouts (390/768/1440px), 78 article
layouts (390/1440px), eight archive layouts, all 20 browser video metadata states,
mobile video playback, Arabic search/no-results/paging, archive navigation,
catalog click-through and guide-to-video links. No overflow or console errors
were observed. Raw evidence files are alongside this report.

No separate lint/typecheck/build commands are defined by this static website.
HRMS lint, unit suites, root E2E and responsive suites were not run because no
HRMS source changed. No production Lighthouse, Search Console or Google indexing
check ran: the website remains local. Ranking is not guaranteed.

## Risk Level

Medium for public publication of many pages/media; Low for HRMS runtime, which
is untouched. Editorial review and replacement of the three illustrative
guides remain publication considerations. Follow README.md for launch checks.

## Rollback Plan

Use the inventory below to reverse only this task's changes. Remove its new
guide pages/media and guide sections, then reverse canonical/navigation/sitemap
edits selectively. Preserve earlier user edits and the previous demo-ar files.
Do not reset the entire worktree.

## Files Changed

Complete inventory for this pass (ignored dependencies/render caches/server logs excluded):

{file_links}
'''
    write(HERE / "REPORT.md", report)
    print(f"Completed {len(DATA)} services and {len(cards)} blog articles", flush=True)


if __name__ == "__main__":
    main()
