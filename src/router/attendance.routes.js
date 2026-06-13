export default [
    {
        path: '/attendance/scan',
        name: 'attendance-scan',
        component: () => import('@/views/attendance/QrScannerView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/attendance/ledger',
        name: 'student-ledger',
        component: () => import('@/views/attendance/LedgerBalanceView.vue'),
        meta: { requiresAuth: true }
    },
    {
    path: '/attendance/session/:id/qr',
        name: 'session-qr',
        component: () => import('@/views/attendance/SessionQrView.vue'),
        meta: { 
            requiresAuth: true, 
            allowedRoles: ['instructor', 'track_admin', 'branch_manager'] 
        }
    },
    {
        path: '/attendance/session/:id/log',
        name: 'attendance-log',
        component: () => import('@/views/attendance/AttendanceLogView.vue'),
        meta: { 
            requiresAuth: true, 
            allowedRoles: ['instructor', 'track_admin', 'branch_manager'] 
        }
    },
    {
        path: '/student/grades',
        name: 'student-grade-card',
        component: () => import('@/views/dashboard/StudentGradeCardView.vue'),
        meta: { requiresAuth: true, roles: ['student'] }
    }
];