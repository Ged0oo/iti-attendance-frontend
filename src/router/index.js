import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import authRoutes from './auth.routes.js'
import cohortRoutes from './cohort.routes.js'
import schedulingRoutes from './scheduling.routes.js'
import attendanceRoutes from './attendance.routes.js'
import gradingRoutes from './grading.routes.js'
import excuseRoutes from './excuse.routes.js'
import dashboardRoutes from './dashboard.routes.js'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    ...authRoutes,
    ...dashboardRoutes,
    ...cohortRoutes,
    ...schedulingRoutes,
    ...attendanceRoutes,
    ...gradingRoutes,
    ...excuseRoutes,

  ],
})

router.beforeEach((to, _from) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.userRole)) {
    return { name: 'login' }
  }

  return true
})

export default router
