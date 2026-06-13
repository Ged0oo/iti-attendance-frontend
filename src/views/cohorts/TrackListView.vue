<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import { useAuth } from '../../composables/useAuth'
import { useCohortStore } from '../../stores/cohort'
import { initials, statusColors } from '../../composables/useUtils'

const store = useCohortStore()
const { hasRole } = useAuth()

const canManage = computed(() => hasRole('branch_manager'))

const search = ref('')
const selectedId = ref(null)

const admins = ref([])
const attendanceRate = ref(null)
const trackCohorts = computed(() =>
  store.cohorts.filter((c) => c.track_id === selected.value?.id),
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return store.tracks
  return store.tracks.filter((t) => t.name.toLowerCase().includes(q))
})

const selected = computed(() =>
  store.tracks.find((t) => t.id === selectedId.value) || store.tracks[0] || null,
)

async function selectTrack(id) {
  selectedId.value = id
  admins.value = await store.fetchTrackAdmins(id)
  attendanceRate.value = null
  try {
    const rate = await store.fetchAttendanceRate({ track_id: id })
    attendanceRate.value = rate.attendance_rate
  } catch (e) { /* ignore */ }
}

function fmtDate(d) {
  return d ? String(d).slice(0, 10) : '—'
}

onMounted(async () => {
  await Promise.all([store.fetchTracks(), store.fetchCohorts()])
  if (store.tracks.length) await selectTrack(store.tracks[0].id)
})
</script>

<template>
  <MainLayout title="Training Tracks">
    <div class="flex flex-1 -m-margin-desktop h-[calc(100vh-64px)] overflow-hidden">
      <section class="w-[35%] bg-surface border-r border-outline-variant flex flex-col shadow-sm">
        <div class="p-6 border-b border-surface-container-low">
          <div class="flex justify-between items-end mb-6">
            <h2 class="font-h2 text-h2 text-primary">Training Tracks</h2>
            <button
              v-if="canManage"
              class="bg-primary text-white p-2 rounded-lg flex items-center justify-center hover:bg-primary-deep transition-all active:scale-95 shadow-md"
              title="New Track"
            >
              <span class="material-symbols-outlined">add</span>
            </button>
          </div>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline scale-90">search</span>
            <input
              v-model="search"
              class="w-full pl-10 pr-4 py-2.5 bg-canvas border border-outline-variant rounded-xl font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
              placeholder="Search track name..."
              type="text"
            />
          </div>
        </div>

        <div class="flex-grow overflow-y-auto p-2 space-y-1">
          <p v-if="!filtered.length" class="text-center text-on-surface-variant font-body-sm text-body-sm py-10">
            No tracks found.
          </p>
          <div
            v-for="t in filtered"
            :key="t.id"
            class="flex items-center p-4 rounded-xl cursor-pointer transition-all hover:bg-primary-mist border-l-[3px]"
            :class="selected && selected.id === t.id ? 'border-primary bg-primary-mist shadow-sm' : 'border-transparent'"
            @click="selectTrack(t.id)"
          >
            <div class="flex-grow">
              <span class="font-mono text-mono font-medium tracking-tight" :class="selected && selected.id === t.id ? 'text-primary' : 'text-on-surface-variant'">
                TRK-{{ t.id }}
              </span>
              <h4 class="font-body-md text-body-md font-bold text-on-surface mt-1">{{ t.name }}</h4>
            </div>
            <span class="w-2.5 h-2.5 rounded-full bg-success shrink-0"></span>
          </div>
        </div>
      </section>

      <section class="w-[65%] bg-canvas overflow-y-auto p-10">
        <div v-if="selected">
          <div class="flex justify-between items-start mb-10">
            <div>
              <h1 class="font-h1 text-h1 text-on-surface mb-1">{{ selected.name }}</h1>
              <div class="flex items-center gap-2">
                <p class="font-body-sm text-body-sm text-secondary">{{ selected.description || 'No description' }}</p>
                <span class="w-1 h-1 rounded-full bg-secondary opacity-30"></span>
                <p class="font-mono text-body-sm text-primary font-bold">TRK-{{ selected.id }}</p>
              </div>
            </div>
            <div v-if="canManage" class="flex gap-3">
              <button class="px-6 py-2 border-[1.5px] border-primary text-primary font-bold font-label text-label rounded-lg hover:bg-primary-mist transition-colors">Edit Track</button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-6 mb-10">
            <div class="bg-surface p-6 rounded-2xl shadow-sm border-b-4 border-role-ta">
              <p class="font-label text-label text-on-surface-variant mb-4 uppercase tracking-widest opacity-70">Cohorts</p>
              <p class="font-kpi text-kpi text-on-surface">{{ trackCohorts.length }}</p>
              <div class="mt-4 flex items-center text-on-surface-variant text-[12px] font-medium">
                <span class="material-symbols-outlined text-[16px] mr-1">folder_managed</span>
                <span>On this track</span>
              </div>
            </div>
            <div class="bg-surface p-6 rounded-2xl shadow-sm border-b-4 border-success">
              <p class="font-label text-label text-on-surface-variant mb-4 uppercase tracking-widest opacity-70">Current Attendance</p>
              <p class="font-kpi text-kpi text-success">{{ attendanceRate === null ? '—' : attendanceRate + '%' }}</p>
              <div class="mt-4 flex items-center text-on-surface-variant text-[12px] font-medium">
                <span class="w-2 h-2 rounded-full bg-success mr-2"></span>
                <span>Across all sessions</span>
              </div>
            </div>
            <div class="bg-surface p-6 rounded-2xl shadow-sm border-b-4 border-warning">
              <p class="font-label text-label text-on-surface-variant mb-4 uppercase tracking-widest opacity-70">Avg. Grade</p>
              <p class="font-kpi text-kpi text-on-surface">—</p>
              <div class="mt-4 flex items-center text-on-surface-variant text-[12px] font-medium">
                <span class="material-symbols-outlined text-[16px] mr-1">analytics</span>
                <span>Provided by grading module</span>
              </div>
            </div>
          </div>

          <div class="mb-10">
            <h3 class="font-h3 text-h3 text-on-surface mb-4">Current Cohorts</h3>
            <div class="bg-surface rounded-xl overflow-hidden shadow-sm">
              <table class="w-full text-left border-collapse">
                <thead class="bg-shell text-white">
                  <tr>
                    <th class="px-6 py-4 font-label text-label uppercase tracking-widest">Cohort</th>
                    <th class="px-6 py-4 font-label text-label uppercase tracking-widest">Start Date</th>
                    <th class="px-6 py-4 font-label text-label uppercase tracking-widest">End Date</th>
                    <th class="px-6 py-4 font-label text-label uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-container-low">
                  <tr v-if="!trackCohorts.length">
                    <td colspan="4" class="px-6 py-8 text-center text-on-surface-variant font-body-sm text-body-sm">
                      No cohorts on this track.
                    </td>
                  </tr>
                  <tr v-for="c in trackCohorts" :key="c.id" class="hover:bg-canvas transition-colors">
                    <td class="px-6 py-4 font-body-md text-body-md font-bold">{{ c.name }}</td>
                    <td class="px-6 py-4 font-mono text-body-md">{{ fmtDate(c.start_date) }}</td>
                    <td class="px-6 py-4 font-mono text-body-md">{{ fmtDate(c.end_date) }}</td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 text-[11px] font-bold rounded-full border" :class="statusColors[c.status] || statusColors.rolled_up">
                        {{ c.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <section>
            <h3 class="font-h3 text-h3 text-on-surface mb-6">Track Admins</h3>
            <div class="grid grid-cols-4 gap-4">
              <div
                v-for="a in admins"
                :key="a.id"
                class="bg-surface p-4 rounded-xl border border-surface-container-highest shadow-sm hover:border-primary transition-all flex flex-col items-center text-center"
              >
                <div class="w-16 h-16 rounded-full bg-primary-mist text-primary flex items-center justify-center font-h3 text-h3 mb-3 border-2 border-primary-mist">
                  {{ initials(a.user?.name) }}
                </div>
                <p class="font-body-md text-body-md font-bold text-on-surface">{{ a.user?.name || 'Unknown' }}</p>
                <p class="text-[11px] text-role-ta font-bold uppercase tracking-wide">Track Admin</p>
              </div>

              <button
                v-if="canManage"
                class="border-2 border-dashed border-surface-container-highest rounded-xl flex flex-col items-center justify-center py-6 text-on-surface-variant hover:border-primary hover:text-primary transition-all"
              >
                <span class="material-symbols-outlined text-[32px] mb-1">person_add</span>
                <span class="font-label text-label">Assign New</span>
              </button>
            </div>
            <p v-if="!admins.length && !canManage" class="text-on-surface-variant font-body-sm text-body-sm">
              No admins assigned to this track.
            </p>
          </section>
        </div>

        <div v-else class="flex-1 flex items-center justify-center text-on-surface-variant font-body-md text-body-md py-20">
          Select a track to view details.
        </div>
      </section>
    </div>
  </MainLayout>
</template>
