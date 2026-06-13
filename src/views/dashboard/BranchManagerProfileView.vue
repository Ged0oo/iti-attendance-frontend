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
const instructors = ref([])
const cohorts = ref([])

// ── Derived ────────────────────────────────────────────────────────────
const userInitials = computed(() => {
  const name = authStore.user?.name || 'B'
  const parts = name.trim().split(' ')
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
})

const activeCohorts = computed(() =>
  cohorts.value.filter(c => c.status === 'active').length
)

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

    await Promise.allSettled([
      api.get('/tracks')
        .then(r => { tracks.value = r.data?.data || [] })
        .catch(() => {}),
      api.get('/instructors')
        .then(r => { instructors.value = r.data?.data || [] })
        .catch(() => {}),
      api.get('/cohorts')
        .then(r => { cohorts.value = r.data?.data || [] })
        .catch(() => {}),
    ])
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
              <span class="role-badge role-badge--bm">
                <span class="material-symbols-outlined text-[12px]">corporate_fare</span>
                Branch Manager
              </span>
            </div>
            <p class="font-body-md text-sm text-on-surface-variant m-0">{{ authStore.user?.email }}</p>
          </div>

          <!-- Stats column -->
          <div class="hero-ids">
            <div class="hero-id-item">
              <span class="hero-id-label">Tracks</span>
              <span class="hero-id-value font-mono">{{ tracks.length }}</span>
            </div>
            <div class="hero-id-item">
              <span class="hero-id-label">Active Cohorts</span>
              <span class="hero-id-value font-mono">{{ activeCohorts }}</span>
            </div>
            <div class="hero-id-item">
              <span class="hero-id-label">Instructors</span>
              <span class="hero-id-value font-mono">{{ instructors.length }}</span>
            </div>
          </div>
        </div>

        <!-- ── KPI row ───────────────────────────────────────────────── -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="info-card">
            <div class="info-card-header">
              <span class="material-symbols-outlined text-[#8B1A1A]">route</span>
              <span class="info-card-title">Tracks</span>
            </div>
            <div class="flex items-baseline gap-1 mt-2">
              <span class="font-h1 text-[34px] leading-none text-on-surface">{{ tracks.length }}</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <span class="material-symbols-outlined text-success">groups</span>
              <span class="info-card-title">Active Cohorts</span>
            </div>
            <div class="flex items-baseline gap-1 mt-2">
              <span class="font-h1 text-[34px] leading-none text-on-surface">{{ activeCohorts }}</span>
              <span class="font-body-md text-xs text-on-surface-variant">/{{ cohorts.length }}</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <span class="material-symbols-outlined text-[#0369A1]">badge</span>
              <span class="info-card-title">Instructors</span>
            </div>
            <div class="flex items-baseline gap-1 mt-2">
              <span class="font-h1 text-[34px] leading-none text-on-surface">{{ instructors.length }}</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <span class="material-symbols-outlined text-warning">pending</span>
              <span class="info-card-title">Pending Cohorts</span>
            </div>
            <div class="flex items-baseline gap-1 mt-2">
              <span class="font-h1 text-[34px] leading-none text-on-surface">
                {{ cohorts.filter(c => c.status === 'configuring' || c.status === 'open').length }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Tracks overview ───────────────────────────────────────── -->
        <div class="section-card mb-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-h1 text-[18px] text-on-surface m-0">Branch Tracks</h2>
            <span class="font-mono text-xs text-on-surface-variant bg-surface-variant px-2 py-1 rounded-md">
              {{ tracks.length }} track{{ tracks.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div v-if="tracks.length === 0" class="flex flex-col items-center justify-center py-10 text-on-surface-variant">
            <span class="material-symbols-outlined text-[40px] mb-3 opacity-30">route</span>
            <p class="font-body-md text-sm">No tracks in this branch yet.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="track in tracks"
              :key="track.id"
              class="track-card"
            >
              <div class="flex items-start gap-3">
                <div class="track-icon-wrap">
                  <span class="material-symbols-outlined text-[20px] text-primary">route</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-body-md text-sm font-semibold text-on-surface m-0 truncate">{{ track.name }}</h3>
                  <p class="font-mono text-xs text-on-surface-variant mt-0.5">ID #{{ track.id }}</p>
                  <p v-if="track.description" class="font-body-md text-xs text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
                    {{ track.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Cohort overview ───────────────────────────────────────── -->
        <div class="section-card mb-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-h1 text-[18px] text-on-surface m-0">All Cohorts</h2>
            <span class="font-mono text-xs text-on-surface-variant bg-surface-variant px-2 py-1 rounded-md">
              {{ cohorts.length }} cohort{{ cohorts.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div v-if="cohorts.length === 0" class="flex flex-col items-center justify-center py-10 text-on-surface-variant">
            <span class="material-symbols-outlined text-[40px] mb-3 opacity-30">groups</span>
            <p class="font-body-md text-sm">No cohorts found.</p>
          </div>

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="cohort in cohorts"
              :key="cohort.id"
              class="cohort-row"
            >
              <div class="flex-1 min-w-0">
                <p class="font-body-md text-sm font-semibold text-on-surface truncate">{{ cohort.name }}</p>
                <p class="font-body-md text-xs text-on-surface-variant mt-0.5">
                  <span v-if="cohort.track?.name">{{ cohort.track.name }}</span>
                </p>
                <p class="info-card-meta mt-1.5">
                  <span class="material-symbols-outlined text-[13px]">date_range</span>
                  {{ formatDate(cohort.start_date) }} → {{ formatDate(cohort.end_date) }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-2 flex-shrink-0">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border uppercase tracking-wide"
                  :class="{
                    'bg-success-mist text-success border-success/20': cohortStatusVariant(cohort.status) === 'success',
                    'bg-primary-mist text-primary border-primary/20': cohortStatusVariant(cohort.status) === 'primary',
                    'bg-warning-mist text-warning border-warning/20': cohortStatusVariant(cohort.status) === 'warning',
                    'bg-surface-variant text-on-surface-variant border-black/10': cohortStatusVariant(cohort.status) === 'secondary' || cohortStatusVariant(cohort.status) === 'muted',
                  }"
                >{{ cohortStatusLabel(cohort.status) }}</span>
                <span v-if="cohort.students_count != null" class="font-mono text-xs text-on-surface-variant">
                  {{ cohort.students_count }} students
                </span>
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
  background: linear-gradient(135deg, #8B1A1A 0%, #6B1212 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(139,26,26,0.35);
}

.role-badge--bm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #FFF5F5;
  color: #8B1A1A;
  border: 1px solid rgba(139,26,26,0.2);
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

/* ── Track card ─────────────────────────────────────────────────────── */
.track-card {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.05);
  background: #FAFAFA;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.track-card:hover {
  background: #F7F7F7;
  border-color: rgba(0,0,0,0.09);
}

.track-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #F9EAEA;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Cohort row ─────────────────────────────────────────────────────── */
.cohort-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  background: #FAFAFA;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.cohort-row:hover {
  background: #F7F7F7;
  border-color: rgba(0,0,0,0.09);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
