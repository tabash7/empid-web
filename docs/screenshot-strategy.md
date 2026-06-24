# Screenshot System (EMPID)

This folder provides a reusable screenshot pipeline for:

- Logging in with demo credentials
- Running consistent product flow captures
- Capturing raw and annotated images
- Reusing stable selectors (`data-tour` first) without changing production behavior
- Running desktop and mobile captures with fixed viewport sizes

## Scripts

```bash
npm run screenshots:demo
npm run screenshots:demo:mobile
```

Optional environment variables:

```bash
set DEMO_USERNAME=demo@example.com
set DEMO_PASSWORD=demo-password
set SCREENSHOT_BASE_URL=http://localhost:5173
```

Optional flags:

- `--mode=desktop|mobile`
- `--baseUrl=http://localhost:5173`
- `--username=...`
- `--password=...`
- `--loginPath=/login`
- `--output=tests/screenshots/output`
- `--rawDir=raw`
- `--annotatedDir=annotated`
- `--headful`

## Output structure

```text
tests/screenshots/output/
  raw/
    01-dashboard-overview.png
    02-employee-directory.png
    03-employee-profile.png
    ...
  annotated/
    01-dashboard-overview.png
    02-employee-directory.png
    03-employee-profile.png
    ...
```

Note:
- If a flow step sets `outputFile` in `tests/screenshots/demo-flows.ts`, the runner uses that filename.
- If no `outputFile` is set, fallback uses `NN-slug.png` numbering.

## How the runner works

1. Starts Playwright and opens `SCREENSHOT_BASE_URL` in desktop or mobile viewport.
2. Logs in through `/login` using demo credentials.
3. Iterates predefined steps from `tests/screenshots/demo-flows.ts`.
4. Waits for stable selectors (fallback among multiple selectors).
5. Optionally hides unstable UI parts (clock, loading states, live notifications).
6. Captures:
   - raw screenshot (clean capture)
   - annotated screenshot (`data-tour` callout badges)
7. Writes outputs to separate folders.

## Add a new flow

Edit `tests/screenshots/demo-flows.ts` and append a new step:

```ts
{
  slug: "branch-overview",
  title: "Overview of branch management",
  path: "/branches",
  waitFor: ["[data-tour='branch-dashboard']", "main"],
  notes: [
    {
      stepNumber: 13,
      selector: "[data-tour='branch-dashboard']",
      textAr: "لوحة KPI لإدارة الفروع.",
      textEn: "Branch dashboard KPI overview."
    }
  ],
  actions: [
    {
      name: "Open branch card",
      selectors: ["[data-tour='branch-card']", "[data-tour='branch-item']"],
      action: "click",
      required: false,
      waitFor: ["[data-tour='branch-details']", "main"]
    }
  ],
  pauseMs: 700
}
```

### Notes for stable selectors

- Prefer `data-tour` first in every step.
- Add `data-tour` only for stable, intentional targets.
- Keep fallback selectors second (classes, roles, or text-based selectors).

## App integration (production-safe)

1. Add:
   - `src/lib/screenshotMode.ts`
   - `src/components/demo/ScreenshotOverlay.tsx`
2. Mount `<ScreenshotOverlay />` once near app root, or keep it always mounted and let mode control visibility.
3. In screenshot mode, set:
   - `localStorage.setItem("screenshotMode", "true")`
   - `localStorage.setItem("screenshotModeShowAnnotations", "true")`
   - `localStorage.setItem("screenshotModeNotes", JSON.stringify(notes))`
4. Use `?screenshotMode=true` or localStorage flags when opening capture targets.

The normal user experience remains unchanged because overlays only render when screenshot mode is active.
