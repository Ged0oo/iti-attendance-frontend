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
        component: () => import('@/views/students/StudentListView.vue'),
        meta: {
            requiresAuth: true,
            roles: ['branch_manager', 'track_admin', 'instructor'],
        },
    },
    {
        path: '/instructors',
        name: 'instructors',
        component: () => import('@/views/instructors/InstructorListView.vue'),
        meta: {
            requiresAuth: true,
            roles: ['branch_manager', 'track_admin'],
        },
    },
]