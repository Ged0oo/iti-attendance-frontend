export default [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {
      requiresAuth: false,
      title: "Login - ITI Attendance & Grading",
    },
  },
  {
    path: '/forgot-password',
    name: 'password.forgot',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Forgot Password - ITI Attendance & Grading',
    },
  },
  {
    path: '/set-password',
    name: 'password.set',
    component: () => import('@/views/auth/PasswordSetupView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Set Password - ITI Attendance & Grading',
      heading: 'Set your password',
      subtitle: 'Welcome! Create a password to activate your account.',
      buttonLabel: 'Set Password',
    },
  },
  {
    path: '/reset-password',
    name: 'password.reset',
    component: () => import('@/views/auth/PasswordSetupView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Reset Password - ITI Attendance & Grading',
      heading: 'Reset your password',
      subtitle: 'Enter and confirm your new password below.',
      buttonLabel: 'Reset Password',
    },
  },
]
