<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { currentUser, userRole } = useAuth()

const allLinks = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard', roles: ['branch_manager', 'track_admin', 'instructor', 'student'] },
  { label: 'Tracks', icon: 'school', to: '/tracks', roles: ['branch_manager', 'track_admin'] },
  { label: 'Students', icon: 'group', to: '/students', roles: ['branch_manager', 'track_admin', 'instructor'] },
  { label: 'Instructors', icon: 'badge', to: '/instructors', roles: ['branch_manager', 'track_admin'] },
  { label: 'Course Setup', icon: 'menu_book', to: '/scheduling/courses', roles: ['branch_manager', 'track_admin'] },
  { label: 'Scheduling', icon: 'calendar_month', to: '/scheduling/engagements', roles: ['branch_manager', 'track_admin'] },
  { label: 'Billing', icon: 'payments', to: '/billing', roles: ['branch_manager'] },
  { label: 'Reports', icon: 'analytics', to: '/reports', roles: ['branch_manager', 'track_admin'] },
]

const links = computed(() =>
  allLinks.filter((link) => link.roles.includes(userRole.value)),
)

const userName = computed(() => currentUser.value?.name || 'User')
const userEmail = computed(() => currentUser.value?.email || '')

async function logout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <nav class="h-screen w-[240px] fixed left-0 top-0 bg-shell text-text-inverse flex flex-col py-6 z-20">
    <div class="px-5 mb-10 flex items-center gap-3">
      <div class="w-10 h-10 rounded-sm bg-surface flex items-center justify-center text-primary flex-shrink-0">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">school</span>
      </div>
      <div>
        <div class="font-h3 text-h3 text-white leading-none">ITI Management</div>
        <div class="text-[11px] font-label-caps text-text-disabled mt-1 tracking-wider uppercase">
          National Authority
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col gap-1 px-3">
      <router-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="group flex items-center gap-3 px-4 py-2.5 rounded-sm border-l-[3px] border-transparent text-text-disabled cursor-pointer transition-colors"
        active-class="!border-primary !text-white"
        exact-active-class="!border-primary !text-white"
      >
        <span class="material-symbols-outlined text-text-secondary group-hover:text-text-disabled transition-colors">{{ link.icon }}</span>
        <span class="font-label text-label">{{ link.label }}</span>
      </router-link>
    </div>

    <div class="px-5 mt-6 pt-6 border-t border-shell-border flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-primary font-bold text-[12px]">
        {{ userName.charAt(0).toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-label text-label text-white truncate">{{ userName }}</div>
        <div class="text-[10px] text-text-disabled truncate">{{ userEmail }}</div>
      </div>
      <button
        class="text-text-disabled hover:text-white transition-colors"
        title="Logout"
        @click="logout"
      >
        <span class="material-symbols-outlined text-[18px]">logout</span>
      </button>
    </div>
  </nav>
</template>
