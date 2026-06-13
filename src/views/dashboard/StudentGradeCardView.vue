<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLedgerStore } from '@/stores/ledger'
import api from '@/services/api'
import MainLayout from '@/components/layout/MainLayout.vue'

import GrandTotalRing from '@/components/student/GrandTotalRing.vue'
import CourseGradeBar from '@/components/student/CourseGradeBar.vue'
import ProgressSparkline from '@/components/student/ProgressSparkline.vue'

const authStore = useAuthStore()
const ledgerStore = useLedgerStore()

const loading = ref(true)
const error = ref(null)
const gradeCardData = ref(null)

// Computed metrics
const courses = computed(() => gradeCardData.value?.courses || [])

const sumCourseScores = computed(() => {
  return courses.value.reduce((acc, c) => acc + (Number(c.total_score) || 0), 0)
})

const sumCourseMaxScores = computed(() => {
  return courses.value.reduce((acc, c) => acc + (Number(c.course?.max_score) || 0), 0)
})

const grandTotal = computed(() => {
  return (ledgerStore.balance || 0) + sumCourseScores.value
})

const grandMax = computed(() => {
  return (ledgerStore.max || 250) + sumCourseMaxScores.value
})

const grandTotalLetter = computed(() => {
  if (grandMax.value === 0) return 'N/A'
  const percentage = (grandTotal.value / grandMax.value) * 100
  if (percentage >= 90) return 'A'
  if (percentage >= 85) return 'B+'
  if (percentage >= 80) return 'B'
  if (percentage >= 75) return 'C+'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
})

const courseAvgPercentage = computed(() => {
  if (sumCourseMaxScores.value === 0) return 0
  return (sumCourseScores.value / sumCourseMaxScores.value) * 100
})

const ledgerPercentage = computed(() => {
  const max = ledgerStore.max || 250
  if (max === 0) return 0
  return ((ledgerStore.balance || 0) / max) * 100
})

// Calculate timeline for sparkline — tracks cumulative course score over time (not ledger)
const timeline = computed(() => {
  const allGrades = []
  courses.value.forEach((c) => {
    if (c.components) {
      allGrades.push(...c.components.filter((g) => g.created_at || g.updated_at))
    }
  })

  if (allGrades.length === 0) {
    // Return a baseline data-point so the sparkline renders without crashing
    return [
      { week: 0, running_total: 0 },
      { week: 1, running_total: sumCourseScores.value }
    ]
  }

  // Sort chronologically
  allGrades.sort((a, b) => new Date(a.created_at || a.updated_at).getTime() - new Date(b.created_at || b.updated_at).getTime())

  const earliest = new Date(allGrades[0].created_at || allGrades[0].updated_at).getTime()
  const weeklyTotals = new Map()

  // Running total of course scores only (ledger is a separate axis)
  let runningTotal = 0

  allGrades.forEach(grade => {
    const msSinceEarliest = new Date(grade.created_at || grade.updated_at).getTime() - earliest
    const week = Math.floor(msSinceEarliest / (7 * 24 * 60 * 60 * 1000)) + 1
    runningTotal += Number(grade.effective_score || 0)
    weeklyTotals.set(week, runningTotal)
  })

  // Convert map to sorted array, prepend week-0 baseline
  const sortedWeeks = Array.from(weeklyTotals.keys()).sort((a, b) => a - b)
  return [
    { week: 0, running_total: 0 },
    ...sortedWeeks.map(w => ({
      week: w,
      running_total: weeklyTotals.get(w) || 0
    }))
  ]
})

onMounted(async () => {
  try {
    loading.value = true
    if (!authStore.user) {
      await authStore.fetchMe()
    }
    
    const studentId = authStore.user?.student_id
    if (!studentId) throw new Error('Student profile not found.')

    // Fetch both Grade Card and Ledger in parallel
    const [gradeCardRes] = await Promise.all([
      api.get(`/students/${studentId}/grade-card`),
      ledgerStore.fetchLedger(studentId)
    ])

    gradeCardData.value = gradeCardRes.data?.data || gradeCardRes.data
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load grade card'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <MainLayout title="Grade Card">
    <div class="p-8 flex-1 overflow-y-auto max-w-[1400px] mx-auto w-full">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
      <div>
        <h1 class="font-h1 text-h1 text-on-surface mb-2">Grade Card</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">Track your academic progress and course performance.</p>
      </div>
      <button class="px-6 py-2.5 rounded-lg border-2 text-primary border-primary font-label text-label hover:bg-primary-mist transition-colors flex items-center gap-2 font-medium w-fit">
        <span class="material-symbols-outlined text-[18px]">download</span>
        Download Grade Report
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-danger-mist text-danger p-6 rounded-[16px] border border-danger-mist">
      <div class="flex items-center gap-3 mb-2">
        <span class="material-symbols-outlined">error</span>
        <h3 class="font-h3 text-h3">Failed to load</h3>
      </div>
      <p>{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Hero Card: Grand Total -->
      <div class="grid grid-cols-12 gap-gutter mb-8">
        <div class="col-span-12 bg-surface rounded-[20px] shadow-sm p-8 flex flex-col md:flex-row gap-8 items-center border border-transparent hover:shadow-md transition-shadow">
          <!-- Left: Circular Progress -->
          <div class="w-full md:w-[40%] flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-outline-variant pb-8 md:pb-0 md:pr-8">
            <h3 class="font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase mb-6 w-full text-center">Grand Total</h3>
            
            <GrandTotalRing 
              :total="grandTotal" 
              :max="grandMax" 
              :grade-letter="grandTotalLetter" 
            />
          </div>

          <!-- Right: Summary Bars -->
          <div class="w-full md:w-[60%] flex flex-col justify-center">
            <!-- Ledger Bar -->
            <div class="mb-6">
              <div class="flex justify-between items-end mb-2">
                <span class="font-label text-label text-on-surface font-medium">Attendance Ledger</span>
                <span class="font-mono text-mono text-on-surface-variant">{{ Math.round(ledgerStore.balance || 0) }} / {{ ledgerStore.max || 250 }}</span>
              </div>
              <div class="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                <div 
                  class="h-2 rounded-full transition-all duration-1000" 
                  :class="!ledgerStore.isAtRisk ? 'bg-success' : 'bg-danger'"
                  :style="{ width: `${ledgerPercentage}%` }"
                ></div>
              </div>
            </div>

            <!-- Course Scores Bar -->
            <div class="mb-8">
              <div class="flex justify-between items-end mb-2">
                <span class="font-label text-label text-on-surface font-medium">Course Scores (Avg)</span>
                <span class="font-mono text-mono text-on-surface-variant">{{ Math.round(sumCourseScores) }} / {{ Math.round(sumCourseMaxScores) }}</span>
              </div>
              <div class="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                <div 
                  class="bg-primary h-2 rounded-full transition-all duration-1000" 
                  :style="{ width: `${courseAvgPercentage}%` }"
                ></div>
              </div>
            </div>

            <p class="font-body-sm text-body-sm text-on-surface-variant italic mt-auto">
              <span class="font-medium">Note:</span> Grand Total = Ledger + Σ Normalized Course Scores
            </p>
          </div>
        </div>
      </div>

      <!-- Split Layout: Course Breakdown & Progress Timeline -->
      <div class="grid grid-cols-12 gap-gutter">
        <!-- Left: Course Breakdown -->
        <div class="col-span-12 lg:col-span-7 flex flex-col gap-4">
          <h3 class="font-h3 text-h3 text-on-surface mb-2">Course Score Breakdown</h3>
          <div class="flex flex-col gap-3">
            <div v-if="courses.length === 0" class="text-on-surface-variant text-body-md py-4">
              No course grades available.
            </div>
            <CourseGradeBar 
              v-for="(courseObj, idx) in courses" 
              :key="courseObj.course?.id || idx"
              :course-obj="courseObj"
            />
          </div>
        </div>

        <!-- Right: Progress Timeline -->
        <div class="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <h3 class="font-h3 text-h3 text-on-surface mb-2">Progress Over Time</h3>
          <ProgressSparkline 
            :timeline="timeline" 
            :max-total="grandMax" 
          />
        </div>
      </div>
    </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.bg-canvas {
  background-color: var(--color-canvas);
}
.text-on-surface {
  color: var(--color-text);
}
.text-on-surface-variant {
  color: var(--color-text-secondary);
}
.bg-surface {
  background-color: var(--color-surface);
}
.bg-surface-variant {
  background-color: var(--color-primary-mist);
}
.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-mist {
  background-color: var(--color-primary-mist);
}
.border-primary {
  border-color: var(--color-primary);
}
.text-primary {
  color: var(--color-primary);
}
.bg-danger {
  background-color: var(--color-danger);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-danger-mist {
  background-color: var(--color-danger-mist);
}
.border-danger-mist {
  border-color: var(--color-danger-mist);
}
.text-danger {
  color: var(--color-danger);
}
.gap-gutter {
  gap: 24px;
}
</style>
