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
]