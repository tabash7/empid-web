"""Build the marketing homepage without modifying the running HRMS application."""
from pathlib import Path
import json
from html import escape
from bs4 import BeautifulSoup
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
TITLE = "EMPID | نظام الموارد البشرية وإدارة القوى العاملة"
DESCRIPTION = "اكتشف EMPID لإدارة الموظفين والحضور والإجازات والرواتب والوثائق. شاهد عرضاً عربياً وصوراً من النظام، واستكشف أدلة الخدمات أو اطلب عرضاً يناسب شركتك."

def copy(ar, en):
    return f'<span class="lang-content lang-ar">{escape(ar)}</span><span class="lang-content lang-en" hidden>{escape(en)}</span>'

def heading(ar, en, tag="h2"):
    return f'<{tag}>{copy(ar, en)}</{tag}>'

def link(url, ar, en, cls=""):
    return f'<a href="{url}" class="{cls}">{copy(ar, en)}</a>'

def build():
    soup = BeautifulSoup((ROOT / "index.html").read_text(encoding="utf-8"), "html.parser")
    form = soup.select_one("#contact-form")
    form.attrs["class"] = ["contact-form"]
    for node in form.select(".reveal"):
        node["class"] = [c for c in node.get("class", []) if c != "reveal"]
    services = json.loads((ROOT / "docs/service-guides/services.json").read_text(encoding="utf-8"))
    english = ["Employee records", "Attendance", "Leave & approvals", "Payroll & payslips", "Document management", "Performance", "Assets", "Expenses", "Reports & analytics", "Employee self-service", "Workforce management", "Projects", "Tasks", "Time tracking", "Contracts", "Benefits", "Onboarding", "Shift management", "Notifications", "Document compliance"]
    # Use the original synthetic pilot capture, not a fabricated dashboard.
    output = ROOT / "assets/homepage"
    output.mkdir(parents=True, exist_ok=True)
    with Image.open(ROOT / "docs/demo-ar/frames/01-dashboard.png") as image:
        image.convert("RGB").save(output / "dashboard.webp", "WEBP", quality=88)
        width, height = image.size
    workflows = [
        ("employee-management", "ملف واحد للموظف", "One employee record", "اربط بيانات العمل والوثائق والخدمات بملف يمكن الرجوع إليه.", "Connect work information, documents and related services in one record."),
        ("attendance-management", "رؤية أوضح ليوم العمل", "A clearer working day", "راجع الحضور والأوقات والاستثناءات مع تقويم وسجل تفصيلي.", "Review attendance, times and exceptions with a calendar and detailed history."),
        ("leave-management", "طلب واضح وقرار موثّق", "Clear requests, recorded decisions", "تابع نوع الإجازة والفترة والرصيد ومسار المراجعة.", "Follow leave type, dates, balance and the review workflow."),
    ]
    flow = "".join(f'<article class="home-workflow"><a href="/{slug}/"><img src="/assets/service-guides/{slug}/step-1.webp" width="1920" height="1080" loading="lazy" alt="{escape(ar)} — مثال من بيانات العرض التجريبي">{heading(ar, en, "h3")}</a><p>{copy(desc, desc_en)}</p>{link(f"/{slug}/", "استكشف الخدمة ←", "Explore the service →", "home-text-link")}</article>' for slug, ar, en, desc, desc_en in workflows)
    service_links = "".join(link(f'/{service["slug"]}/', service["name"], english[index], "home-service-link") for index, service in enumerate(services))
    articles = ""
    for service, en, desc in [(services[0], "What belongs in an employee record?", "Organize essential employee information and clarify who maintains it."), (services[1], "How to review attendance exceptions", "Understand working hours, company timezone and the details behind attendance records."), (services[2], "From leave request to decision", "Review balances, dates and approval responsibilities with a practical example.")]:
        url = f'/blog/{service["blog"]}.html'
        articles += f'<article class="home-article"><p class="home-kicker">{copy("دليل عملي", "Practical guide")}</p>{heading(service["topic"], en, "h3")}<p>{copy(service["intro"][:170] + "…", desc)}</p>{link(url, "اقرأ الدليل ←", "Read the Arabic guide →", "home-text-link")}</article>'
    faqs = [
        ("ما هو EMPID؟", "What is EMPID?", "EMPID منصة لإدارة الموارد البشرية والقوى العاملة، تربط ملفات الموظفين بالحضور والإجازات والوثائق والرواتب والمشاريع والخدمات المرتبطة بها.", "EMPID is a workforce and HR platform connecting employee records with attendance, leave, documents, payroll, projects and related services."),
        ("هل يدعم العربية والإنجليزية؟", "Does it support Arabic and English?", "يدعم النظام واجهة عربية من اليمين إلى اليسار وواجهة إنجليزية. يمكنك مشاهدة أمثلة عربية حقيقية من بيئة العرض في أدلة الخدمات.", "The application supports Arabic RTL and English interfaces. The service guides show Arabic examples captured from the demo environment."),
        ("كيف تعمل صلاحيات المستخدمين؟", "How do user permissions work?", "يرتبط الوصول بدور المستخدم ونطاقه داخل مساحة العمل. يختلف ما يستطيع الموظف أو المدير أو مسؤول الشركة عرضه وتنفيذه بحسب الصلاحيات المعتمدة.", "Access depends on a user's role and scope within the workspace. Employee, manager and administrator actions depend on the configured permissions."),
        ("هل الأسماء والأرقام في العرض بيانات عملاء؟", "Is the demo showing customer data?", "لا. الصور والفيديو تستخدم شركة وموظفين وبيانات تجريبية مصطنعة، ولا تمثل بيانات عملاء أو نتائج مضمونة.", "No. Images and video use fictional company, employee and pilot data. They are not customer data or guaranteed outcomes."),
        ("كيف أختار الخدمات المناسبة لشركتي؟", "How do I choose the right services?", "ابدأ بالخدمات الأساسية لفريقك، وراجع عدد الموظفين ومسارات الموافقات والسياسات الحالية. اطلب عرضاً لمناقشة احتياجاتك والتكلفة والتكاملات قبل اتخاذ القرار.", "Start with your team's core workflows, employee count, approval paths and policies. Request a demo to discuss requirements, pricing and integrations before deciding."),
    ]
    faq_html = "".join(f'<details><summary>{copy(ar, en)}</summary><p>{copy(answer, answer_en)}</p></details>' for ar, en, answer, answer_en in faqs)
    main = f'''<main id="main-content">
    <section class="home-hero" id="home"><div class="container">
      <p class="home-kicker">{copy("إدارة الموارد البشرية والقوى العاملة", "Human resources & workforce management")}</p>
      <h1><b dir="ltr">EMPID</b><br>{copy("نظام الموارد البشرية لشركتك", "HR software for your workforce")}</h1>
      <p class="home-lead">{copy("من ملف الموظف إلى يوم العمل. اجمع الحضور والإجازات والوثائق والرواتب في مسارات مترابطة، مع رؤية واضحة لكل دور.", "From employee records to the working day. Bring attendance, leave, documents and payroll into connected workflows, with clarity for every role.")}</p>
      <div class="home-actions">{link("#contact", "اطلب عرضاً لشركتك", "Request your demo", "btn btn-primary")}{link("#demo", "شاهد النظام بالعربية", "Watch the Arabic demo", "btn btn-secondary")}</div>
      <figure class="home-product"><img src="/assets/homepage/dashboard.webp" width="{width}" height="{height}" fetchpriority="high" alt="لوحة تحكم EMPID بالعربية — بيانات تجريبية مصطنعة"><figcaption>{copy("صورة من النظام • شركة وبيانات تجريبية مصطنعة", "Actual application capture • fictional company and pilot data")}</figcaption></figure>
    </div></section>
    <section class="home-context"><div class="container"><p>{copy("منصة واحدة. أدوار واضحة. عمل مترابط.", "One platform. Clear roles. Connected work.")}</p><div>{copy("الموظف · المدير · الموارد البشرية · المالية", "Employee · Manager · HR · Finance")}</div></div></section>
    <section class="home-section" id="solution"><div class="container"><div class="home-section-heading">{heading("ابدأ بالعمليات التي يعيشها فريقك كل يوم", "Start with your team's everyday workflows")}<p>{copy("استكشف الخطوات والتفاصيل من داخل النظام، قبل اختيار ما يناسب شركتك.", "Explore workflows and details inside the application before choosing what fits your business.")}</p></div><div class="home-workflows">{flow}</div></div></section>
    <section class="home-section home-band" id="features"><div class="container"><div class="home-section-heading">{heading("خدمات متصلة حول ملف الموظف", "Connected services around the employee record")}<p>{copy("تصفح كل خدمة مع صور إرشادية وخطوات عملية وفيديو عربي قصير.", "Browse each service with guided screenshots, practical steps and a short Arabic video.")}</p></div><div class="home-services">{service_links}</div><div class="home-actions">{link("/services/", "تصفح جميع أدلة الخدمات", "Browse all service guides", "btn btn-secondary")}</div></div></section>
    <section class="home-section" id="security"><div class="container home-security"><div>{heading("الوصول المناسب لكل مسؤولية", "Access that matches responsibility")}<p>{copy("ملفات الموظفين تحتاج إلى حدود واضحة، وليس مجرد شاشة جميلة. راجع أدوار فريقك ونطاق الوصول ومسارات الموافقات أثناء إعداد مساحة العمل.", "Employee information needs clear boundaries, not just a polished screen. Review roles, access scopes and approval workflows when setting up your workspace.")}</p>{link("/security-workforce-management/", "تعرف على إدارة الوصول والصلاحيات", "Explore access and permissions", "home-text-link")}</div><dl><div><dt>{copy("مساحة العمل", "Workspace")}</dt><dd>{copy("بيانات مرتبطة بالشركة ونطاق المستخدم.", "Information scoped to the company and authorized user.")}</dd></div><div><dt>{copy("الأدوار والصلاحيات", "Roles & permissions")}</dt><dd>{copy("تمييز القراءة عن التعديل والمراجعة والاعتماد.", "Separate viewing, editing, reviewing and approval.")}</dd></div><div><dt>{copy("الوثائق الخاصة", "Private documents")}</dt><dd>{copy("الوصول إلى الملف يمر عبر التحقق من الصلاحيات.", "File access passes through authorization checks.")}</dd></div></dl></div></section>
    <section class="home-section home-band" id="demo"><div class="container"><div class="home-section-heading">{heading("شاهد EMPID أثناء العمل", "See EMPID in action")}<p>{copy("جولة عربية بصوت توضيحي عبر الموظفين والحضور والإجازات والموافقات والمشاريع والوثائق. جميع البيانات مصطنعة لأغراض العرض.", "An Arabic narrated tour through employee records, attendance, leave, approvals, projects and documents. All data is fictional and used for demonstration.")}</p></div><video controls playsinline preload="none" poster="/assets/demo-ar/empid-ar-demo-poster.jpg" aria-label="EMPID — عرض توضيحي عربي"><source src="/assets/demo-ar/empid-ar-demo.mp4" type="video/mp4"><track kind="captions" src="/assets/demo-ar/empid-ar-demo.vtt" srclang="ar" label="العربية" default></video><div class="home-actions">{link("/videos/", "شاهد شرحاً قصيراً لكل خدمة", "Watch short service walkthroughs", "home-text-link")}</div></div></section>
    <section class="home-section" id="knowledge"><div class="container"><div class="home-section-heading">{heading("أدلة تساعدك على تنظيم العمل", "Guides for better organized work")}{link("/blog/", "تصفح مركز المعرفة ←", "Explore the knowledge hub →", "home-text-link")}</div><div class="home-articles">{articles}</div></div></section>
    <section class="home-section home-band" id="faq"><div class="container home-faq">{heading("أسئلة قبل أن تبدأ", "Before you get started")}<div>{faq_html}</div></div></section>
    <section class="home-section" id="contact"><div class="container contact-grid"><div class="section-copy"><p class="home-kicker">{copy("الخطوة التالية", "Your next step")}</p>{heading("لنناقش احتياجات شركتك", "Let's discuss your business")}<p>{copy("أخبرنا بحجم فريقك والخدمات التي تحتاجها. سنناقش معك النطاق المناسب والتكلفة وخطوات الإعداد في عرض مخصص.", "Tell us your team size and the services you need. We'll discuss scope, pricing and setup in a tailored demonstration.")}</p><p class="home-note">{copy("لا ترسل كلمات مرور أو وثائق موظفين في هذا النموذج.", "Do not send passwords or employee documents through this form.")}</p></div>{form}</div></section>
    </main>'''
    soup.find("main").replace_with(BeautifulSoup(main, "html.parser"))
    soup.body["class"] = ["homepage"]
    # Preserve deep links from existing service pages without recreating SEO filler.
    for fragment, section in [("modules", "features"), ("industries", "features"), ("local-seo", "features"), ("pricing", "contact"), ("problems", "solution")]:
        anchor = soup.new_tag("span", id=fragment)
        soup.find(id=section).insert(0, anchor)
    security_link = soup.select_one('#security a')
    security_link["href"] = "/document-management/"
    security_link.clear()
    security_link.append(BeautifulSoup(copy("تعرف على إدارة الوثائق والوصول إليها", "Explore document management and access"), "html.parser"))
    script = soup.find("script", src=lambda value: value and value.startswith("script.js"))
    script["src"] = "script.js?v=20261005-homepage"
    skip = soup.new_tag("a", href="#main-content", attrs={"class": "home-skip"})
    skip.append(BeautifulSoup(copy("انتقل إلى المحتوى", "Skip to content"), "html.parser"))
    old_skip = soup.select_one(".home-skip")
    if old_skip:
        old_skip.decompose()
    soup.body.insert(0, skip)
    nav = soup.select_one(".nav-links")
    nav.clear()
    for url, ar, en in [("#solution", "طريقة العمل", "Workflows"), ("#features", "الخدمات", "Services"), ("#security", "الصلاحيات", "Permissions"), ("#demo", "العرض", "Demo"), ("/blog/", "مركز المعرفة", "Guides")]:
        nav.append(BeautifulSoup(link(url, ar, en), "html.parser"))
    for node in soup.select('a[href="https://www.linkedin.com/"]'):
        node.decompose()
    footer_links = soup.select_one(".footer-links")
    footer_links.clear()
    for url, ar, en in [("/privacy.html", "الخصوصية", "Privacy"), ("/terms.html", "الشروط", "Terms"), ("/services/", "أدلة الخدمات", "Service guides"), ("/blog/", "مركز المعرفة", "Knowledge hub"), ("#contact", "تواصل معنا", "Contact us")]:
        footer_links.append(BeautifulSoup(link(url, ar, en), "html.parser"))
    latest = soup.select_one(".footer-latest")
    latest.clear()
    latest.append(BeautifulSoup(heading("استكشف EMPID", "Explore EMPID"), "html.parser"))
    for url, ar, en in [("/employee-management/", "ملفات الموظفين", "Employee records"), ("/attendance-management/", "الحضور والانصراف", "Attendance"), ("/videos/", "الشروحات العربية", "Arabic walkthroughs")]:
        latest.append(BeautifulSoup(link(url, ar, en), "html.parser"))
    for node in soup.select('link[hreflang], script[type="application/ld+json"]'):
        node.decompose()
    soup.title.string = TITLE
    soup.title.attrs.pop("data-i18n", None)
    for attr, key, value in [("name", "description", DESCRIPTION), ("property", "og:title", TITLE), ("property", "og:description", DESCRIPTION), ("name", "twitter:title", TITLE), ("name", "twitter:description", DESCRIPTION), ("property", "og:image", "https://www.empid.com/assets/service-guides/workforce-management-system/poster.jpg"), ("name", "twitter:image", "https://www.empid.com/assets/service-guides/workforce-management-system/poster.jpg"), ("property", "og:image:alt", "EMPID — دليل إدارة القوى العاملة بالعربية")]:
        soup.find("meta", attrs={attr: key})["content"] = value
    for old_style in soup.select('link[href^="/homepage.css"]'):
        old_style.decompose()
    soup.head.append(soup.new_tag("link", rel="stylesheet", href="/homepage.css?v=20261005-2"))
    schema = {"@context": "https://schema.org", "@graph": [
        {"@type": "Organization", "@id": "https://www.empid.com/#organization", "name": "EMPID", "url": "https://www.empid.com/", "logo": "https://www.empid.com/assets/EMPID_Icon.png"},
        {"@type": "WebSite", "@id": "https://www.empid.com/#website", "name": "EMPID", "url": "https://www.empid.com/", "publisher": {"@id": "https://www.empid.com/#organization"}},
        {"@type": "WebPage", "@id": "https://www.empid.com/#webpage", "url": "https://www.empid.com/", "name": TITLE, "description": DESCRIPTION, "inLanguage": "ar", "isPartOf": {"@id": "https://www.empid.com/#website"}},
        {"@type": "SoftwareApplication", "name": "EMPID", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "url": "https://www.empid.com/", "description": DESCRIPTION},
    ]}
    node = soup.new_tag("script", type="application/ld+json")
    node.string = json.dumps(schema, ensure_ascii=False)
    soup.head.append(node)
    (ROOT / "index.html").write_text(str(soup), encoding="utf-8")

if __name__ == "__main__":
    build()
