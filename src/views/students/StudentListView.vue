<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import { useAuth } from '../../composables/useAuth'
import { useCohortStore } from '../../stores/cohort'
import { initials, fmtDate } from '../../composables/useUtils'
import api from '@/services/api'

const { hasRole } = useAuth()
const cohortStore = useCohortStore()

const loading = ref(true)
const students = ref([])
const selectedId = ref(null)
const detail = ref(null)
const gradeCard = ref(null)
const detailLoading = ref(false)
const search = ref('')
const filterTab = ref('all')
const selectedCohortId = ref(null)

const cohorts = computed(() => cohortStore.cohorts || [])

const filtered = computed(() => {
  let list = students.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (s) =>
        (s.user?.name || '').toLowerCase().includes(q) ||
        (s.national_id || '').toLowerCase().includes(q),
    )
  }
  if (filterTab.value === 'at-risk') list = list.filter((s) => s.is_at_risk)
  if (filterTab.value === 'active') list = list.filter((s) => !s.is_at_risk)
  return list
})

const selected = computed(
  () => students.value.find((s) => s.id === selectedId.value) || null,
)

async function fetchStudents() {
  if (!selectedCohortId.value) {
    students.value = []
    return
  }
  loading.value = true
  try {
    const res = await api.get(`/api/cohorts/${selectedCohortId.value}/students`)
    students.value = res.data?.data || res.data || []
    if (students.value.length && !selectedId.value) {
      selectStudent(students.value[0].id)
    }
  } catch {
    students.value = []
  } finally {
    loading.value = false
  }
}

async function selectStudent(id) {
  selectedId.value = id
  detailLoading.value = true
  detail.value = null
  gradeCard.value = null
  try {
    const [detailRes, gradeRes] = await Promise.allSettled([
      api.get(`/api/students/${id}`),
      api.get(`/api/students/${id}/grade-card`),
    ])
    if (detailRes.status === 'fulfilled') {
      detail.value = detailRes.value.data?.data || detailRes.value.data
    }
    if (gradeRes.status === 'fulfilled') {
      gradeCard.value = gradeRes.value.data?.data || gradeRes.value.data
    }
  } catch {
  } finally {
    detailLoading.value = false
  }
}

watch(selectedCohortId, () => {
  selectedId.value = null
  detail.value = null
  gradeCard.value = null
  fetchStudents()
})

const courses = computed(() => gradeCard.value?.courses || [])

const totalScore = computed(() =>
  courses.value.reduce((sum, c) => sum + (Number(c.total_score) || 0), 0),
)
const maxScore = computed(() =>
  courses.value.reduce(
    (sum, c) => sum + (Number(c.course?.max_score) || 100),
    0,
  ),
)

const attendancePct = computed(() => {
  const bal = detail.value?.ledger_balance
  if (bal == null) return null
  return Math.round((bal / 250) * 100)
})

const letterGrade = computed(() => {
  if (!maxScore.value) return 'N/A'
  const pct = (totalScore.value / maxScore.value) * 100
  if (pct >= 90) return 'A'
  if (pct >= 85) return 'B+'
  if (pct >= 80) return 'B'
  if (pct >= 75) return 'C+'
  if (pct >= 70) return 'C'
  if (pct >= 60) return 'D'
  return 'F'
})

const trackProgress = computed(() => {
  if (!maxScore.value) return 0
  return Math.round((totalScore.value / maxScore.value) * 100)
})

const trackCircumference = 2 * Math.PI * 54
const trackDashoffset = computed(
  () => trackCircumference - (trackProgress.value / 100) * trackCircumference,
)

const currentCohort = computed(() =>
  cohorts.value.find((c) => c.id === selectedCohortId.value),
)

function courseStatus(c) {
  const pct = (Number(c.total_score) / (c.course?.max_score || 100)) * 100
  if (pct >= 80) return 'bg-success-mist text-success'
  if (pct >= 60) return 'bg-info-mist text-info'
  return 'bg-warning-mist text-warning'
}

function courseLabel(c) {
  const pct = (Number(c.total_score) / (c.course?.max_score || 100)) * 100
  if (pct >= 80) return 'Excellent'
  if (pct >= 60) return 'Good'
  return 'Needs Work'
}

onMounted(async () => {
  await cohortStore.fetchCohorts()
  if (cohorts.value.length) {
    selectedCohortId.value = cohorts.value[0].id
  }
})
</script>

<template>
  <MainLayout title="Student Records">
    <div class="flex flex-1 -m-4 lg:-m-margin-desktop overflow-hidden">
      <section class="w-[35%] min-w-[280px] border-r border-outline-variant bg-surface flex flex-col">
        <div class="p-5 border-b border-outline-variant">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-h3 text-h3 text-on-surface">Student Registry</h2>
          </div>

          <select
            v-model="selectedCohortId"
            class="w-full mb-3 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm focus:ring-2 focus:ring-primary-container/30 focus:border-primary-container"
          >
            <option :value="null" disabled>Select Cohort...</option>
            <option v-for="c in cohorts" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>

          <div class="flex gap-2 overflow-x-auto pb-2">
            <button
              v-for="tab in [
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'at-risk', label: 'At-Risk' },
              ]"
              :key="tab.key"
              class="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap cursor-pointer border-none transition-all"
              :class="
                filterTab === tab.key
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              "
              @click="filterTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="relative mt-3">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              v-model="search"
              type="text"
              placeholder="Search students..."
              class="w-full pl-9 pr-3 py-2 bg-canvas border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-container/20"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="flex flex-col items-center justify-center p-8 text-on-surface-variant text-[13px] gap-2">
            <div class="w-8 h-8 border-3 border-primary-container/10 border-t-primary-container rounded-full animate-spin"></div>
            <p>Loading students...</p>
          </div>
          <div v-else-if="!selectedCohortId" class="flex flex-col items-center justify-center p-8 text-on-surface-variant text-[13px] gap-2">
            <span class="material-symbols-outlined text-[32px] text-outline-variant">groups</span>
            <p>Select a cohort to view students</p>
          </div>
          <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center p-8 text-on-surface-variant text-[13px] gap-2">
            <span class="material-symbols-outlined text-[32px] text-outline-variant">person_off</span>
            <p>No students found</p>
          </div>
          <div
            v-for="s in filtered"
            :key="s.id"
            class="flex items-center gap-3 px-5 py-4 border-l-[3px] border-b border-b-black/5 cursor-pointer transition-all"
            :class="
              selectedId === s.id
                ? 'border-l-primary-container bg-primary-mist'
                : 'border-l-transparent hover:bg-canvas'
            "
            @click="selectStudent(s.id)"
          >
            <div
              class="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] shrink-0"
              :class="
                s.is_at_risk
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-secondary-container text-on-secondary-container'
              "
            >
              {{ initials(s.user?.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-body-md font-semibold text-on-surface truncate">{{ s.user?.name || 'Unknown' }}</p>
              <p class="font-mono text-[11px] text-secondary truncate">
                {{ s.national_id ? `ID: ${s.national_id}` : s.user?.email || '' }}
              </p>
            </div>
            <span
              v-if="s.is_at_risk"
              class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-error-container text-on-error-container shrink-0"
            >At Risk</span>
          </div>
        </div>
      </section>

      <section class="flex-1 bg-canvas overflow-y-auto p-8 flex flex-col gap-6">
        <div v-if="detailLoading" class="flex flex-col items-center justify-center h-full text-on-surface-variant text-[13px] gap-2">
          <div class="w-8 h-8 border-3 border-primary-container/10 border-t-primary-container rounded-full animate-spin"></div>
          <p>Loading student details...</p>
        </div>

        <div v-else-if="!detail" class="flex flex-col items-center justify-center h-full text-on-surface-variant text-[13px] gap-2">
          <span class="material-symbols-outlined text-[48px] text-outline-variant">badge</span>
          <p>Select a student to view details</p>
        </div>

        <template v-else>
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="font-h1 text-[28px] text-on-background leading-tight">
                  {{ detail.user?.name }}
                </h1>
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold uppercase"
                  :class="
                    detail.is_at_risk
                      ? 'bg-danger-mist text-danger'
                      : 'bg-success-mist text-success'
                  "
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="detail.is_at_risk ? 'bg-danger' : 'bg-success'"
                  ></span>
                  {{ detail.is_at_risk ? 'At Risk' : 'Active' }}
                </span>
              </div>
              <p v-if="detail.national_id" class="font-mono text-sm text-secondary tracking-wider">
                NATIONAL ID: {{ detail.national_id }}
              </p>
              <p v-if="detail.user?.email" class="text-sm text-on-surface-variant">
                {{ detail.user.email }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-surface p-5 rounded-2xl shadow-sm border border-black/5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Attendance</p>
              <div class="flex items-baseline gap-2">
                <h3 class="font-kpi text-[32px] leading-none text-on-background">
                  {{ attendancePct != null ? attendancePct + '%' : '—' }}
                </h3>
              </div>
              <p class="text-[11px] text-on-surface-variant mt-2">
                Balance: {{ detail.ledger_balance ?? '—' }} / 250 pts
              </p>
            </div>
            <div class="bg-surface p-5 rounded-2xl shadow-sm border border-black/5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Current Avg.</p>
              <div class="flex items-baseline gap-2">
                <h3 class="font-kpi text-[32px] leading-none text-on-background">
                  {{ maxScore ? Math.round((totalScore / maxScore) * 100) + '%' : '—' }}
                </h3>
                <span class="font-mono text-on-surface-variant text-sm">({{ letterGrade }})</span>
              </div>
              <p class="text-[11px] text-on-surface-variant mt-2">{{ courses.length }} course(s) graded</p>
            </div>
            <div class="bg-surface p-5 rounded-2xl shadow-sm border border-black/5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Total Score</p>
              <div class="flex items-baseline gap-2">
                <h3 class="font-kpi text-[32px] leading-none text-on-background">
                  {{ totalScore }}<span class="text-h3 text-secondary">/{{ maxScore || '—' }}</span>
                </h3>
              </div>
              <div v-if="maxScore" class="w-full h-1.5 bg-canvas rounded-full mt-3 overflow-hidden">
                <div class="h-full bg-primary-container rounded-full transition-all" :style="{ width: trackProgress + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="bg-surface rounded-2xl overflow-hidden shadow-sm border border-black/5">
            <div class="bg-on-background px-6 py-3.5 flex justify-between items-center">
              <h3 class="text-surface text-[15px] font-semibold">Academic Record</h3>
            </div>
            <div v-if="courses.length === 0" class="flex flex-col items-center justify-center py-8 text-on-surface-variant text-[13px]">
              <p>No grades available yet.</p>
            </div>
            <table v-else class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-outline-variant bg-canvas/50">
                  <th class="px-6 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">Course</th>
                  <th class="px-6 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">Score</th>
                  <th class="px-6 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in courses"
                  :key="c.course?.name"
                  class="border-b border-outline-variant/30 hover:bg-canvas/30 transition-colors"
                >
                  <td class="px-6 py-4 font-semibold text-on-surface text-sm">{{ c.course?.name || 'Course' }}</td>
                  <td class="px-6 py-4 font-mono text-sm text-on-background">
                    {{ Number(c.total_score).toFixed(0) }} / {{ c.course?.max_score || 100 }}
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase" :class="courseStatus(c)">
                      {{ courseLabel(c) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="currentCohort" class="bg-surface rounded-2xl p-6 shadow-sm border border-black/5 flex items-start gap-8 max-md:flex-col">
            <div class="flex-1">
              <p class="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Enrolled Cohort</p>
              <h4 class="font-h2 text-[24px] text-primary-container mb-2">{{ currentCohort.name }}</h4>
              <p v-if="currentCohort.track?.name" class="text-sm text-on-surface-variant mb-4">
                Track: {{ currentCohort.track.name }}
              </p>
              <div class="flex items-center gap-6">
                <div>
                  <p class="text-[10px] uppercase font-bold tracking-tight text-on-surface-variant">Start Date</p>
                  <p class="font-mono text-sm">{{ fmtDate(currentCohort.start_date) }}</p>
                </div>
                <div class="w-px h-8 bg-outline-variant"></div>
                <div>
                  <p class="text-[10px] uppercase font-bold tracking-tight text-on-surface-variant">End Date</p>
                  <p class="font-mono text-sm">{{ fmtDate(currentCohort.end_date) }}</p>
                </div>
              </div>
            </div>
            <div v-if="maxScore" class="w-[160px] text-center shrink-0">
              <div class="relative w-[120px] h-[120px] mx-auto mb-3">
                <svg class="w-full h-full transform -rotate-90">
                  <circle cx="60" cy="60" r="54" fill="transparent" stroke="#f5dddb" stroke-width="8" />
                  <circle cx="60" cy="60" r="54" fill="transparent" stroke="#8b1a1a" stroke-width="8"
                    :stroke-dasharray="trackCircumference" :stroke-dashoffset="trackDashoffset" stroke-linecap="round" />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="font-kpi text-[22px] text-on-background">{{ trackProgress }}%</span>
                  <span class="text-[9px] font-bold text-on-surface-variant">SCORE</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </section>
    </div>
  </MainLayout>
</template>
