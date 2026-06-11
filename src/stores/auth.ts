import { defineStore } from "pinia";
import { computed } from "vue";
import { useLocalStorage } from "@/composables/useLocalStorage";

export const useAuthStore = defineStore("auth", () => {
  const token = useLocalStorage<string>("token", null);
  const user = useLocalStorage<any>("user", null);

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role || null);

  const setAuthData = (newToken: string, userData: any) => {
    token.value = newToken;
    user.value = userData;
  };

  const logout = () => {
    token.value = null;
    user.value = null;
  };

  return {
    token,
    user,
    isAuthenticated,
    userRole,
    setAuthData,
    logout,
  };
});
