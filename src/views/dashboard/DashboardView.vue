<script setup>
import { computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import BranchManagerDashboard from './BranchManagerDashboard.vue'
import TrackAdminDashboard from './TrackAdminDashboard.vue'
import StudentDashboard from './StudentDashboard.vue'
import InstructorDashboard from './InstructorDashboard.vue'

const { role } = useAuth()

const dashboards = {
  branch_manager: BranchManagerDashboard,
  track_admin: TrackAdminDashboard,
  student: StudentDashboard,
  instructor: InstructorDashboard,
}

const current = computed(() => dashboards[role.value] || TrackAdminDashboard)
</script>

<template>
  <component :is="current" />
</template>
