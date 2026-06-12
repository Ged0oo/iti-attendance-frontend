import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import authRoutes from './auth.routes.js'
import cohortRoutes from './cohort.routes.js'
import schedulingRoutes from './scheduling.routes.js'
import attendanceRoutes from './attendance.routes.js'
import gradingRoutes from './grading.routes.js'
import excuseRoutes from './excuse.routes.js'

// where to send a signed-in user who lands on a page their role cannot open
const HOME_BY_ROLE = {
  branch_manager: 'dashboard',
  track_admin: 'dashboard',
  instructor: 'dashboard.instructor',
  student: 'dashboard.student',
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    ...authRoutes,
    ...cohortRoutes,
    ...schedulingRoutes,
    ...attendanceRoutes,
    ...gradingRoutes,
    ...excuseRoutes,
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'login' })
  }

  // signed in but not allowed here: send them to their own dashboard, not the login page
  if (to.meta.roles && !to.meta.roles.includes(auth.userRole)) {
    if (!auth.isAuthenticated) return next({ name: 'login' })
    const home = HOME_BY_ROLE[auth.userRole]
    return next(home && home !== to.name ? { name: home } : { name: 'login' })
  }

  next()
})

export default router
