<script setup>
import { computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import BranchManagerDashboard from './BranchManagerDashboard.vue'
import TrackAdminDashboard from './TrackAdminDashboard.vue'

const { userRole } = useAuth()

const dashboards = {
  branch_manager: BranchManagerDashboard,
  track_admin: TrackAdminDashboard,
}

const current = computed(() => dashboards[userRole.value] || TrackAdminDashboard)
</script>

<template>
  <component :is="current" />
</template>
