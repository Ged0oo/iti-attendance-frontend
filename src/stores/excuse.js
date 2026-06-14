import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useExcuseStore = defineStore('excuse', () => {
  const excuseRequests = ref([])
  const submitting = ref(false)
  const submitted = ref(false)
  const submittedLabel = ref('')
  const fieldErrors = ref({})

  async function fetchExcuseRequests() {
    try {
      const response = await api.get('/excuse-requests')
      excuseRequests.value = response.data?.data ?? response.data ?? []
    } catch (e) {
      excuseRequests.value = []
    }
  }

  async function submitExcuse({ attendance_record_id, reason, attachment }) {
    submitting.value = true
    fieldErrors.value = {}

    const form = new FormData()
    form.append('attendance_record_id', String(attendance_record_id))
    form.append('reason', reason)
    if (attachment) {
      form.append('attachment', attachment)
    }

    try {
      const response = await api.post('/excuse-requests', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.status === 201) {
        submitted.value = true
      }
    } catch (err) {
      if (err?.response?.status === 422) {
        fieldErrors.value = err.response.data?.errors ?? {}
      } else {
        throw err
      }
    } finally {
      submitting.value = false
    }
  }

  function reset() {
    submitted.value = false
    fieldErrors.value = {}
    submittedLabel.value = ''
  }

  return {
    excuseRequests,
    submitting,
    submitted,
    submittedLabel,
    fieldErrors,
    fetchExcuseRequests,
    submitExcuse,
    reset
  }
})
