import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useLocalStorage } from "@/composables/useLocalStorage";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  // ── Persisted state ──────────────────────────────────────────────────────
  // KEY MUST BE "auth_token" — this is what api.ts reads from localStorage
  const token = useLocalStorage<string>("auth_token", null);
  const user   = useLocalStorage<any>("user", null);

  // ── Runtime state ─────────────────────────────────────────────────────────
  // Student profile comes from GET /students/{student_id} — not persisted
  const studentProfile = ref<any>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value);
  const userRole        = computed(() => user.value?.role ?? null);

  // student_id lives on the user object returned by /me (and login response)
  const studentId = computed<number | null>(() => user.value?.student_id ?? null);

  // cohort_id lives on the student profile returned by GET /students/{id}
  const cohortId  = computed<number | null>(() => studentProfile.value?.cohort_id ?? null);

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Two-step hydration:
   *   1. GET /me  →  populates user (contains student_id / role)
   *   2. GET /students/{student_id}  →  populates studentProfile (contains cohort_id)
   *
   * Call this once per page load if user is already authenticated.
   * The login flow should call setAuthData() then fetchMe().
   */
  async function fetchMe(): Promise<void> {
    const meRes = await api.get("/me");
    user.value  = meRes.data?.data ?? meRes.data;

    if (user.value?.student_id) {
      const profileRes    = await api.get(`/students/${user.value.student_id}`);
      studentProfile.value = profileRes.data?.data ?? profileRes.data;
    }
  }

  /**
   * Called by the login view after a successful POST /login.
   * Stores token + user, then hydrates studentProfile via fetchMe().
   */
  const setAuthData = async (newToken: string, userData: any): Promise<void> => {
    token.value = newToken;
    user.value  = userData;
    // Hydrate student profile immediately after login
    if (userData?.student_id) {
      const profileRes    = await api.get(`/students/${userData.student_id}`);
      studentProfile.value = profileRes.data?.data ?? profileRes.data;
    }
  };

  const logout = (): void => {
    token.value          = null;
    user.value           = null;
    studentProfile.value = null;
  };

  return {
    token,
    user,
    studentProfile,
    isAuthenticated,
    userRole,
    studentId,
    cohortId,
    fetchMe,
    setAuthData,
    logout,
  };
});
