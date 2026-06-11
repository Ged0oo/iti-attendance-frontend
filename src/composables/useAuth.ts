import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

export function useAuth() {
  const store = useAuthStore();

  const isAuthenticated = computed(() => store.isAuthenticated);
  const currentUser     = computed(() => store.user);
  const userRole        = computed(() => store.userRole);
  const loading         = ref(false);
  const error           = ref<string | null>(null);

  function hasRole(...roles: string[]): boolean {
    return roles.includes(store.userRole ?? "");
  }

  async function login(email: string, password: string): Promise<void> {
    loading.value = true;
    error.value   = null;
    try {
      const res = await api.post("/login", { email, password });
      const token    = res.data?.token   ?? res.data?.data?.token;
      const userData = res.data?.user    ?? res.data?.data?.user ?? res.data?.data;
      await store.setAuthData(token, userData);
    } catch (e: any) {
      error.value = e.response?.data?.message ?? "Login failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    await store.logout();
  }

  return { isAuthenticated, currentUser, userRole, hasRole, login, logout, loading, error };
}
