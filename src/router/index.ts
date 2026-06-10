import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import attendanceRoutes from './attendance.routes';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/auth/LoginView.vue')
        },
        ...attendanceRoutes,
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