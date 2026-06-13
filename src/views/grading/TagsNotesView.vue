<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useGradingStore } from '../../stores/grading';
import MainLayout from '../../components/layout/MainLayout.vue';

const grading = useGradingStore();
const { tags, notes, courses, loading, error } = storeToRefs(grading);

const tagOptions = [
    { value: 'uses_ai', label: 'Uses AI' },
    { value: 'cheating', label: 'Cheating' },
    { value: 'loves_extra_work', label: 'Loves Extra Work' },
    { value: 'needs_support', label: 'Needs Support' },
    { value: 'at_risk', label: 'At-Risk' },
    { value: 'excellent_progress', label: 'Excellent Progress' },
];

const filters = reactive({
    student_id: '',
    course_id: '',
});
const tagForm = reactive({
    tag: 'needs_support',
});
const noteForm = reactive({
    note: '',
});
const notice = ref('');

function params() {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
    );
}

async function load() {
    await grading.fetchTagsAndNotes(params());
}

async function addTag() {
    if (!filters.student_id) {
        notice.value = 'Student ID is required before adding a tag.';
        return;
    }

    await grading.createTag({
        student_id: Number(filters.student_id),
        course_id: filters.course_id ? Number(filters.course_id) : null,
        tag: tagForm.tag,
    });
    notice.value = 'Tag saved.';
}

async function addNote() {
    if (!filters.student_id || noteForm.note.trim().length < 5) {
        notice.value = 'Student ID and a note of at least 5 characters are required.';
        return;
    }

    await grading.createNote({
        student_id: Number(filters.student_id),
        course_id: filters.course_id ? Number(filters.course_id) : null,
        note: noteForm.note,
    });
    noteForm.note = '';
    notice.value = 'Note saved.';
}

function tagLabel(tag) {
    return tagOptions.find((option) => option.value === tag)?.label || tag;
}

function tagClass(tag) {
    if (tag === 'at_risk' || tag === 'cheating') {
        return 'bg-danger-mist text-danger border-danger/20';
    }

    if (tag === 'excellent_progress' || tag === 'loves_extra_work') {
        return 'bg-[#ECFDF5] text-success border-success/20';
    }

    return 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20';
}

onMounted(async () => {
    await grading.fetchReferenceData();
    await load();
});
</script>

<template>
    <MainLayout title="Tags & Notes">
    <section class="mx-auto max-w-7xl space-y-6">
        <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-container">Student support</p>
            <h1 class="font-serif text-4xl text-on-surface">Tags & Notes</h1>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="grid gap-4 lg:grid-cols-[180px_1fr_auto] lg:items-end">
                <label class="space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Student ID</span>
                    <input v-model="filters.student_id" class="h-11 w-full rounded-lg border-slate-200 text-sm" type="number" placeholder="Student ID" />
                </label>
                <label class="space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</span>
                    <select v-model="filters.course_id" class="h-11 w-full rounded-lg border-slate-200 text-sm">
                        <option value="">All courses</option>
                        <option v-for="course in courses" :key="course.id" :value="course.id">
                            {{ course.name }}
                        </option>
                    </select>
                </label>
                <button class="h-11 rounded-lg border border-slate-200 px-5 text-sm font-semibold hover:bg-slate-50" :disabled="loading" @click="load">
                    Apply filters
                </button>
            </div>

            <div v-if="notice" class="mt-4 rounded-lg bg-[#EFF6FF] px-4 py-3 text-sm text-[#2563EB]">{{ notice }}</div>
            <div v-if="error" class="mt-4 rounded-lg bg-danger-mist px-4 py-3 text-sm text-danger">{{ error }}</div>
        </div>

        <div class="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <aside class="space-y-6">
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="mb-4 flex items-center justify-between">
                        <h2 class="text-sm font-semibold uppercase tracking-wide text-on-surface">Student Tags</h2>
                        <span class="font-mono text-sm text-slate-500">{{ tags.length }}</span>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <span v-if="tags.length === 0" class="text-sm text-slate-500">No tags loaded.</span>
                        <span v-for="tag in tags" :key="tag.id" class="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium" :class="tagClass(tag.tag)">
                            {{ tagLabel(tag.tag) }}
                            <button class="rounded-full text-current opacity-70 hover:opacity-100" type="button" @click="grading.deleteTag(tag.id)">x</button>
                        </span>
                    </div>

                    <div class="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <select v-model="tagForm.tag" class="h-10 rounded-lg border-slate-200 text-sm">
                            <option v-for="option in tagOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                        <button class="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary" @click="addTag">
                            Add tag
                        </button>
                    </div>
                </div>

                <div class="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-on-surface">Current Standing</h2>
                    <div class="mt-4 space-y-3 text-sm">
                        <div class="flex items-center justify-between">
                            <span class="text-slate-500">At-risk tags</span>
                            <span class="font-mono text-danger">{{ tags.filter((tag) => tag.tag === 'at_risk').length }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-slate-500">Private notes</span>
                            <span class="font-mono text-on-surface">{{ notes.length }}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <div class="space-y-4">
                <div>
                    <h2 class="text-xl font-semibold text-on-surface">Notes</h2>
                    <p class="text-sm text-slate-500">Visible to authorized instructors and admins only.</p>
                </div>

                <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <textarea v-model="noteForm.note" class="min-h-28 w-full rounded-lg border-slate-200 text-sm" placeholder="Add a private note about this student." />
                    <div class="mt-3 flex justify-end">
                        <button class="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary" @click="addNote">
                            Save note
                        </button>
                    </div>
                </div>

                <article v-if="notes.length === 0" class="rounded-xl bg-white p-5 text-sm text-slate-500 shadow-sm">
                    No notes loaded.
                </article>

                <article v-for="note in notes" :key="note.id" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="mb-3 flex items-start justify-between gap-4">
                        <div>
                            <p class="text-sm font-semibold text-on-surface">{{ note.written_by_user?.name || `User #${note.written_by}` }}</p>
                            <p class="text-xs text-slate-500">{{ note.course?.name || 'General note' }}</p>
                        </div>
                        <button class="rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-mist" @click="grading.deleteNote(note.id)">
                            Delete
                        </button>
                    </div>
                    <p class="whitespace-pre-line text-sm leading-6 text-on-surface">{{ note.note }}</p>
                </article>
            </div>
        </div>
    </section>
    </MainLayout>
</template>
