import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";
import {
  screenshotFlowSteps,
  type ScreenshotAction,
  type ScreenshotFlowStep,
  type SelectorOption
} from "./demo-flows";
import {
  SCREENSHOT_ANNOTATIONS_STORAGE_KEY,
  SCREENSHOT_MODE_STORAGE_KEY,
  SCREENSHOT_NOTES_REFRESH_EVENT,
  SCREENSHOT_NOTES_STORAGE_KEY,
  SCREENSHOT_QUERY_PARAM
} from "../../src/lib/screenshotMode";

type ScreenshotMode = "desktop" | "mobile";

type RunnerOptions = {
  mode: ScreenshotMode;
  baseUrl: string;
  username?: string;
  password?: string;
  loginPath: string;
  outputRoot: string;
  rawDirName: string;
  annotatedDirName: string;
  headful: boolean;
};

const VIEWPORTS: Record<ScreenshotMode, { width: number; height: number }> = {
  desktop: { width: 1440, height: 1100 },
  mobile: { width: 390, height: 844 }
};

const DEFAULT_OUTPUT_ROOT = path.join(process.cwd(), "tests", "screenshots", "output");
const DEFAULT_RAW_DIR = "raw";
const DEFAULT_ANNOTATED_DIR = "annotated";
const DEFAULT_NAVIGATION_TIMEOUT_MS = 45_000;
const DEFAULT_NETWORKIDLE_WAIT_MS = 1_800;
const DEFAULT_STABILIZE_TIMEOUT_MS = 600;
const DEFAULT_UNSTABLE_SELECTORS = [
  "[data-tour='current-time']",
  "[data-tour='live-notification']",
  "[data-tour='random-id']",
  "[role='status']",
  ".loading",
  ".spinner",
  "[aria-live='polite']",
  "[data-tour='blinking-cursor']"
];

type ScreenshotNotePayload = {
  selector: string;
  text: string;
};

function buildScreenshotUrl(baseUrl: string, relativePath: string) {
  return `${buildStepUrl(baseUrl, relativePath)}?${SCREENSHOT_QUERY_PARAM}=true`;
}

const DEMO_DEFAULTS = {
  baseUrl: process.env.SCREENSHOT_BASE_URL ?? "http://localhost:5173",
  username: process.env.DEMO_USERNAME ?? process.env.DEMO_USER,
  password: process.env.DEMO_PASSWORD,
  loginPath: process.env.SCREENSHOT_LOGIN_PATH ?? "/login"
};

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2];
    args[key] = value === undefined ? true : value;
  }
  return args;
}

function parseBooleanFlag(value: unknown) {
  return value === true || value === "true";
}

function joinTokens(tokens: string[]) {
  return tokens.join(", ");
}


function buildStepUrl(baseUrl: string, relativePath: string) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${normalizedBase}${normalizedPath}`;
}

function formatNumber(value: number) {
  return `${value}`.padStart(2, "0");
}

function stepFileName(slug: string, index: number) {
  return `${formatNumber(index)}-${slug}.png`;
}

function parseSelectorList(selectors: SelectorOption): string[] {
  return Array.isArray(selectors) ? selectors : [selectors];
}

async function findExistingSelector(page: Page, selectors: SelectorOption): Promise<string | null> {
  const candidateList = parseSelectorList(selectors);
  for (const selector of candidateList) {
    const count = await page.locator(selector).count();
    if (count > 0) return selector;
  }
  return null;
}

async function waitForOneOfSelectors(page: Page, options: SelectorOption[]) {
  for (const option of options) {
    const selector = await findExistingSelector(page, option);
    if (!selector) continue;
    await page.locator(selector).first().waitFor({ state: "visible", timeout: 12000 });
    return selector;
  }
  return null;
}

function tokenText(action: string, candidates: SelectorOption[]) {
  const flat: string[] = [];
  for (const option of candidates) {
    flat.push(parseSelectorList(option).join(" / "));
  }
  return `action "${action}" not found. Checked selectors: ${joinTokens(flat)}`;
}

async function fillByCandidate(page: Page, action: string, candidates: SelectorOption[], value: string, required: boolean) {
  const selector = await findExistingSelector(page, candidates);
  if (!selector) {
    if (required) throw new Error(tokenText(action, candidates));
    return;
  }
  await page.locator(selector).first().fill(value);
}

async function clickByCandidate(page: Page, action: string, candidates: SelectorOption[], required: boolean) {
  const selector = await findExistingSelector(page, candidates);
  if (!selector) {
    if (required) throw new Error(tokenText(action, candidates));
    return;
  }
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  await target.click({ timeout: 8000 });
}

async function pressByCandidate(page: Page, action: string, candidates: SelectorOption[], key: string, required: boolean) {
  const selector = await findExistingSelector(page, candidates);
  if (!selector) {
    if (required) throw new Error(tokenText(action, candidates));
    return;
  }
  await page.locator(selector).first().press(key);
}

async function selectByCandidate(page: Page, action: string, candidates: SelectorOption[], value: string, required: boolean) {
  const selector = await findExistingSelector(page, candidates);
  if (!selector) {
    if (required) throw new Error(tokenText(action, candidates));
    return;
  }
  await page.locator(selector).first().selectOption(value);
}

async function runAction(
  page: Page,
  action: ScreenshotAction,
  credentials: { username?: string; password?: string }
) {
  const required = action.required !== false;
  const mappedValue = action.value
    ? action.value.replace("{{DEMO_EMAIL}}", credentials.username ?? "")
      .replace("{{DEMO_PASSWORD}}", credentials.password ?? "")
    : "";

  if (action.action === "fill") {
    await fillByCandidate(page, action.name, action.selectors, mappedValue, required);
  } else if (action.action === "click") {
    await clickByCandidate(page, action.name, action.selectors, required);
  } else if (action.action === "press") {
    await pressByCandidate(page, action.name, action.selectors, mappedValue || "Enter", required);
  } else if (action.action === "select") {
    if (action.value) {
      await selectByCandidate(page, action.name, action.selectors, action.value, required);
    }
  }

  if (action.waitFor?.length) {
    await waitForOneOfSelectors(page, action.waitFor);
  }
}

async function setScreenshotModeState(
  page: Page,
  enabled: boolean,
  options?: { showAnnotations?: boolean; notes?: unknown }
) {
  await page.evaluate(
    ({ enabled, showAnnotations, notes, modeKey, annotationsKey, notesKey, eventName }) => {
      try {
        localStorage.setItem(modeKey, enabled ? "true" : "false");
        localStorage.setItem(annotationsKey, showAnnotations ? "true" : "false");
        if (notes !== undefined) {
          localStorage.setItem(notesKey, JSON.stringify(notes));
        } else {
          localStorage.removeItem(notesKey);
        }
        window.dispatchEvent(
          new CustomEvent(eventName, {
            detail: { enabled, showAnnotations, notes }
          })
        );
      } catch {}
    },
    {
      enabled,
      showAnnotations: options?.showAnnotations ?? false,
      notes: options?.notes ?? null,
      modeKey: SCREENSHOT_MODE_STORAGE_KEY,
      annotationsKey: SCREENSHOT_ANNOTATIONS_STORAGE_KEY,
      notesKey: SCREENSHOT_NOTES_STORAGE_KEY,
      eventName: SCREENSHOT_NOTES_REFRESH_EVENT
    }
  );
}

async function removeFallbackOverlay(page: Page) {
  await page.evaluate(() => {
    const node = document.getElementById("empid-screenshot-overlay-fallback");
    if (node) node.remove();
  });
}

async function drawFallbackNotes(page: Page, step: ScreenshotFlowStep, stepIndex: number) {
  const notes: ScreenshotNotePayload[] = (step.notes ?? []).map((note, noteIndex) => ({
    selector: Array.isArray(note.selector) ? note.selector[0] : note.selector,
    text: `${stepIndex * 2 + noteIndex + 1}. ${note.textAr}`
  }));

  if (!notes.length) return;

  await setScreenshotModeState(page, true, { showAnnotations: true, notes });

  await page.evaluate((payload) => {
    const list: Array<{ selector: string; text: string }> = payload.notes;
    const existing = document.getElementById("empid-screenshot-overlay-fallback");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "empid-screenshot-overlay-fallback";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "2147483647";

    list.forEach((item, index) => {
      const target = document.querySelector(item.selector) as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const note = document.createElement("div");
      note.style.position = "absolute";
      note.style.left = `${Math.max(12, rect.left + 12)}px`;
      note.style.top = `${Math.max(12, rect.top + 12)}px`;
      note.style.padding = "8px 10px";
      note.style.borderRadius = "10px";
      note.style.background = "rgba(7, 35, 82, 0.95)";
      note.style.border = "2px solid #ffd94a";
      note.style.color = "#ffffff";
      note.style.font = "12px/1.35 Arial, sans-serif";
      note.style.maxWidth = "320px";
      note.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
      note.textContent = item.text;
      overlay.appendChild(note);

      const dot = document.createElement("div");
      dot.style.position = "absolute";
      dot.style.left = `${Math.max(2, rect.left - 4)}px`;
      dot.style.top = `${Math.max(2, rect.top - 4)}px`;
      dot.style.width = "16px";
      dot.style.height = "16px";
      dot.style.borderRadius = "999px";
      dot.style.background = "#ffd94a";
      dot.style.border = "2px solid #072352";
      dot.style.color = "#072352";
      dot.style.font = "700 10px/12px Arial, sans-serif";
      dot.style.textAlign = "center";
      dot.style.lineHeight = "12px";
      dot.style.display = "flex";
      dot.style.alignItems = "center";
      dot.style.justifyContent = "center";
      dot.style.transform = "translate(-50%, -50%)";
      dot.textContent = `${index + 1}`;
      overlay.appendChild(dot);
    });

    document.body.appendChild(overlay);
  }, { notes });
}

async function hideUnstableUi(page: Page, selectors: string[]) {
  const css = selectors.map((selector) => `${selector}{visibility:hidden !important;}`).join("\n");
  if (!css.trim()) return;
  await page.addStyleTag({ content: css }).catch(() => undefined);
}

async function stabilizeCurrentState(page: Page) {
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await Promise.race([
    page.waitForLoadState("networkidle").catch(() => undefined),
    page.waitForTimeout(DEFAULT_NETWORKIDLE_WAIT_MS)
  ]);
  await page.waitForTimeout(DEFAULT_STABILIZE_TIMEOUT_MS);
  await page.evaluate(() => {
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready;
    }
    return Promise.resolve();
  }).catch(() => undefined);
}
async function runLogin(page: Page, options: RunnerOptions, credentials: { username?: string; password?: string }) {
  const loginStep = screenshotFlowSteps.find((step) => step.slug === "login-dashboard");
  if (!loginStep) throw new Error("No login step configured in demo-flows.ts");

  const loginUrl = buildScreenshotUrl(options.baseUrl, options.loginPath);

  await page.goto(loginUrl, {
    waitUntil: "domcontentloaded",
    timeout: DEFAULT_NAVIGATION_TIMEOUT_MS
  });

  if (loginStep.waitFor?.length) {
    await waitForOneOfSelectors(page, loginStep.waitFor);
  }

  for (const action of loginStep.actions ?? []) {
    await runAction(page, action, credentials);
    await stabilizeCurrentState(page);
  }

  if (loginStep.hideUnstable?.length) {
    await hideUnstableUi(page, [...DEFAULT_UNSTABLE_SELECTORS, ...loginStep.hideUnstable]);
  }

  await setScreenshotModeState(page, true, { showAnnotations: false, notes: [] });
}

async function captureStep(
  page: Page,
  options: RunnerOptions,
  step: ScreenshotFlowStep,
  stepIndex: number,
  rawOutput: string,
  annotatedOutput: string
) {
  const url = buildScreenshotUrl(options.baseUrl, step.path);
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: DEFAULT_NAVIGATION_TIMEOUT_MS
  });
  await stabilizeCurrentState(page);

  if (step.waitFor?.length) {
    const ready = await waitForOneOfSelectors(page, step.waitFor);
    if (!ready) {
      throw new Error(`No ready selector found for ${step.slug}`);
    }
  }

  await hideUnstableUi(page, [...DEFAULT_UNSTABLE_SELECTORS, ...(step.hideUnstable ?? [])]);

  for (const action of step.actions ?? []) {
    await runAction(page, action, {
      username: options.username,
      password: options.password
    });
    await stabilizeCurrentState(page);
  }

  if (step.pauseMs) {
    await page.waitForTimeout(step.pauseMs);
  }

  await setScreenshotModeState(page, true, { showAnnotations: false, notes: [] });
  await removeFallbackOverlay(page);
  await page.screenshot({ path: rawOutput, fullPage: true });

  await drawFallbackNotes(page, step, stepIndex);
  await page.screenshot({ path: annotatedOutput, fullPage: true });
  await removeFallbackOverlay(page);
}

function resolveOptions(): RunnerOptions {
  const args = parseArgs(process.argv.slice(2));
  const mode = ((args.mode as ScreenshotMode) ?? "desktop");
  const baseUrl = (args.baseUrl as string) ?? DEMO_DEFAULTS.baseUrl;
  const username = (args.username as string) ?? DEMO_DEFAULTS.username;
  const password = (args.password as string) ?? DEMO_DEFAULTS.password;
  const loginPath = (args.loginPath as string) ?? DEMO_DEFAULTS.loginPath;
  const outputRoot = (args.output as string) ?? DEFAULT_OUTPUT_ROOT;
  const rawDirName = (args.rawDir as string) ?? DEFAULT_RAW_DIR;
  const annotatedDirName = (args.annotatedDir as string) ?? DEFAULT_ANNOTATED_DIR;
  const headful = parseBooleanFlag(args.headful);

  if (mode !== "desktop" && mode !== "mobile") {
    throw new Error("Mode must be 'desktop' or 'mobile'");
  }

  return {
    mode,
    baseUrl,
    username,
    password,
    loginPath,
    outputRoot,
    rawDirName,
    annotatedDirName,
    headful
  };
}

async function runAll() {
  const options = resolveOptions();

  if (!options.username || !options.password) {
    console.warn("Demo credentials are not fully configured. Some flows may require manual input.");
  }

  const browser = await chromium.launch({ headless: !options.headful });
  const context = await browser.newContext({
    viewport: VIEWPORTS[options.mode]
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const outputRaw = path.resolve(options.outputRoot, options.rawDirName);
  const outputAnnotated = path.resolve(options.outputRoot, options.annotatedDirName);
  await fs.mkdir(outputRaw, { recursive: true });
  await fs.mkdir(outputAnnotated, { recursive: true });

  try {
    await runLogin(page, options, {
      username: options.username,
      password: options.password
    });

    const steps = screenshotFlowSteps.filter((step) => step.slug !== "login-dashboard");
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const outputFile = (step.outputFile ?? "").trim();
      const fallbackRaw = stepFileName(step.slug, i + 1);
      const fallbackAnnotated = stepFileName(step.slug, i + 1);
      const rawFile = path.join(outputRaw, outputFile || fallbackRaw);
      const annotatedFile = path.join(outputAnnotated, outputFile || fallbackAnnotated);

      try {
        await captureStep(page, options, step, i, rawFile, annotatedFile);
        console.log(`Captured ${step.slug}`);
      } catch (error) {
        console.error(`Failed ${step.slug}:`, error instanceof Error ? error.message : String(error));
      }
    }
  } finally {
    await browser.close();
  }
}

runAll().catch((error) => {
  console.error("Screenshot runner failed", error);
  process.exit(1);
});
