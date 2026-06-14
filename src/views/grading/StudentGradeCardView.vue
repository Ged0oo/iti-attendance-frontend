<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useGradingStore } from '../../stores/grading';
import MainLayout from '../../components/layout/MainLayout.vue';

const props = defineProps({
    studentId: {
        type: [String, Number],
        default: '',
    },
});

const grading = useGradingStore();
const { gradeCard, loading, error, courses: referenceCourses } = storeToRefs(grading);
const form = reactive({
    student_id: props.studentId || '',
});
const studentSearch = ref('');
const studentOptions = ref([]);
const suggestionsOpen = ref(false);

const courses = computed(() => gradeCard.value?.courses ?? []);
const student = computed(() => gradeCard.value?.student ?? null);
const overallScore = computed(() => {
    return courses.value.reduce((sum, course) => sum + Number(course.total_score ?? 0), 0);
});
const overallMaxScore = computed(() => {
    return courses.value.reduce((sum, course) => sum + courseMaxScore(course), 0);
});
const filteredStudents = computed(() => {
    const query = studentSearch.value.trim().toLowerCase();

    if (!query) {
        return studentOptions.value.slice(0, 8);
    }

    return studentOptions.value
        .filter((student) => {
            return student.name.toLowerCase().includes(query)
                || student.email.toLowerCase().includes(query)
                || String(student.id).includes(query);
        })
        .slice(0, 8);
});

async function loadCard() {
    if (!form.student_id) {
        return;
    }

    await grading.fetchGradeCard(form.student_id);
}

async function loadStudentSuggestions() {
    await grading.fetchReferenceData();

    const cohortIds = [...new Set(referenceCourses.value.map((course) => course.cohort_id).filter(Boolean))];
    const studentsById = new Map();

    for (const cohortId of cohortIds) {
        const rows = await grading.fetchStudents(cohortId);

        rows.forEach((student) => {
            studentsById.set(Number(student.id), {
                id: Number(student.id),
                name: student.user?.name || `Student #${student.id}`,
                email: student.user?.email || '',
            });
        });
    }

    studentOptions.value = [...studentsById.values()].sort((a, b) => a.name.localeCompare(b.name));

    if (form.student_id) {
        const selected = studentOptions.value.find((option) => String(option.id) === String(form.student_id));
        studentSearch.value = selected ? `${selected.name} (${selected.email})` : String(form.student_id);
    }
}

function selectStudent(student) {
    form.student_id = student.id;
    studentSearch.value = student.email ? `${student.name} (${student.email})` : student.name;
    suggestionsOpen.value = false;
}

function submitSearch() {
    const first = filteredStudents.value[0];

    if (!form.student_id && first) {
        selectStudent(first);
    }

    loadCard();
}

function scoreColor(score) {
    const value = Number(score ?? 0);

    if (value < 60) {
        return 'bg-danger';
    }

    if (value < 70) {
        return 'bg-[#D97706]';
    }

    return 'bg-primary-container';
}

function progressWidth(score) {
    const value = Math.max(0, Math.min(100, Number(score ?? 0)));

    return `${value}%`;
}

function courseMaxScore(course) {
    return Number(course.course?.max_score ?? 100);
}

function componentMaxScore(component) {
    return Number(component.grade_component?.weight ?? 0);
}

function hasOverride(component) {
    return component.override_value !== null && component.override_value !== undefined;
}

function formatScore(value) {
    const number = Number(value ?? 0);

    if (Number.isNaN(number)) {
        return '-';
    }

    return Math.round(number);
}

onMounted(async () => {
    await loadStudentSuggestions();
    await loadCard();
});
</script>

<template>
    <MainLayout title="Grade Cards">
    <section class="w-full space-y-6">
        <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-container">Student portal</p>
        </div>

        <form class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="submitSearch">
            <div class="grid gap-4 lg:grid-cols-[minmax(320px,1fr)_220px] lg:items-end">
                <div class="relative flex min-w-0 flex-col gap-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Student</span>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                        <input
                            v-model="studentSearch"
                            class="h-11 w-full rounded-lg border-slate-200 pl-10 pr-3 text-sm"
                            type="search"
                            placeholder="Search by name, email, or ID"
                            @focus="suggestionsOpen = true"
                            @input="form.student_id = ''; suggestionsOpen = true"
                            @keydown.escape="suggestionsOpen = false"
                        />
                    </div>

                    <div v-if="suggestionsOpen" class="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                        <button
                            v-for="studentOption in filteredStudents"
                            :key="studentOption.id"
                            class="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
                            type="button"
                            @click="selectStudent(studentOption)"
                        >
                            <span class="block font-medium text-on-surface">{{ studentOption.name }}</span>
                            <span class="block text-xs text-slate-500">{{ studentOption.email || `Student #${studentOption.id}` }}</span>
                        </button>
                        <div v-if="filteredStudents.length === 0" class="px-4 py-3 text-sm text-slate-500">
                            No students found.
                        </div>
                    </div>
                </div>
                <button class="h-11 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50" type="submit" :disabled="loading || !form.student_id">
                    Load grade card
                </button>
            </div>

            <div v-if="error" class="mt-4 rounded-lg bg-danger-mist px-4 py-3 text-sm text-danger">
                {{ error }}
            </div>
        </form>

        <div v-if="loading" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading grade card...
        </div>

        <template v-else-if="gradeCard">
            <div class="space-y-6">
                <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_1fr]">
                    <div class="rounded-xl bg-white p-5 shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Student</p>
                                <h2 class="mt-1 text-2xl font-semibold text-on-surface">
                                    {{ student?.user?.name || `Student #${student?.id}` }}
                                </h2>
                                <p class="mt-1 text-sm text-slate-500">{{ student?.user?.email || 'No email loaded' }}</p>
                            </div>
                            <span v-if="student?.is_at_risk" class="rounded-lg bg-danger-mist px-3 py-1.5 text-xs font-semibold text-danger">At-Risk</span>
                        </div>
                    </div>

                    <div class="rounded-xl bg-primary-mist p-5 shadow-sm">
                        <p class="text-xs font-semibold uppercase tracking-wide text-primary-container">Overall Score</p>
                        <p class="mt-2 font-mono text-4xl text-primary-container">
                            {{ formatScore(overallScore) }}
                            <span class="text-xl text-primary-container/70">/ {{ formatScore(overallMaxScore) }}</span>
                        </p>
                    </div>

                    <div class="rounded-xl bg-white p-5 shadow-sm">
                        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</p>
                        <div class="flex flex-wrap gap-2">
                            <span v-if="(gradeCard.tags ?? []).length === 0" class="text-sm text-slate-500">No tags</span>
                            <span v-for="tag in gradeCard.tags" :key="tag.id" class="rounded-md bg-[#EFF6FF] px-3 py-1.5 text-sm font-medium text-[#2563EB]">
                                {{ tag.tag }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <h2 class="text-xl font-semibold text-on-surface">Course Scores</h2>

                    <div v-if="courses.length === 0" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
                        No graded courses returned yet.
                    </div>

                    <article v-for="course in courses" :key="course.course?.id || course.course?.name" class="rounded-xl bg-white p-5 shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <h3 class="text-lg font-semibold text-on-surface">{{ course.course?.name || 'Uncategorized course' }}</h3>
                                <p class="text-sm text-slate-500">{{ course.components?.length || 0 }} components</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Course Score</p>
                                <p class="font-mono text-lg font-semibold text-on-surface">{{ formatScore(course.total_score) }} / {{ formatScore(courseMaxScore(course)) }}</p>
                            </div>
                        </div>

                        <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div class="h-full rounded-full" :class="scoreColor(course.total_score)" :style="{ width: progressWidth(course.total_score) }"></div>
                        </div>

                        <div class="mt-4 divide-y divide-slate-100">
                            <div v-for="component in course.components" :key="component.id" class="grid gap-3 py-4 text-sm sm:grid-cols-[1fr_120px_120px] sm:items-center">
                                <div>
                                    <div class="flex flex-wrap items-center gap-2">
                                        <p class="font-medium text-on-surface">{{ component.grade_component?.name || `Component #${component.grade_component_id}` }}</p>
                                        <span v-if="hasOverride(component)" class="rounded-md bg-[#FFFBEB] px-2 py-1 text-xs font-semibold text-[#D97706]">Overridden</span>
                                    </div>
                                    <p v-if="component.override_note" class="mt-2 rounded-lg bg-[#FFFBEB] px-3 py-2 text-xs text-[#D97706]">
                                        {{ component.override_note }}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw</p>
                                    <p class="mt-1 font-mono font-semibold text-on-surface">{{ formatScore(component.raw_score) }} / {{ formatScore(component.grade_component?.raw_max) }}</p>
                                </div>
                                <div>
                                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
                                    <p class="mt-1 font-mono font-semibold text-on-surface">{{ formatScore(component.effective_score) }} / {{ formatScore(componentMaxScore(component)) }}</p>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </template>
    </section>
    </MainLayout>
</template>
