import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import attendanceRoutes from './attendance.routes';
import excuseRoutes from './excuse.routes'
import StudentDashboard from '@/views/dashboard/StudentDashboard.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/auth/LoginView.vue')
        },
        {
            path: '/',
            name: 'home',
            component: StudentDashboard,
            meta: { requiresAuth: true },
            beforeEnter: (to, from, next) => {
                const authStore = useAuthStore();
                if (authStore.isStudent) {
                    next();
                } else if (authStore.isManager || authStore.isInstructor) {
                    // For now, redirect staff somewhere else until their dashboards are built
                    next('/excuses/review');
                } else {
                    next('/login');
                }
            }
        },
        ...attendanceRoutes,
        ...excuseRoutes
    ]
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const requireAuth = to.matched.some(record => record.meta.requiresAuth);

    if (requireAuth && !authStore.isAuthenticated) {
        next({ name: 'login' });
    } else if (to.name === 'login' && authStore.isAuthenticated) {
        next({ name: '/' });
    } else {
        next();
    }
});

export default router;