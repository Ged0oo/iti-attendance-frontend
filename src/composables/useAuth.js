import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

/**
 * useAuth composable — wraps the auth store for convenience.
 * This is a JS re-export of the shared auth composable.
 */
export function useAuth() {
  const authStore = useAuthStore();

  const user = computed(() => authStore.user);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const role = computed(() => authStore.role);
  const token = computed(() => authStore.token);

  async function login(credentials) {
    return authStore.login(credentials);
  }

  async function logout() {
    return authStore.logout();
  }

  async function fetchMe() {
    return authStore.fetchMe();
  }

  return {
    user,
    isAuthenticated,
    role,
    token,
    login,
    logout,
    fetchMe,
  };
}
