import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api.js'

export const useLedgerStore = defineStore('ledger', () => {
  const balance = ref(250)
  const max = ref(250)
  const is_at_risk = ref(false)
  const entries = ref<any[]>([])
  const loading = ref(false)
  const error = ref<unknown>(null)

  const isAtRisk = computed(() => balance.value < 150)
  const balanceColor = computed(() => balance.value >= 150 ? '#059669' : '#DC2626')

  async function fetchLedger(studentId: number | string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const results = await Promise.allSettled([
        api.get(`/students/${studentId}/ledger`),
        api.get(`/students/${studentId}/ledger/entries`)
      ])

      const ledgerResult = results[0]
      const entriesResult = results[1]

      if (ledgerResult.status === 'fulfilled') {
        const ledgerData = ledgerResult.value.data
        balance.value = ledgerData.balance ?? ledgerData.data?.balance
        max.value = ledgerData.max ?? ledgerData.data?.max ?? 250
        is_at_risk.value = ledgerData.is_at_risk ?? (balance.value < 150)
      } else {
        error.value = ledgerResult.reason
      }

      if (entriesResult.status === 'fulfilled') {
        const entriesData = entriesResult.value.data
        entries.value = Array.isArray(entriesData) ? entriesData : (entriesData.data ?? [])
      } else {
        entries.value = []
      }
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return {
    balance,
    max,
    is_at_risk,
    entries,
    loading,
    error,
    isAtRisk,
    balanceColor,
    fetchLedger
  }
})
