export type ScreenshotCallout = {
  selector: string;
  text: string;
};

export const SCREENSHOT_QUERY_PARAM = "screenshotMode";
export const SCREENSHOT_MODE_STORAGE_KEY = "screenshotMode";
export const SCREENSHOT_ANNOTATIONS_STORAGE_KEY = "screenshotModeShowAnnotations";
export const SCREENSHOT_NOTES_STORAGE_KEY = "screenshotModeNotes";
export const SCREENSHOT_NOTES_REFRESH_EVENT = "empid:screenshot-mode";

export function parseBoolean(value: unknown): boolean {
  return value === "1" || value === "true" || value === true;
}

export function isScreenshotModeEnabled(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get(SCREENSHOT_QUERY_PARAM) === "true") return true;

  try {
    return parseBoolean(window.localStorage.getItem(SCREENSHOT_MODE_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function isScreenshotAnnotationVisible(): boolean {
  if (!isScreenshotModeEnabled() || typeof window === "undefined") return false;

  try {
    return parseBoolean(window.localStorage.getItem(SCREENSHOT_ANNOTATIONS_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function getScreenshotCallouts(): ScreenshotCallout[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SCREENSHOT_NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        const selector = String(item.selector ?? "").trim();
        const text = String(item.text ?? "").trim();
        return selector.length > 0 && text.length > 0
          ? {
              selector,
              text
            }
          : null;
      })
      .filter((item): item is ScreenshotCallout => item !== null);
  } catch {
    return [];
  }
}

export function setScreenshotMode(enabled: boolean, showAnnotations = false): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCREENSHOT_MODE_STORAGE_KEY, enabled ? "true" : "false");
    window.localStorage.setItem(SCREENSHOT_ANNOTATIONS_STORAGE_KEY, showAnnotations ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent(SCREENSHOT_NOTES_REFRESH_EVENT, {
        detail: {
          enabled,
          showAnnotations
        }
      })
    );
  } catch {}
}

export function setScreenshotCallouts(callouts: ScreenshotCallout[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCREENSHOT_NOTES_STORAGE_KEY, JSON.stringify(callouts));
    window.dispatchEvent(
      new CustomEvent(SCREENSHOT_NOTES_REFRESH_EVENT, {
        detail: {
          notes: callouts
        }
      })
    );
  } catch {}
}

export function clearScreenshotModeState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SCREENSHOT_MODE_STORAGE_KEY);
    window.localStorage.removeItem(SCREENSHOT_ANNOTATIONS_STORAGE_KEY);
    window.localStorage.removeItem(SCREENSHOT_NOTES_STORAGE_KEY);
  } catch {}
}
