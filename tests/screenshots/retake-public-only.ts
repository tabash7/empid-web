import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

function cleanText(input: string) {
  return (input || "").replace(/<[^>]+>/g, " ").replace(/&[a-zA-Z0-9#]+;/g, " ").replace(/\s+/g, " ").trim();
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    args.set(key, value);
  }
  return args;
}

function normalizeBase(base: string) {
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function readBlogItems(blogDir: string) {
  const files = await fs.readdir(blogDir, { withFileTypes: true });
  const items: { slug: string; heading: string }[] = [];
  for (const entry of files.filter((f) => f.isFile() && f.name.toLowerCase().endsWith('.html') && f.name.toLowerCase() !== 'index.html').sort((a,b)=>a.name.localeCompare(b.name))) {
    const slug = entry.name.replace(/\.html$/i, '');
    const html = await fs.readFile(path.join(blogDir, entry.name), 'utf8');
    const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const expectedHeading = match ? cleanText(match[1]) : slug;
    items.push({ slug, heading: expectedHeading });
  }
  return items;
}

async function setArabicDirection(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem("empid-language", "ar");
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.style.direction = "rtl";
  });
}

async function has404Signals(page: Page) {
  const heading = cleanText(await page.locator("main h1").first().textContent().catch(() => ""));
  const title = cleanText(await page.title().catch(() => ""));
  const body = cleanText(await page.locator("body").innerText().catch(() => ""));
  const is404 = /404|not found|page not found/i.test(heading + " " + title + " " + body);
  const statusText = cleanText(await page.locator("main").getAttribute("data-status").catch(() => ""));
  return {
    is404,
    heading,
    title,
    statusText,
    body: body.slice(0, 160)
  };
}

async function checkAccessibility(page: Page) {
  const result = {
    missingAltImages: 0,
    unlabeledInputs: 0,
    hasLang: false,
    hasH1: false
  };

  result.hasLang = await page.locator("html[lang]").count().then((count) => count > 0);
  result.hasH1 = await page.locator("h1").count().then((count) => count > 0);

  result.missingAltImages = await page.$$eval("img", (images: HTMLImageElement[]) =>
    images.filter((image) => !image.getAttribute("alt") || image.getAttribute("alt")?.trim() === "").length
  );

  result.unlabeledInputs = await page.$$eval("input:not([type='hidden']), textarea, select", (fields) =>
    fields.filter((field) => {
      const ariaLabel = field.getAttribute("aria-label");
      const ariaLabelledBy = field.getAttribute("aria-labelledby");
      const id = field.getAttribute("id");
      const hasName = field.getAttribute("name");
      if (ariaLabel || ariaLabelledBy) return false;
      if (!id) return true;
      const label = document.querySelector(`label[for='${CSS.escape(id)}']`);
      return !label && !hasName;
    }).length
  );

  return {
    ...result
  };
}

async function attemptLogin(
  page: Page,
  base: string,
  loginPath: string,
  username: string,
  password: string
) {
  const loginUrl = `${normalizeBase(base)}${loginPath}`;
  const response = await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  if (!response || response.status() >= 400) {
    return false;
  }

  const hasLoginForm = await page.locator(
    "input[type='email'], input[name='email'], input[name='username'], input[type='text']"
  ).first().count();
  if (!hasLoginForm) {
    return false;
  }

  const emailSelectors = [
    "input[type='email']",
    "input[name='email']",
    "input[id='email']",
    "input[type='text'][name*='email']",
    "input[name='username']",
    "input[id='username']"
  ];
  const passwordSelectors = [
    "input[type='password']",
    "input[name='password']",
    "input[id='password']"
  ];
  const submitSelectors = [
    "button[type='submit']",
    "button:has-text('تسجيل')",
    "button:has-text('Login')",
    "input[type='submit']"
  ];

  const findSelector = async (selectors: string[]) => {
    for (const selector of selectors) {
      const count = await page.locator(selector).first().count();
      if (count > 0) return selector;
    }
    return null;
  };

  const emailSelector = await findSelector(emailSelectors);
  if (!emailSelector) return false;

  const passwordSelector = await findSelector(passwordSelectors);
  const submitSelector = await findSelector(submitSelectors);

  if (!passwordSelector || !submitSelector) return false;

  await page.locator(emailSelector).first().fill(username);
  await page.locator(passwordSelector).first().fill(password);
  await page.locator(submitSelector).first().click();
  await page.waitForTimeout(1200);

  const postLoginUrl = page.url();
  return !/\/login/i.test(postLoginUrl);
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const base = args.get("base") || "http://localhost:4173";
  const outputDirArg = args.get("output") || path.join(process.cwd(), "public/assets/blog-screenshots");
  const username = args.get("username") || "cutest.ducklings@gmail.com";
  const password = args.get("password") || "Password123$$";
  const loginPath = args.get("loginPath") || "/login";

  const items = await readBlogItems(path.join(process.cwd(), 'blog'));
  const outDir = path.resolve(outputDirArg);
  await fs.mkdir(outDir, { recursive: true });
  await Promise.all((await fs.readdir(outDir)).map((file) => fs.unlink(path.join(outDir, file)).catch(() => undefined)));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 768 });

  try {
    let i = 0;
    let loginAttempted = false;
    if (username && password) {
      try {
        loginAttempted = await attemptLogin(page, base, loginPath, username, password);
        console.log(`Login attempt: ${loginAttempted ? "success" : "skipped/failed"}`);
      } catch (error) {
        console.warn("Login check failed:", error instanceof Error ? error.message : String(error));
      }
    }

    for (const item of items) {
      const url = `${normalizeBase(base)}/blog/${item.slug}.html`;
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(900);

      const pageState = await has404Signals(page);
      if (!response || response.status() >= 400 || pageState.is404 || !pageState.heading) {
        console.log(`FAIL ${item.slug} -> ${pageState.heading || "missing heading"} | ${pageState.body}`);
        continue;
      }

      await setArabicDirection(page);
      const accessibility = await checkAccessibility(page);
      if (accessibility.missingAltImages > 8) {
        console.log(`WARN ${item.slug} missing alt images: ${accessibility.missingAltImages}`);
      }
      if (accessibility.unlabeledInputs > 12) {
        console.log(`WARN ${item.slug} unlabeled form fields: ${accessibility.unlabeledInputs}`);
      }
      if (!accessibility.hasLang) {
        console.log(`WARN ${item.slug} html lang attribute is missing`);
      }
      if (!accessibility.hasH1) {
        console.log(`WARN ${item.slug} no H1 heading`);
      }

      const output = path.join(outDir, `${item.slug}.jpg`);
      const buf = await page.screenshot({ path: output, type: "jpeg", quality: 60, fullPage: false });
      i++;
      console.log(`OK ${item.slug} | ${pageState.heading.slice(0, 70)} | bytes=${buf.length} | login=${loginAttempted}`);
    }
    console.log(`Done ${i}/${items.length}`);
  } finally {
    await browser.close();
  }
})();
