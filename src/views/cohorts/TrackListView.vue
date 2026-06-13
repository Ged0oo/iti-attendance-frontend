<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import { useAuth } from '../../composables/useAuth'
import { useCohortStore } from '../../stores/cohort'
import api from '@/services/api'
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

const showAddTrack = ref(false)
const addTrackForm = ref({ name: '', description: '', branch_id: '' })
const addTrackError = ref(null)
const addTrackLoading = ref(false)
const branches = ref([])

async function fetchBranches() {
  try {
    const res = await api.get('/api/branches')
    branches.value = res.data?.data || res.data || []
  } catch (e) { /* ignore */ }
}

async function addTrack() {
  addTrackError.value = null
  addTrackLoading.value = true
  try {
    const created = await store.createTrack({
      ...addTrackForm.value,
      branch_id: Number(addTrackForm.value.branch_id),
    })
    showAddTrack.value = false
    addTrackForm.value = { name: '', description: '', branch_id: '' }
    await selectTrack(created.id)
  } catch (e) {
    addTrackError.value = e.response?.data?.message || 'Failed to create track'
  }
  addTrackLoading.value = false
}

const showEditTrack = ref(false)
const editTrackForm = ref({ name: '', description: '' })
const editTrackError = ref(null)
const editTrackLoading = ref(false)

function openEditTrack() {
  if (!selected.value) return
  editTrackForm.value = { name: selected.value.name, description: selected.value.description || '' }
  editTrackError.value = null
  showEditTrack.value = true
}

async function saveEditTrack() {
  editTrackError.value = null
  editTrackLoading.value = true
  try {
    await store.updateTrack(selected.value.id, editTrackForm.value)
    showEditTrack.value = false
  } catch (e) {
    editTrackError.value = e.response?.data?.message || 'Failed to update track'
  }
  editTrackLoading.value = false
}

const showAssignAdmin = ref(false)
const assignEmail = ref('')
const assignError = ref(null)
const assignLoading = ref(false)

async function assignAdmin() {
  assignError.value = null
  assignLoading.value = true
  try {
    await store.assignTrackAdmin(selected.value.id, assignEmail.value)
    admins.value = await store.fetchTrackAdmins(selected.value.id)
    showAssignAdmin.value = false
    assignEmail.value = ''
  } catch (e) {
    assignError.value = e.response?.data?.message || 'Failed to assign admin'
  }
  assignLoading.value = false
}

async function removeAdmin(userId) {
  try {
    await store.removeTrackAdmin(selected.value.id, userId)
    admins.value = admins.value.filter((a) => (a.user_id || a.id) !== userId)
  } catch (e) { /* ignore */ }
}

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
  await Promise.all([store.fetchTracks(), store.fetchCohorts(), fetchBranches()])
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
              @click="showAddTrack = true"
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
              <button class="px-6 py-2 border-[1.5px] border-primary text-primary font-bold font-label text-label rounded-lg hover:bg-primary-mist transition-colors" @click="openEditTrack">Edit Track</button>
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
                <button
                  v-if="canManage"
                  class="mt-2 text-on-surface-variant hover:text-danger transition-colors"
                  title="Remove Admin"
                  @click="removeAdmin(a.user_id || a.id)"
                >
                  <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <button
                v-if="canManage"
                class="border-2 border-dashed border-surface-container-highest rounded-xl flex flex-col items-center justify-center py-6 text-on-surface-variant hover:border-primary hover:text-primary transition-all"
                @click="showAssignAdmin = true"
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
    <!-- Add Track Modal -->
    <div v-if="showAddTrack" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" @click.self="showAddTrack = false">
      <div class="bg-surface rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="font-h3 text-h3 text-on-surface mb-4">New Track</h3>
        <p v-if="addTrackError" class="text-danger font-body-sm text-body-sm mb-3 bg-danger-mist border border-danger/20 rounded-lg px-4 py-2">{{ addTrackError }}</p>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-label text-label text-on-surface-variant">Track Name</label>
            <input v-model="addTrackForm.name" type="text" placeholder="e.g. Open Source" class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-label text-label text-on-surface-variant">Branch</label>
            <select v-model="addTrackForm.branch_id" class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
              <option value="" disabled>Select a branch</option>
              <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-label text-label text-on-surface-variant">Description</label>
            <textarea v-model="addTrackForm.description" rows="3" placeholder="Optional description" class="rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="px-5 py-2.5 rounded-lg font-label text-label text-on-surface-variant hover:bg-surface-sunken transition-colors" @click="showAddTrack = false">Cancel</button>
          <button class="px-5 py-2.5 rounded-lg font-label text-label bg-primary text-white hover:bg-primary-deep transition-colors shadow-sm" :disabled="!addTrackForm.name || !addTrackForm.branch_id || addTrackLoading" :class="{ 'opacity-50 cursor-not-allowed': !addTrackForm.name || !addTrackForm.branch_id || addTrackLoading }" @click="addTrack">
            {{ addTrackLoading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Track Modal -->
    <div v-if="showEditTrack" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" @click.self="showEditTrack = false">
      <div class="bg-surface rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="font-h3 text-h3 text-on-surface mb-4">Edit Track</h3>
        <p v-if="editTrackError" class="text-danger font-body-sm text-body-sm mb-3 bg-danger-mist border border-danger/20 rounded-lg px-4 py-2">{{ editTrackError }}</p>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-label text-label text-on-surface-variant">Track Name</label>
            <input v-model="editTrackForm.name" type="text" class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-label text-label text-on-surface-variant">Description</label>
            <textarea v-model="editTrackForm.description" rows="3" class="rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="px-5 py-2.5 rounded-lg font-label text-label text-on-surface-variant hover:bg-surface-sunken transition-colors" @click="showEditTrack = false">Cancel</button>
          <button class="px-5 py-2.5 rounded-lg font-label text-label bg-primary text-white hover:bg-primary-deep transition-colors shadow-sm" :disabled="!editTrackForm.name || editTrackLoading" :class="{ 'opacity-50 cursor-not-allowed': !editTrackForm.name || editTrackLoading }" @click="saveEditTrack">
            {{ editTrackLoading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Assign Admin Modal -->
    <div v-if="showAssignAdmin" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" @click.self="showAssignAdmin = false">
      <div class="bg-surface rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="font-h3 text-h3 text-on-surface mb-4">Assign Track Admin</h3>
        <p v-if="assignError" class="text-danger font-body-sm text-body-sm mb-3 bg-danger-mist border border-danger/20 rounded-lg px-4 py-2">{{ assignError }}</p>
        <div class="flex flex-col gap-2">
          <label class="font-label text-label text-on-surface-variant">User ID</label>
          <input v-model="assignEmail" type="text" placeholder="Enter user ID" class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="px-5 py-2.5 rounded-lg font-label text-label text-on-surface-variant hover:bg-surface-sunken transition-colors" @click="showAssignAdmin = false">Cancel</button>
          <button class="px-5 py-2.5 rounded-lg font-label text-label bg-primary text-white hover:bg-primary-deep transition-colors shadow-sm" :disabled="!assignEmail || assignLoading" :class="{ 'opacity-50 cursor-not-allowed': !assignEmail || assignLoading }" @click="assignAdmin">
            {{ assignLoading ? 'Assigning...' : 'Assign' }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
