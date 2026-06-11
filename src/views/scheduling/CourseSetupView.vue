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

const steps = [
  { key: 'basic', label: 'Basic Info', state: 'done' },
  { key: 'courses', label: 'Courses & Weights', state: 'active' },
  { key: 'labs', label: 'Lab Groups', state: 'upcoming' },
  { key: 'instructors', label: 'Assign Instructors', state: 'upcoming' },
]

const cohorts = ref([])
const cohortId = ref('')
const courses = ref([]) // each: { ...course, components: [], draft: {...} }
const error = ref('')
const busy = ref(false)
const newCourseName = ref('')
const confirmState = ref({ open: false, title: '', message: '', confirmLabel: 'Delete', action: null })

const blankDraft = () => ({ name: '', type: 'lab_deliverable', weight: 10, raw_max: 100 })
const courseTotal = (course) => course.components.reduce((sum, c) => sum + Number(c.weight), 0)
// a cohort name can repeat across tracks, so show the track to keep them apart
const cohortLabel = (c) => (c.track?.name ? `${c.name} — ${c.track.name}` : c.name)

onMounted(async () => {
  try {
    const { data } = await api.get('/api/cohorts')
    cohorts.value = data.data ?? data ?? []
    if (cohorts.value.length) {
      cohortId.value = cohorts.value[0].id
      await loadCourses()
    }
  } catch (e) {
    error.value = 'Could not load cohorts.'
  }
})

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

async function addCourse() {
  const name = newCourseName.value.trim()
  if (!name) return
  error.value = ''
  try {
    const course = await store.createCourse({ cohort_id: cohortId.value, name })
    courses.value.push({ ...course, components: [], draft: blankDraft() })
    newCourseName.value = ''
  } catch (e) {
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
  try {
    const comp = await store.createComponent({
      course_id: course.id,
      name: d.name.trim(),
      type: d.type,
      weight: Number(d.weight),
      raw_max: Number(d.raw_max),
    })
    course.components.push(comp)
    course.draft = blankDraft()
  } catch (e) {
    // backend rejects when the weights would pass 100
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

function closeConfirm() {
  confirmState.value.open = false
}

function runConfirm() {
  const action = confirmState.value.action
  closeConfirm()
  if (action) action()
}

const selectedCohortName = computed(
  () => cohorts.value.find((c) => c.id === cohortId.value)?.name || '',
)
</script>

<template>
  <MainLayout title="Cohort Configuration">
    <div class="max-w-canvas mx-auto w-full flex gap-12">
      <!-- Stepper -->
      <aside class="w-[240px] shrink-0 pt-2 hidden lg:block">
        <div class="relative flex flex-col gap-10">
          <div class="absolute left-[11px] top-3 bottom-3 w-[2px] bg-surface-container-highest -z-10"></div>
          <div v-for="step in steps" :key="step.key" class="flex items-center gap-4 bg-canvas">
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10"
              :class="{
                'bg-success': step.state === 'done',
                'bg-primary-container shadow-focus': step.state === 'active',
                'border-2 border-outline-variant bg-canvas': step.state === 'upcoming',
              }"
            >
              <span v-if="step.state === 'done'" class="material-symbols-outlined text-white text-[16px]">check</span>
              <div v-else-if="step.state === 'active'" class="w-2.5 h-2.5 rounded-full bg-white"></div>
            </div>
            <span
              class="font-label text-label"
              :class="step.state === 'active' ? 'text-primary-container font-bold' : step.state === 'done' ? 'text-on-surface' : 'text-on-surface-variant'"
            >{{ step.label }}</span>
          </div>
        </div>
      </aside>

      <!-- Active panel -->
      <section class="flex-1 bg-surface rounded-xl shadow-elevated p-10 border border-surface-container-highest min-w-0">
        <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 class="font-h2 text-h2 text-on-surface mb-1">Define Courses &amp; Grade Weights</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Each course's component weights must total 100%.</p>
          </div>
          <!-- Cohort picker -->
          <label class="flex flex-col gap-1">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Cohort</span>
            <select
              v-model="cohortId"
              @change="loadCourses"
              class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            >
              <option v-for="c in cohorts" :key="c.id" :value="c.id">{{ cohortLabel(c) }}</option>
            </select>
          </label>
        </div>

        <p v-if="error" class="mb-4 rounded-lg bg-danger-mist text-danger border border-danger/20 px-4 py-2 font-body-sm text-body-sm">{{ error }}</p>

        <div v-if="busy" class="py-10 text-center text-on-surface-variant font-body-sm">Loading…</div>

        <div v-else class="flex flex-col gap-4">
          <p v-if="!courses.length" class="py-8 text-center text-on-surface-variant font-body-sm">No courses in {{ selectedCohortName }} yet. Add the first one below.</p>

          <!-- Course cards -->
          <article
            v-for="course in courses"
            :key="course.id"
            class="rounded-lg p-6 bg-surface border transition-shadow hover:shadow-elevated"
            :class="courseTotal(course) === 100 ? 'border-surface-container-highest' : 'border-danger/30 bg-danger-mist/20'"
          >
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-h3 text-h3 text-on-surface">{{ course.name }}</h3>
              <div class="flex items-center gap-3">
                <!-- total badge -->
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

            <!-- component rows -->
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

            <!-- add component -->
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

          <!-- add course -->
          <form class="mt-2 flex items-center gap-3" @submit.prevent="addCourse">
            <input v-model="newCourseName" type="text" placeholder="New course name (e.g. Laravel)" class="flex-1 h-12 rounded-lg border-2 border-dashed border-outline-variant bg-surface px-4 font-body-md text-body-md focus:border-primary-container focus:ring-0 outline-none" />
            <button type="submit" class="h-12 px-6 rounded-lg bg-primary-container text-white font-label text-label flex items-center gap-2 hover:bg-primary transition-colors shadow-elevated">
              <span class="material-symbols-outlined text-[20px]">add</span> Add Course
            </button>
          </form>
        </div>
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
