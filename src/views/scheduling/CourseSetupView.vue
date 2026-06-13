<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import ConfirmModal from '../../components/common/ConfirmModal.vue'
import { useEngagementStore } from '../../stores/engagement'
import api from '../../services/api'

const store = useEngagementStore()

const COMPONENT_TYPES = [
  { value: 'lab_deliverable', label: 'Lab' },
  { value: 'exam', label: 'Exam' },
  { value: 'project', label: 'Project' },
]

const STEPS = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'courses', label: 'Courses & Weights' },
  { key: 'labs', label: 'Lab Groups' },
]

const cohorts = ref([])
const cohortId = ref('')
const step = ref('courses')
const courses = ref([]) // each: { ...course, components: [], draft: {...} }
const error = ref('')
const busy = ref(false)
const loadingCohorts = ref(true)
const newCourseName = ref('')
const confirmState = ref({ open: false, title: '', message: '', confirmLabel: 'Delete', action: null })
let tempSeq = 0 // ids for optimistic rows until the server returns the real one

// lab groups step
const instructors = ref([])
const labGroups = ref([])
const students = ref([])
const loadingLabs = ref(false)
const labForm = ref({ name: '', course_id: '', instructor_id: '' })
const assignDraft = ref({}) // labGroupId -> selected studentId

const blankDraft = () => ({ name: '', type: 'lab_deliverable', weight: 10, raw_max: 100 })
const courseTotal = (course) => course.components.reduce((sum, c) => sum + Number(c.weight), 0)
// a cohort name can repeat across tracks, so show the track to keep them apart
const cohortLabel = (c) => (c.track?.name ? `${c.name} — ${c.track.name}` : c.name)

const courseMap = computed(() => Object.fromEntries(courses.value.map((c) => [c.id, c.name])))
const instructorMap = computed(() =>
  Object.fromEntries(instructors.value.map((i) => [i.user_id, i.user_name || `Instructor #${i.user_id}`])),
)
const studentName = (s) => s.user?.name || `Student #${s.id}`
const studentsInGroup = (groupId) => students.value.filter((s) => s.lab_group_id === groupId)
const unassignedStudents = computed(() => students.value.filter((s) => !s.lab_group_id))

const selectedCohortName = computed(() => cohorts.value.find((c) => c.id === cohortId.value)?.name || '')

function stepState(key) {
  if (key === 'basic') return 'done'
  if (key === step.value) return 'active'
  if (key === 'courses' && step.value === 'labs') return 'done'
  return 'upcoming'
}

onMounted(async () => {
  try {
    cohorts.value = await store.fetchCohorts()
    if (cohorts.value.length) cohortId.value = cohorts.value[0].id
  } catch (e) {
    error.value = 'Could not load cohorts.'
  } finally {
    loadingCohorts.value = false
  }
  if (cohortId.value) await loadCourses()
})

function onCohortChange() {
  step.value = 'courses'
  labGroups.value = []
  students.value = []
  loadCourses()
}

function goStep(key) {
  if (key === 'basic') return // the cohort itself is created elsewhere
  step.value = key
  if (key === 'labs' && !labGroups.value.length && !loadingLabs.value) loadLabs()
}

async function loadCourses() {
  if (!cohortId.value) return
  error.value = ''
  busy.value = true
  try {
    const list = await store.fetchCourses(cohortId.value)
    courses.value = await Promise.all(
      list.map(async (course) => ({
        ...course,
        components: await loadComponents(course.id),
        draft: blankDraft(),
      })),
    )
  } catch (e) {
    error.value = store.error || 'Could not load courses.'
  } finally {
    busy.value = false
  }
}

async function loadComponents(courseId) {
  const { data } = await api.get(`/api/courses/${courseId}/components`)
  return data.data ?? data ?? []
}

async function loadLabs() {
  if (!cohortId.value) return
  error.value = ''
  loadingLabs.value = true
  try {
    const [lg, inst, studs] = await Promise.all([
      store.fetchLabGroups(cohortId.value),
      store.fetchInstructors(),
      api.get(`/api/cohorts/${cohortId.value}/students`).then((r) => r.data.data ?? r.data ?? []),
    ])
    labGroups.value = [...(lg || [])]
    instructors.value = [...(inst || [])]
    students.value = [...studs]
    // make sure courses are loaded too (needed to label a group's course)
    if (!courses.value.length) await loadCourses()
  } catch (e) {
    error.value = store.error || 'Could not load lab groups.'
  } finally {
    loadingLabs.value = false
  }
}

async function addCourse() {
  const name = newCourseName.value.trim()
  if (!name) return
  error.value = ''
  // show the card straight away, then swap in the saved row once it returns
  const temp = { id: `temp-${tempSeq++}`, name, components: [], draft: blankDraft() }
  courses.value.push(temp)
  newCourseName.value = ''
  try {
    const course = await store.createCourse({ cohort_id: cohortId.value, name })
    const i = courses.value.findIndex((c) => c.id === temp.id)
    if (i !== -1) courses.value[i] = { ...course, components: [], draft: blankDraft() }
  } catch (e) {
    courses.value = courses.value.filter((c) => c.id !== temp.id)
    error.value = store.error || 'Could not add the course.'
  }
}

function requestRemoveCourse(course) {
  confirmState.value = {
    open: true,
    title: 'Delete course',
    message: `Delete "${course.name}" and all of its grade components? This cannot be undone.`,
    confirmLabel: 'Delete course',
    action: () => removeCourse(course),
  }
}

async function removeCourse(course) {
  error.value = ''
  // optimistic: drop it from the list now so the slow round trip does not feel laggy
  const backup = courses.value
  courses.value = courses.value.filter((c) => c.id !== course.id)
  try {
    await store.deleteCourse(course.id)
  } catch (e) {
    courses.value = backup
    error.value = store.error || 'Could not remove the course.'
  }
}

async function addComponent(course) {
  error.value = ''
  const d = course.draft
  if (!d.name.trim()) return
  const weight = Number(d.weight)
  // catch the over-100 case here so we skip a doomed round trip
  const projected = courseTotal(course) + weight
  if (projected > 100) {
    error.value = `These weights would total ${projected}%. Keep each course within 100%.`
    return
  }
  const temp = { id: `temp-${tempSeq++}`, name: d.name.trim(), type: d.type, weight, raw_max: Number(d.raw_max) }
  course.components.push(temp)
  course.draft = blankDraft()
  try {
    const comp = await store.createComponent({
      course_id: course.id,
      name: temp.name,
      type: temp.type,
      weight,
      raw_max: temp.raw_max,
    })
    const i = course.components.findIndex((c) => c.id === temp.id)
    if (i !== -1) course.components[i] = comp
  } catch (e) {
    // backend still has the final say (e.g. another tab pushed it over 100)
    course.components = course.components.filter((c) => c.id !== temp.id)
    error.value = store.error || 'Could not add the component.'
  }
}

function requestRemoveComponent(course, comp) {
  confirmState.value = {
    open: true,
    title: 'Remove component',
    message: `Remove "${comp.name}" (${comp.weight}%) from ${course.name}?`,
    confirmLabel: 'Remove',
    action: () => removeComponent(course, comp),
  }
}

async function removeComponent(course, comp) {
  error.value = ''
  const backup = course.components
  course.components = course.components.filter((c) => c.id !== comp.id)
  try {
    await store.deleteComponent(comp.id)
  } catch (e) {
    course.components = backup
    error.value = store.error || 'Could not remove the component.'
  }
}

// --- lab groups ---
async function createLabGroup() {
  const f = labForm.value
  if (!f.name.trim() || !f.course_id || !f.instructor_id) {
    error.value = 'A lab group needs a name, a course and an instructor.'
    return
  }
  error.value = ''
  try {
    const lg = await store.createLabGroup({
      cohort_id: cohortId.value,
      course_id: f.course_id,
      instructor_id: f.instructor_id,
      name: f.name.trim(),
    })
    labGroups.value.unshift(lg)
    labForm.value = { name: '', course_id: '', instructor_id: '' }
  } catch (e) {
    error.value = store.error || 'Could not create the lab group.'
  }
}

async function assignStudent(group) {
  const studentId = assignDraft.value[group.id]
  if (!studentId) return
  error.value = ''
  const s = students.value.find((x) => x.id === Number(studentId))
  const prev = s?.lab_group_id
  if (s) s.lab_group_id = group.id // optimistic
  assignDraft.value[group.id] = ''
  try {
    await api.patch(`/api/students/${studentId}/lab-group`, { lab_group_id: group.id })
  } catch (e) {
    if (s) s.lab_group_id = prev
    error.value = 'Could not assign the student.'
  }
}

async function unassignStudent(student) {
  error.value = ''
  const prev = student.lab_group_id
  student.lab_group_id = null // optimistic
  try {
    await api.patch(`/api/students/${student.id}/lab-group`, { lab_group_id: null })
  } catch (e) {
    student.lab_group_id = prev
    error.value = 'Could not remove the student from the group.'
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
  <MainLayout title="Cohort Configuration">
    <div class="max-w-canvas mx-auto w-full flex gap-12">
      <!-- Stepper -->
      <aside class="w-[240px] shrink-0 pt-2 hidden lg:block">
        <div class="relative flex flex-col gap-10">
          <div class="absolute left-[11px] top-3 bottom-3 w-[2px] bg-surface-container-highest -z-10"></div>
          <button
            v-for="s in STEPS"
            :key="s.key"
            type="button"
            class="flex items-center gap-4 bg-canvas text-left"
            :class="s.key === 'basic' ? 'cursor-default' : 'cursor-pointer'"
            @click="goStep(s.key)"
          >
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10"
              :class="{
                'bg-success': stepState(s.key) === 'done',
                'bg-primary-container shadow-focus': stepState(s.key) === 'active',
                'border-2 border-outline-variant bg-canvas': stepState(s.key) === 'upcoming',
              }"
            >
              <span v-if="stepState(s.key) === 'done'" class="material-symbols-outlined text-white text-[16px]">check</span>
              <span v-else-if="stepState(s.key) === 'active'" class="w-2.5 h-2.5 rounded-full bg-white"></span>
            </span>
            <span
              class="font-label text-label"
              :class="stepState(s.key) === 'active' ? 'text-primary-container font-bold' : stepState(s.key) === 'done' ? 'text-on-surface' : 'text-on-surface-variant'"
            >{{ s.label }}</span>
          </button>
        </div>
      </aside>

      <!-- Active panel -->
      <section class="flex-1 bg-surface rounded-xl shadow-elevated p-10 border border-surface-container-highest min-w-0">
        <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div v-if="step === 'courses'">
            <h2 class="font-h2 text-h2 text-on-surface mb-1">Define Courses &amp; Grade Weights</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Each course's component weights must total 100%.</p>
          </div>
          <div v-else>
            <h2 class="font-h2 text-h2 text-on-surface mb-1">Lab Groups</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Create groups and assign students to an instructor.</p>
          </div>
          <!-- Cohort picker -->
          <label class="flex flex-col gap-1">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Cohort</span>
            <select
              v-model="cohortId"
              @change="onCohortChange"
              :disabled="loadingCohorts"
              class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container disabled:opacity-60"
            >
              <option v-if="loadingCohorts" value="">Loading…</option>
              <option v-for="c in cohorts" :key="c.id" :value="c.id">{{ cohortLabel(c) }}</option>
            </select>
          </label>
        </div>

        <p v-if="error" class="mb-4 rounded-lg bg-danger-mist text-danger border border-danger/20 px-4 py-2 font-body-sm text-body-sm">{{ error }}</p>

        <!-- ===== Courses step ===== -->
        <template v-if="step === 'courses'">
          <div v-if="loadingCohorts || busy" class="py-12 flex items-center justify-center gap-2 text-on-surface-variant font-body-sm">
            <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            {{ loadingCohorts ? 'Loading cohorts…' : 'Loading courses…' }}
          </div>

          <div v-else class="flex flex-col gap-4">
            <p v-if="!courses.length" class="py-8 text-center text-on-surface-variant font-body-sm">No courses in {{ selectedCohortName }} yet. Add the first one below.</p>

            <article
              v-for="course in courses"
              :key="course.id"
              class="rounded-lg p-6 bg-surface border transition-shadow hover:shadow-elevated"
              :class="courseTotal(course) === 100 ? 'border-surface-container-highest' : 'border-danger/30 bg-danger-mist/20'"
            >
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-h3 text-h3 text-on-surface">{{ course.name }}</h3>
                <div class="flex items-center gap-3">
                  <span
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-mono border"
                    :class="courseTotal(course) === 100 ? 'bg-success-mist text-success border-success/20' : 'bg-danger-mist text-danger border-danger/20'"
                  >
                    {{ courseTotal(course) }}%
                    <span v-if="courseTotal(course) === 100" class="material-symbols-outlined text-[16px]">check</span>
                    <span v-else class="material-symbols-outlined text-[16px]">warning</span>
                  </span>
                  <button class="text-on-surface-variant hover:text-danger transition-colors" title="Remove course" @click="requestRemoveCourse(course)">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-2 mb-4">
                <div
                  v-for="comp in course.components"
                  :key="comp.id"
                  class="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-sunken/60"
                >
                  <span class="font-body-md text-body-md text-on-surface flex-1 min-w-0 truncate">{{ comp.name }}</span>
                  <span class="font-label-caps text-label-caps uppercase text-on-surface-variant">{{ comp.type.replace('_', ' ') }}</span>
                  <span class="font-mono text-mono text-on-surface">{{ comp.weight }}%</span>
                  <button class="text-on-surface-variant hover:text-danger transition-colors" title="Remove" @click="requestRemoveComponent(course, comp)">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <p v-if="!course.components.length" class="font-body-sm text-body-sm text-on-surface-variant px-3 py-1">No components yet.</p>
              </div>

              <form class="flex flex-wrap items-end gap-3" @submit.prevent="addComponent(course)">
                <label class="flex flex-col gap-1">
                  <span class="font-label text-label text-on-surface-variant">Component</span>
                  <input v-model="course.draft.name" type="text" placeholder="e.g. Labs" class="h-10 w-40 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
                </label>
                <label class="flex flex-col gap-1">
                  <span class="font-label text-label text-on-surface-variant">Type</span>
                  <select v-model="course.draft.type" class="h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container">
                    <option v-for="t in COMPONENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </label>
                <label class="flex flex-col gap-1">
                  <span class="font-label text-label text-on-surface-variant">Weight %</span>
                  <input v-model.number="course.draft.weight" type="number" min="0" max="100" class="h-10 w-24 rounded-lg border border-outline-variant bg-surface px-3 font-mono text-mono focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
                </label>
                <label class="flex flex-col gap-1">
                  <span class="font-label text-label text-on-surface-variant">Raw max</span>
                  <input v-model.number="course.draft.raw_max" type="number" min="1" class="h-10 w-24 rounded-lg border border-outline-variant bg-surface px-3 font-mono text-mono focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
                </label>
                <button type="submit" class="h-10 px-4 rounded-lg bg-primary-container text-white font-label text-label flex items-center gap-1 hover:bg-primary transition-colors">
                  <span class="material-symbols-outlined text-[18px]">add</span> Add
                </button>
              </form>
            </article>

            <form class="mt-2 flex items-center gap-3" @submit.prevent="addCourse">
              <input v-model="newCourseName" type="text" placeholder="New course name (e.g. Laravel)" class="flex-1 h-12 rounded-lg border-2 border-dashed border-outline-variant bg-surface px-4 font-body-md text-body-md focus:border-primary-container focus:ring-0 outline-none" />
              <button type="submit" class="h-12 px-6 rounded-lg bg-primary-container text-white font-label text-label flex items-center gap-2 hover:bg-primary transition-colors shadow-elevated">
                <span class="material-symbols-outlined text-[20px]">add</span> Add Course
              </button>
            </form>

            <div class="flex justify-end pt-4">
              <button class="h-11 px-5 rounded-lg border-[1.5px] border-primary-container text-primary-container font-label text-label flex items-center gap-2 hover:bg-primary-mist transition-colors" @click="goStep('labs')">
                Next: Lab Groups <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </template>

        <!-- ===== Lab groups step ===== -->
        <template v-else>
          <div v-if="loadingLabs" class="py-12 flex items-center justify-center gap-2 text-on-surface-variant font-body-sm">
            <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            Loading lab groups…
          </div>

          <div v-else class="flex flex-col gap-4">
            <!-- create lab group -->
            <form class="flex flex-wrap items-end gap-3 rounded-lg border border-surface-container-highest p-4" @submit.prevent="createLabGroup">
              <label class="flex flex-col gap-1">
                <span class="font-label text-label text-on-surface-variant">Group name</span>
                <input v-model="labForm.name" type="text" placeholder="e.g. Group A" class="h-10 w-40 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="font-label text-label text-on-surface-variant">Course</span>
                <select v-model="labForm.course_id" class="h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container">
                  <option value="">Select…</option>
                  <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </label>
              <label class="flex flex-col gap-1">
                <span class="font-label text-label text-on-surface-variant">Instructor</span>
                <select v-model="labForm.instructor_id" class="h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container">
                  <option value="">Select…</option>
                  <option v-for="i in instructors" :key="i.id" :value="i.user_id">{{ i.user_name || `Instructor #${i.user_id}` }}</option>
                </select>
              </label>
              <button type="submit" class="h-10 px-4 rounded-lg bg-primary-container text-white font-label text-label flex items-center gap-1 hover:bg-primary transition-colors">
                <span class="material-symbols-outlined text-[18px]">add</span> Create group
              </button>
            </form>

            <p v-if="!labGroups.length" class="py-8 text-center text-on-surface-variant font-body-sm">No lab groups yet. Create the first one above.</p>

            <!-- lab group cards -->
            <article v-for="g in labGroups" :key="g.id" class="rounded-lg p-6 bg-surface border border-surface-container-highest">
              <div class="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div>
                  <h3 class="font-h3 text-h3 text-on-surface">{{ g.name }}</h3>
                  <div class="font-body-sm text-body-sm text-on-surface-variant">
                    {{ courseMap[g.course_id] || 'No course' }} · {{ instructorMap[g.instructor_id] || `Instructor #${g.instructor_id}` }}
                  </div>
                </div>
                <span class="font-label text-label text-on-surface-variant">{{ studentsInGroup(g.id).length }} students</span>
              </div>

              <!-- assigned students -->
              <div class="flex flex-wrap gap-2 mb-4">
                <span v-for="s in studentsInGroup(g.id)" :key="s.id" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-sunken font-label text-label text-on-surface">
                  {{ studentName(s) }}
                  <button class="text-on-surface-variant hover:text-danger" title="Remove from group" @click="unassignStudent(s)">
                    <span class="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </span>
                <span v-if="!studentsInGroup(g.id).length" class="font-body-sm text-body-sm text-on-surface-variant">No students assigned yet.</span>
              </div>

              <!-- assign control -->
              <form class="flex items-end gap-2" @submit.prevent="assignStudent(g)">
                <label class="flex flex-col gap-1">
                  <span class="font-label text-label text-on-surface-variant">Add student</span>
                  <select v-model="assignDraft[g.id]" class="h-10 w-56 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container">
                    <option value="">Unassigned students…</option>
                    <option v-for="s in unassignedStudents" :key="s.id" :value="s.id">{{ studentName(s) }}</option>
                  </select>
                </label>
                <button type="submit" class="h-10 px-4 rounded-lg border-[1.5px] border-primary-container text-primary-container font-label text-label hover:bg-primary-mist transition-colors">Assign</button>
              </form>
            </article>

            <div class="flex justify-start pt-4">
              <button class="h-11 px-5 rounded-lg font-label text-label text-on-surface-variant hover:bg-surface-sunken flex items-center gap-2" @click="goStep('courses')">
                <span class="material-symbols-outlined text-[18px]">arrow_back</span> Back to courses
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>

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
