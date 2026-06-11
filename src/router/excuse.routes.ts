export default [
  {
    path: '/excuses/submit',
    name: 'ExcuseForm',
    component: () => import('@/views/excuses/ExcuseFormView.vue'),
    meta: { requiresAuth: true, roles: ['student'] },
  },
]
