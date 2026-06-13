import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        loading: false,
        error: null
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        userRole: (state) => state.user?.role || null
    },
    actions: {
        async login(email, password) {
            this.loading = true;
            this.error = null;

            try {
                const response = await api.post('/login', {
                    email,
                    password
                });

                this.user = response.data.user;
                this.token = response.data.token;

                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

            } catch (error) {
                this.error = error.response?.data?.message || 'Login failed';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async fetchMe() {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get('/me');
                this.user = response.data;
                localStorage.setItem('user', JSON.stringify(this.user));
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to fetch user';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
});
