const CourseSetupView = () => import('../views/scheduling/CourseSetupView.vue')
const EngagementCalendarView = () => import('../views/scheduling/EngagementCalendarView.vue')
const BillingRollupView = () => import('../views/scheduling/BillingRollupView.vue')

export default [
  {
    path: '/scheduling/courses',
    name: 'course-setup',
    component: CourseSetupView,
    meta: { requiresAuth: true, roles: ['track_admin', 'branch_manager'] },
  },
  {
    path: '/scheduling/engagements',
    name: 'engagement-calendar',
    component: EngagementCalendarView,
    meta: { requiresAuth: true, roles: ['track_admin', 'branch_manager'] },
  },
  {
    path: '/billing',
    name: 'billing-rollup',
    component: BillingRollupView,
    meta: { requiresAuth: true, roles: ['branch_manager'] },
  },
]
