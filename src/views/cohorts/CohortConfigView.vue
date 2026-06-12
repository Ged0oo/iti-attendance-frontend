<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '../../components/layout/MainLayout.vue'
import { useCohortStore } from '../../stores/cohort'
import { statusColors } from '../../composables/useUtils'

const route = useRoute()
const cohortId = route.params.id
const store = useCohortStore()

const steps = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'courses', label: 'Courses & Weights' },
  { key: 'labs', label: 'Lab Groups' },
  { key: 'instructors', label: 'Assign Instructors' },
]

const activeStep = ref(0)
const loading = ref(false)
const courses = ref([])
const cohort = ref(null)
const basicForm = ref({ name: '', start_date: '', end_date: '' })
const saving = ref(false)
const saveMsg = ref(null)
const transitionError = ref(null)

const nextTransition = {
  open: 'configuring',
  configuring: 'delivering',
  delivering: 'participating',
  participating: 'rolled_up',
}

const transitionLabels = {
  open: 'Start Configuring',
  configuring: 'Begin Delivering',
  delivering: 'Open Participation',
  participating: 'Roll Up',
}

function total(course) {
  return Number(course.lab || 0) + Number(course.project || 0)
}

let nextCourseId = -1
function addCourse() {
  courses.value.push({ id: nextCourseId--, name: 'New Course', lab: 0, project: 0 })
}
function removeCourse(id) {
  courses.value = courses.value.filter((c) => c.id !== id)
}

const allValid = computed(() => courses.value.length > 0 && courses.value.every((c) => total(c) === 100))
const basicValid = computed(() => basicForm.value.name && basicForm.value.start_date && basicForm.value.end_date)

const nextLabel = computed(() => {
  if (activeStep.value === 0) return 'Next: Courses & Weights'
  if (activeStep.value === 1) return 'Next: Lab Groups'
  if (activeStep.value === 2) return 'Next: Assign Instructors'
  return 'Finish'
})

const canNext = computed(() => {
  if (activeStep.value === 0) return basicValid.value
  if (activeStep.value === 1) return allValid.value
  return true
})

function weightsFrom(components) {
  let lab = 0
  let project = 0
  for (const comp of components) {
    const w = Number(comp.weight || 0)
    if (comp.type === 'project' || comp.type === 'exam') project += w
    else lab += w
  }
  return { lab, project }
}

async function saveBasicInfo() {
  saving.value = true
  saveMsg.value = null
  try {
    const updated = await store.updateCohort(cohortId, {
      name: basicForm.value.name,
      start_date: basicForm.value.start_date,
      end_date: basicForm.value.end_date,
    })
    const data = updated?.data ?? updated
    cohort.value = data
    saveMsg.value = 'Saved'
    setTimeout(() => (saveMsg.value = null), 2000)
  } catch (e) {
    saveMsg.value = e.response?.data?.message || 'Failed to save'
  }
  saving.value = false
}

async function transitionStatus() {
  transitionError.value = null
  const next = nextTransition[cohort.value?.status]
  if (!next) return
  try {
    const updated = await store.transitionCohort(cohortId, next)
    const data = updated?.data ?? updated
    cohort.value = data
  } catch (e) {
    transitionError.value = e.response?.data?.message || 'Transition failed'
  }
}

onMounted(async () => {
  loading.value = true
  try {
    if (!store.cohorts.length) await store.fetchCohorts()
    const found = store.cohorts.find((c) => String(c.id) === String(cohortId))
    if (found) {
      cohort.value = found
    } else {
      const { data } = await store.fetchCohorts()
      cohort.value = (data ?? store.cohorts).find((c) => String(c.id) === String(cohortId))
    }
    if (cohort.value) {
      basicForm.value.name = cohort.value.name || ''
      basicForm.value.start_date = cohort.value.start_date || ''
      basicForm.value.end_date = cohort.value.end_date || ''
    }
  } catch (e) { /* ignore */ }
  try {
    const list = await store.fetchCourses(cohortId)
    courses.value = await Promise.all(
      list.map(async (c) => {
        let lab = 0
        let project = 0
        try {
          const comps = await store.fetchCourseComponents(c.id)
          ;({ lab, project } = weightsFrom(comps))
        } catch (e) { /* ignore */ }
        return { id: c.id, name: c.name, lab, project }
      }),
    )
  } catch (e) { /* ignore */ }
  loading.value = false
})
</script>

<template>
  <MainLayout :title="cohort ? cohort.name : 'Cohort Configuration'">
    <div class="max-w-[1200px] mx-auto flex gap-12 w-full">
      <div class="w-[280px] shrink-0 pt-4">
        <div class="relative flex flex-col gap-10">
          <div class="absolute left-[11px] top-[12px] bottom-[12px] w-[2px] bg-surface-container-highest -z-10"></div>

          <div
            v-for="(step, i) in steps"
            :key="step.key"
            class="flex items-center gap-4 relative bg-canvas cursor-pointer"
            @click="i <= activeStep && (activeStep = i)"
          >
            <div
              v-if="i < activeStep"
              class="w-6 h-6 rounded-full bg-success flex items-center justify-center shrink-0 z-10"
            >
              <span class="material-symbols-outlined text-white text-[16px]">check</span>
            </div>
            <div
              v-else-if="i === activeStep"
              class="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shrink-0 z-10 shadow-[0_0_0_4px_rgba(139,26,26,0.12)]"
            >
              <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
            </div>
            <div
              v-else
              class="w-6 h-6 rounded-full border-2 border-outline-variant bg-canvas shrink-0 z-10"
            ></div>

            <span
              :class="i === activeStep ? 'font-h2 text-h3 text-primary-container font-bold' : i < activeStep ? 'font-label text-label text-on-surface' : 'font-label text-label text-on-surface-variant'"
            >{{ step.label }}</span>
          </div>
        </div>
      </div>

      <div class="flex-1 bg-surface rounded-xl shadow-sm p-10 flex flex-col border border-surface-container-highest">
        <p v-if="loading" class="text-center text-on-surface-variant font-body-sm text-body-sm py-12">Loading...</p>

        <template v-else-if="activeStep === 0">
          <div class="mb-8">
            <h2 class="font-h2 text-h2 text-on-surface mb-1">Basic Info</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Configure cohort name, dates, and lifecycle status.</p>
          </div>

          <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
              <label class="font-label text-label text-on-surface-variant">Cohort Name</label>
              <input
                v-model="basicForm.name"
                type="text"
                class="h-11 max-w-md rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
              />
            </div>
            <div class="grid grid-cols-2 gap-6 max-w-md">
              <div class="flex flex-col gap-2">
                <label class="font-label text-label text-on-surface-variant">Start Date</label>
                <input
                  v-model="basicForm.start_date"
                  type="date"
                  class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-mono text-mono text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-label text-label text-on-surface-variant">End Date</label>
                <input
                  v-model="basicForm.end_date"
                  type="date"
                  class="h-11 rounded-lg border border-outline-variant bg-surface px-4 font-mono text-mono text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                />
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                class="px-5 py-2.5 rounded-lg font-label text-label bg-primary-container text-white hover:bg-primary transition-colors shadow-sm"
                :disabled="!basicValid || saving"
                :class="{ 'opacity-50 cursor-not-allowed': !basicValid || saving }"
                @click="saveBasicInfo"
              >{{ saving ? 'Saving...' : 'Save Changes' }}</button>
              <span v-if="saveMsg" class="font-body-sm text-body-sm text-success">{{ saveMsg }}</span>
            </div>

            <div v-if="cohort" class="mt-4 pt-6 border-t border-surface-container-highest">
              <div class="flex items-center gap-4 mb-4">
                <span class="font-label text-label text-on-surface-variant">Current Status:</span>
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  :class="statusColors[cohort.status] || statusColors.open"
                >{{ cohort.status }}</span>
              </div>
              <p v-if="transitionError" class="text-danger font-body-sm text-body-sm mb-3">{{ transitionError }}</p>
              <button
                v-if="nextTransition[cohort.status]"
                class="px-5 py-2.5 rounded-lg font-label text-label bg-surface border border-outline-variant text-on-surface hover:bg-primary-mist hover:border-primary-container transition-colors flex items-center gap-2"
                @click="transitionStatus"
              >
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                {{ transitionLabels[cohort.status] }}
              </button>
              <p v-else class="font-body-sm text-body-sm text-on-surface-variant">This cohort has reached its final status.</p>
            </div>
          </div>
        </template>

        <template v-else-if="activeStep === 1">
          <div class="mb-8">
            <h2 class="font-h2 text-h2 text-on-surface mb-1">Define Courses &amp; Grade Weights</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Each course's weights must total 100%</p>
          </div>

          <div class="flex flex-col gap-4">
            <p v-if="!courses.length" class="text-center text-on-surface-variant font-body-sm text-body-sm py-8">
              No courses defined for this cohort yet. Add one to begin.
            </p>
            <div
              v-for="course in courses"
              :key="course.id"
              class="rounded-lg p-6 transition-shadow hover:shadow-sm"
              :class="total(course) === 100 ? 'border border-surface-container-highest bg-surface' : 'border border-danger/30 bg-danger-mist/30'"
            >
              <div class="flex justify-between items-center mb-4">
                <input
                  v-model="course.name"
                  class="font-h3 text-h3 text-on-surface bg-transparent border-none p-0 focus:ring-0 outline-none"
                />
                <button class="text-on-surface-variant hover:text-danger transition-colors" title="Remove Course" @click="removeCourse(course.id)">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
              <div class="flex flex-wrap items-end gap-6">
                <div class="flex flex-col gap-2">
                  <label class="font-label text-label text-on-surface-variant">Lab Weight %</label>
                  <input
                    v-model.number="course.lab"
                    type="number"
                    class="w-24 h-11 rounded-lg border border-outline-variant bg-surface px-4 font-mono text-mono text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="font-label text-label text-on-surface-variant">Project Weight %</label>
                  <input
                    v-model.number="course.project"
                    type="number"
                    class="w-24 h-11 rounded-lg border border-outline-variant bg-surface px-4 font-mono text-mono text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all"
                  />
                </div>
                <div
                  class="ml-auto mt-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-mono border"
                  :class="total(course) === 100 ? 'bg-success-mist text-success border-success/20' : 'bg-danger-mist text-danger border-danger/20'"
                >
                  <span>{{ total(course) }}%{{ total(course) === 100 ? '' : ' — must equal 100%' }}</span>
                  <span class="material-symbols-outlined text-[16px]">{{ total(course) === 100 ? 'check' : 'warning' }}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            class="w-full mt-6 py-4 border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center gap-2 text-primary-container font-label text-label hover:bg-primary-mist hover:border-primary-container transition-all duration-200"
            @click="addCourse"
          >
            <span class="material-symbols-outlined text-[20px]">add</span>
            Add Course
          </button>
        </template>

        <template v-else-if="activeStep === 2">
          <div class="mb-8">
            <h2 class="font-h2 text-h2 text-on-surface mb-1">Lab Groups</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Assign students to lab groups for each course.</p>
          </div>
          <p class="text-center text-on-surface-variant font-body-sm text-body-sm py-12">Lab group management is handled by the scheduling module.</p>
        </template>

        <template v-else-if="activeStep === 3">
          <div class="mb-8">
            <h2 class="font-h2 text-h2 text-on-surface mb-1">Assign Instructors</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Map instructors to engagements and lab groups.</p>
          </div>
          <p class="text-center text-on-surface-variant font-body-sm text-body-sm py-12">Instructor assignment is handled by the scheduling module.</p>
        </template>

        <div class="mt-12 pt-6 border-t border-surface-container-highest flex justify-between items-center sticky bottom-0 bg-surface">
          <button
            class="flex items-center gap-2 font-label text-label text-on-surface-variant hover:text-primary transition-colors px-4 py-2 -ml-4 rounded-lg hover:bg-surface-sunken"
            :disabled="activeStep === 0"
            :class="{ 'opacity-50 cursor-not-allowed': activeStep === 0 }"
            @click="activeStep > 0 && activeStep--"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
            Back
          </button>
          <button
            v-if="activeStep < steps.length - 1"
            class="px-6 py-3 rounded-lg font-label text-label flex items-center gap-2 transition-colors shadow-sm"
            :class="canNext ? 'bg-primary-container text-white hover:bg-primary shadow-[rgba(139,26,26,0.12)]' : 'bg-outline-variant text-white cursor-not-allowed'"
            :disabled="!canNext"
            @click="canNext && activeStep++"
          >
            {{ nextLabel }}
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <router-link
            v-else
            :to="{ name: 'cohorts' }"
            class="px-6 py-3 rounded-lg font-label text-label flex items-center gap-2 bg-primary-container text-white hover:bg-primary transition-colors shadow-sm"
          >
            Done
            <span class="material-symbols-outlined text-[20px]">check</span>
          </router-link>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
