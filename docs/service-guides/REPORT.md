# Arabic Website Guides: Handover

## What Changed

- 20 core service guides, 60 Arabic annotated images and 20 silent 24-second MP4 videos.
- 14 new service pages; walkthroughs added to the six existing core pages and six existing sector/overview pages.
- 17 new service-specific articles, retaining the existing 22 articles: 39 total.
- Rebuilt the corrupted Arabic blog index with search, pagination and four crawlable archive pages.
- Added dedicated watch pages with transcripts, captions, stable posters and VideoObject schema.
- Corrected canonical/OG/schema URLs, malformed legacy aliases and invalid head/body nesting.
- Updated sitemaps, video sitemap, discovery links and crawler exclusions.
- Extended the thumbnail verifier to validate new guide images while retaining its legacy assertions.
- All new content, tooling and reports live in `D:/empid-web`. No publication or push occurred.

## What Was Not Changed

No HRMS application code, tenant boundaries, roles, authentication, payroll
calculations, private storage, document flows, email or queue behavior changed.
Earlier user edits and existing demo-ar assets were retained.

17 services use real synthetic-demo screen captures. Payroll, Performance and
Document Compliance use clearly labeled illustrations, not claimed UI evidence.
Screenshots contain demo records only; no login credentials or MFA screens.

## Verification

Run with Python dependencies in `D:/empid-web/.tools/python-packages`:

```powershell
python docs/service-guides/build_guides.py
python docs/service-guides/verify_guides.py
node --check service-guides.js
npm run verify:blog-thumbnails
```

Results: 96 public pages validated without failures/warnings; 20 videos fully
decoded at 1920x1080, 24 seconds and no audio; 39 posts with 22 mirrored legacy
thumbnails and 77 guide-image references verified. The thumbnail command was
initially blocked by missing local tsx; after installing website dependencies,
the final run passed.

Visible Pilot verification: 60 service layouts (390/768/1440px), 78 article
layouts (390/1440px), eight archive layouts, all 20 browser video metadata states,
mobile video playback, Arabic search/no-results/paging, archive navigation,
catalog click-through and guide-to-video links. No overflow or console errors
were observed. Raw evidence files are alongside this report.

No separate lint/typecheck/build commands are defined by this static website.
HRMS lint, unit suites, root E2E and responsive suites were not run because no
HRMS source changed. No production Lighthouse, Search Console or Google indexing
check ran: the website remains local. Ranking is not guaranteed.

## Risk Level

Medium for public publication of many pages/media; Low for HRMS runtime, which
is untouched. Editorial review and replacement of the three illustrative
guides remain publication considerations. Follow README.md for launch checks.

## Rollback Plan

Use the inventory below to reverse only this task's changes. Remove its new
guide pages/media and guide sections, then reverse canonical/navigation/sitemap
edits selectively. Preserve earlier user edits and the previous demo-ar files.
Do not reset the entire worktree.

## Files Changed

Complete inventory for this pass (ignored dependencies/render caches/server logs excluded):

- [.gitignore](<D:/empid-web/.gitignore>)
- [asset-management/index.html](<D:/empid-web/asset-management/index.html>)
- [assets/service-guides/asset-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/asset-management/guide-ar.vtt>)
- [assets/service-guides/asset-management/guide.mp4](<D:/empid-web/assets/service-guides/asset-management/guide.mp4>)
- [assets/service-guides/asset-management/poster.jpg](<D:/empid-web/assets/service-guides/asset-management/poster.jpg>)
- [assets/service-guides/asset-management/step-1.webp](<D:/empid-web/assets/service-guides/asset-management/step-1.webp>)
- [assets/service-guides/asset-management/step-2.webp](<D:/empid-web/assets/service-guides/asset-management/step-2.webp>)
- [assets/service-guides/asset-management/step-3.webp](<D:/empid-web/assets/service-guides/asset-management/step-3.webp>)
- [assets/service-guides/attendance-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/attendance-management/guide-ar.vtt>)
- [assets/service-guides/attendance-management/guide.mp4](<D:/empid-web/assets/service-guides/attendance-management/guide.mp4>)
- [assets/service-guides/attendance-management/poster.jpg](<D:/empid-web/assets/service-guides/attendance-management/poster.jpg>)
- [assets/service-guides/attendance-management/step-1.webp](<D:/empid-web/assets/service-guides/attendance-management/step-1.webp>)
- [assets/service-guides/attendance-management/step-2.webp](<D:/empid-web/assets/service-guides/attendance-management/step-2.webp>)
- [assets/service-guides/attendance-management/step-3.webp](<D:/empid-web/assets/service-guides/attendance-management/step-3.webp>)
- [assets/service-guides/benefits-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/benefits-management/guide-ar.vtt>)
- [assets/service-guides/benefits-management/guide.mp4](<D:/empid-web/assets/service-guides/benefits-management/guide.mp4>)
- [assets/service-guides/benefits-management/poster.jpg](<D:/empid-web/assets/service-guides/benefits-management/poster.jpg>)
- [assets/service-guides/benefits-management/step-1.webp](<D:/empid-web/assets/service-guides/benefits-management/step-1.webp>)
- [assets/service-guides/benefits-management/step-2.webp](<D:/empid-web/assets/service-guides/benefits-management/step-2.webp>)
- [assets/service-guides/benefits-management/step-3.webp](<D:/empid-web/assets/service-guides/benefits-management/step-3.webp>)
- [assets/service-guides/contract-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/contract-management/guide-ar.vtt>)
- [assets/service-guides/contract-management/guide.mp4](<D:/empid-web/assets/service-guides/contract-management/guide.mp4>)
- [assets/service-guides/contract-management/poster.jpg](<D:/empid-web/assets/service-guides/contract-management/poster.jpg>)
- [assets/service-guides/contract-management/step-1.webp](<D:/empid-web/assets/service-guides/contract-management/step-1.webp>)
- [assets/service-guides/contract-management/step-2.webp](<D:/empid-web/assets/service-guides/contract-management/step-2.webp>)
- [assets/service-guides/contract-management/step-3.webp](<D:/empid-web/assets/service-guides/contract-management/step-3.webp>)
- [assets/service-guides/document-compliance/guide-ar.vtt](<D:/empid-web/assets/service-guides/document-compliance/guide-ar.vtt>)
- [assets/service-guides/document-compliance/guide.mp4](<D:/empid-web/assets/service-guides/document-compliance/guide.mp4>)
- [assets/service-guides/document-compliance/poster.jpg](<D:/empid-web/assets/service-guides/document-compliance/poster.jpg>)
- [assets/service-guides/document-compliance/step-1.webp](<D:/empid-web/assets/service-guides/document-compliance/step-1.webp>)
- [assets/service-guides/document-compliance/step-2.webp](<D:/empid-web/assets/service-guides/document-compliance/step-2.webp>)
- [assets/service-guides/document-compliance/step-3.webp](<D:/empid-web/assets/service-guides/document-compliance/step-3.webp>)
- [assets/service-guides/document-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/document-management/guide-ar.vtt>)
- [assets/service-guides/document-management/guide.mp4](<D:/empid-web/assets/service-guides/document-management/guide.mp4>)
- [assets/service-guides/document-management/poster.jpg](<D:/empid-web/assets/service-guides/document-management/poster.jpg>)
- [assets/service-guides/document-management/step-1.webp](<D:/empid-web/assets/service-guides/document-management/step-1.webp>)
- [assets/service-guides/document-management/step-2.webp](<D:/empid-web/assets/service-guides/document-management/step-2.webp>)
- [assets/service-guides/document-management/step-3.webp](<D:/empid-web/assets/service-guides/document-management/step-3.webp>)
- [assets/service-guides/employee-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/employee-management/guide-ar.vtt>)
- [assets/service-guides/employee-management/guide.mp4](<D:/empid-web/assets/service-guides/employee-management/guide.mp4>)
- [assets/service-guides/employee-management/poster.jpg](<D:/empid-web/assets/service-guides/employee-management/poster.jpg>)
- [assets/service-guides/employee-management/step-1.webp](<D:/empid-web/assets/service-guides/employee-management/step-1.webp>)
- [assets/service-guides/employee-management/step-2.webp](<D:/empid-web/assets/service-guides/employee-management/step-2.webp>)
- [assets/service-guides/employee-management/step-3.webp](<D:/empid-web/assets/service-guides/employee-management/step-3.webp>)
- [assets/service-guides/employee-self-service/guide-ar.vtt](<D:/empid-web/assets/service-guides/employee-self-service/guide-ar.vtt>)
- [assets/service-guides/employee-self-service/guide.mp4](<D:/empid-web/assets/service-guides/employee-self-service/guide.mp4>)
- [assets/service-guides/employee-self-service/poster.jpg](<D:/empid-web/assets/service-guides/employee-self-service/poster.jpg>)
- [assets/service-guides/employee-self-service/step-1.webp](<D:/empid-web/assets/service-guides/employee-self-service/step-1.webp>)
- [assets/service-guides/employee-self-service/step-2.webp](<D:/empid-web/assets/service-guides/employee-self-service/step-2.webp>)
- [assets/service-guides/employee-self-service/step-3.webp](<D:/empid-web/assets/service-guides/employee-self-service/step-3.webp>)
- [assets/service-guides/expense-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/expense-management/guide-ar.vtt>)
- [assets/service-guides/expense-management/guide.mp4](<D:/empid-web/assets/service-guides/expense-management/guide.mp4>)
- [assets/service-guides/expense-management/poster.jpg](<D:/empid-web/assets/service-guides/expense-management/poster.jpg>)
- [assets/service-guides/expense-management/step-1.webp](<D:/empid-web/assets/service-guides/expense-management/step-1.webp>)
- [assets/service-guides/expense-management/step-2.webp](<D:/empid-web/assets/service-guides/expense-management/step-2.webp>)
- [assets/service-guides/expense-management/step-3.webp](<D:/empid-web/assets/service-guides/expense-management/step-3.webp>)
- [assets/service-guides/leave-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/leave-management/guide-ar.vtt>)
- [assets/service-guides/leave-management/guide.mp4](<D:/empid-web/assets/service-guides/leave-management/guide.mp4>)
- [assets/service-guides/leave-management/poster.jpg](<D:/empid-web/assets/service-guides/leave-management/poster.jpg>)
- [assets/service-guides/leave-management/step-1.webp](<D:/empid-web/assets/service-guides/leave-management/step-1.webp>)
- [assets/service-guides/leave-management/step-2.webp](<D:/empid-web/assets/service-guides/leave-management/step-2.webp>)
- [assets/service-guides/leave-management/step-3.webp](<D:/empid-web/assets/service-guides/leave-management/step-3.webp>)
- [assets/service-guides/notification-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/notification-management/guide-ar.vtt>)
- [assets/service-guides/notification-management/guide.mp4](<D:/empid-web/assets/service-guides/notification-management/guide.mp4>)
- [assets/service-guides/notification-management/poster.jpg](<D:/empid-web/assets/service-guides/notification-management/poster.jpg>)
- [assets/service-guides/notification-management/step-1.webp](<D:/empid-web/assets/service-guides/notification-management/step-1.webp>)
- [assets/service-guides/notification-management/step-2.webp](<D:/empid-web/assets/service-guides/notification-management/step-2.webp>)
- [assets/service-guides/notification-management/step-3.webp](<D:/empid-web/assets/service-guides/notification-management/step-3.webp>)
- [assets/service-guides/onboarding-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/onboarding-management/guide-ar.vtt>)
- [assets/service-guides/onboarding-management/guide.mp4](<D:/empid-web/assets/service-guides/onboarding-management/guide.mp4>)
- [assets/service-guides/onboarding-management/poster.jpg](<D:/empid-web/assets/service-guides/onboarding-management/poster.jpg>)
- [assets/service-guides/onboarding-management/step-1.webp](<D:/empid-web/assets/service-guides/onboarding-management/step-1.webp>)
- [assets/service-guides/onboarding-management/step-2.webp](<D:/empid-web/assets/service-guides/onboarding-management/step-2.webp>)
- [assets/service-guides/onboarding-management/step-3.webp](<D:/empid-web/assets/service-guides/onboarding-management/step-3.webp>)
- [assets/service-guides/payroll-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/payroll-management/guide-ar.vtt>)
- [assets/service-guides/payroll-management/guide.mp4](<D:/empid-web/assets/service-guides/payroll-management/guide.mp4>)
- [assets/service-guides/payroll-management/poster.jpg](<D:/empid-web/assets/service-guides/payroll-management/poster.jpg>)
- [assets/service-guides/payroll-management/step-1.webp](<D:/empid-web/assets/service-guides/payroll-management/step-1.webp>)
- [assets/service-guides/payroll-management/step-2.webp](<D:/empid-web/assets/service-guides/payroll-management/step-2.webp>)
- [assets/service-guides/payroll-management/step-3.webp](<D:/empid-web/assets/service-guides/payroll-management/step-3.webp>)
- [assets/service-guides/performance-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/performance-management/guide-ar.vtt>)
- [assets/service-guides/performance-management/guide.mp4](<D:/empid-web/assets/service-guides/performance-management/guide.mp4>)
- [assets/service-guides/performance-management/poster.jpg](<D:/empid-web/assets/service-guides/performance-management/poster.jpg>)
- [assets/service-guides/performance-management/step-1.webp](<D:/empid-web/assets/service-guides/performance-management/step-1.webp>)
- [assets/service-guides/performance-management/step-2.webp](<D:/empid-web/assets/service-guides/performance-management/step-2.webp>)
- [assets/service-guides/performance-management/step-3.webp](<D:/empid-web/assets/service-guides/performance-management/step-3.webp>)
- [assets/service-guides/project-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/project-management/guide-ar.vtt>)
- [assets/service-guides/project-management/guide.mp4](<D:/empid-web/assets/service-guides/project-management/guide.mp4>)
- [assets/service-guides/project-management/poster.jpg](<D:/empid-web/assets/service-guides/project-management/poster.jpg>)
- [assets/service-guides/project-management/step-1.webp](<D:/empid-web/assets/service-guides/project-management/step-1.webp>)
- [assets/service-guides/project-management/step-2.webp](<D:/empid-web/assets/service-guides/project-management/step-2.webp>)
- [assets/service-guides/project-management/step-3.webp](<D:/empid-web/assets/service-guides/project-management/step-3.webp>)
- [assets/service-guides/reports-analytics/guide-ar.vtt](<D:/empid-web/assets/service-guides/reports-analytics/guide-ar.vtt>)
- [assets/service-guides/reports-analytics/guide.mp4](<D:/empid-web/assets/service-guides/reports-analytics/guide.mp4>)
- [assets/service-guides/reports-analytics/poster.jpg](<D:/empid-web/assets/service-guides/reports-analytics/poster.jpg>)
- [assets/service-guides/reports-analytics/step-1.webp](<D:/empid-web/assets/service-guides/reports-analytics/step-1.webp>)
- [assets/service-guides/reports-analytics/step-2.webp](<D:/empid-web/assets/service-guides/reports-analytics/step-2.webp>)
- [assets/service-guides/reports-analytics/step-3.webp](<D:/empid-web/assets/service-guides/reports-analytics/step-3.webp>)
- [assets/service-guides/shift-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/shift-management/guide-ar.vtt>)
- [assets/service-guides/shift-management/guide.mp4](<D:/empid-web/assets/service-guides/shift-management/guide.mp4>)
- [assets/service-guides/shift-management/poster.jpg](<D:/empid-web/assets/service-guides/shift-management/poster.jpg>)
- [assets/service-guides/shift-management/step-1.webp](<D:/empid-web/assets/service-guides/shift-management/step-1.webp>)
- [assets/service-guides/shift-management/step-2.webp](<D:/empid-web/assets/service-guides/shift-management/step-2.webp>)
- [assets/service-guides/shift-management/step-3.webp](<D:/empid-web/assets/service-guides/shift-management/step-3.webp>)
- [assets/service-guides/task-management/guide-ar.vtt](<D:/empid-web/assets/service-guides/task-management/guide-ar.vtt>)
- [assets/service-guides/task-management/guide.mp4](<D:/empid-web/assets/service-guides/task-management/guide.mp4>)
- [assets/service-guides/task-management/poster.jpg](<D:/empid-web/assets/service-guides/task-management/poster.jpg>)
- [assets/service-guides/task-management/step-1.webp](<D:/empid-web/assets/service-guides/task-management/step-1.webp>)
- [assets/service-guides/task-management/step-2.webp](<D:/empid-web/assets/service-guides/task-management/step-2.webp>)
- [assets/service-guides/task-management/step-3.webp](<D:/empid-web/assets/service-guides/task-management/step-3.webp>)
- [assets/service-guides/time-tracking/guide-ar.vtt](<D:/empid-web/assets/service-guides/time-tracking/guide-ar.vtt>)
- [assets/service-guides/time-tracking/guide.mp4](<D:/empid-web/assets/service-guides/time-tracking/guide.mp4>)
- [assets/service-guides/time-tracking/poster.jpg](<D:/empid-web/assets/service-guides/time-tracking/poster.jpg>)
- [assets/service-guides/time-tracking/step-1.webp](<D:/empid-web/assets/service-guides/time-tracking/step-1.webp>)
- [assets/service-guides/time-tracking/step-2.webp](<D:/empid-web/assets/service-guides/time-tracking/step-2.webp>)
- [assets/service-guides/time-tracking/step-3.webp](<D:/empid-web/assets/service-guides/time-tracking/step-3.webp>)
- [assets/service-guides/workforce-management-system/guide-ar.vtt](<D:/empid-web/assets/service-guides/workforce-management-system/guide-ar.vtt>)
- [assets/service-guides/workforce-management-system/guide.mp4](<D:/empid-web/assets/service-guides/workforce-management-system/guide.mp4>)
- [assets/service-guides/workforce-management-system/poster.jpg](<D:/empid-web/assets/service-guides/workforce-management-system/poster.jpg>)
- [assets/service-guides/workforce-management-system/step-1.webp](<D:/empid-web/assets/service-guides/workforce-management-system/step-1.webp>)
- [assets/service-guides/workforce-management-system/step-2.webp](<D:/empid-web/assets/service-guides/workforce-management-system/step-2.webp>)
- [assets/service-guides/workforce-management-system/step-3.webp](<D:/empid-web/assets/service-guides/workforce-management-system/step-3.webp>)
- [attendance-management/index.html](<D:/empid-web/attendance-management/index.html>)
- [benefits-management/index.html](<D:/empid-web/benefits-management/index.html>)
- [blog/attendance-management-system.html](<D:/empid-web/blog/attendance-management-system.html>)
- [blog/attendance-management-system/index.html](<D:/empid-web/blog/attendance-management-system/index.html>)
- [blog/best-hrms-saudi-arabia.html](<D:/empid-web/blog/best-hrms-saudi-arabia.html>)
- [blog/best-hrms-saudi-arabia/index.html](<D:/empid-web/blog/best-hrms-saudi-arabia/index.html>)
- [blog/construction-attendance.html](<D:/empid-web/blog/construction-attendance.html>)
- [blog/construction-attendance/index.html](<D:/empid-web/blog/construction-attendance/index.html>)
- [blog/construction-site-shift-handover.html](<D:/empid-web/blog/construction-site-shift-handover.html>)
- [blog/document-compliance-guide.html](<D:/empid-web/blog/document-compliance-guide.html>)
- [blog/employee-assets-guide.html](<D:/empid-web/blog/employee-assets-guide.html>)
- [blog/employee-benefits-guide.html](<D:/empid-web/blog/employee-benefits-guide.html>)
- [blog/employee-contracts-guide.html](<D:/empid-web/blog/employee-contracts-guide.html>)
- [blog/employee-documents-guide.html](<D:/empid-web/blog/employee-documents-guide.html>)
- [blog/employee-expenses-guide.html](<D:/empid-web/blog/employee-expenses-guide.html>)
- [blog/employee-lifecycle-onboarding-offboarding.html](<D:/empid-web/blog/employee-lifecycle-onboarding-offboarding.html>)
- [blog/employee-onboarding-guide.html](<D:/empid-web/blog/employee-onboarding-guide.html>)
- [blog/employee-records-guide.html](<D:/empid-web/blog/employee-records-guide.html>)
- [blog/employee-self-service-advanced-requests.html](<D:/empid-web/blog/employee-self-service-advanced-requests.html>)
- [blog/employee-self-service.html](<D:/empid-web/blog/employee-self-service.html>)
- [blog/employee-self-service/index.html](<D:/empid-web/blog/employee-self-service/index.html>)
- [blog/how-to-choose-hrms.html](<D:/empid-web/blog/how-to-choose-hrms.html>)
- [blog/how-to-choose-hrms/index.html](<D:/empid-web/blog/how-to-choose-hrms/index.html>)
- [blog/hr-notifications-guide.html](<D:/empid-web/blog/hr-notifications-guide.html>)
- [blog/hr-reporting-guide.html](<D:/empid-web/blog/hr-reporting-guide.html>)
- [blog/hrms-go-live-checklist.html](<D:/empid-web/blog/hrms-go-live-checklist.html>)
- [blog/hrms-vs-excel.html](<D:/empid-web/blog/hrms-vs-excel.html>)
- [blog/hrms-vs-excel/index.html](<D:/empid-web/blog/hrms-vs-excel/index.html>)
- [blog/index.html](<D:/empid-web/blog/index.html>)
- [blog/leave-balance-forecasting.html](<D:/empid-web/blog/leave-balance-forecasting.html>)
- [blog/leave-management.html](<D:/empid-web/blog/leave-management.html>)
- [blog/leave-management/index.html](<D:/empid-web/blog/leave-management/index.html>)
- [blog/multi-branch-employee-management.html](<D:/empid-web/blog/multi-branch-employee-management.html>)
- [blog/multi-branch-employee-management/index.html](<D:/empid-web/blog/multi-branch-employee-management/index.html>)
- [blog/multi-branch-workforce-standardization.html](<D:/empid-web/blog/multi-branch-workforce-standardization.html>)
- [blog/night-shift-safety-attendance.html](<D:/empid-web/blog/night-shift-safety-attendance.html>)
- [blog/page/2/index.html](<D:/empid-web/blog/page/2/index.html>)
- [blog/page/3/index.html](<D:/empid-web/blog/page/3/index.html>)
- [blog/page/4/index.html](<D:/empid-web/blog/page/4/index.html>)
- [blog/page/5/index.html](<D:/empid-web/blog/page/5/index.html>)
- [blog/payroll-cost-center-control.html](<D:/empid-web/blog/payroll-cost-center-control.html>)
- [blog/payroll-errors.html](<D:/empid-web/blog/payroll-errors.html>)
- [blog/payroll-errors/index.html](<D:/empid-web/blog/payroll-errors/index.html>)
- [blog/payroll-workflow-guide.html](<D:/empid-web/blog/payroll-workflow-guide.html>)
- [blog/performance-reviews-guide.html](<D:/empid-web/blog/performance-reviews-guide.html>)
- [blog/project-time-tracking-guide.html](<D:/empid-web/blog/project-time-tracking-guide.html>)
- [blog/remote-team-attendance-guidelines.html](<D:/empid-web/blog/remote-team-attendance-guidelines.html>)
- [blog/role-based-access-control-hrms.html](<D:/empid-web/blog/role-based-access-control-hrms.html>)
- [blog/security-incident-checklist-for-attendance.html](<D:/empid-web/blog/security-incident-checklist-for-attendance.html>)
- [blog/security-workforce-management.html](<D:/empid-web/blog/security-workforce-management.html>)
- [blog/security-workforce-management/index.html](<D:/empid-web/blog/security-workforce-management/index.html>)
- [blog/task-workload-guide.html](<D:/empid-web/blog/task-workload-guide.html>)
- [blog/work-shifts-guide.html](<D:/empid-web/blog/work-shifts-guide.html>)
- [blog/workforce-analytics-kpi-dashboard.html](<D:/empid-web/blog/workforce-analytics-kpi-dashboard.html>)
- [blog/workforce-operations-guide.html](<D:/empid-web/blog/workforce-operations-guide.html>)
- [blog/workforce-projects-guide.html](<D:/empid-web/blog/workforce-projects-guide.html>)
- [construction-hr-software/index.html](<D:/empid-web/construction-hr-software/index.html>)
- [contract-management/index.html](<D:/empid-web/contract-management/index.html>)
- [docs/service-guides/README.md](<D:/empid-web/docs/service-guides/README.md>)
- [docs/service-guides/REPORT.md](<D:/empid-web/docs/service-guides/REPORT.md>)
- [docs/service-guides/archive-responsive-validation.json](<D:/empid-web/docs/service-guides/archive-responsive-validation.json>)
- [docs/service-guides/blog-responsive-validation.json](<D:/empid-web/docs/service-guides/blog-responsive-validation.json>)
- [docs/service-guides/build_guides.py](<D:/empid-web/docs/service-guides/build_guides.py>)
- [docs/service-guides/catalog-desktop.png](<D:/empid-web/docs/service-guides/catalog-desktop.png>)
- [docs/service-guides/catalog-mobile.png](<D:/empid-web/docs/service-guides/catalog-mobile.png>)
- [docs/service-guides/document-guide-desktop.png](<D:/empid-web/docs/service-guides/document-guide-desktop.png>)
- [docs/service-guides/evidence.json](<D:/empid-web/docs/service-guides/evidence.json>)
- [docs/service-guides/files-changed.json](<D:/empid-web/docs/service-guides/files-changed.json>)
- [docs/service-guides/raw/assets.png](<D:/empid-web/docs/service-guides/raw/assets.png>)
- [docs/service-guides/raw/benefits.png](<D:/empid-web/docs/service-guides/raw/benefits.png>)
- [docs/service-guides/raw/contracts.png](<D:/empid-web/docs/service-guides/raw/contracts.png>)
- [docs/service-guides/raw/expenses.png](<D:/empid-web/docs/service-guides/raw/expenses.png>)
- [docs/service-guides/raw/notifications.png](<D:/empid-web/docs/service-guides/raw/notifications.png>)
- [docs/service-guides/raw/onboarding.png](<D:/empid-web/docs/service-guides/raw/onboarding.png>)
- [docs/service-guides/raw/reports.png](<D:/empid-web/docs/service-guides/raw/reports.png>)
- [docs/service-guides/raw/shifts.png](<D:/empid-web/docs/service-guides/raw/shifts.png>)
- [docs/service-guides/raw/time-tracking.png](<D:/empid-web/docs/service-guides/raw/time-tracking.png>)
- [docs/service-guides/requirements.txt](<D:/empid-web/docs/service-guides/requirements.txt>)
- [docs/service-guides/responsive-validation.json](<D:/empid-web/docs/service-guides/responsive-validation.json>)
- [docs/service-guides/services.json](<D:/empid-web/docs/service-guides/services.json>)
- [docs/service-guides/validation.json](<D:/empid-web/docs/service-guides/validation.json>)
- [docs/service-guides/verify_guides.py](<D:/empid-web/docs/service-guides/verify_guides.py>)
- [docs/service-guides/video-browser-validation.json](<D:/empid-web/docs/service-guides/video-browser-validation.json>)
- [docs/service-guides/video-mobile.png](<D:/empid-web/docs/service-guides/video-mobile.png>)
- [docs/service-guides/website-preview.png](<D:/empid-web/docs/service-guides/website-preview.png>)
- [document-compliance/index.html](<D:/empid-web/document-compliance/index.html>)
- [document-management/index.html](<D:/empid-web/document-management/index.html>)
- [employee-management/index.html](<D:/empid-web/employee-management/index.html>)
- [employee-self-service/index.html](<D:/empid-web/employee-self-service/index.html>)
- [expense-management/index.html](<D:/empid-web/expense-management/index.html>)
- [healthcare-hr-software/index.html](<D:/empid-web/healthcare-hr-software/index.html>)
- [hrms-saudi-arabia/index.html](<D:/empid-web/hrms-saudi-arabia/index.html>)
- [index.html](<D:/empid-web/index.html>)
- [leave-management/index.html](<D:/empid-web/leave-management/index.html>)
- [logistics-workforce-management/index.html](<D:/empid-web/logistics-workforce-management/index.html>)
- [notification-management/index.html](<D:/empid-web/notification-management/index.html>)
- [onboarding-management/index.html](<D:/empid-web/onboarding-management/index.html>)
- [payroll-management/index.html](<D:/empid-web/payroll-management/index.html>)
- [performance-management/index.html](<D:/empid-web/performance-management/index.html>)
- [private-school-hr-software/index.html](<D:/empid-web/private-school-hr-software/index.html>)
- [project-management/index.html](<D:/empid-web/project-management/index.html>)
- [reports-analytics/index.html](<D:/empid-web/reports-analytics/index.html>)
- [robots.txt](<D:/empid-web/robots.txt>)
- [security-workforce-management/index.html](<D:/empid-web/security-workforce-management/index.html>)
- [service-guides.css](<D:/empid-web/service-guides.css>)
- [service-guides.js](<D:/empid-web/service-guides.js>)
- [shift-management/index.html](<D:/empid-web/shift-management/index.html>)
- [sitemap.xml](<D:/empid-web/sitemap.xml>)
- [task-management/index.html](<D:/empid-web/task-management/index.html>)
- [tests/screenshots/retake-app-blog-thumbnails.ts](<D:/empid-web/tests/screenshots/retake-app-blog-thumbnails.ts>)
- [time-tracking/index.html](<D:/empid-web/time-tracking/index.html>)
- [video-sitemap.xml](<D:/empid-web/video-sitemap.xml>)
- [videos/asset-management/index.html](<D:/empid-web/videos/asset-management/index.html>)
- [videos/attendance-management/index.html](<D:/empid-web/videos/attendance-management/index.html>)
- [videos/benefits-management/index.html](<D:/empid-web/videos/benefits-management/index.html>)
- [videos/contract-management/index.html](<D:/empid-web/videos/contract-management/index.html>)
- [videos/document-compliance/index.html](<D:/empid-web/videos/document-compliance/index.html>)
- [videos/document-management/index.html](<D:/empid-web/videos/document-management/index.html>)
- [videos/employee-management/index.html](<D:/empid-web/videos/employee-management/index.html>)
- [videos/employee-self-service/index.html](<D:/empid-web/videos/employee-self-service/index.html>)
- [videos/expense-management/index.html](<D:/empid-web/videos/expense-management/index.html>)
- [videos/index.html](<D:/empid-web/videos/index.html>)
- [videos/leave-management/index.html](<D:/empid-web/videos/leave-management/index.html>)
- [videos/notification-management/index.html](<D:/empid-web/videos/notification-management/index.html>)
- [videos/onboarding-management/index.html](<D:/empid-web/videos/onboarding-management/index.html>)
- [videos/payroll-management/index.html](<D:/empid-web/videos/payroll-management/index.html>)
- [videos/performance-management/index.html](<D:/empid-web/videos/performance-management/index.html>)
- [videos/project-management/index.html](<D:/empid-web/videos/project-management/index.html>)
- [videos/reports-analytics/index.html](<D:/empid-web/videos/reports-analytics/index.html>)
- [videos/shift-management/index.html](<D:/empid-web/videos/shift-management/index.html>)
- [videos/task-management/index.html](<D:/empid-web/videos/task-management/index.html>)
- [videos/time-tracking/index.html](<D:/empid-web/videos/time-tracking/index.html>)
- [videos/workforce-management-system/index.html](<D:/empid-web/videos/workforce-management-system/index.html>)
- [workforce-management-system/index.html](<D:/empid-web/workforce-management-system/index.html>)
