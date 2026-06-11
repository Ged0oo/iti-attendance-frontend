import { defineStore } from 'pinia';
import api from '../services/api';

function dataItems(response) {
    const payload = response.data?.data ?? response.data;

    if (Array.isArray(payload)) {
        return payload;
    }

    return payload?.data ?? [];
}

function dataObject(response) {
    return response.data?.data ?? response.data ?? {};
}

function errorMessage(error, fallback = 'Request failed.') {
    if (error.message === 'Network Error') {
        return 'Connection failed. Please try again.';
    }

    return error.response?.data?.message || error.message || fallback;
}

export const useGradingStore = defineStore('grading', {
    state: () => ({
        grades: [],
        courses: [],
        components: [],
        labGroups: [],
        tags: [],
        notes: [],
        gradeCard: null,
        distribution: null,
        loading: false,
        saving: false,
        error: '',
    }),

    getters: {
        atRiskGrades: (state) => state.grades.filter((grade) => {
            const effective = Number(grade.effective_score ?? grade.normalized_score ?? 0);

            return grade.student?.is_at_risk || effective < 60;
        }),

        graderConsistencyRows: (state) => {
            const groups = new Map();

            state.grades.forEach((grade) => {
                if (!grade.lab_group_id) {
                    return;
                }

                const key = grade.lab_group_id;
                const entry = groups.get(key) ?? {
                    lab_group_id: key,
                    group: grade.lab_group?.name ?? `Group ${key}`,
                    instructor: grade.grader?.name ?? 'Assigned instructor',
                    total: 0,
                    count: 0,
                };

                entry.total += Number(grade.effective_score ?? grade.normalized_score ?? 0);
                entry.count += 1;
                groups.set(key, entry);
            });

            const rows = Array.from(groups.values()).map((entry) => ({
                ...entry,
                average: entry.count ? Number((entry.total / entry.count).toFixed(2)) : 0,
            }));
            const mean = rows.length
                ? rows.reduce((sum, row) => sum + row.average, 0) / rows.length
                : 0;

            return rows.map((row) => ({
                ...row,
                gap: Number((row.average - mean).toFixed(2)),
                flagged: Math.abs(row.average - mean) >= 10,
            }));
        },
    },

    actions: {
        async request(callback) {
            this.loading = true;
            this.error = '';

            try {
                return await callback();
            } catch (error) {
                this.error = errorMessage(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchReferenceData() {
            return this.request(async () => {
                const [courses, components, labGroups] = await Promise.all([
                    api.get('/api/courses'),
                    api.get('/api/grade-components'),
                    api.get('/api/lab-groups'),
                ]);

                this.courses = dataItems(courses);
                this.components = dataItems(components);
                this.labGroups = dataItems(labGroups);
            });
        },

        async fetchGrades(params = {}) {
            return this.request(async () => {
                const response = await api.get('/api/grades', { params });
                this.grades = dataItems(response);

                return this.grades;
            });
        },

        async saveRawGrade(payload) {
            this.saving = true;
            this.error = '';

            try {
                const rawPayload = {
                    student_id: payload.student_id,
                    grade_component_id: payload.grade_component_id,
                    lab_group_id: payload.lab_group_id || null,
                    raw_score: payload.raw_score,
                };
                const response = payload.id
                    ? await api.patch(`/api/grades/${payload.id}`, {
                        raw_score: rawPayload.raw_score,
                        lab_group_id: rawPayload.lab_group_id,
                    })
                    : await api.post('/api/grades', rawPayload);
                const saved = dataObject(response);
                const index = this.grades.findIndex((grade) => grade.id === saved.id);

                if (index >= 0) {
                    this.grades[index] = saved;
                } else {
                    this.grades.unshift(saved);
                }

                return saved;
            } catch (error) {
                this.error = errorMessage(error, 'Grade save failed.');
                return null;
            } finally {
                this.saving = false;
            }
        },

        async overrideGrade(gradeId, payload) {
            this.saving = true;
            this.error = '';

            try {
                const response = await api.patch(`/api/grades/${gradeId}/override`, {
                    override_value: payload.override_value,
                    override_note: payload.override_note,
                });
                const saved = dataObject(response);
                const index = this.grades.findIndex((grade) => grade.id === saved.id);

                if (index >= 0) {
                    this.grades[index] = saved;
                }

                return saved;
            } catch (error) {
                this.error = errorMessage(error, 'Override failed.');
                return null;
            } finally {
                this.saving = false;
            }
        },

        async fetchGradeCard(studentId) {
            return this.request(async () => {
                const response = await api.get(`/api/students/${studentId}/grade-card`);
                this.gradeCard = dataObject(response);

                return this.gradeCard;
            });
        },

        async fetchTagsAndNotes(params = {}) {
            return this.request(async () => {
                const [tags, notes] = await Promise.all([
                    api.get('/api/student-tags', { params }),
                    api.get('/api/student-notes', { params }),
                ]);

                this.tags = dataItems(tags);
                this.notes = dataItems(notes);
            });
        },

        async createTag(payload) {
            const response = await api.post('/api/student-tags', payload);
            const tag = dataObject(response);

            this.tags.unshift(tag);

            return tag;
        },

        async deleteTag(tagId) {
            await api.delete(`/api/student-tags/${tagId}`);
            this.tags = this.tags.filter((tag) => tag.id !== tagId);
        },

        async createNote(payload) {
            const response = await api.post('/api/student-notes', payload);
            const note = dataObject(response);

            this.notes.unshift(note);

            return note;
        },

        async deleteNote(noteId) {
            await api.delete(`/api/student-notes/${noteId}`);
            this.notes = this.notes.filter((note) => note.id !== noteId);
        },

        async fetchDistribution(params = {}) {
            return this.request(async () => {
                const response = await api.get('/api/grade-distribution', { params });
                this.distribution = dataObject(response);

                return this.distribution;
            });
        },
    },
});
