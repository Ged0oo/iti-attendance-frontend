import { defineStore } from 'pinia'
import axios from 'axios'

// const API_URL = 'http://13.60.179.178/api'
const API_URL = 'http://192.168.1.11:8000/api';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        loading: false,
        error: null
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        isInstructor: (state) => state.user?.role === 'instructor',
        isStudent: (state) => state.user?.role === 'student',
        isManager: (state) => state.user?.role === 'manager'
    },
    actions: {
        async login(email, password) {
            this.loading = true;
            this.error = null;

            try {
                const response = await axios.post(`${API_URL}/login`, {
                    email,
                    password
                }, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                this.user = response.data.user;
                this.token = response.data.token;

                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

            } catch (error) {
                this.error = error.response?.data?.message || 'Login failed';
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