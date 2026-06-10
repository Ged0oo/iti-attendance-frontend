import { createRouter, createWebHistory } from "vue-router";
import authRoutes from "./auth.routes";
import { useAuthStore } from "@/stores/auth";

const roleMap: Record<string, string> = {
  track_admin: "admin-dashboard",
  branch_manager: "manager-dashboard",
  instructor: "instructor-dashboard",
  student: "student-dashboard",
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" },

    ...authRoutes,

    {
      path: "/dashboard",
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          redirect: () => {
            const role = useAuthStore().user?.role;
            const routeName = role ? roleMap[role] : null;
            return routeName ? { name: routeName } : { name: "login" };
          },
        },
        {
          path: "admin",
          name: "admin-dashboard",
          meta: { role: "track_admin" },
          component: () => import("@/views/dashboard/TrackAdminDashboard.vue"),
        },
        {
          path: "manager",
          name: "manager-dashboard",
          meta: { role: "branch_manager" },
          component: () =>
            import("@/views/dashboard/BranchManagerDashboard.vue"),
        },
        {
          path: "instructor",
          name: "instructor-dashboard",
          meta: { role: "instructor" },
          component: () => import("@/views/dashboard/InstructorDashboard.vue"),
        },
        {
          path: "student",
          name: "student-dashboard",
          meta: { role: "student" },
          component: () => import("@/views/dashboard/StudentDashboard.vue"),
        },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated)
    return next({ name: "login" });

  if (to.name === "login" && authStore.isAuthenticated)
    return next({ path: "/dashboard" });

  if (to.meta.role && to.meta.role !== authStore.user?.role)
    return next({ path: "/dashboard" });

  next();
});

export default router;
