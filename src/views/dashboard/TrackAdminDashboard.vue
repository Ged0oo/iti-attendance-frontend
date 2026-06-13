<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import { useCohortStore } from '../../stores/cohort'
import { initials } from '../../composables/useUtils'

const store = useCohortStore()

const students = ref([])
const atRiskList = ref([])
const distribution = ref(null)

const activeCohort = computed(
  () => store.cohorts.find((c) => c.status !== 'rolled_up') || store.cohorts[0] || null,
)

const kpis = computed(() => [
  { label: 'Students Enrolled', value: String(students.value.length), icon: 'check_circle', tone: 'success', note: activeCohort.value ? activeCohort.value.name : 'No active cohort', noteIcon: 'group' },
  { label: 'At-Risk Students', value: String(atRiskList.value.length), icon: 'warning', tone: 'danger', note: 'Flagged students', noteIcon: 'error' },
])

const gradeBars = computed(() => {
  const buckets = distribution.value?.buckets ?? []
  const total = buckets.reduce((sum, b) => sum + Number(b.count || 0), 0)
  return buckets.map((b) => ({
    range: b.label,
    pct: total > 0 ? Math.round((Number(b.count || 0) / total) * 100) : 0,
    fail: b.label === '<60',
  }))
})

const hasGrades = computed(() => (distribution.value?.student_course_count ?? 0) > 0)

onMounted(async () => {
  if (!store.cohorts.length) await store.fetchCohorts()
  try {
    if (activeCohort.value) students.value = await store.fetchStudents(activeCohort.value.id)
  } catch (e) { /* ignore */ }
  try {
    atRiskList.value = await store.fetchAtRiskStudents()
  } catch (e) { /* ignore */ }
  try {
    const params = activeCohort.value ? { cohort_id: activeCohort.value.id } : {}
    distribution.value = await store.fetchGradeDistribution(params)
  } catch (e) { /* ignore */ }
})
</script>

<template>
  <MainLayout title="Academic Portal">
    <template #action>
      <button class="bg-primary hover:bg-primary-deep text-on-primary px-5 h-10 rounded-lg font-label text-label flex items-center gap-2 shadow-sm transition-all active:scale-95 duration-150 hover:shadow-md border border-primary">
        <span class="material-symbols-outlined text-[18px]">add</span>
        New Enrollment
      </button>
    </template>

    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="font-display text-display text-on-surface mb-1">Overview</h2>
        <p class="font-body-md text-body-md text-on-surface-variant">
          Track operational metrics and monitor academic integrity.
        </p>
      </div>
      <button class="flex items-center gap-2 bg-surface border border-outline-variant hover:border-outline px-4 py-2.5 rounded-lg shadow-sm transition-colors text-on-surface font-label text-label min-w-[280px] justify-between group">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[18px]">folder_managed</span>
          <span>{{ activeCohort ? activeCohort.name : 'No active cohort' }}</span>
        </div>
        <span class="material-symbols-outlined text-outline text-[18px]">arrow_drop_down</span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow relative overflow-hidden group"
        :class="kpi.tone === 'danger' ? 'bg-danger-mist border-danger/10' : 'bg-surface border-transparent'"
      >
        <div
          class="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-500"
          :class="kpi.tone === 'success' ? 'bg-success-mist' : kpi.tone === 'warning' ? 'bg-warning-mist' : 'bg-danger/10'"
        ></div>
        <div class="flex justify-between items-start mb-4 relative z-10">
          <div class="flex items-center gap-2">
            <span class="font-label text-label" :class="kpi.tone === 'danger' ? 'text-danger' : 'text-on-surface-variant'">{{ kpi.label }}</span>
            <span v-if="kpi.badge" class="bg-warning text-surface text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{{ kpi.badge }}</span>
          </div>
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :class="kpi.tone === 'success' ? 'bg-success-mist text-success' : kpi.tone === 'warning' ? 'bg-warning-mist text-warning' : 'bg-danger/10 text-danger'"
          >
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">{{ kpi.icon }}</span>
          </div>
        </div>
        <div class="font-kpi text-kpi relative z-10" :class="kpi.tone === 'danger' ? 'text-danger' : 'text-on-surface'">{{ kpi.value }}</div>
        <div
          class="mt-2 flex items-center gap-1 font-body-sm text-body-sm relative z-10"
          :class="kpi.tone === 'success' ? 'text-success' : kpi.tone === 'warning' ? 'text-warning' : 'text-danger'"
        >
          <span class="material-symbols-outlined text-[14px]">{{ kpi.noteIcon }}</span>
          <span>{{ kpi.note }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
      <div class="lg:col-span-7 bg-surface rounded-xl shadow-sm p-6 border border-transparent">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-h3 text-h3 text-on-surface">Grade Distribution</h3>
          <span v-if="activeCohort" class="font-label-caps text-label-caps text-on-surface-variant uppercase opacity-60">{{ activeCohort.name }}</span>
        </div>
        <p v-if="!hasGrades" class="text-center text-on-surface-variant font-body-sm text-body-sm py-10">
          No grades recorded yet.
        </p>
        <div v-else class="space-y-4 pt-2">
          <div
            v-for="bar in gradeBars"
            :key="bar.range"
            class="flex items-center gap-4"
            :class="{ 'mt-6': bar.fail }"
          >
            <div class="w-16 font-mono text-mono text-right" :class="bar.fail ? 'text-danger font-bold' : 'text-on-surface-variant'">{{ bar.range }}</div>
            <div class="flex-1 h-3 bg-surface-sunken rounded-full overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="bar.fail ? 'bg-danger' : 'bg-gradient-to-r from-primary-container to-primary'"
                :style="{ width: bar.pct + '%' }"
              ></div>
            </div>
            <div class="w-10 font-label text-label text-right" :class="bar.fail ? 'text-danger font-bold' : 'text-on-surface'">{{ bar.pct }}%</div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-5 bg-surface rounded-xl shadow-sm border border-transparent overflow-hidden flex flex-col">
        <div class="p-6 pb-4 border-b border-surface-container-highest flex items-center gap-2">
          <h3 class="font-h3 text-h3 text-on-surface">At-Risk Students</h3>
          <span class="material-symbols-outlined text-danger text-[18px]" style="font-variation-settings: 'FILL' 1;">warning</span>
        </div>
        <div class="flex-1 overflow-y-auto max-h-72">
          <p v-if="!atRiskList.length" class="text-center text-on-surface-variant font-body-sm text-body-sm py-10">
            No at-risk students.
          </p>
          <div
            v-for="s in atRiskList"
            :key="s.id"
            class="flex items-center gap-3 px-6 py-3 border-b border-surface-container-highest hover:bg-danger-mist/30 transition-colors"
          >
            <div class="w-8 h-8 rounded-full bg-danger-mist text-danger flex items-center justify-center font-bold text-[12px]">
              {{ initials(s.user?.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-on-surface truncate">{{ s.user?.name || 'Student #' + s.id }}</div>
              <div class="font-mono text-[11px] text-on-surface-variant">ID: {{ s.national_id || s.id }}</div>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-danger-mist text-danger border border-danger/20">At-Risk</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-transparent overflow-hidden mb-8">
      <div class="p-6 pb-4 flex justify-between items-center bg-shell text-white">
        <h3 class="font-h3 text-h3 uppercase tracking-wide">Enrolled Students</h3>
        <span class="font-mono text-mono text-white/70">{{ students.length }} total</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-surface-sunken border-b border-surface-container-highest">
            <tr class="text-on-surface-variant font-label-caps text-label-caps uppercase">
              <th class="py-4 px-6 font-semibold">Student Name</th>
              <th class="py-4 px-6 font-semibold">Email</th>
              <th class="py-4 px-6 font-semibold">National ID</th>
              <th class="py-4 px-6 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-highest font-body-sm text-body-sm">
            <tr v-if="!students.length">
              <td colspan="4" class="py-8 px-6 text-center text-on-surface-variant">
                No students enrolled in this cohort.
              </td>
            </tr>
            <tr
              v-for="s in students"
              :key="s.id"
              class="hover:bg-surface-sunken/30 transition-colors"
            >
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-[12px]">
                    {{ initials(s.user?.name) }}
                  </div>
                  <span class="font-medium text-on-surface">{{ s.user?.name || 'Student #' + s.id }}</span>
                </div>
              </td>
              <td class="py-4 px-6 text-on-surface-variant">{{ s.user?.email || '—' }}</td>
              <td class="py-4 px-6 font-mono text-mono text-on-surface-variant">{{ s.national_id || '—' }}</td>
              <td class="py-4 px-6 text-right">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium border"
                  :class="s.is_at_risk ? 'bg-danger-mist text-danger border-danger/20' : 'bg-success-mist text-success border-success/20'"
                >
                  {{ s.is_at_risk ? 'At-Risk' : 'Active' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </MainLayout>
</template>
