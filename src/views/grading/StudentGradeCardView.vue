<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
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
const { gradeCard, loading, error } = storeToRefs(grading);
const form = reactive({
    student_id: props.studentId || '',
});

const courses = computed(() => gradeCard.value?.courses ?? []);
const student = computed(() => gradeCard.value?.student ?? null);
const totalCourseScore = computed(() => {
    return courses.value.reduce((sum, course) => sum + Number(course.total_score ?? 0), 0);
});

async function loadCard() {
    if (!form.student_id) {
        return;
    }

    await grading.fetchGradeCard(form.student_id);
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

onMounted(loadCard);
</script>

<template>
    <MainLayout title="Grade Cards">
    <section class="mx-auto max-w-7xl space-y-6">
        <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-container">Student portal</p>
            <h1 class="font-serif text-4xl text-on-surface">Grade Card</h1>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="grid gap-4 sm:grid-cols-[minmax(240px,320px)_auto] sm:items-end">
                <label class="flex min-w-0 flex-col gap-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Student ID</span>
                    <input v-model="form.student_id" class="h-11 w-full rounded-lg border-slate-200 text-sm" type="number" placeholder="Example: 12" />
                </label>
                <button class="h-11 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50" :disabled="loading || !form.student_id" @click="loadCard">
                    Load grade card
                </button>
            </div>

            <div v-if="error" class="mt-4 rounded-lg bg-danger-mist px-4 py-3 text-sm text-danger">
                {{ error }}
            </div>
        </div>

        <div v-if="loading" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading grade card...
        </div>

        <template v-else-if="gradeCard">
            <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div class="rounded-2xl bg-white p-6 shadow-sm">
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

                    <div class="mt-8 rounded-xl bg-primary-mist p-5">
                        <p class="text-xs font-semibold uppercase tracking-wide text-primary-container">Course total</p>
                        <p class="mt-2 font-mono text-4xl text-primary-container">{{ totalCourseScore.toFixed(2) }}</p>
                    </div>

                    <div class="mt-6">
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
                    <h2 class="text-xl font-semibold text-on-surface">Course Score Breakdown</h2>

                    <div v-if="courses.length === 0" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
                        No graded courses returned yet.
                    </div>

                    <article v-for="course in courses" :key="course.course?.id || course.course?.name" class="rounded-xl bg-white p-5 shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <h3 class="text-lg font-semibold text-on-surface">{{ course.course?.name || 'Uncategorized course' }}</h3>
                                <p class="text-sm text-slate-500">{{ course.components?.length || 0 }} components</p>
                            </div>
                            <span class="font-mono text-lg font-semibold text-on-surface">{{ course.total_score }} / 100</span>
                        </div>

                        <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div class="h-full rounded-full" :class="scoreColor(course.total_score)" :style="{ width: progressWidth(course.total_score) }"></div>
                        </div>

                        <div class="mt-4 divide-y divide-slate-100">
                            <div v-for="component in course.components" :key="component.id" class="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                                <div>
                                    <p class="font-medium text-on-surface">{{ component.grade_component?.name || `Component #${component.grade_component_id}` }}</p>
                                    <p class="text-xs text-slate-500">Raw score {{ component.raw_score }} / {{ component.grade_component?.raw_max ?? '-' }}</p>
                                </div>
                                <div class="font-mono text-slate-700">Normalized {{ component.normalized_score }}</div>
                                <div class="font-mono font-semibold text-on-surface">Effective {{ component.effective_score }}</div>
                                <p v-if="component.override_note" class="rounded-lg bg-[#FFFBEB] px-3 py-2 text-xs text-[#D97706] sm:col-span-3">
                                    Override note: {{ component.override_note }}
                                </p>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </template>
    </section>
    </MainLayout>
</template>
