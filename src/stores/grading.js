import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useGradingStore = defineStore('grading', () => {
  const gradeCard = ref(null);
  const distribution = ref(null);
  const grades = ref([]);
  const courses = ref([]);
  const components = ref([]);
  const labGroups = ref([]);
  const tags = ref([]);
  const notes = ref([]);
  const atRiskGrades = ref([]);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref(null);

  function unwrap(response) {
    return response.data?.data || response.data || [];
  }

  function setError(err, fallback) {
    error.value = err.response?.data?.message || err.message || fallback;
  }

  function replaceById(collection, item) {
    const index = collection.value.findIndex((entry) => Number(entry.id) === Number(item.id));

    if (index === -1) {
      collection.value.unshift(item);
      return;
    }

    collection.value[index] = item;
  }

  function refreshAtRiskGrades() {
    atRiskGrades.value = grades.value.filter((grade) => {
      const score = Number(grade.effective_score ?? grade.normalized_score ?? 0);
      return score < 60 || grade.student?.is_at_risk;
    });
  }

  async function fetchReferenceData() {
    loading.value = true;
    error.value = null;

    try {
      const [courseRes, componentRes, labGroupRes] = await Promise.all([
        api.get('/courses'),
        api.get('/grade-components'),
        api.get('/lab-groups'),
      ]);

      courses.value = Array.isArray(unwrap(courseRes)) ? unwrap(courseRes) : [];
      components.value = Array.isArray(unwrap(componentRes)) ? unwrap(componentRes) : [];
      labGroups.value = Array.isArray(unwrap(labGroupRes)) ? unwrap(labGroupRes) : [];
    } catch (err) {
      setError(err, 'Failed to load grading reference data');
    } finally {
      loading.value = false;
    }
  }

  async function fetchGradeCard(studentId) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get(`/students/${studentId}/grade-card`);
      gradeCard.value = unwrap(res);
    } catch (err) {
      setError(err, 'Failed to load grade card');
    } finally {
      loading.value = false;
    }
  }

  async function fetchDistribution(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/grade-distribution', { params });
      distribution.value = unwrap(res);
    } catch (err) {
      setError(err, 'Failed to load grade distribution');
    } finally {
      loading.value = false;
    }
  }

  async function fetchGrades(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/grades', { params });
      const data = unwrap(res);
      grades.value = Array.isArray(data) ? data : [];
      refreshAtRiskGrades();
    } catch (err) {
      setError(err, 'Failed to load grades');
    } finally {
      loading.value = false;
    }
  }

  async function saveRawGrade(payload) {
    saving.value = true;
    error.value = null;

    try {
      const res = payload.id
        ? await api.patch(`/grades/${payload.id}`, {
            raw_score: payload.raw_score,
            lab_group_id: payload.lab_group_id,
          })
        : await api.post('/grades', payload);

      const grade = unwrap(res);
      replaceById(grades, grade);
      refreshAtRiskGrades();

      return grade;
    } catch (err) {
      setError(err, 'Failed to save grade');
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function overrideGrade(gradeId, payload) {
    saving.value = true;
    error.value = null;

    try {
      const res = await api.patch(`/grades/${gradeId}/override`, payload);
      const grade = unwrap(res);
      replaceById(grades, grade);
      refreshAtRiskGrades();

      return grade;
    } catch (err) {
      setError(err, 'Failed to override grade');
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function fetchTagsAndNotes(params = {}) {
    loading.value = true;
    error.value = null;

    try {
      const [tagRes, noteRes] = await Promise.all([
        api.get('/student-tags', { params }),
        api.get('/student-notes', { params }),
      ]);

      tags.value = Array.isArray(unwrap(tagRes)) ? unwrap(tagRes) : [];
      notes.value = Array.isArray(unwrap(noteRes)) ? unwrap(noteRes) : [];
    } catch (err) {
      setError(err, 'Failed to load tags and notes');
    } finally {
      loading.value = false;
    }
  }

  async function createTag(payload) {
    saving.value = true;
    error.value = null;

    try {
      const res = await api.post('/student-tags', payload);
      const tag = unwrap(res);
      replaceById(tags, tag);

      return tag;
    } catch (err) {
      setError(err, 'Failed to create tag');
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function createNote(payload) {
    saving.value = true;
    error.value = null;

    try {
      const res = await api.post('/student-notes', payload);
      const note = unwrap(res);
      replaceById(notes, note);

      return note;
    } catch (err) {
      setError(err, 'Failed to create note');
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function deleteTag(tagId) {
    saving.value = true;
    error.value = null;

    try {
      await api.delete(`/student-tags/${tagId}`);
      tags.value = tags.value.filter((tag) => Number(tag.id) !== Number(tagId));
      return true;
    } catch (err) {
      setError(err, 'Failed to delete tag');
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function deleteNote(noteId) {
    saving.value = true;
    error.value = null;

    try {
      await api.delete(`/student-notes/${noteId}`);
      notes.value = notes.value.filter((note) => Number(note.id) !== Number(noteId));
      return true;
    } catch (err) {
      setError(err, 'Failed to delete note');
      return false;
    } finally {
      saving.value = false;
    }
  }

  return {
    gradeCard,
    distribution,
    grades,
    courses,
    components,
    labGroups,
    tags,
    notes,
    atRiskGrades,
    loading,
    saving,
    error,
    fetchReferenceData,
    fetchGradeCard,
    fetchDistribution,
    fetchGrades,
    saveRawGrade,
    overrideGrade,
    fetchTagsAndNotes,
    createTag,
    createNote,
    deleteTag,
    deleteNote
  };
});
