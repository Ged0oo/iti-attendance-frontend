import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

/**
 * Cohort store — M3 module stub.
 * Full implementation owned by M3 team.
 */
export const useCohortStore = defineStore('cohort', () => {
  const cohorts = ref([]);
  const currentCohort = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function fetchCohorts() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/cohorts');
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
      const res = await api.get(`/cohorts/${id}`);
      currentCohort.value = res.data?.data || res.data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load cohort';
    } finally {
      loading.value = false;
    }
  }

  return { cohorts, currentCohort, loading, error, fetchCohorts, fetchCohort };
});
