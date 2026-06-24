import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

type BlogItem = { slug: string; expectedHeading: string };
type Result = { slug: string; status: "ok" | "failed"; route: string; heading: string; reason?: string; bytes?: number; };

function cleanText(input: string) {
  return (input || "").replace(/<[^>]+>/g, " ").replace(/&[a-zA-Z0-9#]+;/g, " ").replace(/\s+/g, " ").trim();
}

async function readBlogItems(blogDir: string): Promise<BlogItem[]> {
  const files = await fs.readdir(blogDir, { withFileTypes: true });
  const out: BlogItem[] = [];
  for (const entry of files
    .filter((f) => f.isFile() && f.name.toLowerCase().endsWith(".html") && f.name.toLowerCase() !== "index.html")
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const slug = entry.name.replace(/\.html$/i, "");
    const html = await fs.readFile(path.join(blogDir, entry.name), "utf8");
    const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    out.push({ slug, expectedHeading: match ? cleanText(match[1]) : slug.replace(/-/g, " ") });
  }
  return out;
}

async function ensureArabic(page: any) {
  await page.evaluate(() => {
    localStorage.setItem("empid-language", "ar");
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  });
}

async function capture(item: BlogItem, baseUrl: string, page: any, outputDirs: string[]): Promise<Result> {
  const route = `/blog/${item.slug}.html`;
  const url = `${baseUrl.replace(/\/$/, "")}${route}`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(700);

  const headingRaw = await page.locator("main h1").first().textContent().catch(() => "");
  const heading = cleanText(headingRaw || "");
  const bodyText = cleanText(await page.locator("body").innerText().catch(() => "") || "");

  if (!heading || /404/i.test(heading) || /404/i.test(bodyText)) {
    return { slug: item.slug, status: "failed", route, heading, reason: "No readable heading found" };
  }

  await ensureArabic(page);
  await page.setViewportSize({ width: 1440, height: 768 });

  const outputName = `${item.slug}.jpg`;
  const primary = path.join(outputDirs[0], outputName);
  const buf = await page.screenshot({ path: primary, type: "jpeg", quality: 88, fullPage: false });

  for (let i = 1; i < outputDirs.length; i++) {
    await fs.copyFile(primary, path.join(outputDirs[i], outputName));
  }

  return { slug: item.slug, status: "ok", route, heading, bytes: buf.length };
}

(async () => {
  const baseArg = process.argv.find((arg) => arg.startsWith("--base="));
  const baseUrl = baseArg ? baseArg.split("=")[1] : "http://localhost:4173";

  const items = await readBlogItems(path.join(process.cwd(), "blog"));
  const outputDirs = [
    path.join(process.cwd(), "public/assets/blog-screenshots"),
    path.join(process.cwd(), "assets/blog-screenshots")
  ];
  for (const dir of outputDirs) await fs.mkdir(dir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const out: Result[] = [];

  try {
    for (const item of items) {
      const res = await capture(item, baseUrl, page, outputDirs);
      out.push(res);
      if (res.status === "ok") {
        console.log(`OK ${res.slug} | ${res.heading.slice(0, 80)} | bytes=${res.bytes}`);
      } else {
        console.log(`FAIL ${res.slug} | ${res.reason}`);
      }
    }

    const ok = out.filter((r) => r.status === "ok").length;
    const fail = out.filter((r) => r.status === "failed").length;
    console.log(`Summary: ${ok} ok, ${fail} failed.`);
  } finally {
    await browser.close();
  }
})();
