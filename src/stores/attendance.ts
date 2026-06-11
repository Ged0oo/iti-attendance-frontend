import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api.js'

export const useAttendanceStore = defineStore('attendance', () => {
  const scanState = ref('scanning')
  const lastScanResult = ref<any>(null)
  const loading = ref(false)

  async function submitScan(qrValue: string): Promise<void> {
    loading.value = true
    try {
      const response = await api.post('/attendance/scan', { session_qr_code: qrValue })
      const data = response.data
      const scanStatus = data.status ?? ''          // prefer explicit status field
      const msg = (data.message ?? '').toLowerCase()

      if (scanStatus === 'checked-out' || msg.includes('left') || msg.includes('check-out') || msg.includes('checkout')) {
        scanState.value = 'checked-out'
      } else {
        // 'checked-in', 'arrived', or any other 2xx → treat as check-in
        scanState.value = 'checked-in'
      }

      lastScanResult.value = data
    } catch (err: unknown) {
      const error = err as any
      if (error?.response) {
        const status = error.response.status as number
        const msg: string = error.response.data?.message ?? ''

        if (status === 400) {
          scanState.value = msg.toLowerCase().includes('expired') ? 'expired' : 'invalid'
        } else if (status === 403) {
          scanState.value = 'wrong-day'
        } else if (status === 409) {
          scanState.value = 'duplicate'
        } else {
          scanState.value = 'error'
        }
      } else {
        scanState.value = 'error'
      }
    } finally {
      loading.value = false
    }
  }

  function resetScan() {
    scanState.value = 'scanning'
    lastScanResult.value = null
  }

  return {
    scanState,
    lastScanResult,
    loading,
    submitScan,
    resetScan
  }
})