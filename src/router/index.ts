import { createRouter, createWebHistory } from 'vue-router'
import gradingRoutes from './grading.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...gradingRoutes,
  ],
})

export default router
