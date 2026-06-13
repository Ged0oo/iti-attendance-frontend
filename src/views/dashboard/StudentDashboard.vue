<template>
  <MainLayout title="Academic Portal">
    <div class="mb-2">
      <div class="flex items-center gap-3 mb-2">
        <h1 class="font-h1 text-[36px] leading-[1.15] text-on-surface m-0">Good morning, {{ authStore.user?.name || 'Student' }} <span class="inline-block origin-[70%_70%] animate-wave">👋</span></h1>
        <span v-if="authStore.user?.cohort" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-mist text-primary border border-primary/20">
          {{ authStore.user?.cohort?.name }}
        </span>
      </div>
      <p class="font-body-md text-base text-on-surface-variant m-0">Here is your daily academic overview.</p>
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 text-on-surface-variant">
      <div class="w-10 h-10 border-3 border-primary/10 border-t-primary rounded-full animate-spin mb-4"></div>
      <p>Loading your dashboard...</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Attendance Balance"
          icon="calendar_month"
          :variant="ledgerStore.isAtRisk ? 'at-risk' : 'success'"
        >
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="font-h1 text-[40px] leading-none text-on-surface">{{ ledgerStore.balance }}</span>
              <span class="font-body-md text-xl font-semibold text-on-surface-variant">/ 250 pts</span>
            </div>
          </div>
          <template #footer>
            <div class="mt-6">
              <div class="w-full bg-black/5 rounded-full h-1.5 mb-2">
                <div
                  class="h-full rounded-full transition-[width] duration-500 ease-out"
                  :class="ledgerStore.isAtRisk ? 'bg-danger' : 'bg-success'"
                  :style="{ width: `${Math.min(100, Math.max(0, (ledgerStore.balance / 250) * 100))}%` }"
                ></div>
              </div>
              <div class="flex items-center gap-1 text-xs" :class="ledgerStore.isAtRisk ? 'text-danger' : 'text-on-surface-variant'">
                <span class="material-symbols-outlined text-[14px]">warning</span>
                <span>{{ ledgerStore.isAtRisk ? 'At-risk below 150 pts' : 'Good standing' }}</span>
              </div>
            </div>
          </template>
        </SummaryCard>

        <SummaryCard title="Grand Total Score" icon="emoji_events" variant="primary">
          <div class="mt-4 flex justify-between items-center pr-2">
            <div class="flex items-baseline gap-2">
              <span class="font-h1 text-[40px] leading-none text-on-surface">{{ grandTotal }}</span>
              <span class="font-body-md text-xl font-semibold text-on-surface-variant">/ {{ maxGrandTotal }}</span>
            </div>
            <div class="flex items-center gap-3">
              <GrandTotalRing :total="grandTotal" :max="maxGrandTotal" :grade-letter="currentGrade" mini />
            </div>
          </div>
          <template #footer>
            <div class="mt-6 text-right text-sm text-secondary">
              <span>+0 pts since last week</span>
            </div>
          </template>
        </SummaryCard>

        <SummaryCard title="Pending Actions" icon="assignment_late" variant="warning">
          <div class="mt-4 flex flex-col items-center justify-center py-2 h-full">
            <span class="font-kpi text-[64px] leading-none text-warning">{{ pendingActionsCount }}</span>
            <span class="font-body-md text-xl font-semibold text-on-surface-variant mt-2">Unanswered items</span>
          </div>
        </SummaryCard>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-5 bg-surface rounded-3xl border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] hover:border-black/10">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-h1 text-[28px] text-on-surface m-0">Recent Announcements</h2>
            <span class="material-symbols-outlined text-secondary">campaign</span>
          </div>
          <div class="flex flex-col gap-4 flex-1">
            <div v-if="announcements.length === 0" class="text-on-surface-variant italic p-4">No recent announcements.</div>
            <div
              v-for="ann in announcements.slice(0,3)"
              :key="ann.id"
              class="p-4 rounded-2xl bg-surface border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer transition-all duration-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-primary before:opacity-0 before:transition-opacity before:duration-300 hover:translate-x-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:border-black/[0.08] hover:before:opacity-100"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-body-md text-[13px] font-semibold text-on-surface">{{ ann.author_name || 'Admin' }}</span>
                  <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-role-instructor/10 text-role-instructor">{{ ann.author_role || 'Staff' }}</span>
                </div>
                <span class="font-mono text-xs text-on-surface-variant">{{ formatDateShort(ann.created_at) }}</span>
              </div>
              <p class="font-body-md text-sm text-on-surface m-0 transition-colors duration-200">{{ ann.title }}</p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-7 bg-surface rounded-3xl border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] hover:border-black/10 overflow-hidden">
          <div class="flex justify-between items-center p-6 border-b border-black/5">
            <h2 class="font-h1 text-[28px] text-on-surface m-0">My Course Grades</h2>
            <button class="bg-transparent border-none text-on-surface-variant cursor-pointer p-1 rounded-full transition-colors hover:text-primary hover:bg-black/5">
              <span class="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div class="flex flex-col gap-4 p-6">
            <CourseGradeBar
              v-for="grade in courseGrades"
              :key="grade.course.name"
              :course-obj="grade"
            />
            <div v-if="courseGrades.length === 0" class="text-on-surface-variant italic py-4 text-center">
              No grades available yet.
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h2 class="font-h1 text-[28px] text-on-surface m-0">Upcoming Sessions</h2>
          <div class="flex gap-2">
            <button class="w-8 h-8 rounded-full border border-black/10 bg-transparent flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors hover:bg-black/5" @click="scrollSessions(-1)">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button class="w-8 h-8 rounded-full border border-black/10 bg-transparent flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors hover:bg-black/5" @click="scrollSessions(1)">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
        <div class="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide" ref="sessionsScrollRef">
          <div v-if="sessions.length === 0" class="text-on-surface-variant italic p-4">No upcoming sessions scheduled.</div>
          <SessionCard
            v-for="session in sessions"
            :key="session.id"
            :date="formatDateShort(session.start_time)"
            :type="session.type || 'Lecture'"
            :title="session.title || 'Session'"
            :instructor="session.instructor_name || 'TBA'"
            :time="formatTimeRange(session.start_time, session.end_time)"
          />
        </div>
      </div>
    </template>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLedgerStore } from '@/stores/ledger'
import api from '@/services/api'
import MainLayout from '@/components/layout/MainLayout.vue'

import SummaryCard from '@/components/student/SummaryCard.vue'
import GrandTotalRing from '@/components/student/GrandTotalRing.vue'
import CourseGradeBar from '@/components/student/CourseGradeBar.vue'
import SessionCard from '@/components/student/SessionCard.vue'

const authStore = useAuthStore()
const ledgerStore = useLedgerStore()

const isLoading = ref(true)
const announcements = ref([])
const sessions = ref([])
const courseGrades = ref([])
const pendingActionsCount = ref(0)

const sessionsScrollRef = ref(null)

const scrollSessions = (direction) => {
  if (sessionsScrollRef.value) {
    const scrollAmount = 344
    sessionsScrollRef.value.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' })
  }
}

const grandTotal = computed(() => {
  const courseSum = courseGrades.value.reduce((sum, g) => sum + (g.total_score || 0), 0)
  return ledgerStore.balance + courseSum
})

const maxGrandTotal = computed(() => {
  const courseMax = courseGrades.value.reduce((sum, g) => sum + (g.course?.max_score || 100), 0)
  return 250 + courseMax
})

const currentGrade = computed(() => {
  if (maxGrandTotal.value === 0) return 'N/A'
  const pct = (grandTotal.value / maxGrandTotal.value) * 100
  if (pct >= 90) return 'A'
  if (pct >= 85) return 'B+'
  if (pct >= 80) return 'B'
  if (pct >= 75) return 'C+'
  if (pct >= 70) return 'C'
  if (pct >= 60) return 'D'
  return 'F'
})

onMounted(async () => {
  try {
    if (!authStore.user) {
      await authStore.fetchMe()
    }

    const studentId = authStore.user?.student_id
    let cohortId = authStore.user?.cohort_id

    if (studentId) {
      if (!cohortId) {
        try {
          const profileRes = await api.get(`/students/${studentId}`)
          cohortId = profileRes.data?.data?.cohort_id || profileRes.data?.cohort_id
        } catch (e) {
          console.error("Could not fetch student profile", e)
        }
      }
    }

    const promises = []

    if (studentId) {
      promises.push(
        ledgerStore.fetchLedger(studentId).catch(() => {})
      )
    }

    promises.push(
      api.get('/sessions').then(res => {
        sessions.value = res.data.data || res.data || []
      }).catch(() => {})
    )

    if (cohortId) {
      promises.push(
        api.get(`/cohorts/${cohortId}/announcements`).then(res => {
          announcements.value = res.data.data || res.data || []
        }).catch(() => {})
      )
    }

    promises.push(
      api.get('/excuse-requests').then(res => {
        const requests = res.data.data || res.data || []
        pendingActionsCount.value = requests.filter((r) => r.status === 'pending').length
      }).catch(() => {})
    )

    if (studentId) {
      promises.push(
        api.get(`/students/${studentId}/grade-card`).then(res => {
          const gradeCardData = res.data?.data || res.data
          courseGrades.value = (gradeCardData?.courses || []).map((c) => ({
            course: {
              name: c.course?.name || c.name || 'Course',
              max_score: Number(c.course?.max_score) || Number(c.max_score) || 100
            },
            total_score: Number(c.total_score) || 0,
            components: (c.components || []).map((comp) => ({
              effective_score: Number(comp.effective_score) || 0,
              grade_component: {
                name: comp.grade_component?.name || comp.name || 'Component',
                weight: Number(comp.grade_component?.weight) || Number(comp.weight) || 100
              }
            }))
          }))
        }).catch(() => {
          courseGrades.value = []
        })
      )
    }

    await Promise.allSettled(promises)
  } catch {
  } finally {
    isLoading.value = false
  }
})

const formatDateShort = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatTimeRange = (start, end) => {
  if (!start) return ''
  const formatTime = (timeStr) => {
    const d = new Date(timeStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return `${formatTime(start)} - ${end ? formatTime(end) : '?'}`
}
</script>
