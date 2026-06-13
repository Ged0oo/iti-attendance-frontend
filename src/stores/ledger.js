import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useLedgerStore = defineStore('ledger', () => {
  const balance = ref(250)
  const max = ref(250)
  const threshold = ref(150)
  const entries = ref([])
  const loading = ref(false)
  const error = ref(null)

  const balancePercentage = computed(() => {
    return Math.max(0, (balance.value / max.value) * 100)
  })

  const isAtRisk = computed(() => {
    return balance.value < threshold.value
  })

  async function fetchLedger(studentId) {
    loading.value = true
    error.value = null
    try {
      const balanceResponse = await api.get(`/students/${studentId}/ledger`)
      const fetchedBalance = balanceResponse.data.data?.balance ?? balanceResponse.data.balance
      balance.value = fetchedBalance ?? 250

      const entriesResponse = await api.get(`/students/${studentId}/ledger/entries`)
      entries.value = entriesResponse.data.data || []
    } catch (err) {
      console.error("Failed to fetch live ledger data:", err)
      error.value = err.response?.data?.message || 'Failed to load ledger'
    } finally {
      loading.value = false
    }
  }

  return {
    balance,
    max,
    threshold,
    entries,
    loading,
    error,
    balancePercentage,
    isAtRisk,
    fetchLedger
  }
})