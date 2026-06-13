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
      <h1 v-if="props.title" class="font-h2 text-h2 text-primary m-0">{{ props.title }}</h1>
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
      <div class="relative hidden lg:block w-64">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
        <input
          class="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-sunken border-transparent focus:border-primary focus:ring-1 focus:ring-primary focus:bg-surface text-body-sm font-body-sm transition-all outline-none text-on-surface placeholder:text-on-surface-variant"
          placeholder="Search..."
          type="text"
        />
      </div>

      <div class="flex items-center gap-2">
        <button class="p-2 rounded-full text-secondary hover:text-primary hover:bg-primary-mist transition-colors relative active:scale-95 duration-150">
          <span class="material-symbols-outlined">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger"></span>
        </button>
        <button class="p-2 rounded-full text-secondary hover:text-primary hover:bg-primary-mist transition-colors active:scale-95 duration-150">
          <span class="material-symbols-outlined">help_outline</span>
        </button>
      </div>

      <slot name="action" />
    </div>
  </header>
</template>
