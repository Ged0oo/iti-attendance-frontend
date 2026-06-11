<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '../../components/layout/MainLayout.vue'
import { useCohortStore } from '../../stores/cohort'

const route = useRoute()
const cohortId = route.params.id
const store = useCohortStore()

const steps = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'courses', label: 'Courses & Weights' },
  { key: 'labs', label: 'Lab Groups' },
  { key: 'instructors', label: 'Assign Instructors' },
]

const activeStep = ref(1)
const loading = ref(false)
const courses = ref([])

function total(course) {
  return Number(course.lab || 0) + Number(course.project || 0)
}

let nextId = -1
function addCourse() {
  courses.value.push({ id: nextId--, name: 'New Course', lab: 0, project: 0 })
}
function removeCourse(id) {
  courses.value = courses.value.filter((c) => c.id !== id)
}

const allValid = computed(() => courses.value.length > 0 && courses.value.every((c) => total(c) === 100))

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

onMounted(async () => {
  loading.value = true
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
  <MainLayout title="Cohort Configuration">
    <div class="max-w-[1200px] mx-auto flex gap-12 w-full">
      <div class="w-[280px] shrink-0 pt-4">
        <div class="relative flex flex-col gap-10">
          <div class="absolute left-[11px] top-[12px] bottom-[12px] w-[2px] bg-neutral-200 -z-10"></div>

          <div v-for="(step, i) in steps" :key="step.key" class="flex items-center gap-4 relative bg-canvas">
            <div
              v-if="i < activeStep"
              class="w-6 h-6 rounded-full bg-success flex items-center justify-center shrink-0 z-10"
            >
              <span class="material-symbols-outlined text-white text-[16px]">check</span>
            </div>
            <div
              v-else-if="i === activeStep"
              class="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 z-10 shadow-[0_0_0_4px_rgba(139,26,26,0.12)]"
            >
              <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
            </div>
            <div
              v-else
              class="w-6 h-6 rounded-full border-2 border-outline-variant bg-canvas shrink-0 z-10"
            ></div>

            <span
              class="text-label"
              :class="i === activeStep ? 'font-h2 text-h3 text-primary font-bold' : i < activeStep ? 'font-label text-on-surface' : 'font-label text-on-surface-variant'"
            >{{ step.label }}</span>
          </div>
        </div>
      </div>

      <div class="flex-1 bg-surface rounded-xl shadow-sm p-10 flex flex-col border border-neutral-200">
        <div class="mb-8">
          <h2 class="font-h2 text-h2 text-on-surface mb-1">Define Courses &amp; Grade Weights</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Each course's weights must total 100%</p>
        </div>

        <div class="flex flex-col gap-4">
          <p v-if="loading" class="text-center text-on-surface-variant font-body-sm text-body-sm py-8">Loading courses…</p>
          <p v-else-if="!courses.length" class="text-center text-on-surface-variant font-body-sm text-body-sm py-8">
            No courses defined for this cohort yet. Add one to begin.
          </p>
          <div
            v-for="course in courses"
            :key="course.id"
            class="rounded-lg p-6 transition-shadow hover:shadow-sm"
            :class="total(course) === 100 ? 'border border-neutral-200 bg-surface' : 'border border-danger/30 bg-danger-mist/30'"
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
                  class="w-24 h-11 rounded-lg border border-outline-variant bg-surface px-4 font-mono text-mono text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-label text-label text-on-surface-variant">Project Weight %</label>
                <input
                  v-model.number="course.project"
                  type="number"
                  class="w-24 h-11 rounded-lg border border-outline-variant bg-surface px-4 font-mono text-mono text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
          class="w-full mt-6 py-4 border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center gap-2 text-primary font-label text-label hover:bg-primary-mist hover:border-primary transition-all duration-200"
          @click="addCourse"
        >
          <span class="material-symbols-outlined text-[20px]">add</span>
          Add Course
        </button>

        <div class="mt-12 pt-6 border-t border-neutral-200 flex justify-between items-center">
          <button
            class="flex items-center gap-2 font-label text-label text-on-surface-variant hover:text-primary transition-colors px-4 py-2 -ml-4 rounded-lg hover:bg-surface-sunken"
            :disabled="activeStep === 0"
            @click="activeStep > 0 && activeStep--"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
            Back
          </button>
          <button
            class="px-6 py-3 rounded-lg font-label text-label flex items-center gap-2 transition-colors shadow-sm"
            :class="allValid ? 'bg-primary text-white hover:bg-primary-deep' : 'bg-neutral-300 text-white cursor-not-allowed'"
            :disabled="!allValid"
            @click="allValid && activeStep < steps.length - 1 && activeStep++"
          >
            Next: Lab Groups
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
