import QrScannerView from '@/views/attendance/QrScannerView.vue';
import AttendanceLogView from '@/views/attendance/AttendanceLogView.vue';

export default [
    {
        path: '/attendance/scan',
        name: 'attendance-scan',
        component: QrScannerView,
        meta: { requiresAuth: true }
    },
    {
        path: '/attendance/ledger',
        name: 'student-ledger',
        component: () => import('@/views/excuses/LedgerBalanceView.vue'),
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
    }
];