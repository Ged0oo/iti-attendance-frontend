# ITI Attendance & Grading Platform — M5 Frontend

## Project Overview
Internal management system for the Information Technology Institute (ITI), Egypt.
Full-stack: Laravel 11 REST API backend + Vue 3 SPA frontend.
Backend is live at: http://13.60.179.178/api
Auth: Laravel Sanctum (Bearer token)
<!-- CORRECTED: tsconfig files exist but are NOT used in practice. All real
     stores/views in this repo are .js / .vue WITHOUT lang="ts". Do NOT add
     lang="ts" or TypeScript types/interfaces to any file — match the existing
     plain-JS Composition API style exactly. -->
Language: JavaScript (Vue 3 Composition API, plain <script setup> — no TypeScript)

## My Role — M5
I own the Student Portal and Attendance modules:
- Students module (StudentDashboard, StudentGradeCard)
- AttendanceLedger module (LedgerBalance, LedgerEntries)
- AttendanceLedgerEntry module (timeline entries inside ledger)
- ExcuseRequest module (submission form + states)

## My Screens (in priority order)
1. src/views/dashboard/StudentDashboard.vue
2. src/views/attendance/LedgerBalanceView.vue
3. src/views/excuses/ExcuseFormView.vue
4. src/views/attendance/QrScannerView.vue
5. src/views/dashboard/StudentGradeCardView.vue

## Tech Stack
- Vue 3 Composition API — ALWAYS use plain <script setup> (NO "lang=ts")
- Plain JavaScript throughout — no TS types/interfaces/generics
- Pinia for state management (Setup Stores for excuse.js, Options Stores for
  ledger.js/attendance.js — match each file's existing style, don't convert)
- Vue Router 4 — routes split by domain file (attendance.routes.js, excuse.routes.js)
- API via src/services/api.js — DO NOT create a new axios file
<!-- CORRECTED: src/composables/useApi.js does NOT exist in this repo.
     Available composables are: useAuth.js, usePasswordFlow.js, useUtils.js. -->
- Composables: src/composables/useAuth.js — USE for auth helpers, don't duplicate
- Tailwind utility classes are the project convention — use them freely;
scoped CSS is only for things Tailwind can't express, like the SVG ring in
GrandTotalRing.vue
- jsQR library for QR scanning

## Design System (from DESIGN.md — AUTHORITATIVE SOURCE)
Fonts:
  Heading/Display: "Playfair Display, Georgia, serif"
  Body/UI:         "DM Sans, system-ui, sans-serif"
  Mono (IDs/timestamps): "JetBrains Mono, Courier New, monospace"
  KPI numbers (dashboards): Playfair Display 40px

Colors:
  --color-primary: #8B1A1A        (ITI Crimson)
  --color-primary-deep: #6B1212   (hover state)
  --color-primary-mist: #F9EAEA   (light fill)
  --color-shell: #1A0A0A          (sidebar bg)
  --color-canvas: #F7F7F7         (page bg)
  --color-surface: #FFFFFF        (card bg)
  --color-success: #059669
  --color-success-mist: #ECFDF5
  --color-warning: #D97706
  --color-warning-mist: #FFFBEB
  --color-danger: #DC2626
  --color-danger-mist: #FEF2F2
  --color-text: #1A1A2E
  --color-text-secondary: #6B7280
  --role-bm: #7C3AED
  --role-ta: #0369A1
  --role-instructor: #0D9488
  --role-student: #6B7280

Card:
  border-radius: 16px
  shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
  padding: 24px

Buttons (primary):
  background: #8B1A1A, hover: #6B1212
  height: 44px, border-radius: 8px, font-size: 14px

## Business Rules (CRITICAL)
- At-Risk threshold: ledger_balance < 150 pts -> crimson styling everywhere
- Starting ledger balance: 250 pts
- Unexcused absence deduction: -25 pts
- Excused absence deduction: -5 pts
- Grand Total = Attendance Ledger + Sum of Course Normalized Scores

## API Base URL
http://13.60.179.178/api

## API endpoints
Always when dealing with endpoints do not assume anything but look for it in the
postman_collection.json.

<!-- ADDED: known data-layer facts, confirmed against the codebase, to stop Gemini
     from re-guessing these every session: -->
## Known Data Shapes (do not re-derive — verified)
- The authenticated user object (src/stores/auth.js `user` state, populated by
  /me) does NOT have top-level `studentId`/`cohortId`/`studentProfile` getters.
  Always read `authStore.user?.student_id`, `authStore.user?.cohort_id`,
  `authStore.user?.cohort` directly from the `user` object — never invent a
  getter on auth.js (it's M1's file, read-only for me).
- src/stores/ledger.js exposes: balance, max, threshold (150), entries, loading,
  error, getters isAtRisk/balancePercentage, action fetchLedger(studentId).
- src/stores/attendance.js exposes: scanState ('scanning'|'checked-in'|
  'checked-out'|'duplicate'|'expired'|'invalid'|'wrong-day'|'error'), loading,
  lastScanResult, action submitScan(qrCodeString) [never throws], action
  resetScan().
- src/stores/excuse.js (Setup Store) exposes: excuseRequests, submitting,
  submitted, fieldErrors, actions fetchExcuseRequests/submitExcuse/reset.
- Router route names I depend on (do not rename without updating my router.push
  calls): 'submit-excuse' (/excuses/submit), 'student-ledger' (/attendance/ledger),
  'dashboard.student' (/dashboards/student), 'student-grade-card' (/student/grades).

## Stitch Exports (reference HTML for pixel-accurate conversion)
stitch-exports/student_dashboard_iti_platform/code.html
stitch-exports/attendance_ledger_iti_student_portal/code.html
stitch-exports/excuse_submission_iti_student_portal/code.html
stitch-exports/qr_scanner_iti_student_portal/code.html
stitch-exports/student_grade_card_iti_portal/code.html

## Team Boundaries (DO NOT CROSS)
I CREATE NEW FILES IN:
  src/views/dashboard/           <- StudentDashboard, StudentGradeCardView
  src/views/attendance/          <- LedgerBalanceView, QrScannerView
  src/views/excuses/             <- ExcuseFormView
  src/components/student/
  src/components/attendance/

I ADD ROUTES TO (don't rewrite, just append):
  src/router/attendance.routes.js
  src/router/excuse.routes.js

I EXTEND IF NEEDED (file exists, check first before adding):
  src/stores/ledger.js
  src/stores/attendance.js
<!-- ADDED: excuse.js was missing from this list even though ExcuseFormView.vue
     depends on it and I'm the only consumer. -->
  src/stores/excuse.js

I READ ONLY (never modify):
  src/stores/auth.js             <- M1
  src/stores/grading.js          <- M6
  src/services/api.js            <- shared
  src/composables/useAuth.js

I NEVER TOUCH:
  src/views/cohorts/
  src/views/scheduling/
  src/views/grading/
  src/views/auth/
  src/stores/cohort.js
  src/stores/engagement.js
<!-- ADDED: flag, don't delete, this orphaned/duplicate file if encountered: -->
  src/views/excuses/LedgerBalanceView.vue  <- NOT mine, not routed, unclear
                                               ownership — flag to team lead,
                                               do not edit or delete unilaterally

## Sub-components I Will Create
src/components/attendance/
  LedgerTimeline.vue
  BalanceHeroCard.vue
  ExcuseUploadZone.vue
  QrScanFrame.vue
  QrStatusCard.vue

src/components/student/
  SummaryCard.vue
  CourseGradeBar.vue
  GrandTotalRing.vue
  SessionCard.vue

## Skills to Load
Always:        /antigravity-workflows
/context-driven-development
UI conversion: /stitch-ui-design/antigravity-design-expert
Components:    /senior-frontend/ui-component
Testing:       /tdd-workflow
Debugging:     /systematic-debugging