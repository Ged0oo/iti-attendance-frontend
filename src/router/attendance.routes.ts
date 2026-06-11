export default [
  // ── Student Dashboard ──────────────────────────────────────────────────────
  {
    path: '/student/dashboard',
    name: 'StudentDashboard',
    component: () => import('@/views/dashboard/StudentDashboard.vue'),
    meta: { requiresAuth: true, roles: ['student'] },
  },
  {
    path: '/student/grades',
    name: 'StudentGradeCard',
    component: () => import('@/views/dashboard/StudentGradeCardView.vue'),
    meta: { requiresAuth: true, roles: ['student'] },
  },

  // ── Attendance ─────────────────────────────────────────────────────────────
  {
    path: '/attendance/ledger',
    name: 'LedgerBalance',
    component: () => import('@/views/attendance/LedgerBalanceView.vue'),
    meta: { requiresAuth: true, roles: ['student'] },
  },
  {
    path: '/attendance/scan',
    name: 'QrScanner',
    component: () => import('@/views/attendance/QrScannerView.vue'),
    meta: { requiresAuth: true, roles: ['student'] },
  },
]
