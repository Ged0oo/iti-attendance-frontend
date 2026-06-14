import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

/**
 * useAuth composable — wraps the auth store for convenience.
 * This is a JS re-export of the shared auth composable.
 */
export function useAuth() {
  const authStore = useAuthStore();

  const user = computed(() => authStore.user);
  const currentUser = computed(() => authStore.user);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const role = computed(() => authStore.userRole);
  const userRole = computed(() => authStore.userRole);
  const token = computed(() => authStore.token);

  async function login(email, password) {
    return authStore.login(email, password);
  }

  async function logout() {
    return authStore.logout();
  }

  async function fetchMe() {
    return authStore.fetchMe();
  }

  function hasRole(...roles) {
    return roles.includes(authStore.userRole);
  }

  return {
    user,
    currentUser,
    isAuthenticated,
    role,
    userRole,
    token,
    login,
    logout,
    fetchMe,
    hasRole,
  };
}
