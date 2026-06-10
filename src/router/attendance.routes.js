import QrScannerView from '@/views/attendance/QrScannerView.vue';
import AttendanceLogView from '@/views/attendance/AttendanceLogView.vue';

export default [
    {
        path: '/attendance/scan',
        name: 'attendance-scan',
        component: QrScannerView
    },
    {
        path: '/attendance/log/:sessionId',
        name: 'attendance-log',
        component: AttendanceLogView
    },
    {
        path: '/attendance/projector/:sessionId',
        name: 'attendance-projector',
        component: () => import('@/views/attendance/SessionQrView.vue')
    }
];