<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import { initials } from '../../composables/useUtils'
import api from '@/services/api'

const loading = ref(true)
const instructors = ref([])
const selectedId = ref(null)
const detail = ref(null)
const engagements = ref([])
const detailLoading = ref(false)
const search = ref('')
const filterTab = ref('all')

const filtered = computed(() => {
  let list = instructors.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (i) =>
        (i.user_name || '').toLowerCase().includes(q) ||
        (i.compensation_type || '').toLowerCase().includes(q),
    )
  }
  if (filterTab.value === 'internal')
    list = list.filter((i) => i.compensation_type === 'internal' || i.compensation_type === 'fixed')
  if (filterTab.value === 'external')
    list = list.filter((i) => i.compensation_type === 'external' || i.compensation_type === 'hourly')
  return list
})

const selected = computed(
  () => instructors.value.find((i) => i.id === selectedId.value) || null,
)

async function fetchInstructors() {
  loading.value = true
  try {
    const res = await api.get('/api/instructors')
    instructors.value = res.data?.data || res.data || []
    if (instructors.value.length && !selectedId.value) {
      selectInstructor(instructors.value[0].id)
    }
  } catch {
    instructors.value = []
  } finally {
    loading.value = false
  }
}

async function selectInstructor(id) {
  selectedId.value = id
  detailLoading.value = true
  detail.value = null
  engagements.value = []
  try {
    const [detailRes, engRes] = await Promise.allSettled([
      api.get(`/api/instructors/${id}`),
      api.get('/api/engagements', { params: { instructor_id: id } }),
    ])
    if (detailRes.status === 'fulfilled') {
      detail.value = detailRes.value.data?.data || detailRes.value.data
    }
    if (engRes.status === 'fulfilled') {
      const raw = engRes.value.data?.data || engRes.value.data || []
      engagements.value = Array.isArray(raw)
        ? raw.filter((e) => e.instructor_id === id)
        : []
    }
  } catch {
  } finally {
    detailLoading.value = false
  }
}

function compLabel(type) {
  if (type === 'internal' || type === 'fixed') return 'Internal'
  if (type === 'external' || type === 'hourly') return 'External'
  return type || '—'
}

function compBadgeClass(type) {
  if (type === 'internal' || type === 'fixed') return 'bg-role-ta/10 text-role-ta'
  return 'bg-role-instructor/10 text-role-instructor'
}

function engStatusClass(status) {
  if (status === 'completed') return 'bg-success-mist text-success'
  if (status === 'active' || status === 'delivering') return 'bg-info-mist text-info'
  return 'bg-warning-mist text-warning'
}

const totalHours = computed(() =>
  engagements.value.reduce((sum, e) => sum + (Number(e.scheduled_hours) || 0), 0),
)

onMounted(() => {
  fetchInstructors()
})
</script>

<template>
  <MainLayout title="Instructors">
    <div class="flex flex-1 -m-4 lg:-m-margin-desktop overflow-hidden">
      <section class="w-[35%] min-w-[280px] border-r border-outline-variant bg-surface flex flex-col max-md:w-full max-md:max-h-[50vh]">
        <div class="p-5 border-b border-outline-variant">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-h2 text-[22px] text-on-surface">Instructor Directory</h2>
          </div>

          <div class="flex gap-2 overflow-x-auto pb-2">
            <button
              v-for="tab in [
                { key: 'all', label: 'All' },
                { key: 'internal', label: 'Internal' },
                { key: 'external', label: 'External' },
              ]"
              :key="tab.key"
              class="px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap cursor-pointer border-none transition-all"
              :class="
                filterTab === tab.key
                  ? 'bg-primary-container text-surface'
                  : 'bg-canvas text-on-surface-variant hover:bg-surface-variant'
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
              placeholder="Search instructors..."
              class="w-full pl-9 pr-3 py-2 bg-canvas border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-container/20"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="flex flex-col items-center justify-center p-8 text-on-surface-variant text-[13px] gap-2">
            <div class="w-8 h-8 border-3 border-primary-container/10 border-t-primary-container rounded-full animate-spin"></div>
            <p>Loading instructors...</p>
          </div>
          <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center p-8 text-on-surface-variant text-[13px] gap-2">
            <span class="material-symbols-outlined text-[32px] text-outline-variant">school</span>
            <p>No instructors found</p>
          </div>
          <div
            v-for="i in filtered"
            :key="i.id"
            class="flex items-center gap-3 px-5 py-3.5 border-l-[3px] border-b border-b-black/5 cursor-pointer transition-all"
            :class="
              selectedId === i.id
                ? 'border-l-primary-container bg-primary-mist'
                : 'border-l-transparent hover:bg-canvas'
            "
            @click="selectInstructor(i.id)"
          >
            <div class="w-11 h-11 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-[15px] shrink-0">
              {{ initials(i.user_name) }}
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-body-md text-on-surface truncate" :class="selectedId === i.id ? 'font-bold' : 'font-medium'">
                {{ i.user_name || 'Unknown' }}
              </h4>
              <div class="flex items-center gap-2 mt-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide" :class="compBadgeClass(i.compensation_type)">
                  {{ compLabel(i.compensation_type) }}
                </span>
              </div>
            </div>
            <span
              class="material-symbols-outlined text-[18px] transition-opacity"
              :class="selectedId === i.id ? 'opacity-100 text-primary-container' : 'opacity-0 text-outline-variant'"
            >chevron_right</span>
          </div>
        </div>
      </section>

      <section class="flex-1 bg-canvas overflow-y-auto p-8 flex flex-col gap-6 max-md:p-4">
        <div v-if="detailLoading" class="flex flex-col items-center justify-center h-full text-on-surface-variant text-[13px] gap-2">
          <div class="w-8 h-8 border-3 border-primary-container/10 border-t-primary-container rounded-full animate-spin"></div>
          <p>Loading details...</p>
        </div>

        <div v-else-if="!detail" class="flex flex-col items-center justify-center h-full text-on-surface-variant text-[13px] gap-2">
          <span class="material-symbols-outlined text-[48px] text-outline-variant">school</span>
          <p>Select an instructor to view details</p>
        </div>

        <template v-else>
          <div class="bg-surface rounded-2xl p-6 flex justify-between items-start shadow-sm border border-black/5 max-md:flex-col max-md:gap-4">
            <div class="flex gap-5 items-start">
              <div class="w-24 h-24 rounded-2xl bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-[28px] shrink-0 shadow-md">
                {{ initials(detail.user_name || selected?.user_name) }}
              </div>
              <div>
                <div class="flex items-center gap-3">
                  <h1 class="font-h1 text-[30px] text-on-surface leading-tight">
                    {{ detail.user_name || selected?.user_name || '—' }}
                  </h1>
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-success-mist text-success">
                    <span class="w-1.5 h-1.5 bg-success rounded-full"></span>
                    Active
                  </span>
                </div>
                <p class="text-on-surface-variant text-sm mt-1">
                  {{ compLabel(detail.compensation_type) }} Instructor
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-on-surface-variant text-[11px] uppercase tracking-widest font-semibold">Instructor ID</p>
              <p class="font-mono text-sm text-on-surface">{{ detail.id }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-surface p-5 rounded-2xl shadow-sm border border-black/5 flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-xl bg-primary-mist text-primary-container flex items-center justify-center">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">groups</span>
              </div>
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Engagements</p>
                <p class="font-kpi text-[28px] leading-none text-on-surface">{{ engagements.length }}</p>
              </div>
            </div>
            <div class="bg-surface p-5 rounded-2xl shadow-sm border border-black/5 flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-xl bg-info-mist text-info flex items-center justify-center">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">history_edu</span>
              </div>
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Scheduled Hrs</p>
                <p class="font-kpi text-[28px] leading-none text-on-surface">{{ totalHours }}</p>
              </div>
            </div>
            <div class="bg-surface p-5 rounded-2xl shadow-sm border border-black/5 flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-xl bg-success-mist text-success flex items-center justify-center">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">payments</span>
              </div>
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Compensation</p>
                <p class="font-kpi text-[22px] leading-none text-on-surface" v-if="detail.compensation_type === 'external' || detail.compensation_type === 'hourly'">
                  {{ Number(detail.hourly_rate || 0).toFixed(0) }} <span class="text-sm text-secondary font-normal">/hr</span>
                </p>
                <p class="font-kpi text-[22px] leading-none text-on-surface" v-else>
                  {{ Number(detail.fixed_salary || 0).toFixed(0) }} <span class="text-sm text-secondary font-normal">/month</span>
                </p>
              </div>
            </div>
          </div>

          <div class="bg-surface rounded-2xl overflow-hidden shadow-sm border border-black/5">
            <div class="bg-on-background px-6 py-3.5 flex justify-between items-center">
              <h3 class="text-surface text-[15px] font-semibold">Current Engagements</h3>
              <span class="text-[12px] text-surface/60">{{ engagements.length }} total</span>
            </div>
            <div v-if="engagements.length === 0" class="flex flex-col items-center justify-center py-8 text-on-surface-variant text-[13px]">
              <p>No engagements assigned.</p>
            </div>
            <table v-else class="w-full text-left">
              <thead>
                <tr class="border-b border-outline-variant bg-canvas/50">
                  <th class="px-6 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">Type</th>
                  <th class="px-6 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">Scheduled Hrs</th>
                  <th class="px-6 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">Period</th>
                  <th class="px-6 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="e in engagements"
                  :key="e.id"
                  class="border-b border-outline-variant/30 hover:bg-canvas/30 transition-colors"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-2 h-2 rounded-full"
                        :class="e.type === 'lecture' ? 'bg-engagement-lecture' : e.type === 'lab' ? 'bg-engagement-lab' : 'bg-engagement-biz'"
                      ></div>
                      <span class="font-medium text-on-surface text-sm capitalize">{{ e.type || '—' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 font-mono text-sm text-on-surface">{{ e.scheduled_hours || '—' }}</td>
                  <td class="px-6 py-4 font-mono text-[12px] text-on-surface-variant">
                    {{ e.date_range_start ? e.date_range_start.slice(0, 10) : '—' }}
                    →
                    {{ e.date_range_end ? e.date_range_end.slice(0, 10) : '—' }}
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase" :class="engStatusClass(e.status)">
                      {{ e.status || 'pending' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>
    </div>
  </MainLayout>
</template>
