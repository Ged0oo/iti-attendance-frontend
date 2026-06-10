import { createRouter, createWebHistory } from "vue-router";
import authRoutes from "./auth.routes";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    ...authRoutes,
  ],
});

export default router;
