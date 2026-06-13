import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useCohortStore = defineStore('cohort', () => {
  const cohorts = ref([]);
  const currentCohort = ref(null);
  const tracks = ref([]);
  const announcements = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchCohorts() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/api/cohorts');
      cohorts.value = res.data?.data || res.data || [];
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load cohorts';
    } finally {
      loading.value = false;
    }
  }

  async function fetchCohort(id) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get(`/api/cohorts/${id}`);
      currentCohort.value = res.data?.data || res.data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load cohort';
    } finally {
      loading.value = false;
    }
  }

  async function createCohort(payload) {
    const res = await api.post('/api/cohorts', payload);
    const data = res.data?.data || res.data;
    cohorts.value.push(data);
    return data;
  }

  async function updateCohort(id, payload) {
    const res = await api.put(`/api/cohorts/${id}`, payload);
    const data = res.data?.data || res.data;
    const idx = cohorts.value.findIndex((c) => c.id === id);
    if (idx !== -1) cohorts.value[idx] = data;
    return data;
  }

  async function deleteCohort(id) {
    await api.delete(`/api/cohorts/${id}`);
    cohorts.value = cohorts.value.filter((c) => c.id !== id);
  }

  async function transitionCohort(id, status) {
    const res = await api.patch(`/api/cohorts/${id}/transition`, { status });
    const data = res.data?.data || res.data;
    const idx = cohorts.value.findIndex((c) => c.id === id);
    if (idx !== -1) cohorts.value[idx] = data;
    return data;
  }

  async function fetchTracks() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/api/tracks');
      tracks.value = res.data?.data || res.data || [];
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load tracks';
    } finally {
      loading.value = false;
    }
  }

  async function createTrack(payload) {
    const res = await api.post('/api/tracks', payload);
    const data = res.data?.data || res.data;
    tracks.value.push(data);
    return data;
  }

  async function updateTrack(id, payload) {
    const res = await api.put(`/api/tracks/${id}`, payload);
    const data = res.data?.data || res.data;
    const idx = tracks.value.findIndex((t) => t.id === id);
    if (idx !== -1) tracks.value[idx] = data;
    return data;
  }

  async function deleteTrack(id) {
    await api.delete(`/api/tracks/${id}`);
    tracks.value = tracks.value.filter((t) => t.id !== id);
  }

  async function fetchTrackAdmins(trackId) {
    const res = await api.get(`/api/tracks/${trackId}/admins`);
    return res.data?.data || res.data || [];
  }

  async function assignTrackAdmin(trackId, userId) {
    const res = await api.post(`/api/tracks/${trackId}/admins`, { user_id: userId });
    return res.data?.data || res.data;
  }

  async function removeTrackAdmin(trackId, userId) {
    await api.delete(`/api/tracks/${trackId}/admins/${userId}`);
  }

  async function fetchAnnouncements(cohortId) {
    loading.value = true;
    try {
      const res = await api.get(`/api/cohorts/${cohortId}/announcements`);
      announcements.value = res.data?.data || res.data || [];
    } finally {
      loading.value = false;
    }
  }

  async function createAnnouncement(payload) {
    const res = await api.post('/api/announcements', payload);
    const data = res.data?.data || res.data;
    announcements.value.unshift(data);
    return data;
  }

  async function updateAnnouncement(id, payload) {
    const res = await api.put(`/api/announcements/${id}`, payload);
    const data = res.data?.data || res.data;
    const idx = announcements.value.findIndex((a) => a.id === id);
    if (idx !== -1) announcements.value[idx] = data;
    return data;
  }

  async function deleteAnnouncement(id) {
    await api.delete(`/api/announcements/${id}`);
    announcements.value = announcements.value.filter((a) => a.id !== id);
  }

  async function fetchCourses(cohortId) {
    const res = await api.get(`/api/cohorts/${cohortId}/courses`);
    return res.data?.data || res.data || [];
  }

  async function fetchCourseComponents(courseId) {
    const res = await api.get(`/api/courses/${courseId}/components`);
    return res.data?.data || res.data || [];
  }

  async function fetchStudents(cohortId) {
    const res = await api.get(`/api/cohorts/${cohortId}/students`);
    return res.data?.data || res.data || [];
  }

  async function fetchAtRiskStudents() {
    const res = await api.get('/api/students/at-risk');
    return res.data?.data || res.data || [];
  }

  async function fetchBilling() {
    const res = await api.get('/api/billing');
    return res.data?.data || res.data || [];
  }

  async function fetchAttendanceRate(params = {}) {
    const res = await api.get('/api/attendance-rate', { params });
    return res.data?.data || res.data || { attendance_rate: 0 };
  }

  async function fetchGradeDistribution(params = {}) {
    const res = await api.get('/api/grade-distribution', { params });
    return res.data?.data || res.data || {};
  }

  return {
    cohorts,
    currentCohort,
    tracks,
    announcements,
    loading,
    error,
    fetchCohorts,
    fetchCohort,
    createCohort,
    updateCohort,
    deleteCohort,
    transitionCohort,
    fetchTracks,
    createTrack,
    updateTrack,
    deleteTrack,
    fetchTrackAdmins,
    assignTrackAdmin,
    removeTrackAdmin,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    fetchCourses,
    fetchCourseComponents,
    fetchStudents,
    fetchAtRiskStudents,
    fetchBilling,
    fetchAttendanceRate,
    fetchGradeDistribution
  };
});
