import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

function decrementButtonRequests(config) {
    if (config && config.triggerButton) {
        const btn = config.triggerButton;
        const activeRequests = Math.max(0, parseInt(btn.dataset.activeRequests || '0', 10) - 1);
        btn.dataset.activeRequests = activeRequests.toString();
        if (activeRequests === 0) {
            btn.disabled = false;
        }
    }
}

api.interceptors.request.use((config) => {
    // Sanitize URL to handle inconsistent route prefixes in codebase
    if (config.url && import.meta.env.VITE_API_BASE_URL?.endsWith('/api')) {
        if (config.url.startsWith('/api/')) {
            config.url = config.url.substring(4); // Keep leading slash: /cohorts
        } else if (config.url.startsWith('api/')) {
            config.url = '/' + config.url.substring(4);
        }
    }

    const lastClickedButton = window.lastClickedButton;
    if (lastClickedButton) {
        config.triggerButton = lastClickedButton;
        const activeRequests = parseInt(lastClickedButton.dataset.activeRequests || '0', 10) + 1;
        lastClickedButton.dataset.activeRequests = activeRequests.toString();
        lastClickedButton.disabled = true;
    }

    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    response => {
        decrementButtonRequests(response.config);
        return response;
    },
    error => {
        if (error.config) {
            decrementButtonRequests(error.config);
        }
        if (error.response?.status === 401) {
            const authStore = useAuthStore();
            authStore.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;