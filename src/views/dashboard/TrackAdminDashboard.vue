<script setup>
import { computed, onMounted, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { useGradingStore } from '../../stores/grading';

const grading = useGradingStore();
const { distribution, grades, tags, loading, error } = storeToRefs(grading);

const filters = reactive({
    track_id: '',
    cohort_id: '',
    course_id: '',
    lab_group_id: '',
});

const buckets = computed(() => distribution.value?.buckets ?? []);
const bucketTotal = computed(() => buckets.value.reduce((sum, bucket) => sum + Number(bucket.count ?? 0), 0));
const consistencyRows = computed(() => grading.graderConsistencyRows);
const flaggedConsistencyRows = computed(() => consistencyRows.value.filter((row) => row.flagged));
const gradeRiskRows = computed(() => grading.atRiskGrades.slice(0, 5));
const flaggedTags = computed(() => tags.value.filter((tag) => ['at_risk', 'needs_support', 'cheating'].includes(tag.tag)));

function params() {
    return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
}

function bucketPercent(bucket) {
    if (!bucketTotal.value) {
        return '0%';
    }

    return `${Math.round((Number(bucket.count ?? 0) / bucketTotal.value) * 100)}%`;
}

async function loadDashboard() {
    const requestParams = params();

    await Promise.all([
        grading.fetchDistribution(requestParams),
        grading.fetchGrades(requestParams),
        grading.fetchTagsAndNotes(requestParams),
    ]);
}

onMounted(loadDashboard);
</script>

<template>
    <section class="mx-auto max-w-7xl space-y-6">
        <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-container">Track Admin dashboard</p>
            <h1 class="font-serif text-4xl text-on-surface">Grade Health</h1>
        </div>

        <div class="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-5">
            <input v-model="filters.track_id" class="h-10 rounded-lg border-slate-200 text-sm" type="number" placeholder="Track ID" />
            <input v-model="filters.cohort_id" class="h-10 rounded-lg border-slate-200 text-sm" type="number" placeholder="Cohort ID" />
            <input v-model="filters.course_id" class="h-10 rounded-lg border-slate-200 text-sm" type="number" placeholder="Course ID" />
            <input v-model="filters.lab_group_id" class="h-10 rounded-lg border-slate-200 text-sm" type="number" placeholder="Lab group ID" />
            <button class="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary" :disabled="loading" @click="loadDashboard">
                Refresh
            </button>
        </div>

        <div v-if="error" class="rounded-lg bg-danger-mist px-4 py-3 text-sm text-danger">{{ error }}</div>

        <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-xl bg-white p-5 shadow-sm">
                <p class="text-sm font-semibold text-slate-500">Average Score</p>
                <p class="mt-2 font-mono text-4xl text-primary-container">{{ distribution?.average_score ?? 0 }}</p>
            </div>
            <div class="rounded-xl bg-[#FFFBEB] p-5 shadow-sm">
                <p class="text-sm font-semibold text-[#D97706]">Consistency Alerts</p>
                <p class="mt-2 font-mono text-4xl text-[#D97706]">{{ flaggedConsistencyRows.length }}</p>
                <p class="mt-1 text-xs text-slate-600">Lab groups with a 10+ point gap</p>
            </div>
            <div class="rounded-xl bg-danger-mist p-5 shadow-sm">
                <p class="text-sm font-semibold text-danger">At-Risk / Flagged</p>
                <p class="mt-2 font-mono text-4xl text-danger">{{ gradeRiskRows.length + flaggedTags.length }}</p>
                <p class="mt-1 text-xs text-slate-600">Grade risks and support tags</p>
            </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div class="rounded-xl bg-white p-6 shadow-sm">
                <div class="mb-6 flex items-center justify-between">
                    <h2 class="text-xl font-semibold text-on-surface">Grade Distribution</h2>
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ distribution?.student_course_count ?? 0 }} student-courses</span>
                </div>

                <div class="space-y-4">
                    <div v-for="bucket in buckets" :key="bucket.label" class="grid grid-cols-[70px_1fr_52px] items-center gap-4">
                        <div class="font-mono text-sm" :class="bucket.label === '<60' ? 'text-danger font-semibold' : 'text-slate-600'">
                            {{ bucket.label }}
                        </div>
                        <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div class="h-full rounded-full" :class="bucket.label === '<60' ? 'bg-danger' : 'bg-primary-container'" :style="{ width: bucketPercent(bucket) }"></div>
                        </div>
                        <div class="text-right font-mono text-sm text-on-surface">{{ bucket.count }}</div>
                    </div>
                </div>
            </div>

            <div class="rounded-xl bg-white p-6 shadow-sm">
                <h2 class="mb-4 text-xl font-semibold text-on-surface">Grader Consistency</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-left text-sm">
                        <thead class="text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th class="py-2">Group</th>
                                <th class="py-2 text-right">Avg</th>
                                <th class="py-2 text-right">Gap</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="consistencyRows.length === 0">
                                <td class="py-4 text-slate-500" colspan="3">No graded groups loaded.</td>
                            </tr>
                            <tr v-for="row in consistencyRows" :key="row.lab_group_id" :class="row.flagged ? 'bg-[#FFFBEB]' : ''">
                                <td class="py-3 font-medium text-on-surface">{{ row.group }}</td>
                                <td class="py-3 text-right font-mono">{{ row.average }}</td>
                                <td class="py-3 text-right font-mono" :class="row.flagged ? 'font-semibold text-[#D97706]' : 'text-slate-500'">
                                    {{ row.gap > 0 ? '+' : '' }}{{ row.gap }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-semibold text-on-surface">At-Risk & Tag-Flagged Students</h2>
            <div class="grid gap-4 lg:grid-cols-2">
                <div>
                    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Grade risks</p>
                    <div class="space-y-2">
                        <p v-if="gradeRiskRows.length === 0" class="text-sm text-slate-500">No grade risk rows loaded.</p>
                        <div v-for="grade in gradeRiskRows" :key="grade.id" class="rounded-lg bg-danger-mist px-4 py-3 text-sm text-danger">
                            Student #{{ grade.student_id }} - score {{ grade.effective_score ?? grade.normalized_score }}
                        </div>
                    </div>
                </div>
                <div>
                    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Support tags</p>
                    <div class="space-y-2">
                        <p v-if="flaggedTags.length === 0" class="text-sm text-slate-500">No support tags loaded.</p>
                        <div v-for="tag in flaggedTags.slice(0, 5)" :key="tag.id" class="rounded-lg bg-[#EFF6FF] px-4 py-3 text-sm text-[#2563EB]">
                            Student #{{ tag.student_id }} - {{ tag.tag }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
