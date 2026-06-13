<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLedgerStore } from '@/stores/ledger'
import api from '@/services/api'
import MainLayout from '@/components/layout/MainLayout.vue'
import CourseGradeBar from '@/components/student/CourseGradeBar.vue'
import GrandTotalRing from '@/components/student/GrandTotalRing.vue'

const authStore = useAuthStore()
const ledgerStore = useLedgerStore()

const loading = ref(true)
const error = ref(null)

// Raw API data
const studentRecord = ref(null)   // GET /students/{id}
const cohortRecord = ref(null)    // GET /cohorts/{cohort_id}
const gradeCard = ref(null)       // GET /students/{id}/grade-card
const excuses = ref([])           // GET /excuse-requests

// ── Derived ──────────────────────────────────────────────────────────
const student = computed(() => studentRecord.value)
const cohort = computed(() => cohortRecord.value)
const track = computed(() => cohortRecord.value?.track || null)
const courses = computed(() => gradeCard.value?.courses || [])

const ledgerBalance = computed(() => student.value?.ledger_balance ?? ledgerStore.balance ?? 0)
const isAtRisk = computed(() => student.value?.is_at_risk ?? ledgerStore.isAtRisk ?? false)

const sumCourseScores = computed(() =>
  courses.value.reduce((acc, c) => acc + (Number(c.total_score) || 0), 0)
)
const grandTotal = computed(() => ledgerBalance.value + sumCourseScores.value)
const grandMax = computed(() => {
  const courseMax = courses.value.reduce((acc, c) => acc + (Number(c.course?.max_score) || 0), 0)
  return 250 + courseMax
})
const grandTotalLetter = computed(() => {
  if (grandMax.value === 0) return 'N/A'
  const pct = (grandTotal.value / grandMax.value) * 100
  if (pct >= 90) return 'A'
  if (pct >= 85) return 'B+'
  if (pct >= 80) return 'B'
  if (pct >= 75) return 'C+'
  if (pct >= 70) return 'C'
  if (pct >= 60) return 'D'
  return 'F'
})

const balancePct = computed(() => Math.min(100, Math.max(0, (ledgerBalance.value / 250) * 100)))

const cohortStatus = computed(() => {
  const map = { open: 'Open', configuring: 'Configuring', active: 'Active', completed: 'Completed', archived: 'Archived' }
  return map[cohort.value?.status] || cohort.value?.status || '—'
})
const cohortStatusVariant = computed(() => {
  const map = { active: 'success', completed: 'primary', configuring: 'warning', open: 'secondary', archived: 'muted' }
  return map[cohort.value?.status] || 'secondary'
})

const userInitials = computed(() => {
  const name = authStore.user?.name || 'S'
  const parts = name.trim().split(' ')
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0].toUpperCase()
})

// ── Formatters ───────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const excuseStatusLabel = (status) => {
  const map = { requested: 'Pending', approved: 'Approved', rejected: 'Rejected' }
  return map[status] || status
}
const excuseStatusClass = (status) => {
  const map = {
    requested: 'bg-warning-mist text-warning border-warning/20',
    approved: 'bg-success-mist text-success border-success/20',
    rejected: 'bg-danger-mist text-danger border-danger/20'
  }
  return map[status] || 'bg-surface-variant text-on-surface-variant border-black/10'
}

// ── Data fetching ─────────────────────────────────────────────────────
onMounted(async () => {
  try {
    loading.value = true
    if (!authStore.user) await authStore.fetchMe()

    const studentId = authStore.user?.student_id
    if (!studentId) throw new Error('No student profile linked to this account.')

    // Step 1: fetch student record to get cohort_id
    const studentRes = await api.get(`/students/${studentId}`)
    studentRecord.value = studentRes.data?.data || studentRes.data

    const cohortId = studentRecord.value?.cohort_id
    if (!cohortId) throw new Error('Student is not enrolled in any cohort.')

    // Step 2: fan out remaining calls in parallel
    await Promise.allSettled([
      api.get(`/cohorts/${cohortId}`).then(r => { cohortRecord.value = r.data?.data || r.data }).catch(() => {}),
      api.get(`/students/${studentId}/grade-card`).then(r => { gradeCard.value = r.data?.data || r.data }).catch(() => {}),
      api.get('/excuse-requests').then(r => { excuses.value = r.data?.data || [] }).catch(() => {}),
      ledgerStore.fetchLedger(studentId).catch(() => {}),
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

        <!-- ── HERO: Identity card ──────────────────────────────────── -->
        <div class="profile-hero mb-6">
          <!-- Avatar -->
          <div class="hero-avatar">{{ userInitials }}</div>

          <!-- Identity -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-3 mb-1">
              <h1 class="font-h1 text-[28px] leading-tight text-on-surface m-0">
                {{ authStore.user?.name || '—' }}
              </h1>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-mist text-primary border border-primary/20 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[12px]">school</span>
                Student
              </span>
              <span v-if="isAtRisk" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-mist text-danger border border-danger/20">
                <span class="material-symbols-outlined text-[12px]">warning</span>
                At Risk
              </span>
            </div>
            <p class="font-body-md text-sm text-on-surface-variant m-0">{{ authStore.user?.email }}</p>
          </div>

          <!-- IDs column -->
          <div class="hero-ids">
            <div class="hero-id-item">
              <span class="hero-id-label">Student ID</span>
              <span class="hero-id-value font-mono">#{{ authStore.user?.student_id ?? '—' }}</span>
            </div>
            <div class="hero-id-item" v-if="student?.national_id">
              <span class="hero-id-label">National ID</span>
              <span class="hero-id-value font-mono">{{ String(student.national_id).slice(0, -4).replace(/./g, '•') + String(student.national_id).slice(-4) }}</span>
            </div>
            <div class="hero-id-item" v-if="student?.lab_group_id">
              <span class="hero-id-label">Lab Group</span>
              <span class="hero-id-value font-mono">Group #{{ student.lab_group_id }}</span>
            </div>
          </div>
        </div>

        <!-- ── ROW 1: Cohort + Track + Stats ──────────────────────── -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <!-- Cohort card -->
          <div class="info-card">
            <div class="info-card-header">
              <span class="material-symbols-outlined text-primary">groups</span>
              <span class="info-card-title">Cohort</span>
            </div>
            <p class="info-card-primary">{{ cohort?.name || '—' }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border uppercase tracking-wide"
                :class="{
                  'bg-success-mist text-success border-success/20': cohortStatusVariant === 'success',
                  'bg-primary-mist text-primary border-primary/20': cohortStatusVariant === 'primary',
                  'bg-warning-mist text-warning border-warning/20': cohortStatusVariant === 'warning',
                  'bg-surface-variant text-on-surface-variant border-black/10': cohortStatusVariant === 'secondary' || cohortStatusVariant === 'muted',
                }"
              >{{ cohortStatus }}</span>
            </div>
            <div class="info-card-meta mt-3">
              <span class="material-symbols-outlined text-[14px]">date_range</span>
              {{ formatDate(cohort?.start_date) }} → {{ formatDate(cohort?.end_date) }}
            </div>
          </div>

          <!-- Track card -->
          <div class="info-card">
            <div class="info-card-header">
              <span class="material-symbols-outlined text-primary">route</span>
              <span class="info-card-title">Track</span>
            </div>
            <p class="info-card-primary">{{ track?.name || '—' }}</p>
            <p class="info-card-meta mt-2">
              <span class="material-symbols-outlined text-[14px]">corporate_fare</span>
              Branch ID: {{ track?.branch_id || '—' }}
            </p>
            <p v-if="track?.description" class="font-body-md text-xs text-on-surface-variant mt-2 leading-relaxed">
              {{ track.description }}
            </p>
          </div>

          <!-- Balance KPI card -->
          <div class="info-card" :class="isAtRisk ? 'border-danger/30 bg-danger-mist/30' : ''">
            <div class="info-card-header">
              <span class="material-symbols-outlined" :class="isAtRisk ? 'text-danger' : 'text-success'">account_balance_wallet</span>
              <span class="info-card-title">Attendance Balance</span>
            </div>
            <div class="flex items-baseline gap-1.5 mt-2">
              <span class="font-h1 text-[36px] leading-none" :class="isAtRisk ? 'text-danger' : 'text-on-surface'">{{ ledgerBalance }}</span>
              <span class="font-body-md text-base text-on-surface-variant font-semibold">/ 250 pts</span>
            </div>
            <div class="mt-3">
              <div class="w-full bg-black/5 rounded-full h-1.5">
                <div
                  class="h-full rounded-full transition-[width] duration-700 ease-out"
                  :class="isAtRisk ? 'bg-danger' : 'bg-success'"
                  :style="{ width: `${balancePct}%` }"
                ></div>
              </div>
              <p class="font-body-md text-xs mt-1.5 flex items-center gap-1" :class="isAtRisk ? 'text-danger' : 'text-on-surface-variant'">
                <span class="material-symbols-outlined text-[13px]">{{ isAtRisk ? 'warning' : 'check_circle' }}</span>
                {{ isAtRisk ? 'Below at-risk threshold of 150 pts' : 'Good standing' }}
              </p>
            </div>
          </div>
        </div>

        <!-- ── ROW 2: Grand Total ring + Course breakdown ─────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

          <!-- Grand Total -->
          <div class="lg:col-span-4 section-card flex flex-col items-center justify-center py-8">
            <h2 class="font-h1 text-[18px] text-on-surface mb-1 text-center">Grand Total</h2>
            <p class="font-body-md text-xs text-on-surface-variant mb-6 text-center">Ledger + Course Scores</p>
            <GrandTotalRing :total="grandTotal" :max="grandMax" :grade-letter="grandTotalLetter" />
            <div class="mt-6 w-full space-y-2 px-4">
              <div class="flex justify-between items-center text-sm">
                <span class="text-on-surface-variant flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-success inline-block"></span>
                  Attendance
                </span>
                <span class="font-mono text-xs text-on-surface">{{ ledgerBalance }} pts</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-on-surface-variant flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  Courses
                </span>
                <span class="font-mono text-xs text-on-surface">{{ sumCourseScores }} pts</span>
              </div>
            </div>
          </div>

          <!-- Course grades -->
          <div class="lg:col-span-8 section-card">
            <div class="flex justify-between items-center mb-6">
              <h2 class="font-h1 text-[18px] text-on-surface m-0">Course Performance</h2>
              <span class="font-mono text-xs text-on-surface-variant bg-surface-variant px-2 py-1 rounded-md">
                {{ courses.length }} course{{ courses.length !== 1 ? 's' : '' }}
              </span>
            </div>
            <div class="flex flex-col gap-3">
              <CourseGradeBar
                v-for="(courseObj, idx) in courses"
                :key="courseObj.course?.id || idx"
                :course-obj="courseObj"
              />
              <div v-if="courses.length === 0" class="flex flex-col items-center justify-center py-10 text-on-surface-variant">
                <span class="material-symbols-outlined text-[40px] mb-3 opacity-30">menu_book</span>
                <p class="font-body-md text-sm">No course grades recorded yet.</p>
                <p class="font-body-md text-xs opacity-70 mt-1">Grades will appear here once your instructors enter them.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── ROW 3: Excuse history ───────────────────────────────── -->
        <div class="section-card mb-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-h1 text-[18px] text-on-surface m-0">Excuse Requests</h2>
            <span class="font-mono text-xs text-on-surface-variant bg-surface-variant px-2 py-1 rounded-md">
              {{ excuses.length }} request{{ excuses.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div v-if="excuses.length === 0" class="flex flex-col items-center justify-center py-10 text-on-surface-variant">
            <span class="material-symbols-outlined text-[40px] mb-3 opacity-30">description</span>
            <p class="font-body-md text-sm">No excuse requests submitted.</p>
          </div>

          <div v-else class="flex flex-col gap-3">
            <div
              v-for="ex in excuses"
              :key="ex.id"
              class="excuse-row"
            >
              <!-- Status dot -->
              <div class="excuse-id">
                <span class="font-mono text-xs text-on-surface-variant">#{{ ex.id }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-body-md text-sm text-on-surface truncate">{{ ex.reason || 'No reason provided' }}</p>
                <p class="font-body-md text-xs text-on-surface-variant mt-0.5">
                  Attendance record #{{ ex.attendance_record_id }}
                  <span v-if="ex.reviewed_at"> · Reviewed {{ formatDate(ex.reviewed_at) }}</span>
                </p>
              </div>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0"
                :class="excuseStatusClass(ex.status)"
              >{{ excuseStatusLabel(ex.status) }}</span>
              <a
                v-if="ex.attachment_url"
                :href="`https://13.60.179.178${ex.attachment_url}`"
                target="_blank"
                rel="noopener"
                class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-mist transition-colors"
                title="View attachment"
              >
                <span class="material-symbols-outlined text-[16px]">attach_file</span>
              </a>
            </div>
          </div>
        </div>

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

.info-card-primary {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0;
  line-height: 1.2;
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

/* ── Excuse row ─────────────────────────────────────────────────────── */
.excuse-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  background: #FAFAFA;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.excuse-row:hover {
  background: #F7F7F7;
  border-color: rgba(0,0,0,0.09);
}

.excuse-id {
  flex-shrink: 0;
  width: 36px;
  text-align: center;
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
