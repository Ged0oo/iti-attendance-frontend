<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import MainLayout from '@/components/layout/MainLayout.vue'
import AccountSettingsCard from '@/components/profile/AccountSettingsCard.vue'

const authStore = useAuthStore()

const loading = ref(true)
const error = ref(null)

const tracks = ref([])
const cohortsByTrack = ref({})  // trackId -> cohorts[]

// ── Derived ────────────────────────────────────────────────────────────
const userInitials = computed(() => {
  const name = authStore.user?.name || 'T'
  const parts = name.trim().split(' ')
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
})

const totalCohorts = computed(() =>
  Object.values(cohortsByTrack.value).reduce((sum, list) => sum + list.length, 0)
)

const totalStudents = computed(() => {
  let count = 0
  Object.values(cohortsByTrack.value).forEach(list => {
    list.forEach(c => { count += c.students_count || 0 })
  })
  return count
})

// ── Formatters ─────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const cohortStatusVariant = (status) => {
  const map = { active: 'success', completed: 'primary', configuring: 'warning', open: 'secondary', archived: 'muted' }
  return map[status] || 'secondary'
}

const cohortStatusLabel = (status) => {
  const map = { open: 'Open', configuring: 'Configuring', active: 'Active', completed: 'Completed', archived: 'Archived' }
  return map[status] || status || '—'
}

// ── Data fetching ──────────────────────────────────────────────────────
onMounted(async () => {
  try {
    loading.value = true
    if (!authStore.user) await authStore.fetchMe()

    // Track Admins get only their own tracks from GET /tracks
    const tracksRes = await api.get('/tracks')
    tracks.value = tracksRes.data?.data || []

    // Fetch cohorts for each track in parallel
    await Promise.allSettled(
      tracks.value.map(track =>
        api.get('/cohorts', { params: { track_id: track.id } })
          .then(r => { cohortsByTrack.value[track.id] = r.data?.data || [] })
          .catch(() => { cohortsByTrack.value[track.id] = [] })
      )
    )
  } catch (err) {
    error.value = err.message || 'Failed to load profile.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <MainLayout title="My Profile">
    <div class="max-w-[1200px] mx-auto w-full">

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 text-on-surface-variant">
        <div class="w-10 h-10 border-[3px] border-primary/10 border-t-primary rounded-full animate-spin mb-4"></div>
        <p class="font-body-md text-sm">Loading your profile…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-danger-mist text-danger p-6 rounded-2xl border border-danger/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined">error</span>
          <h3 class="font-h3 text-h3">Something went wrong</h3>
        </div>
        <p class="font-body-md text-sm">{{ error }}</p>
      </div>

      <template v-else>

        <!-- ── HERO ──────────────────────────────────────────────────── -->
        <div class="profile-hero mb-6">
          <div class="hero-avatar">{{ userInitials }}</div>

          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-3 mb-1">
              <h1 class="font-h1 text-[28px] leading-tight text-on-surface m-0">
                {{ authStore.user?.name || '—' }}
              </h1>
              <span class="role-badge role-badge--track-admin">
                <span class="material-symbols-outlined text-[12px]">admin_panel_settings</span>
                Track Admin
              </span>
            </div>
            <p class="font-body-md text-sm text-on-surface-variant m-0">{{ authStore.user?.email }}</p>
          </div>

          <!-- Stats column -->
          <div class="hero-ids">
            <div class="hero-id-item">
              <span class="hero-id-label">Tracks Managed</span>
              <span class="hero-id-value font-mono">{{ tracks.length }}</span>
            </div>
            <div class="hero-id-item">
              <span class="hero-id-label">Total Cohorts</span>
              <span class="hero-id-value font-mono">{{ totalCohorts }}</span>
            </div>
            <div class="hero-id-item">
              <span class="hero-id-label">Total Students</span>
              <span class="hero-id-value font-mono">{{ totalStudents }}</span>
            </div>
          </div>
        </div>

        <!-- ── KPI row ───────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="info-card">
            <div class="info-card-header">
              <span class="material-symbols-outlined text-[#7C3AED]">route</span>
              <span class="info-card-title">Tracks</span>
            </div>
            <div class="flex items-baseline gap-1.5 mt-2">
              <span class="font-h1 text-[36px] leading-none text-on-surface">{{ tracks.length }}</span>
              <span class="font-body-md text-base text-on-surface-variant font-semibold">track{{ tracks.length !== 1 ? 's' : '' }}</span>
            </div>
            <div class="info-card-meta mt-3">
              <span class="material-symbols-outlined text-[14px]">manage_accounts</span>
              Under your administration
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <span class="material-symbols-outlined text-primary">groups</span>
              <span class="info-card-title">Cohorts</span>
            </div>
            <div class="flex items-baseline gap-1.5 mt-2">
              <span class="font-h1 text-[36px] leading-none text-on-surface">{{ totalCohorts }}</span>
              <span class="font-body-md text-base text-on-surface-variant font-semibold">cohort{{ totalCohorts !== 1 ? 's' : '' }}</span>
            </div>
            <div class="info-card-meta mt-3">
              <span class="material-symbols-outlined text-[14px]">school</span>
              Across all tracks
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <span class="material-symbols-outlined text-success">group</span>
              <span class="info-card-title">Students</span>
            </div>
            <div class="flex items-baseline gap-1.5 mt-2">
              <span class="font-h1 text-[36px] leading-none text-on-surface">{{ totalStudents }}</span>
              <span class="font-body-md text-base text-on-surface-variant font-semibold">enrolled</span>
            </div>
            <div class="info-card-meta mt-3">
              <span class="material-symbols-outlined text-[14px]">person</span>
              Total active students
            </div>
          </div>
        </div>

        <!-- ── Tracks + Cohorts ──────────────────────────────────────── -->
        <div class="section-card mb-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-h1 text-[18px] text-on-surface m-0">Managed Tracks</h2>
            <span class="font-mono text-xs text-on-surface-variant bg-surface-variant px-2 py-1 rounded-md">
              {{ tracks.length }} track{{ tracks.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div v-if="tracks.length === 0" class="flex flex-col items-center justify-center py-10 text-on-surface-variant">
            <span class="material-symbols-outlined text-[40px] mb-3 opacity-30">route</span>
            <p class="font-body-md text-sm">No tracks assigned yet.</p>
          </div>

          <div v-else class="flex flex-col gap-6">
            <div v-for="track in tracks" :key="track.id" class="track-section">
              <!-- Track header -->
              <div class="flex items-center gap-3 mb-3">
                <div class="w-8 h-8 rounded-lg bg-[#F5F0FF] flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined text-[18px] text-[#7C3AED]">route</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-body-md text-sm font-semibold text-on-surface m-0">{{ track.name }}</h3>
                  <p class="font-mono text-xs text-on-surface-variant">ID #{{ track.id }}</p>
                </div>
                <span class="font-mono text-xs text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded">
                  {{ (cohortsByTrack[track.id] || []).length }} cohorts
                </span>
              </div>

              <!-- Cohorts list -->
              <div v-if="(cohortsByTrack[track.id] || []).length === 0" class="pl-11">
                <p class="font-body-md text-xs text-on-surface-variant">No cohorts in this track.</p>
              </div>
              <div v-else class="pl-11 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div
                  v-for="cohort in cohortsByTrack[track.id]"
                  :key="cohort.id"
                  class="cohort-row"
                >
                  <div class="flex-1 min-w-0">
                    <p class="font-body-md text-xs font-semibold text-on-surface truncate">{{ cohort.name }}</p>
                    <p class="info-card-meta mt-1">
                      <span class="material-symbols-outlined text-[12px]">date_range</span>
                      {{ formatDate(cohort.start_date) }} → {{ formatDate(cohort.end_date) }}
                    </p>
                  </div>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wide flex-shrink-0"
                    :class="{
                      'bg-success-mist text-success border-success/20': cohortStatusVariant(cohort.status) === 'success',
                      'bg-primary-mist text-primary border-primary/20': cohortStatusVariant(cohort.status) === 'primary',
                      'bg-warning-mist text-warning border-warning/20': cohortStatusVariant(cohort.status) === 'warning',
                      'bg-surface-variant text-on-surface-variant border-black/10': cohortStatusVariant(cohort.status) === 'secondary' || cohortStatusVariant(cohort.status) === 'muted',
                    }"
                  >{{ cohortStatusLabel(cohort.status) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Account Settings ──────────────────────────────────────── -->
        <AccountSettingsCard />

      </template>
    </div>
  </MainLayout>
</template>

<style scoped>
/* ── Hero ───────────────────────────────────────────────────────────── */
.profile-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 20px;
  padding: 28px 28px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.03);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  flex-wrap: wrap;
}
.profile-hero:hover {
  box-shadow: 0 24px 48px -12px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.hero-avatar {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(124,58,237,0.35);
}

.role-badge--track-admin {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #F5F0FF;
  color: #7C3AED;
  border: 1px solid rgba(124,58,237,0.2);
}

.hero-ids {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 20px;
  border-left: 1px solid rgba(0,0,0,0.06);
  flex-shrink: 0;
}

.hero-id-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.hero-id-label {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  font-weight: 600;
}

.hero-id-value {
  font-family: "JetBrains Mono", "Courier New", monospace;
  font-size: 13px;
  color: #1A1A2E;
  font-weight: 500;
}

/* ── Info cards ─────────────────────────────────────────────────────── */
.info-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.info-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.07);
  transform: translateY(-2px);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-card-title {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  font-weight: 600;
}

.info-card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 12px;
  color: #6B7280;
}

/* ── Section cards ──────────────────────────────────────────────────── */
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

/* ── Track section ──────────────────────────────────────────────────── */
.track-section {
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.track-section:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

/* ── Cohort row ─────────────────────────────────────────────────────── */
.cohort-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.05);
  background: #FAFAFA;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.cohort-row:hover {
  background: #F7F7F7;
  border-color: rgba(0,0,0,0.09);
}

@media (max-width: 640px) {
  .hero-ids {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid rgba(0,0,0,0.06);
    padding-top: 12px;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  }
  .hero-id-item {
    min-width: 100px;
  }
}
</style>
