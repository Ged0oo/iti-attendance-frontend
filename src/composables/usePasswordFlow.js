import { ref } from 'vue'
import api from '../services/api.js'

export function usePasswordFlow() {
    const loading = ref(false)
    const error = ref(null)
    const success = ref(false)

    /**
     * POST /reset-password
     */
    async function submitResetPassword(payload) {
        loading.value = true
        error.value = null
        success.value = false

        try {
            await api.post('/reset-password', payload)
            success.value = true
        } catch (e) {
            const errors = e.response?.data?.errors
            if (errors) {
                const firstKey = Object.keys(errors)[0]
                error.value = errors[firstKey][0]
            } else {
                error.value = e.response?.data?.message || 'Something went wrong. Please try again.'
            }
            throw e
        } finally {
            loading.value = false
        }
    }

    /**
     * POST /forgot-password
     */
    async function submitForgotPassword(email) {
        loading.value = true
        error.value = null
        success.value = false

        try {
            await api.post('/forgot-password', { email })
            success.value = true
        } catch (e) {
            error.value = e.response?.data?.message || 'Something went wrong. Please try again.'
            throw e
        } finally {
            loading.value = false
        }
    }

    return { loading, error, success, submitResetPassword, submitForgotPassword }
}