<script setup>
import { computed, onMounted, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { useGradingStore } from '../../stores/grading';

const grading = useGradingStore();
const { loading, error } = storeToRefs(grading);

// Safely access properties that might not be implemented in the grading store stub yet
const distribution = computed(() => grading.distribution || {});
const grades = computed(() => grading.grades || []);
const atRiskGrades = computed(() => grading.atRiskGrades || []);

const filters = reactive({
    course_id: '',
    lab_group_id: '',
});

const buckets = computed(() => distribution.value?.buckets ?? []);
const total = computed(() => buckets.value.reduce((sum, bucket) => sum + Number(bucket.count ?? 0), 0));
const needsReview = computed(() => atRiskGrades.value.slice(0, 4));

function params() {
    return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
}

function height(bucket) {
    if (!total.value) {
        return '4%';
    }

    return `${Math.max(6, Math.round((Number(bucket.count ?? 0) / total.value) * 100))}%`;
}

async function loadDashboard() {
    const requestParams = params();

    const promises = [];
    if (typeof grading.fetchDistribution === 'function') {
        promises.push(grading.fetchDistribution(requestParams));
    }
    if (typeof grading.fetchGrades === 'function') {
        promises.push(grading.fetchGrades(requestParams));
    }
    
    if (promises.length > 0) {
        await Promise.all(promises);
    }
}

onMounted(loadDashboard);
</script>

<template>
    <section class="mx-auto max-w-7xl space-y-6">
        <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-container">Instructor dashboard</p>
            <h1 class="font-serif text-4xl text-on-surface">Group Grade Distribution</h1>
        </div>

        <div class="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto]">
            <input v-model="filters.course_id" class="h-10 rounded-lg border-slate-200 text-sm" type="number" placeholder="Course ID" />
            <input v-model="filters.lab_group_id" class="h-10 rounded-lg border-slate-200 text-sm" type="number" placeholder="Lab group ID" />
            <button class="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary" :disabled="loading" @click="loadDashboard">
                Refresh
            </button>
        </div>

        <div v-if="error" class="rounded-lg bg-danger-mist px-4 py-3 text-sm text-danger">{{ error }}</div>

        <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div class="rounded-xl bg-white p-6 shadow-sm">
                <div class="mb-6 flex items-center justify-between">
                    <h2 class="text-xl font-semibold text-on-surface">Group Grade Distribution</h2>
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ total }} entries</span>
                </div>

                <div class="flex h-72 items-end gap-3 border-b border-slate-200 pb-8">
                    <div v-for="bucket in buckets" :key="bucket.label" class="flex h-full flex-1 flex-col justify-end">
                        <div class="relative flex flex-1 items-end">
                            <div class="w-full rounded-t-md" :class="bucket.label === '<60' ? 'bg-danger' : 'bg-primary-container'" :style="{ height: height(bucket) }"></div>
                            <span class="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-xs text-slate-500">{{ bucket.count }}</span>
                        </div>
                        <div class="mt-3 -rotate-45 text-center font-mono text-xs text-slate-500">{{ bucket.label }}</div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="rounded-xl bg-white p-6 shadow-sm">
                    <p class="text-sm font-semibold text-slate-500">Average Score</p>
                    <p class="mt-2 font-mono text-4xl text-primary-container">{{ distribution?.average_score ?? 0 }}</p>
                </div>

                <div class="rounded-xl bg-white p-6 shadow-sm">
                    <h2 class="mb-4 text-xl font-semibold text-on-surface">Needs Review</h2>
                    <div class="space-y-2">
                        <p v-if="needsReview.length === 0" class="text-sm text-slate-500">No grade risk rows loaded.</p>
                        <div v-for="grade in needsReview" :key="grade.id" class="rounded-lg bg-danger-mist px-4 py-3 text-sm text-danger">
                            Student #{{ grade.student_id }} - score {{ grade.effective_score ?? grade.normalized_score }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-semibold text-on-surface">Recent Grades</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                    <thead class="text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th class="py-2">Student</th>
                            <th class="py-2">Component</th>
                            <th class="py-2 text-right">Raw</th>
                            <th class="py-2 text-right">Effective</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-if="grades.length === 0">
                            <td class="py-4 text-slate-500" colspan="4">No grades loaded.</td>
                        </tr>
                        <tr v-for="grade in grades.slice(0, 8)" :key="grade.id">
                            <td class="py-3 font-medium text-on-surface">Student #{{ grade.student_id }}</td>
                            <td class="py-3 text-slate-600">{{ grade.grade_component?.name || `Component #${grade.grade_component_id}` }}</td>
                            <td class="py-3 text-right font-mono">{{ grade.raw_score }}</td>
                            <td class="py-3 text-right font-mono font-semibold">{{ grade.effective_score ?? grade.normalized_score }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>
</template>
