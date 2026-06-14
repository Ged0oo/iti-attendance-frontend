import { useAuthStore } from '../stores/auth'

export default [
    {
        path: '/dashboard',
        name: 'dashboard',
        redirect: () => {
            const auth = useAuthStore()
            if (auth.userRole === 'student') return { name: 'dashboard.student' }
            if (auth.userRole === 'instructor') return { name: 'dashboard.instructor' }
            return { name: 'dashboard.admin' }
        },
    },
    {
        path: '/dashboards/admin',
        name: 'dashboard.admin',
        component: () => import('../views/dashboard/DashboardView.vue'),
        meta: { requiresAuth: true, roles: ['branch_manager', 'track_admin'] },
    },
    {
        path: '/dashboards/instructor',
        name: 'dashboard.instructor',
        component: () => import('../views/dashboard/InstructorDashboard.vue'),
        meta: { requiresAuth: true, roles: ['instructor'] },
    },
    {
        path: '/dashboards/student',
        name: 'dashboard.student',
        component: () => import('../views/dashboard/StudentDashboard.vue'),
        meta: { requiresAuth: true, roles: ['student'] },
    },
    {
        path: '/student/profile',
        name: 'student-profile',
        component: () => import('../views/dashboard/StudentProfileView.vue'),
        meta: { requiresAuth: true, roles: ['student'] },
    },
    {
        path: '/instructor/profile',
        name: 'instructor-profile',
        component: () => import('../views/dashboard/InstructorProfileView.vue'),
        meta: { requiresAuth: true, roles: ['instructor'] },
    },
    {
        path: '/track-admin/profile',
        name: 'track-admin-profile',
        component: () => import('../views/dashboard/TrackAdminProfileView.vue'),
        meta: { requiresAuth: true, roles: ['track_admin'] },
    },
    {
        path: '/branch-manager/profile',
        name: 'branch-manager-profile',
        component: () => import('../views/dashboard/BranchManagerProfileView.vue'),
        meta: { requiresAuth: true, roles: ['branch_manager'] },
    },
]  