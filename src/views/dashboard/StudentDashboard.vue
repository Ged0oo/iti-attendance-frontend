<script setup>
import { computed, onMounted, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { useGradingStore } from '../../stores/grading';

const grading = useGradingStore();
const { gradeCard, loading, error } = storeToRefs(grading);
const form = reactive({
    student_id: '',
});

const courses = computed(() => gradeCard.value?.courses ?? []);

async function load() {
    if (!form.student_id) {
        return;
    }

    await grading.fetchGradeCard(form.student_id);
}

function width(score) {
    const value = Math.max(0, Math.min(100, Number(score ?? 0)));

    return `${value}%`;
}

onMounted(() => {
    const storedStudentId = localStorage.getItem('student_id');

    if (storedStudentId) {
        form.student_id = storedStudentId;
        load();
    }
});
</script>

<template>
    <section class="mx-auto max-w-7xl space-y-6">
        <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-container">Student dashboard</p>
            <h1 class="font-serif text-4xl text-on-surface">My Course Grades</h1>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label class="space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Student ID</span>
                    <input v-model="form.student_id" class="h-11 w-56 rounded-lg border-slate-200 text-sm" type="number" placeholder="Your student ID" />
                </label>
                <button class="h-11 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary" :disabled="loading || !form.student_id" @click="load">
                    Load dashboard
                </button>
                <RouterLink class="h-11 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50" :to="`/grading/students/${form.student_id || ''}`">
                    Full grade card
                </RouterLink>
            </div>

            <div v-if="error" class="mt-4 rounded-lg bg-danger-mist px-4 py-3 text-sm text-danger">{{ error }}</div>
        </div>

        <div v-if="loading" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading grades...</div>

        <div v-else class="grid gap-4 lg:grid-cols-3">
            <article v-for="course in courses" :key="course.course?.id || course.course?.name" class="rounded-xl bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h2 class="text-lg font-semibold text-on-surface">{{ course.course?.name || 'Course' }}</h2>
                        <p class="text-sm text-slate-500">{{ course.components?.length || 0 }} components</p>
                    </div>
                    <span class="font-mono text-lg font-semibold">{{ course.total_score }}</span>
                </div>
                <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full rounded-full bg-primary-container" :style="{ width: width(course.total_score) }"></div>
                </div>
                <div class="mt-4 space-y-2">
                    <div v-for="component in course.components" :key="component.id" class="rounded-lg bg-slate-50 p-3 text-sm">
                        <div class="flex justify-between gap-3">
                            <span class="font-medium text-on-surface">{{ component.grade_component?.name || 'Component' }}</span>
                            <span class="font-mono">{{ component.effective_score }}</span>
                        </div>
                        <p class="mt-1 text-xs text-slate-500">Normalized {{ component.normalized_score }} - raw {{ component.raw_score }}</p>
                    </div>
                </div>
            </article>

            <div v-if="courses.length === 0" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm lg:col-span-3">
                No grade card loaded yet.
            </div>
        </div>
    </section>
</template>
