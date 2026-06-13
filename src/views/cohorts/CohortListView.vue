<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../components/layout/MainLayout.vue'
import { useCohortStore } from '../../stores/cohort'
import { useAuthStore } from '../../stores/auth'
import { statusColors, statusIcons, fmtDate } from '../../composables/useUtils'

const router = useRouter()
const store = useCohortStore()
const authStore = useAuthStore()

const loading = ref(false)
const showCreate = ref(false)
const createError = ref(null)
const form = ref({ name: '', track_id: '', start_date: '', end_date: '' })

const isBM = computed(() => authStore.user?.role === 'branch_manager')

const cohorts = computed(() => {
  const list = store.cohorts
  return Array.isArray(list) ? list : list?.data ?? []
})

async function createCohort() {
  createError.value = null
  try {
    const cohort = await store.createCohort({
      ...form.value,
      track_id: Number(form.value.track_id),
    })
    showCreate.value = false
    form.value = { name: '', track_id: '', start_date: '', end_date: '' }
    const created = cohort?.data ?? cohort
    router.push({ name: 'cohort-config', params: { id: created.id } })
  } catch (e) {
    const errors = e.response?.data?.errors
    createError.value = errors
      ? Object.values(errors).flat().join(' ')
      : e.response?.data?.message || 'Failed to create cohort'
  }
}

async function deleteCohort(id) {
  try {
    await store.deleteCohort(id)
  } catch (e) { /* ignore */ }
}

onMounted(async () => {
  loading.value = true
  if (!store.cohorts.length) await store.fetchCohorts()
  if (!store.tracks.length) await store.fetchTracks()
  loading.value = false
})
</script>

<template>
  <MainLayout title="Cohorts">
    <template #action>
      <button
        v-if="isBM"
        class="bg-primary hover:bg-primary-deep text-on-primary px-5 h-10 rounded-lg font-label text-label flex items-center gap-2 shadow-sm transition-all active:scale-95 duration-150 hover:shadow-md border border-primary"
        @click="showCreate = !showCreate"
      >
        <span class="material-symbols-outlined text-[18px]">add</span>
        New Cohort
      </button>
    </template>

    <div v-if="showCreate" class="bg-surface rounded-xl shadow-sm border border-surface-container-highest p-6 mb-6">
      <h3 class="font-h3 text-h3 text-on-surface mb-4">Create Cohort</h3>
      <p v-if="createError" class="text-danger font-body-sm text-body-sm mb-4 bg-danger-mist border border-danger/20 rounded-lg px-4 py-2">{{ createError }}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-label text-label text-on-surface-variant">Cohort Name</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g. Intake 47"
            class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-label text-label text-on-surface-variant">Track</label>
          <select
            v-model="form.track_id"
            class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
          >
            <option value="" disabled>Select a track</option>
            <option v-for="t in store.tracks" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-label text-label text-on-surface-variant">Start Date</label>
          <input
            v-model="form.start_date"
            type="date"
            class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-mono text-mono text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-label text-label text-on-surface-variant">End Date</label>
          <input
            v-model="form.end_date"
            type="date"
            class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-mono text-mono text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
          />
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button
          class="px-5 py-2.5 rounded-lg font-label text-label text-on-surface-variant hover:bg-surface-sunken transition-colors"
          @click="showCreate = false"
        >Cancel</button>
        <button
          class="px-5 py-2.5 rounded-lg font-label text-label bg-primary-container text-white hover:bg-primary transition-colors shadow-sm"
          :disabled="!form.name || !form.track_id || !form.start_date || !form.end_date"
          :class="{ 'opacity-50 cursor-not-allowed': !form.name || !form.track_id || !form.start_date || !form.end_date }"
          @click="createCohort"
        >Create Cohort</button>
      </div>
    </div>

    <p v-if="loading" class="text-center text-on-surface-variant font-body-sm text-body-sm py-12">Loading cohorts...</p>
    <p v-else-if="!cohorts.length" class="text-center text-on-surface-variant font-body-sm text-body-sm py-12">No cohorts yet.</p>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="cohort in cohorts"
        :key="cohort.id"
        class="bg-surface rounded-xl shadow-sm border border-surface-container-highest hover:shadow-md transition-shadow overflow-hidden group"
      >
        <div class="p-6">
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-h3 text-h3 text-on-surface">{{ cohort.name }}</h3>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border"
              :class="statusColors[cohort.status] || statusColors.open"
            >
              <span class="material-symbols-outlined text-[14px]">{{ statusIcons[cohort.status] || 'circle' }}</span>
              {{ cohort.status }}
            </span>
          </div>
          <div class="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">school</span>
              <span>{{ cohort.track?.name || 'Track #' + cohort.track_id }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">calendar_today</span>
              <span class="font-mono text-mono">{{ fmtDate(cohort.start_date) }} — {{ fmtDate(cohort.end_date) }}</span>
            </div>
            <div v-if="cohort.creator" class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">person</span>
              <span>{{ cohort.creator.name }}</span>
            </div>
          </div>
        </div>
        <div class="px-6 py-3 border-t border-surface-container-highest bg-canvas flex items-center justify-between">
          <div class="flex items-center gap-2">
            <router-link
              :to="{ name: 'cohort-config', params: { id: cohort.id } }"
              class="font-label text-label text-primary-container hover:text-primary transition-colors flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-[16px]">settings</span>
              Configure
            </router-link>
            <router-link
              :to="{ name: 'announcements', params: { id: cohort.id } }"
              class="font-label text-label text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 ml-4"
            >
              <span class="material-symbols-outlined text-[16px]">campaign</span>
              Announcements
            </router-link>
          </div>
          <button
            v-if="isBM"
            class="text-on-surface-variant hover:text-danger transition-colors"
            title="Delete Cohort"
            @click="deleteCohort(cohort.id)"
          >
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
