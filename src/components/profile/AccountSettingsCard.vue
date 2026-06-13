<template>
  <div class="section-card">
    <div class="flex items-center gap-3 mb-6">
      <span class="material-symbols-outlined text-primary text-[24px]">manage_accounts</span>
      <h2 class="font-h1 text-[18px] text-on-surface m-0">Account Settings</h2>
    </div>

    <!-- Success message -->
    <div v-if="saveSuccess" class="mb-4 p-4 rounded-xl bg-success-mist text-success border border-success/20 flex items-center gap-2 font-body-md text-sm animate-fadeIn">
      <span class="material-symbols-outlined text-[18px]">check_circle</span>
      <span>Profile updated successfully.</span>
    </div>

    <!-- Error message -->
    <div v-if="saveError" class="mb-4 p-4 rounded-xl bg-danger-mist text-danger border border-danger/20 flex items-center gap-2 font-body-md text-sm animate-fadeIn">
      <span class="material-symbols-outlined text-[18px]">error</span>
      <span>{{ saveError }}</span>
    </div>

    <form class="space-y-4" @submit.prevent="save">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-label text-xs text-on-surface-variant mb-1 font-semibold uppercase tracking-wider">Full Name</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full px-4 h-[44px] rounded-lg border border-surface-container-highest bg-surface-bright
                   focus:border-primary-ember focus:ring-1 focus:ring-primary-ember
                   font-body-md text-body-md text-on-surface outline-none transition-all"
          />
        </div>

        <div>
          <label class="block font-label text-xs text-on-surface-variant mb-1 font-semibold uppercase tracking-wider">Email Address</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 h-[44px] rounded-lg border border-surface-container-highest bg-surface-bright
                   focus:border-primary-ember focus:ring-1 focus:ring-primary-ember
                   font-body-md text-body-md text-on-surface outline-none transition-all"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-label text-xs text-on-surface-variant mb-1 font-semibold uppercase tracking-wider">New Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Leave blank to keep current"
            class="w-full px-4 h-[44px] rounded-lg border border-surface-container-highest bg-surface-bright
                   focus:border-primary-ember focus:ring-1 focus:ring-primary-ember
                   font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40"
          />
        </div>

        <div>
          <label class="block font-label text-xs text-on-surface-variant mb-1 font-semibold uppercase tracking-wider">Confirm Password</label>
          <input
            v-model="passwordConfirmation"
            type="password"
            :required="!!password"
            placeholder="Confirm new password"
            class="w-full px-4 h-[44px] rounded-lg border border-surface-container-highest bg-surface-bright
                   focus:border-primary-ember focus:ring-1 focus:ring-primary-ember
                   font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40"
          />
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button
          type="submit"
          :disabled="saving"
          class="h-[44px] px-6 rounded-lg bg-[#8B1A1A] hover:bg-[#6B1212] text-white font-label text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
        >
          <span v-if="saving" class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          {{ saving ? "Saving changes…" : "Save Changes" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()

// Helper to extract properties based on API payload shape
const getInitialName = () => {
  return authStore.user?.user?.name || authStore.user?.user_name || authStore.user?.name || ''
}
const getInitialEmail = () => {
  return authStore.user?.user?.email || authStore.user?.email || ''
}

const name = ref(getInitialName())
const email = ref(getInitialEmail())
const password = ref('')
const passwordConfirmation = ref('')
const saving = ref(false)
const saveError = ref(null)
const saveSuccess = ref(false)

// Watch or sync if authStore.user updates
import { watch } from 'vue'
watch(() => authStore.user, () => {
  name.value = getInitialName()
  email.value = getInitialEmail()
}, { deep: true })

async function save() {
  saving.value = true
  saveError.value = null
  saveSuccess.value = false
  try {
    const payload = { name: name.value, email: email.value }
    if (password.value) {
      if (password.value !== passwordConfirmation.value) {
        throw new Error("Passwords do not match.")
      }
      payload.password = password.value
      payload.password_confirmation = passwordConfirmation.value
    }
    await api.patch('/me', payload)
    
    // Preserve role just in case /me doesn't return it
    const oldRole = authStore.user?.role
    await authStore.fetchMe()
    if (oldRole && (!authStore.user.role || authStore.user.role !== oldRole)) {
      authStore.user.role = oldRole
    }
    
    saveSuccess.value = true
    password.value = ''
    passwordConfirmation.value = ''
  } catch (e) {
    saveError.value = e.response?.data?.message || e.message || 'Failed to save changes.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.section-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.03);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.section-card:hover {
  box-shadow: 0 24px 48px -12px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}
</style>
