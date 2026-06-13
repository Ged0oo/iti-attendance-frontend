import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    // Sanitize URL to handle inconsistent route prefixes in codebase
    if (config.url && apiBaseUrl.endsWith('/api')) {
        if (config.url.startsWith('/api/')) {
            config.url = config.url.substring(4); // Keep leading slash: /cohorts
        } else if (config.url.startsWith('api/')) {
            config.url = '/' + config.url.substring(4);
        }
    }

    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            const authStore = useAuthStore();
            authStore.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
