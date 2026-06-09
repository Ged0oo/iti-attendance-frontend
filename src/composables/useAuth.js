import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const store = useAuthStore()

  const isAuthenticated = computed(() => store.isAuthenticated)
  const currentUser = computed(() => store.user)
  const userRole = computed(() => store.userRole)

  function hasRole(...roles) {
    return roles.includes(store.userRole)
  }

  return { isAuthenticated, currentUser, userRole, hasRole }
}
