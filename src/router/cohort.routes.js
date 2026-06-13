export default [
  {
    path: '/tracks',
    name: 'tracks',
    component: () => import('../views/cohorts/TrackListView.vue'),
    meta: { requiresAuth: true, roles: ['branch_manager', 'track_admin'] },
  },
  {
    path: '/cohorts/:id/config',
    name: 'cohort-config',
    component: () => import('../views/cohorts/CohortConfigView.vue'),
    meta: { requiresAuth: true, roles: ['branch_manager', 'track_admin'] },
  },
  {
    path: '/cohorts/:id/announcements',
    name: 'announcements',
    component: () => import('../views/cohorts/AnnouncementsView.vue'),
    meta: { requiresAuth: true, roles: ['branch_manager', 'track_admin', 'instructor'] },
  },
]
