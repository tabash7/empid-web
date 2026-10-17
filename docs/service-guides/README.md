# Arabic Service Guide Library

## Scope

Workspace boundary: all website copy, demo captures, generated media, source
scripts, reports and local rendering dependencies live under `D:\empid-web`.
`D:\hrms` is only the running application being captured. Do not create website
or marketing artifacts there, and do not modify its application code as part of
this website task. Local dependencies belong in the ignored `.tools` directory.

20 core service guides, 60 annotated Arabic walkthrough images, and 20 silent
24-second videos. The blog now contains 39 articles: 17 new service-specific
articles and 22 preserved existing articles. The existing service and industry
pages retain their original copy and gain a guided walkthrough section.

The source of editorial content is `services.json`. Do not add fabricated
customer results, legal guarantees, reviews, awards, or unsupported integrations.
Screenshots use synthetic demo records, not production employee information.
No credentials, authentication screens, or MFA codes belong in published media.

17 service guides use actual app captures. Payroll, Performance, and Document
Compliance use explicitly labeled process illustrations. They must not be
described as filmed UI acceptance evidence. Replace these illustrations only
after authorized access and suitable demo records are available. Some captured
app labels remain English; the guide overlays and surrounding website text are
Arabic. This website work does not fix or certify the application workflows.

## Rebuild

Use Python with the dependencies in `requirements.txt`. The media renderer uses
the existing Windows Arial fonts and the ffmpeg binary provided by
`imageio-ffmpeg`. On another OS, set `FONT` and `BOLD` to Arabic-capable fonts.

```powershell
python -m pip install --target .tools/python-packages -r docs/service-guides/requirements.txt
$env:PYTHONPATH = (Resolve-Path .tools/python-packages).Path
python docs/service-guides/build_guides.py
python docs/service-guides/verify_guides.py
node --check service-guides.js
npm run verify:blog-thumbnails
```

The builder preserves authored legacy page bodies and replaces only its own
`#arabic-guide` section. Pages with `body.guide-page` are generated and should
be edited through the source data/builder. Canonical/OG/JSON-LD URLs in existing
blog articles are normalized to the actual non-www `.html` URL. Existing blog
directory aliases continue to redirect to those articles.

Media fingerprints invalidate changed captures or content. Use
`--rebuild-media` after changing the renderer itself. Intermediate PNG frames
are held in the ignored `render-cache` directory; deploy only the final WebP,
JPEG, MP4 and VTT assets.

## Verified Locally

- `verify_guides.py`: 96 public HTML pages; metadata, one H1, unique canonical,
  OG/canonical agreement, JSON-LD syntax, local links/assets, Arabic corruption,
  image descriptions/dimensions, sitemap consistency. No failures or warnings.
- All 20 MP4 files decoded through ffmpeg: 1920x1080, 24 seconds, no audio.
- Visible Pilot: all 20 service guides at 390px, 768px and 1440px; no horizontal
  overflow and three walkthrough steps on every service page.
- Arabic blog search, pagination, catalog click-through and mobile video
  playback checked interactively. Video playback reached readyState 4 and an
  advancing timestamp. Full-size image links support inspection on small screens.
- All 39 blog articles checked at 390px and 1440px; no horizontal overflow or
  broken Arabic text. Four additional static archive pages give crawlers real
  pagination URLs without depending on JavaScript button clicks.
- `npm run verify:blog-thumbnails`: 39 posts, 22 legacy thumbnails verified in
  both existing directories, plus 77 guide-image references. Result: OK.
  The verifier recognizes the new guide assets while retaining every existing
  legacy thumbnail/mirror assertion. Its verification mode performs file checks
  only; no hidden browser automation was run.

Evidence: `validation.json`, `responsive-validation.json`, `evidence.json`, and
the preview screenshots in this directory. These checks are local website QA,
not a Google indexing result or a full HRMS acceptance pass. No HRMS lint,
unit/E2E suites were run because no HRMS source or business behavior changed.
The static website does not define lint/typecheck/build scripts.

## Publication Checklist

1. Review the Arabic copy and all captured demo screens before public release.
2. Deploy only public pages/media; exclude `.git`, `.kilo`, `node_modules`, test
   outputs, source capture directories, caches and internal documentation.
3. Configure HTTPS and one canonical host (`https://www.empid.com`). Redirect the
   other host and old blog aliases at the hosting/CDN layer when possible.
   Set article/video publication dates to the actual release date when publishing.
4. Ensure MP4/VTT/WebP have correct content types and long-lived cache headers.
   Video hosting must support range requests; never require authentication for
   these public synthetic marketing clips. Preserve private employee storage.
5. Submit `/sitemap.xml` and `/video-sitemap.xml` in verified Google Search
   Console. Inspect representative service, article and dedicated watch URLs.
6. Run PageSpeed/Lighthouse on deployed mobile pages, including font loading,
   LCP and CLS. Local layout checks are not field Core Web Vitals measurements.
7. Monitor indexing, search queries, click-through rate and demo conversions.
   Add useful customer-approved case studies and authoritative references where
   relevant. Do not buy links, stuff keywords or manufacture testimonials.

Dedicated watch pages put the video above the transcript, with VideoObject
metadata, stable media URLs, posters and a video sitemap. This makes the content
eligible for discovery but does not guarantee video indexing or search ranking.

Official guidance:
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/appearance/video

## Protected Behavior and Rollback

No app permissions, tenant boundaries, payroll calculations, private storage,
document delivery, authentication or notifications were changed. Existing user
edits and earlier demo assets were preserved. Changes remain local; no commit,
push or production deployment was performed.

Risk: Medium for publishing many new public pages; Low for HRMS runtime because
it is untouched. For rollback, remove the generated pages/media and new guide
sections, then reverse this task's canonical/navigation/sitemap/style changes
selectively. Preserve earlier user edits and the existing `demo-ar` assets.
