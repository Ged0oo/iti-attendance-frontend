import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

/**
 * Grading store — M6 module stub
 * Full implementation owned by M6 team.
 */
export const useGradingStore = defineStore('grading', () => {
  const gradeCard = ref(null);
  const distribution = ref(null);
  const grades = ref([]);
  const atRiskGrades = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchGradeCard(studentId) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get(`/students/${studentId}/grade-card`);
      gradeCard.value = res.data?.data || res.data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load grade card';
    } finally {
      loading.value = false;
    }
  }

  async function fetchDistribution(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/grade-distribution', { params });
      distribution.value = res.data?.data || res.data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load grade distribution';
    } finally {
      loading.value = false;
    }
  }

  async function fetchGrades(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/grades', { params });
      const data = res.data?.data || res.data;
      grades.value = Array.isArray(data) ? data : [];
      // Populate atRiskGrades with grades below 60
      atRiskGrades.value = grades.value.filter(g => {
        const score = g.effective_score ?? g.normalized_score;
        return score !== undefined && score < 60;
      });
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load grades';
    } finally {
      loading.value = false;
    }
  }

  return {
    gradeCard,
    distribution,
    grades,
    atRiskGrades,
    loading,
    error,
    fetchGradeCard,
    fetchDistribution,
    fetchGrades
  };
});
