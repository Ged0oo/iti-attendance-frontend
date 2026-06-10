import { useApi } from "./useApi";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

export function useAuth() {
  const authStore = useAuthStore();
  const router = useRouter();

  const api = useApi("http://127.0.0.1:8000/api");

  const login = async (email: string, password: string) => {
    await api.post({ email, password }, "login");

    if (api.error.value) {
      return;
    }

    const { token, user } = api.data.value;

    authStore.setAuthData(token, user);

    router.push("/dashboard");
  };

  return {
    login,
    loading: api.loading,
    error: api.error,
  };
}
