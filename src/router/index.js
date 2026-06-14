import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import authRoutes from './auth.routes.js'
import cohortRoutes from './cohort.routes.js'
import schedulingRoutes from './scheduling.routes.js'
import attendanceRoutes from './attendance.routes.js'
import gradingRoutes from './grading.routes.js'
import excuseRoutes from './excuse.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import userRoutes from './user.routes.js'



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
    ...dashboardRoutes,
    ...cohortRoutes,
    ...schedulingRoutes,
    ...attendanceRoutes,
    ...gradingRoutes,
    ...excuseRoutes,
    ...userRoutes,


  ],
})

router.beforeEach((to, _from) => {
  const auth = useAuthStore()

  if (auth.isAuthenticated && to.meta.requiresAuth === false) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  // signed in but not allowed here: send them to their own dashboard, not the login page
  const allowedRoles = to.meta.roles || to.meta.allowedRoles;
  if (allowedRoles && !allowedRoles.includes(auth.userRole)) {
    if (!auth.isAuthenticated) return { name: 'login' }
    const home = HOME_BY_ROLE[auth.userRole]
    return home && home !== to.name ? { name: home } : { name: 'login' }
  }

  return true
})

export default router
