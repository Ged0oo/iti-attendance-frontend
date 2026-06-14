<script setup>
import { computed } from 'vue'
import { useAuth } from '../../composables/useAuth'

const props = defineProps({
  title: { type: String, default: 'Academic Portal' },
})

const { userRole } = useAuth()

const roleBadges = {
  branch_manager: { label: 'Branch Manager', color: 'role-bm', icon: 'corporate_fare' },
  track_admin: { label: 'Track Admin', color: 'role-ta', icon: 'admin_panel_settings' },
  instructor: { label: 'Instructor', color: 'role-instructor', icon: 'co_present' },
  student: { label: 'Student', color: 'role-student', icon: 'person' },
}

const badge = computed(() => roleBadges[userRole.value] || null)
</script>

<template>
  <header class="bg-surface sticky top-0 border-b border-neutral-200 z-40 flex justify-between items-center h-16 px-margin-desktop" style="background-color: #FFFFFF;">
    <div class="flex items-center gap-4">
      <h1 class="font-h2 text-h2 text-primary m-0">{{ props.title }}</h1>
      <div
        v-if="badge"
        class="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border ml-2"
        :class="`text-${badge.color} border-${badge.color}/20 bg-${badge.color}/10`"
      >
        <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">
          {{ badge.icon }}
        </span>
        <span class="font-label-caps text-[10px] uppercase tracking-wider font-bold">{{ badge.label }}</span>
      </div>
    </div>

    <div class="flex items-center gap-6">
      <slot name="action" />
    </div>
  </header>
</template>
