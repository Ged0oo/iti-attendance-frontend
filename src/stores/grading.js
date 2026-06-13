import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

/**
 * Grading store — M6 module stub
 * Full implementation owned by M6 team.
 */
export const useGradingStore = defineStore('grading', () => {
  const gradeCard = ref(null);
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

  return { gradeCard, loading, error, fetchGradeCard };
});
