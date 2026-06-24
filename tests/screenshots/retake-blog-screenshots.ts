import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

type BlogItem = {
  slug: string;
  expectedHeading: string;
};

type Result =
  | {
      slug: string;
      status: "ok";
      route: string;
      heading: string;
      accessible: boolean;
      bytes: number;
    }
  | {
      slug: string;
      status: "failed";
      route: string;
      reason: string;
    };

const DEFAULT_BASE_URL = "http://localhost:5173";
const LOGIN_PATH = "/login";

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, v] = arg.slice(2).split("=", 2);
    out[k] = v ?? "true";
  }
  return out;
}

function cleanText(input: string) {
  return (input || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readBlogItems(blogDir: string): Promise<BlogItem[]> {
  const files = await fs.readdir(blogDir, { withFileTypes: true });
  const items: BlogItem[] = [];

  for (const entry of files
    .filter((f) => f.isFile() && f.name.toLowerCase().endsWith(".html") && f.name.toLowerCase() !== "index.html")
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const slug = entry.name.replace(/\.html$/i, "");
    const filePath = path.join(blogDir, entry.name);
    const html = await fs.readFile(filePath, "utf8");
    const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const expectedHeading = cleanText(headingMatch?.[1] || slug.replace(/-/g, " "));
    items.push({ slug, expectedHeading: expectedHeading.slice(0, 120) });
  }

  return items;
}

function buildRoutes(slug: string): string[] {
  return [
    `/blog/${slug}.html`,
    `/blog/${slug}/`,
    `/blog/${slug}/index.html`
  ];
}

function likelySameBlogPath(pathname: string, slug: string) {
  const p = (pathname || "").toLowerCase();
  const s = slug.toLowerCase();
  return p === `/blog/${s}` || p === `/blog/${s}.html` || p === `/blog/${s}/` || p === `/blog/${s}/index.html` || p.startsWith(`/blog/${s}/`);
}

async function setArabicAndStable(page: any) {
  await page.evaluate(() => {
    try {
      localStorage.setItem("empid-language", "ar");
    } catch {}
    document.documentElement.setAttribute("lang", "ar");
    document.documentElement.setAttribute("dir", "rtl");
  });
  await page.setViewportSize({ width: 1440, height: 2000 });
}

async function login(page: any, baseUrl: string, username?: string, password?: string) {
  const loginUrl = `${baseUrl.replace(/\/$/, "")}${LOGIN_PATH}`;
  await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

  const email = page.locator("#email-address, input[name='email'], input[type='email']");
  const pass = page.locator("#password, input[name='password'], input[type='password']");
  const submit = page.locator("button[type='submit'], [data-tour='login-submit'], [data-tour='auth-submit']");

  if (await email.count()) {
    if (username) await email.first().fill(username);
  }
  if (await pass.count()) {
    if (password) await pass.first().fill(password);
  }
  if (await submit.count()) {
    await submit.first().click({ timeout: 8000 }).catch(() => undefined);
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  }
}

function isLikely404Text(text: string) {
  const t = (text || "").toLowerCase();
  return t.includes("404") || t.includes("not found") || t.includes("page not found") || t.includes("??? ?????");
}

async function capture(item: BlogItem, baseUrl: string, page: any, outputDirs: string[]): Promise<Result> {
  const routes = buildRoutes(item.slug);
  let successRoute = "";
  let heading = "";

  for (const route of routes) {
    const url = `${baseUrl.replace(/\/$/, "")}${route}?screenshotMode=true`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(700);

    const pathName = new URL(page.url()).pathname;
    const inBlogRoute = likelySameBlogPath(pathName, item.slug);
    const h1 = (await page.locator("main .blog-article h1, main h1").first().textContent().catch(() => "")) || "";
    const h1Text = cleanText(h1);
    const bodyText = cleanText((await page.locator("body").textContent().catch(() => "")) || "");

    if (isLikely404Text(bodyText)) continue;
    if (!inBlogRoute) continue;
    if (h1Text.length < 8) continue;

    const expected = item.expectedHeading.slice(0, 30);
    if (expected && !h1Text.includes(expected)) continue;

    successRoute = route;
    heading = h1Text;
    break;
  }

  if (!successRoute) {
    return {
      slug: item.slug,
      status: "failed",
      route: routes[0],
      reason: "No valid arabic blog page loaded after route attempts"
    };
  }

  await setArabicAndStable(page);
  await page.waitForTimeout(500);

  const filename = `${item.slug}.jpg`;
  const primary = path.join(outputDirs[0], filename);

  const buffer = await page
    .screenshot({
      path: primary,
      type: "jpeg",
      quality: 90,
      fullPage: true
    })
    .catch(async () => {
      await page.setViewportSize({ width: 1365, height: 768 });
      return page.screenshot({ path: primary, type: "jpeg", quality: 90, fullPage: true });
    });

  for (let i = 1; i < outputDirs.length; i++) {
    const destination = path.join(outputDirs[i], filename);
    await fs.copyFile(primary, destination);
  }

  const accessible = Boolean(await page.accessibility.snapshot({ interestingOnly: true }).catch(() => null));

  return {
    slug: item.slug,
    status: "ok",
    route: successRoute,
    heading,
    accessible,
    bytes: buffer ? buffer.length : 0
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args.base ?? DEFAULT_BASE_URL;
  const username = args.username ?? args.user;
  const password = args.password;

  const items = await readBlogItems(path.join(process.cwd(), "blog"));
  const outputDirs = [
    path.join(process.cwd(), "public/assets/blog-screenshots"),
    path.join(process.cwd(), "assets/blog-screenshots")
  ];

  for (const dir of outputDirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await login(page, baseUrl, username, password);
    await setArabicAndStable(page);

    const results: Result[] = [];
    for (const item of items) {
      const result = await capture(item, baseUrl, page, outputDirs);
      results.push(result);
      if (result.status === "ok") {
        console.log(`OK ${result.slug} | ${result.route} | accessible=${result.accessible ? "pass" : "warn"} | heading=${result.heading.slice(0, 55)}`);
      } else {
        console.log(`FAIL ${result.slug} | ${result.route} | reason=${result.reason}`);
      }
    }

    const ok = results.filter((r) => r.status === "ok").length;
    const failed = results.filter((r) => r.status === "failed").length;
    console.log(`\nSummary: ${ok} passed, ${failed} failed, total ${results.length}.`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Screenshot re-capture failed", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
