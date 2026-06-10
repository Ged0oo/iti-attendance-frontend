export default [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: {
      requiresAuth: false,
      title: "Login - ITI Attendance & Grading",
    },
  },
];
