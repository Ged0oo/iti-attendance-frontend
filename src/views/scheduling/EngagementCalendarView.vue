<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import ConfirmModal from '../../components/common/ConfirmModal.vue'
import { useEngagementStore } from '../../stores/engagement'
import api from '../../services/api'

const store = useEngagementStore()

const TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'lab', label: 'Lab' },
  { value: 'business_session', label: 'Business' },
]

const TYPE_META = {
  lecture: { label: 'Lecture', dot: 'bg-engagement-lecture', text: 'text-engagement-lecture', tint: 'bg-primary-mist', stripe: 'bg-engagement-lecture' },
  lab: { label: 'Lab', dot: 'bg-engagement-lab', text: 'text-engagement-lab', tint: 'bg-success-mist', stripe: 'bg-engagement-lab' },
  business_session: { label: 'Business', dot: 'bg-engagement-biz', text: 'text-engagement-biz', tint: 'bg-warning-mist', stripe: 'bg-engagement-biz' },
}
const meta = (t) => TYPE_META[t] ?? { label: t, dot: 'bg-on-surface-variant', text: 'text-on-surface-variant', tint: 'bg-surface-sunken', stripe: 'bg-on-surface-variant' }

const STATUS_BADGE = {
  scheduled: 'bg-surface-sunken text-on-surface-variant',
  in_progress: 'bg-info-mist text-info',
  completed: 'bg-success-mist text-success',
  cancelled: 'bg-danger-mist text-danger',
}

const cohorts = ref([])
const cohortId = ref('')
const loadingCohorts = ref(true)
const busy = ref(false)
const error = ref('')

const engagements = ref([])
const courses = ref([])
const instructors = ref([])

const courseMap = computed(() => Object.fromEntries(courses.value.map((c) => [c.id, c.name])))
const instructorMap = computed(() => Object.fromEntries(instructors.value.map((i) => [i.user_id, i.user_name || `Instructor #${i.user_id}`])))

// drawer
const selected = ref(null)
const sessions = ref([])
const loadingSessions = ref(false)

// schedule modal (also reused for editing)
const scheduleOpen = ref(false)
const editingId = ref(null) // engagement id when the modal is in edit mode
const blankSchedule = () => ({ course_id: '', instructor_id: '', type: 'lecture', date_range_start: '', date_range_end: '', scheduled_hours: 10 })
const scheduleForm = ref(blankSchedule())

// generate sessions form (inside drawer)
const blankGen = () => ({ start_time: '09:00', end_time: '12:00', scheduled_hours: 3 })
const genForm = ref(blankGen())

const confirmState = ref({ open: false, title: '', message: '', confirmLabel: 'Confirm', action: null })

const cohortLabel = (c) => (c.track?.name ? `${c.name} — ${c.track.name}` : c.name)
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '')
const fmtTime = (t) => (t ? String(t).slice(0, 5) : '')

const deliveredHours = computed(() =>
  sessions.value.filter((s) => s.is_delivered).reduce((sum, s) => sum + Number(s.scheduled_hours || 0), 0),
)
const progressPct = computed(() => {
  const total = Number(selected.value?.scheduled_hours || 0)
  if (!total) return 0
  return Math.min(100, Math.round((deliveredHours.value / total) * 100))
})

onMounted(async () => {
  try {
    const { data } = await api.get('/api/cohorts')
    cohorts.value = data.data ?? data ?? []
    if (cohorts.value.length) cohortId.value = cohorts.value[0].id
  } catch (e) {
    error.value = 'Could not load cohorts.'
  } finally {
    loadingCohorts.value = false
  }
  if (cohortId.value) await loadCohort()
})

async function loadCohort() {
  if (!cohortId.value) return
  error.value = ''
  busy.value = true
  closeDrawer()
  try {
    const [eng, crs, inst] = await Promise.all([
      store.fetchEngagements(cohortId.value),
      store.fetchCourses(cohortId.value),
      store.fetchInstructors(),
    ])
    // copy so our local list is not the same array the store mutates internally
    engagements.value = [...(eng || [])]
    courses.value = [...(crs || [])]
    instructors.value = [...(inst || [])]
  } catch (e) {
    error.value = store.error || 'Could not load engagements.'
  } finally {
    busy.value = false
  }
}

async function openDrawer(engagement) {
  selected.value = engagement
  sessions.value = []
  genForm.value = blankGen()
  loadingSessions.value = true
  try {
    sessions.value = [...(await store.fetchSessions(engagement.id))]
  } catch (e) {
    error.value = store.error || 'Could not load sessions.'
  } finally {
    loadingSessions.value = false
  }
}
function closeDrawer() {
  selected.value = null
  sessions.value = []
}

function openSchedule() {
  editingId.value = null
  scheduleForm.value = blankSchedule()
  scheduleOpen.value = true
}

function openEdit(engagement) {
  editingId.value = engagement.id
  scheduleForm.value = {
    course_id: engagement.course_id || '',
    instructor_id: engagement.instructor_id || '',
    type: engagement.type,
    date_range_start: (engagement.date_range_start || '').slice(0, 10),
    date_range_end: (engagement.date_range_end || '').slice(0, 10),
    scheduled_hours: engagement.scheduled_hours,
  }
  scheduleOpen.value = true
}

function closeSchedule() {
  scheduleOpen.value = false
  editingId.value = null
  scheduleForm.value = blankSchedule()
}

async function submitSchedule() {
  const f = scheduleForm.value
  if (!f.date_range_start || !f.date_range_end) {
    error.value = 'Pick a start and end date.'
    return
  }
  error.value = ''
  const payload = {
    cohort_id: cohortId.value,
    type: f.type,
    course_id: f.course_id || null,
    instructor_id: f.instructor_id || null,
    date_range_start: f.date_range_start,
    date_range_end: f.date_range_end,
    scheduled_hours: Number(f.scheduled_hours),
  }
  try {
    if (editingId.value) {
      const updated = await store.updateEngagement(editingId.value, payload)
      const i = engagements.value.findIndex((e) => e.id === editingId.value)
      if (i !== -1) engagements.value[i] = updated
      if (selected.value?.id === editingId.value) selected.value = updated
    } else {
      const created = await store.createEngagement(payload)
      engagements.value.unshift(created)
    }
    closeSchedule()
  } catch (e) {
    error.value = store.error || (editingId.value ? 'Could not update the engagement.' : 'Could not schedule the engagement.')
  }
}

async function submitGenerate() {
  if (!selected.value) return
  error.value = ''
  try {
    const rows = await store.generateSessions(selected.value.id, {
      start_time: genForm.value.start_time,
      end_time: genForm.value.end_time,
      scheduled_hours: Number(genForm.value.scheduled_hours),
    })
    sessions.value = [...rows]
    genForm.value = blankGen()
  } catch (e) {
    error.value = store.error || 'Could not generate sessions.'
  }
}

async function markDelivered(session) {
  error.value = ''
  const i = sessions.value.findIndex((s) => s.id === session.id)
  if (i !== -1) sessions.value[i] = { ...session, is_delivered: true } // optimistic
  try {
    const updated = await store.deliverSession(session.id)
    if (i !== -1) sessions.value[i] = updated
  } catch (e) {
    if (i !== -1) sessions.value[i] = session
    error.value = store.error || 'Could not mark the session delivered.'
  }
}

function requestCancel(engagement) {
  confirmState.value = {
    open: true,
    title: 'Cancel engagement',
    message: `Cancel this ${meta(engagement.type).label.toLowerCase()} engagement? Its schedule will be marked cancelled.`,
    confirmLabel: 'Cancel engagement',
    action: () => cancelEngagement(engagement),
  }
}
async function cancelEngagement(engagement) {
  error.value = ''
  try {
    const updated = await store.updateEngagement(engagement.id, { status: 'cancelled' })
    const i = engagements.value.findIndex((e) => e.id === engagement.id)
    if (i !== -1) engagements.value[i] = updated
    if (selected.value?.id === engagement.id) selected.value = updated
  } catch (e) {
    error.value = store.error || 'Could not cancel the engagement.'
  }
}

function closeConfirm() {
  confirmState.value.open = false
}
function runConfirm() {
  const action = confirmState.value.action
  closeConfirm()
  if (action) action()
}
</script>

<template>
  <MainLayout title="Engagement Scheduling">
    <div class="max-w-canvas mx-auto w-full">
      <!-- toolbar -->
      <div class="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div class="flex items-end gap-4 flex-wrap">
          <label class="flex flex-col gap-1">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Cohort</span>
            <select
              v-model="cohortId"
              @change="loadCohort"
              :disabled="loadingCohorts"
              class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container disabled:opacity-60"
            >
              <option v-if="loadingCohorts" value="">Loading…</option>
              <option v-for="c in cohorts" :key="c.id" :value="c.id">{{ cohortLabel(c) }}</option>
            </select>
          </label>
          <!-- legend -->
          <div class="flex items-center gap-3 h-11">
            <span v-for="t in TYPES" :key="t.value" class="flex items-center gap-1.5 font-label text-label text-on-surface-variant">
              <span class="w-2.5 h-2.5 rounded-full" :class="meta(t.value).dot"></span>{{ t.label }}
            </span>
          </div>
        </div>
        <button
          class="h-11 px-5 rounded-lg bg-primary-container text-white font-label text-label flex items-center gap-2 hover:bg-primary transition-colors shadow-elevated"
          @click="openSchedule()"
        >
          <span class="material-symbols-outlined text-[18px]">add</span> Schedule Engagement
        </button>
      </div>

      <p v-if="error" class="mb-4 rounded-lg bg-danger-mist text-danger border border-danger/20 px-4 py-2 font-body-sm text-body-sm">{{ error }}</p>

      <div v-if="loadingCohorts || busy" class="py-12 flex items-center justify-center gap-2 text-on-surface-variant font-body-sm">
        <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
        {{ loadingCohorts ? 'Loading cohorts…' : 'Loading engagements…' }}
      </div>

      <div v-else>
        <p v-if="!engagements.length" class="py-12 text-center text-on-surface-variant font-body-sm">
          No engagements scheduled yet. Use “Schedule Engagement” to add one.
        </p>

        <!-- engagement cards -->
        <ul v-else class="flex flex-col gap-3">
          <li
            v-for="e in engagements"
            :key="e.id"
            class="flex items-stretch rounded-lg bg-surface shadow-elevated overflow-hidden cursor-pointer hover:shadow-cardhover transition-shadow"
            @click="openDrawer(e)"
          >
            <span class="w-1.5 shrink-0" :class="meta(e.type).stripe"></span>
            <div class="flex-1 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-4 min-w-0">
                <span class="flex items-center gap-1.5 px-3 py-1 rounded-full font-label text-label" :class="[meta(e.type).tint, meta(e.type).text]">
                  <span class="w-2 h-2 rounded-full" :class="meta(e.type).dot"></span>{{ meta(e.type).label }}
                </span>
                <div class="min-w-0">
                  <div class="font-h3 text-h3 text-on-surface truncate">{{ courseMap[e.course_id] || 'General' }}</div>
                  <div class="font-body-sm text-body-sm text-on-surface-variant">{{ instructorMap[e.instructor_id] || `Instructor #${e.instructor_id}` }}</div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="font-mono text-mono text-on-surface">{{ fmtDate(e.date_range_start) }} – {{ fmtDate(e.date_range_end) }}</div>
                  <div class="font-body-sm text-body-sm text-on-surface-variant">{{ e.scheduled_hours }}h scheduled</div>
                </div>
                <span class="px-3 py-1 rounded-full font-label text-label capitalize" :class="STATUS_BADGE[e.status] || 'bg-surface-sunken text-on-surface-variant'">{{ (e.status || '').replace('_', ' ') }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Schedule modal -->
    <Teleport to="body">
      <div v-if="scheduleOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="closeSchedule()">
        <div class="w-full max-w-lg rounded-xl bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <h3 class="font-h2 text-h2 text-on-surface mb-5">{{ editingId ? 'Edit Engagement' : 'Schedule Engagement' }}</h3>
          <form class="grid grid-cols-2 gap-4" @submit.prevent="submitSchedule">
            <label class="flex flex-col gap-1 col-span-2">
              <span class="font-label text-label text-on-surface-variant">Type</span>
              <select v-model="scheduleForm.type" class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container">
                <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-label text-label text-on-surface-variant">Course (optional)</span>
              <select v-model="scheduleForm.course_id" class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container">
                <option value="">General</option>
                <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-label text-label text-on-surface-variant">Instructor</span>
              <select v-model="scheduleForm.instructor_id" class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container">
                <option value="">Unassigned</option>
                <option v-for="i in instructors" :key="i.id" :value="i.user_id">{{ i.user_name || `Instructor #${i.user_id}` }}</option>
              </select>
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-label text-label text-on-surface-variant">Start date</span>
              <input v-model="scheduleForm.date_range_start" type="date" class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-label text-label text-on-surface-variant">End date</span>
              <input v-model="scheduleForm.date_range_end" type="date" class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
            </label>
            <label class="flex flex-col gap-1 col-span-2">
              <span class="font-label text-label text-on-surface-variant">Scheduled hours</span>
              <input v-model.number="scheduleForm.scheduled_hours" type="number" min="0" class="h-11 w-40 rounded-lg border border-outline-variant bg-surface px-3 font-mono text-mono focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
            </label>
            <div class="col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" class="h-11 px-5 rounded-lg font-label text-label text-on-surface-variant hover:bg-surface-sunken" @click="closeSchedule()">Cancel</button>
              <button type="submit" class="h-11 px-5 rounded-lg bg-primary-container text-white font-label text-label hover:bg-primary transition-colors">{{ editingId ? 'Save changes' : 'Schedule' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Details drawer -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-50 flex justify-end bg-black/30" @click.self="closeDrawer">
        <aside class="w-full max-w-[380px] bg-surface h-full shadow-[-4px_0_24px_rgba(0,0,0,0.12)] flex flex-col">
          <div class="p-6 border-b border-surface-variant flex items-center justify-between bg-surface-sunken">
            <h2 class="font-h3 text-h3 text-on-surface">Engagement Details</h2>
            <button class="p-1 rounded-full hover:bg-surface-variant text-on-surface-variant" @click="closeDrawer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="p-6 flex-1 overflow-y-auto">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label text-label mb-3" :class="[meta(selected.type).tint, meta(selected.type).text]">
              <span class="w-2 h-2 rounded-full" :class="meta(selected.type).dot"></span>{{ meta(selected.type).label }}
            </span>
            <h3 class="font-h2 text-h2 text-on-surface mb-5">{{ courseMap[selected.course_id] || 'General engagement' }}</h3>

            <div class="space-y-3 mb-6 font-body-sm text-body-sm">
              <div class="flex items-center gap-3"><span class="material-symbols-outlined text-on-surface-variant text-[20px]">event</span><span class="text-on-surface">{{ fmtDate(selected.date_range_start) }} – {{ fmtDate(selected.date_range_end) }}</span></div>
              <div class="flex items-center gap-3"><span class="material-symbols-outlined text-on-surface-variant text-[20px]">person</span><span class="text-on-surface">{{ instructorMap[selected.instructor_id] || `Instructor #${selected.instructor_id}` }}</span></div>
              <div class="flex items-center gap-3"><span class="material-symbols-outlined text-on-surface-variant text-[20px]">flag</span><span class="text-on-surface capitalize">{{ (selected.status || '').replace('_', ' ') }}</span></div>
            </div>

            <!-- progress -->
            <div class="bg-surface-container-low p-4 rounded-lg border border-surface-variant mb-6">
              <div class="font-label text-label text-on-surface mb-2">Delivery progress</div>
              <div class="w-full bg-surface-variant rounded-full h-2 mb-1">
                <div class="bg-primary-container h-2 rounded-full transition-all" :style="{ width: progressPct + '%' }"></div>
              </div>
              <div class="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>Scheduled: {{ selected.scheduled_hours }}h</span>
                <span>Delivered: {{ deliveredHours }}h</span>
              </div>
            </div>

            <!-- sessions -->
            <div class="font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">Sessions</div>
            <div v-if="loadingSessions" class="py-4 text-center text-on-surface-variant font-body-sm">Loading…</div>
            <div v-else>
              <p v-if="!sessions.length" class="font-body-sm text-body-sm text-on-surface-variant mb-3">No sessions yet. Generate them below.</p>
              <ul v-else class="flex flex-col gap-2 mb-4">
                <li v-for="s in sessions" :key="s.id" class="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-surface-sunken/60">
                  <div class="font-mono text-mono text-on-surface">{{ fmtDate(s.date) }} · {{ fmtTime(s.start_time) }}–{{ fmtTime(s.end_time) }}</div>
                  <span v-if="s.is_delivered" class="flex items-center gap-1 font-label text-label text-success"><span class="material-symbols-outlined text-[16px]">check_circle</span>Delivered</span>
                  <button v-else class="font-label text-label text-primary-container hover:text-primary" @click="markDelivered(s)">Mark delivered</button>
                </li>
              </ul>

              <!-- generate -->
              <form class="rounded-lg border border-surface-variant p-3 flex flex-wrap items-end gap-2" @submit.prevent="submitGenerate">
                <label class="flex flex-col gap-1">
                  <span class="font-label text-label text-on-surface-variant">Start</span>
                  <input v-model="genForm.start_time" type="time" class="h-9 rounded-lg border border-outline-variant bg-surface px-2 font-mono text-mono" />
                </label>
                <label class="flex flex-col gap-1">
                  <span class="font-label text-label text-on-surface-variant">End</span>
                  <input v-model="genForm.end_time" type="time" class="h-9 rounded-lg border border-outline-variant bg-surface px-2 font-mono text-mono" />
                </label>
                <label class="flex flex-col gap-1">
                  <span class="font-label text-label text-on-surface-variant">Hours/session</span>
                  <input v-model.number="genForm.scheduled_hours" type="number" min="1" class="h-9 w-20 rounded-lg border border-outline-variant bg-surface px-2 font-mono text-mono" />
                </label>
                <button type="submit" class="h-9 px-3 rounded-lg bg-primary-container text-white font-label text-label hover:bg-primary transition-colors">Generate</button>
              </form>
            </div>
          </div>

          <div class="p-6 border-t border-surface-variant flex flex-col gap-3">
            <button
              v-if="selected.status !== 'cancelled'"
              class="w-full h-11 rounded-lg border-[1.5px] border-primary-container text-primary-container font-label text-label hover:bg-primary-mist transition-colors"
              @click="openEdit(selected)"
            >
              Edit details
            </button>
            <button
              v-if="selected.status !== 'cancelled'"
              class="w-full h-11 rounded-lg border-[1.5px] border-danger text-danger font-label text-label hover:bg-danger-mist transition-colors"
              @click="requestCancel(selected)"
            >
              Cancel engagement
            </button>
          </div>
        </aside>
      </div>
    </Teleport>

    <ConfirmModal
      :open="confirmState.open"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-label="confirmState.confirmLabel"
      @confirm="runConfirm"
      @cancel="closeConfirm"
    />
  </MainLayout>
</template>
