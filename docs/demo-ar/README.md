# EMPID Arabic marketing demo

Production date: 5 October 2026.

Local capture target: http://127.0.0.1:5173 and http://localhost:5173.

Use the existing synthetic Arabic demonstration records for شركة الريادة للمقاولات والخدمات. Do not include authentication screens, passwords, MFA codes, recovery codes, or genuine employee data in deliverable media.

The planned output is a narrated Arabic walkthrough assembled from verified app screenshots, with Arabic subtitles. It is a guided product video, not a continuous screen recording. Workflow claims must correspond to observed outcomes. Unsupported scenes are removed rather than simulated.

Captured roles: فاطمة الزهراني (HR manager/reviewer), مريم الشمري (employee). Separate browser origins preserve independent authenticated sessions.

Observed workflow: Maryam submitted synthetic annual leave request 86 for 18-20 October 2026. Fatima reviewed and approved it with a demo comment. Maryam's annual remaining balance changed from 17 to 14 days; the employee page displayed approval. The labeled request is preserved as demo evidence.

No app code, permissions, storage configuration, payroll calculations, or credentials were changed. Language/date preferences were saved for the two demo accounts. Existing demo records were reused; the seed script was not rerun.

Voice: synthesized Arabic Saudi female narration (ar-SA-ZariyahNeural). Subtitles use approximate sentence timing, not forced word alignment. Review pronunciation and subtitle timing before public publication.

Remaining presentation observations: some dashboard quick-action labels truncate, a few activity strings remain English, and the existing demo shift name/department are English. This media task does not silently fix application behavior. No full acceptance/security claim is made by this demo.

Output location: assets/demo-ar/. Production source, evidence and narration: docs/demo-ar/.

Do not publish or change the live website automatically. Review the finished local media before placing it on the public site.

## Verification

- `build_demo.py narrate`: nine Arabic narration clips generated successfully.
- `build_demo.py render`: nine chapters assembled, including additional workflow screenshots, branding outro, MP4, voiceover MP3, poster, Arabic VTT and script.
- `verify_demo.py`: full MP4 video/audio decode passed; H.264/AAC, 1920x1080, 25 fps, approximately 3 minutes 24 seconds.
- Visual review: captured screenshots, review sheet, review chapter and Arabic branding outro inspected. No login/MFA screens included.
- App lint/typecheck/build/unit/E2E suites were not run: no application source code changed. This is media production, not service acceptance coverage.
- Human review of synthesized pronunciation, approximate caption timing and commercial publication rights remains required before release.

## Risk And Rollback

Low risk for local media files. No website pages were modified or published. Remove only this task's untracked `assets/demo-ar` and `docs/demo-ar` assets to undo media production. Do not revert pre-existing website edits. The demo accounts' saved preferences and synthetic leave request 86 remain in the local application; use normal preference and leave-management workflows if those should be changed.
