import QrScannerView from '@/views/attendance/QrScannerView.vue';
import AttendanceLogView from '@/views/attendance/AttendanceLogView.vue';

export default [
    {
        path: '/excuses/submit',
        name: 'submit-excuse',
        component: () => import('@/views/excuses/ExcuseFormView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/excuses/review',
        name: 'review-excuses',
        component: () => import('@/views/excuses/ExcuseApprovalView.vue'),
        meta: {
            requiresAuth: true,
            allowedRoles: ['track_admin', 'branch_manager'] 
        }
    }
];