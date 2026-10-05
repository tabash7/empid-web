# Homepage Refresh

## What Changed

- Replaced the split mock-dashboard hero and repetitive SEO sections with a concise product-led homepage.
- Added an actual Arabic pilot dashboard image, three visual workflow previews, links to all 20 services, a permissions section, the existing narrated video, practical articles, five relevant FAQs and the existing enquiry form.
- Added homepage-scoped responsive styling, bilingual content, keyboard focus and a skip link.
- Updated titles, descriptions, canonical/social metadata and Organization, WebSite, WebPage and SoftwareApplication structured data. Removed an unsupported English hreflang URL, generic LinkedIn identity and fictional performance claims.
- Kept old homepage fragment links working and prevented the service-guide generator from inserting legacy homepage sections into this design.

## Authored Files

- index.html
- homepage.css
- script.js (homepage-scoped metadata only)
- docs/homepage/build_homepage.py
- docs/homepage/test_homepage.py
- docs/homepage/README.md
- docs/service-guides/build_guides.py (homepage regeneration guard)
- assets/homepage/dashboard.webp

Evidence: desktop-ar.png, mobile-ar.png, responsive-validation.json and preview.png in this directory.

## Protected Behavior

No HRMS application code, authentication, permissions, payroll calculations, database, storage or tenant data changed. Existing enquiry field names and Formspree endpoint preserved. No enquiry submitted, no deployment, commit or push performed. Other service/blog styling was not redesigned. Existing demo assets preserved.

## Verification

- Focused static homepage tests: 7 checks.
- node --check script.js.
- docs/service-guides/verify_guides.py: 96 public pages; 20 service videos decoded; no failures or warnings.
- npm run verify:blog-thumbnails: 39 posts; passed.
- Pilot browser: Arabic RTL and English LTR at 360, 390, 768 and 1440 pixels; image loading, overflow and control bounds checked. Mobile menu, language switching, FAQ expansion and invalid/required-field form validation exercised. No external lead submitted.
- HRMS lint/build/unit/E2E suites not run: no HRMS changes. Website has no lint/typecheck/build scripts. No production Lighthouse, field Core Web Vitals, Google indexing or ranking result claimed.

## SEO Expectations

Search visibility depends on publishing, crawlability, useful content, competition and ongoing measurement. These changes improve the homepage foundations, not guarantee a search position. Arabic is the canonical published content; English is a user-facing toggle, not a separately indexed language URL. Add a real English URL before declaring an English hreflang alternate.

## Risk And Rollback

Low to medium: homepage presentation/content changed; shared script adjustment is scoped to body.homepage. Revert only the listed homepage changes and the generator guard, retaining unrelated website edits. The existing contact endpoint needs a real delivery check before release; that was intentionally not sent during local testing.

## Rebuild

Use the bundled Python runtime with PYTHONPATH set to D:/empid-web/.tools/python-packages. Run build_homepage.py and then test_homepage.py. All generated marketing output remains in D:/empid-web.
