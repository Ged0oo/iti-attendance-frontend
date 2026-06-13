import { defineStore } from "pinia";
import axios from "axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
  },
  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/login`,
          {
            email,
            password,
          },
          {
            headers: {
              Accept: "application/json",
            },
          },
        );

        this.user = response.data.user;
        this.token = response.data.token;

        localStorage.setItem("token", this.token);
        localStorage.setItem("user", JSON.stringify(this.user));
      } catch (error) {
        this.error = error.response?.data?.message || "Login failed";
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async fetchMe() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/me`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${this.token}`,
            },
          },
        );
        this.user = response.data;
        localStorage.setItem("user", JSON.stringify(this.user));
      } catch (error) {
        this.error = error.response?.data?.message || "Failed to fetch user";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      //this token is dummy
    },
  },
});
