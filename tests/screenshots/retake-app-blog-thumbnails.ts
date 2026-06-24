import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

type Mapping = Record<string, string[]>;

const BLOG_DIR = path.join(process.cwd(), "blog");

const BLOG_TO_ROUTE_MAP: Mapping = {
  "attendance-management-system": ["/attendance"],
  "best-hrms-saudi-arabia": ["/dashboard"],
  "construction-attendance": ["/attendance"],
  "construction-site-shift-handover": ["/team/attendance", "/team"],
  "employee-lifecycle-onboarding-offboarding": ["/team", "/organization/teams"],
  "employee-self-service": ["/team", "/attendance"],
  "employee-self-service-advanced-requests": ["/tasks", "/team"],
  "how-to-choose-hrms": ["/dashboard"],
  "hrms-go-live-checklist": ["/workforce-command-center", "/dashboard"],
  "hrms-vs-excel": ["/workforce-command-center", "/dashboard"],
  "leave-balance-forecasting": ["/leave"],
  "leave-management": ["/leave"],
  "multi-branch-employee-management": ["/organization/teams", "/team"],
  "multi-branch-workforce-standardization": ["/workforce-command-center", "/dashboard"],
  "night-shift-safety-attendance": ["/attendance", "/team/attendance"],
  "payroll-cost-center-control": ["/workforce-command-center", "/dashboard"],
  "payroll-errors": ["/approvals", "/workforce-command-center"],
  "remote-team-attendance-guidelines": ["/attendance", "/team/attendance"],
  "role-based-access-control-hrms": ["/profile/settings", "/dashboard"],
  "security-incident-checklist-for-attendance": ["/team/attendance", "/attendance"],
  "security-workforce-management": ["/team", "/organization/teams"],
  "workforce-analytics-kpi-dashboard": ["/workforce-command-center", "/dashboard"]
};

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    args.set(key, value);
  }
  return args;
}

async function readBlogSlugs(blogDir: string) {
  const files = await fs.readdir(blogDir, { withFileTypes: true });
  return files
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html") && entry.name.toLowerCase() !== "index.html")
    .map((entry) => entry.name.replace(/\.html$/i, ""))
    .sort((a, b) => a.localeCompare(b));
}

async function verifyBlogScreenshots() {
  const files = await readBlogSlugs(BLOG_DIR);
  const screenshotPattern = /(?:https?:\/\/[^"']+)?\/assets\/blog-screenshots\/([a-z0-9-]+\.jpg)\b/gi;
  const referenced = new Set<string>();
  const missingReferences = new Map<string, string>();

  for (const slug of files) {
    const content = await fs.readFile(path.join(BLOG_DIR, `${slug}.html`), "utf8");
    let m: RegExpExecArray | null;
    let found = false;
    screenshotPattern.lastIndex = 0;
    while ((m = screenshotPattern.exec(content)) !== null) {
      referenced.add(m[1]);
      found = true;
    }
    if (!found) {
      missingReferences.set(slug, "no screenshot reference found");
    }
  }

  const outDirs = [
    path.join(process.cwd(), "public/assets/blog-screenshots"),
    path.join(process.cwd(), "assets/blog-screenshots")
  ];

  const expected = [...referenced].sort((a, b) => a.localeCompare(b));
  const screenshots1 = (await fs.readdir(outDirs[0])).filter((f) => f.toLowerCase().endsWith(".jpg")).sort((a, b) => a.localeCompare(b));
  const screenshots2 = (await fs.readdir(outDirs[1])).filter((f) => f.toLowerCase().endsWith(".jpg")).sort((a, b) => a.localeCompare(b));

  let ok = true;
  console.log(`Blog posts checked: ${files.length}`);
  console.log(`Referenced thumbnails: ${expected.length}`);
  console.log(`public/assets/blog-screenshots: ${screenshots1.length}`);
  console.log(`assets/blog-screenshots: ${screenshots2.length}`);
  console.log("----");

  const missing1 = expected.filter((name) => !screenshots1.includes(name));
  const missing2 = expected.filter((name) => !screenshots2.includes(name));
  const extra1 = screenshots1.filter((name) => !referenced.has(name));
  const extra2 = screenshots2.filter((name) => !referenced.has(name));

  if (missing1.length) {
    ok = false;
    console.log("Missing in public/assets/blog-screenshots:");
    for (const f of missing1) console.log(`- ${f}`);
  }
  if (missing2.length) {
    ok = false;
    console.log("Missing in assets/blog-screenshots:");
    for (const f of missing2) console.log(`- ${f}`);
  }
  if (extra1.length) {
    ok = false;
    console.log("Unreferenced in public/assets/blog-screenshots:");
    for (const f of extra1) console.log(`- ${f}`);
  }
  if (extra2.length) {
    ok = false;
    console.log("Unreferenced in assets/blog-screenshots:");
    for (const f of extra2) console.log(`- ${f}`);
  }
  if (missingReferences.size) {
    ok = false;
    console.log("Posts with no screenshot ref:");
    for (const [slug, reason] of missingReferences.entries()) console.log(`${slug}.html (${reason})`);
  }

  if (!ok) {
    console.log("Result: FAILED");
    process.exit(1);
  }
  console.log("Result: OK");
  process.exit(0);
}

function normalizeBase(base: string) {
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function login(page: Page, baseUrl: string, username: string, password: string) {
  const loginUrl = `${normalizeBase(baseUrl)}/login`;
  await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.fill("#email-address", username);
  await page.fill("#password", password);
  await page.locator("button[type='submit']").first().click();
  await page.waitForTimeout(1200);
}

async function setLanguageToArabic(page: Page, baseUrl: string) {
  await page.goto(`${normalizeBase(baseUrl)}/profile/settings`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(900);

  const selects = page.locator("select");
  const selectCount = await selects.count();
  let languageSelect: any = null;

  for (let i = 0; i < selectCount; i++) {
    const selectLocator = selects.nth(i);
    const hasArabicOption = await selectLocator.evaluate((element) => {
      return Array.from(element.options).some(
        (option) =>
          option.value === "ar" ||
          (option.textContent || "").toLowerCase().includes("arabic") ||
          (option.textContent || "").toLowerCase().includes("العربية")
      );
    });
    const hasLanguageLabel = await selectLocator
      .locator("xpath=ancestor::*[contains(@class, 'MuiFormControl-root')][1]")
      .locator("xpath=preceding-sibling::* | .//preceding::*")
      .filter({ hasText: /Language|اللغة/i })
      .count()
      .then((count) => count > 0);

    if (hasArabicOption && (hasLanguageLabel || selectCount === 1)) {
      languageSelect = selectLocator;
      break;
    }
  }

  if (!languageSelect) {
    for (let i = 0; i < selectCount; i++) {
      const selectLocator = selects.nth(i);
      const hasArabicOption = await selectLocator.evaluate((element) => {
        return Array.from(element.options).some(
          (option) => option.value === "ar" || (option.textContent || "").toLowerCase().includes("العربية")
        );
      });
      if (hasArabicOption) {
        languageSelect = selectLocator;
        break;
      }
    }
  }

  if (languageSelect) {
    await languageSelect.selectOption({ value: "ar" }).catch(() => {});
    await page.waitForTimeout(900);
  }

  const saveBtn = page
    .locator("button")
    .filter({ hasText: /Save Changes/i })
    .or(page.locator("button:has-text('Save Changes'), [type='submit']"))
    .first();
  if (await saveBtn.count()) {
    await saveBtn.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }
}

async function isRouteUsable(page: Page) {
  const h1 = (await page.locator("h1").first().textContent().catch(() => "")).toLowerCase();
  const body = (await page.locator("body").innerText().catch(() => "")).toLowerCase();
  return !/(^|\\b)(404|403|not found|unauthorized)(\\b|$)/i.test(`${h1} ${body}`) && h1.trim().length > 0;
}

function chooseRoute(slug: string) {
  return BLOG_TO_ROUTE_MAP[slug] ?? ["/dashboard"];
}

async function capturePage(page: Page, baseUrl: string, route: string) {
  await page.goto(`${normalizeBase(baseUrl)}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(900);
  await page.setViewportSize({ width: 1440, height: 768 });
  await page.evaluate(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.style.direction = "rtl";
  });

  return isRouteUsable(page);
}

async function writeScreenshot(page: Page, slug: string, outDirs: string[]) {
  const filename = `${slug}.jpg`;
  const tempPath = path.join(outDirs[0], filename);
  const buffer = await page.screenshot({ path: tempPath, type: "jpeg", quality: 72, fullPage: false });
  for (let i = 1; i < outDirs.length; i++) {
    await fs.copyFile(tempPath, path.join(outDirs[i], filename));
  }
  return buffer.length;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const base = args.get("base") || "http://localhost:5173";
  const username = args.get("username") || "amina.haddad@empid.test";
  const password = args.get("password") || "demo789";
  if (args.has("verify-only") || args.get("mode") === "verify") {
    await verifyBlogScreenshots();
    return;
  }
  const outputDirs = [
    args.get("primaryOut") || path.join(process.cwd(), "public/assets/blog-screenshots"),
    args.get("secondaryOut") || path.join(process.cwd(), "assets/blog-screenshots")
  ];

  for (const dir of outputDirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  const slugs = await readBlogSlugs(BLOG_DIR);
  const fallbackRoutes = ["/dashboard", "/workforce-command-center", "/attendance", "/leave", "/team", "/team/attendance", "/approvals"];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  let ok = 0;
  let failed = 0;

  try {
    await login(page, base, username, password);
    await setLanguageToArabic(page, base);
    const loggedInUrl = page.url();
    console.log("Logged in:", loggedInUrl);

    for (const slug of slugs) {
      const mapped = chooseRoute(slug);
      let usedRoute = "";
      let captured = false;
      let bytes = 0;

      for (const route of [...mapped, ...fallbackRoutes]) {
        usedRoute = route;
        const routeWorks = await capturePage(page, base, route);
        if (!routeWorks) continue;
        try {
          bytes = await writeScreenshot(page, slug, outputDirs);
          captured = true;
          break;
        } catch {
          bytes = 0;
          continue;
        }
      }

      if (captured) {
        ok++;
        console.log(`OK ${slug} -> ${usedRoute} (${bytes} bytes)`);
      } else {
        failed++;
        console.log(`FAIL ${slug} -> no usable app route`);
      }
    }

    console.log(`Summary: ${ok} passed, ${failed} failed, total ${slugs.length}`);
  } finally {
    await browser.close();
  }
})();
