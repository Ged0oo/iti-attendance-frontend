export default [
    {
        path: '/users',
        name: 'users',
        component: () => import('@/views/auth/UserManagementView.vue'),
        meta: {
            requiresAuth: true,
            roles: ['branch_manager', 'track_admin'],
        },
    },
    {
        path: '/students',
        name: 'students',
        redirect: '/dashboard',
        meta: {
            requiresAuth: true,
            roles: ['branch_manager', 'track_admin', 'instructor'],
        },
    },
    {
        path: '/instructors',
        name: 'instructors',
        redirect: '/dashboard',
        meta: {
            requiresAuth: true,
            roles: ['branch_manager', 'track_admin'],
        },
    },
    {
        path: '/reports',
        name: 'reports',
        redirect: '/dashboard',
        meta: {
            requiresAuth: true,
            roles: ['branch_manager', 'track_admin'],
        },
    },
]