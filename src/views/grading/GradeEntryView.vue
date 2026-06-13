<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useGradingStore } from '../../stores/grading';
import MainLayout from '../../components/layout/MainLayout.vue';

const grading = useGradingStore();
const { grades, courses, components, labGroups, loading, saving, error } = storeToRefs(grading);

const filters = reactive({
    course_id: '',
    grade_component_id: '',
    lab_group_id: '',
});
const newGrade = reactive({
    student_id: '',
    raw_score: '',
});
const overrideForm = reactive({
    grade: null,
    override_value: '',
    override_note: '',
});
const rawDrafts = ref({});
const notice = ref('');

const filteredComponents = computed(() => {
    if (!filters.course_id) {
        return components.value;
    }

    return components.value.filter((component) => String(component.course_id) === String(filters.course_id));
});

const activeComponent = computed(() => {
    return components.value.find((component) => String(component.id) === String(filters.grade_component_id));
});

const selectedLabGroupId = computed(() => {
    return filters.lab_group_id || grades.value[0]?.lab_group_id || '';
});

const ready = ref(false);

const activeCourse = computed(() => {
    return courses.value.find((course) => String(course.id) === String(filters.course_id));
});

const gradedCount = computed(() => grades.value.filter((grade) => grade.raw_score !== null).length);

const canSaveNewGrade = computed(() => {
    return Boolean(filters.grade_component_id && newGrade.student_id && newGrade.raw_score !== '');
});

function requestParams() {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
    );
}

async function loadGrades() {
    await grading.fetchGrades(requestParams());
    rawDrafts.value = Object.fromEntries(
        grades.value.map((grade) => [grade.id, grade.raw_score])
    );
}

async function saveExisting(grade) {
    const saved = await grading.saveRawGrade({
        id: grade.id,
        lab_group_id: grade.lab_group_id,
        raw_score: rawDrafts.value[grade.id],
    });

    if (saved) {
        notice.value = 'Raw score saved.';
    }
}

async function saveNewGrade() {
    if (!canSaveNewGrade.value) {
        notice.value = 'Select a component, student, and raw score.';
        return;
    }

    const saved = await grading.saveRawGrade({
        student_id: Number(newGrade.student_id),
        grade_component_id: Number(filters.grade_component_id),
        lab_group_id: selectedLabGroupId.value ? Number(selectedLabGroupId.value) : null,
        raw_score: newGrade.raw_score,
    });

    if (saved) {
        newGrade.student_id = '';
        newGrade.raw_score = '';
        notice.value = 'Raw score submitted.';
    }
}

function openOverride(grade) {
    overrideForm.grade = grade;
    overrideForm.override_value = grade.override_value ?? grade.effective_score ?? '';
    overrideForm.override_note = '';
}

function closeOverride() {
    overrideForm.grade = null;
    overrideForm.override_value = '';
    overrideForm.override_note = '';
}

async function submitOverride() {
    if (!overrideForm.override_note.trim()) {
        notice.value = 'Override note is required.';
        return;
    }

    const saved = await grading.overrideGrade(overrideForm.grade.id, {
        override_value: overrideForm.override_value,
        override_note: overrideForm.override_note,
    });

    if (saved) {
        notice.value = 'Override saved.';
        closeOverride();
    }
}

function studentLabel(grade) {
    return grade.student?.user?.name || `Student #${grade.student_id}`;
}

function componentWeight(grade) {
    return Number(grade.grade_component?.weight ?? activeComponent.value?.weight ?? 0);
}

function effectiveScore(grade) {
    return Number(grade.effective_score ?? grade.normalized_score ?? 0);
}

function scorePercent(grade) {
    const weight = componentWeight(grade);

    if (weight <= 0) {
        return 0;
    }

    return (effectiveScore(grade) / weight) * 100;
}

function scoreTone(grade) {
    const percent = scorePercent(grade);

    if (percent < 60) {
        return 'text-danger';
    }

    if (grade.override_value !== null && grade.override_value !== undefined) {
        return 'text-[#D97706]';
    }

    return 'text-on-surface';
}

watch(() => filters.course_id, () => {
    if (!filters.course_id) {
        return;
    }

    const componentStillValid = filteredComponents.value.some((component) => {
        return String(component.id) === String(filters.grade_component_id);
    });

    if (!componentStillValid) {
        filters.grade_component_id = filteredComponents.value[0]?.id ?? '';
    }
});

watch(filters, () => {
    if (ready.value) {
        loadGrades();
    }
}, { deep: true });

onMounted(async () => {
    await grading.fetchReferenceData();
    filters.course_id = courses.value[0]?.id ?? '';
    filters.grade_component_id = filteredComponents.value[0]?.id ?? '';
    filters.lab_group_id = labGroups.value.length === 1 ? labGroups.value[0].id : '';
    ready.value = true;
    await loadGrades();
});
</script>

<template>
    <MainLayout title="Grade Entry">
    <section class="mx-auto max-w-7xl space-y-6">
        <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-container">Instructor grading sheet</p>
            <h1 class="font-serif text-4xl text-on-surface">Grade Entry</h1>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_0.9fr]">
                <label class="space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</span>
                    <select v-model="filters.course_id" class="h-11 w-full rounded-lg border-slate-200 text-sm">
                        <option value="">Select course</option>
                        <option v-for="course in courses" :key="course.id" :value="course.id">
                            {{ course.name }}
                        </option>
                    </select>
                </label>

                <label class="space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Grade Component</span>
                    <select v-model="filters.grade_component_id" class="h-11 w-full rounded-lg border-slate-200 text-sm">
                        <option value="">Select component</option>
                        <option v-for="component in filteredComponents" :key="component.id" :value="component.id">
                            {{ component.name }}
                        </option>
                    </select>
                </label>

                <label class="space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Lab Group</span>
                    <select v-model="filters.lab_group_id" class="h-11 w-full rounded-lg border-slate-200 text-sm">
                        <option value="">All lab groups</option>
                        <option v-for="group in labGroups" :key="group.id" :value="group.id">
                            {{ group.name }}
                        </option>
                    </select>
                </label>

                <div class="rounded-lg bg-primary-mist p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-primary-container">{{ activeCourse?.name || 'Course' }}</p>
                    <p class="mt-1 font-mono text-2xl text-primary-container">{{ gradedCount }} graded</p>
                    <p class="text-xs text-slate-600">
                        {{ activeComponent ? `${activeComponent.weight} pts · raw max ${activeComponent.raw_max}` : 'No component selected' }}
                    </p>
                </div>
            </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 class="text-lg font-semibold text-on-surface">{{ activeComponent?.name || 'Raw scores' }}</h2>
                    <p class="text-sm text-slate-500">{{ activeComponent ? `Raw max ${activeComponent.raw_max}; normalized into ${activeComponent.weight} course points.` : 'Select a component first.' }}</p>
                </div>
                <div class="grid gap-3 sm:grid-cols-[150px_150px_auto]">
                    <input v-model="newGrade.student_id" class="h-10 rounded-lg border-slate-200 text-sm disabled:bg-slate-50" placeholder="Student ID" type="number" :disabled="!activeComponent" />
                    <input v-model="newGrade.raw_score" class="h-10 rounded-lg border-slate-200 text-sm disabled:bg-slate-50" placeholder="Raw score" type="number" min="0" :max="activeComponent?.raw_max" :disabled="!activeComponent" />
                    <button class="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50" :disabled="saving || !canSaveNewGrade" @click="saveNewGrade">
                        Add score
                    </button>
                </div>
            </div>

            <div v-if="notice" class="mb-4 rounded-lg bg-[#EFF6FF] px-4 py-3 text-sm text-[#2563EB]">
                {{ notice }}
            </div>
            <div v-if="error" class="mb-4 rounded-lg bg-danger-mist px-4 py-3 text-sm text-danger">
                {{ error }}
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th class="px-4 py-3">Student</th>
                            <th class="px-4 py-3">Component</th>
                            <th class="px-4 py-3">Raw score</th>
                            <th class="px-4 py-3">Normalized</th>
                            <th class="px-4 py-3">Effective</th>
                            <th class="px-4 py-3">Status</th>
                            <th class="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-if="loading">
                            <td class="px-4 py-6 text-slate-500" colspan="7">Loading grades...</td>
                        </tr>
                        <tr v-else-if="!activeComponent">
                            <td class="px-4 py-6 text-slate-500" colspan="7">Select a grade component.</td>
                        </tr>
                        <tr v-else-if="grades.length === 0">
                            <td class="px-4 py-6 text-slate-500" colspan="7">No scores recorded for this selection.</td>
                        </tr>
                        <tr v-for="grade in grades" v-else :key="grade.id" :class="grade.student?.is_at_risk ? 'border-l-4 border-l-danger bg-danger-mist/40' : 'hover:bg-primary-mist/30'">
                            <td class="px-4 py-4">
                                <div class="font-medium text-on-surface">{{ studentLabel(grade) }}</div>
                                <div class="font-mono text-xs text-slate-500">ID: {{ grade.student_id }}</div>
                            </td>
                            <td class="px-4 py-4">
                                <div class="font-medium text-on-surface">{{ grade.grade_component?.name || `Component #${grade.grade_component_id}` }}</div>
                                <div class="text-xs text-slate-500">Raw max {{ grade.grade_component?.raw_max ?? '-' }}</div>
                            </td>
                            <td class="px-4 py-4">
                                <input v-model="rawDrafts[grade.id]" class="h-10 w-24 rounded-lg border-slate-200 text-center font-mono text-sm" type="number" min="0" :max="grade.grade_component?.raw_max" />
                            </td>
                            <td class="px-4 py-4 font-mono text-slate-700">{{ grade.normalized_score ?? '-' }}</td>
                            <td class="px-4 py-4 font-mono font-semibold" :class="scoreTone(grade)">
                                {{ grade.effective_score ?? '-' }}
                            </td>
                            <td class="px-4 py-4">
                                <span v-if="grade.override_value !== null && grade.override_value !== undefined" class="rounded-md bg-[#FFFBEB] px-2 py-1 text-xs font-semibold text-[#D97706]">Overridden</span>
                                <span v-else-if="grade.student?.is_at_risk" class="rounded-md bg-danger-mist px-2 py-1 text-xs font-semibold text-danger">At-Risk</span>
                                <span v-else class="rounded-md bg-[#ECFDF5] px-2 py-1 text-xs font-semibold text-success">Current</span>
                            </td>
                            <td class="px-4 py-4">
                                <div class="flex justify-end gap-2">
                                    <button class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50" :disabled="saving" @click="saveExisting(grade)">
                                        Save
                                    </button>
                                    <button class="rounded-lg border border-[#D97706]/30 px-3 py-2 text-xs font-semibold text-[#D97706] hover:bg-[#FFFBEB]" @click="openOverride(grade)">
                                        Override
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="overrideForm.grade" class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <h2 class="text-xl font-semibold text-on-surface">Override grade</h2>
                <p class="mt-1 text-sm text-slate-500">A review note is required.</p>

                <div class="mt-5 space-y-4">
                    <label class="block space-y-2">
                        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Override value</span>
                        <input v-model="overrideForm.override_value" class="h-11 w-full rounded-lg border-slate-200" type="number" min="0" />
                    </label>
                    <label class="block space-y-2">
                        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Review note</span>
                        <textarea v-model="overrideForm.override_note" class="min-h-28 w-full rounded-lg border-slate-200 text-sm" placeholder="Explain the rubric review or correction." />
                    </label>
                </div>

                <div class="mt-6 flex justify-end gap-2">
                    <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50" @click="closeOverride">Cancel</button>
                    <button class="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50" :disabled="saving" @click="submitOverride">
                        Save override
                    </button>
                </div>
            </div>
        </div>
    </section>
    </MainLayout>
</template>
