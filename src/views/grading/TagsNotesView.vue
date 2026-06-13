<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
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
const studentSearch = ref('');
const studentOptions = ref([]);
const studentSuggestionsOpen = ref(false);

const filteredStudentOptions = computed(() => {
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

function params() {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
    );
}

async function load() {
    await grading.fetchTagsAndNotes(params());
}

async function loadStudentSuggestions() {
    const cohortIds = [...new Set(courses.value.map((course) => course.cohort_id).filter(Boolean))];
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

    if (filters.student_id) {
        const selected = studentOptions.value.find((student) => String(student.id) === String(filters.student_id));
        studentSearch.value = selected ? formatStudentSearchLabel(selected) : String(filters.student_id);
    }
}

function formatStudentSearchLabel(student) {
    return student.email ? `${student.name} (${student.email})` : `${student.name} (#${student.id})`;
}

async function selectStudent(student, shouldLoad = true) {
    filters.student_id = student.id;
    studentSearch.value = formatStudentSearchLabel(student);
    studentSuggestionsOpen.value = false;

    if (shouldLoad) {
        await load();
    }
}

function handleStudentSearchInput() {
    filters.student_id = '';
    studentSuggestionsOpen.value = true;
}

async function applyFilters() {
    if (!filters.student_id && filteredStudentOptions.value.length > 0) {
        await selectStudent(filteredStudentOptions.value[0], false);
    }

    await load();
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
    await loadStudentSuggestions();
    await load();
});
</script>

<template>
    <MainLayout title="Tags & Notes">
    <section class="w-full space-y-6">
        <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-container">Student support</p>
            <h1 class="font-serif text-4xl text-on-surface">Tags & Notes</h1>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_minmax(220px,1fr)_auto] lg:items-end">
                <div class="relative space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Student</span>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                        <input
                            v-model="studentSearch"
                            class="h-11 w-full rounded-lg border-slate-200 pl-10 pr-3 text-sm"
                            type="search"
                            placeholder="Search by name, email, or ID"
                            @focus="studentSuggestionsOpen = true"
                            @input="handleStudentSearchInput"
                            @keydown.escape="studentSuggestionsOpen = false"
                        />
                    </div>

                    <div v-if="studentSuggestionsOpen" class="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                        <button
                            v-for="student in filteredStudentOptions"
                            :key="student.id"
                            class="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
                            type="button"
                            @click="selectStudent(student)"
                        >
                            <span class="block font-medium text-on-surface">{{ student.name }}</span>
                            <span class="block text-xs text-slate-500">{{ student.email || `Student #${student.id}` }}</span>
                        </button>
                        <div v-if="filteredStudentOptions.length === 0" class="px-4 py-3 text-sm text-slate-500">
                            No students found.
                        </div>
                    </div>
                </div>
                <label class="space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</span>
                    <select v-model="filters.course_id" class="h-11 w-full rounded-lg border-slate-200 text-sm">
                        <option value="">All courses</option>
                        <option v-for="course in courses" :key="course.id" :value="course.id">
                            {{ course.name }}
                        </option>
                    </select>
                </label>
                <button class="h-11 rounded-lg border border-slate-200 px-5 text-sm font-semibold hover:bg-slate-50" :disabled="loading" @click="applyFilters">
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
