import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const store = useAuthStore()

  const isAuthenticated = computed(() => store.isAuthenticated)
  const currentUser = computed(() => store.user)
  const userRole = computed(() => store.userRole)
  const loading = ref(false)
  const error = ref(null)

  function hasRole(...roles) {
    return roles.includes(store.userRole)
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      await store.login(email, password)
    } catch (e) {
      error.value = e.response?.data?.message || 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await store.logout()
  }

  return { isAuthenticated, currentUser, userRole, hasRole, login, logout, loading, error }
}
