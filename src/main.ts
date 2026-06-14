import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'

// Track clicked button globally for async disabling
(window as any).lastClickedButton = null;
window.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const btn = (target && typeof target.closest === 'function') ? target.closest('button') : null;
  if (btn) {
    (window as any).lastClickedButton = btn;
    setTimeout(() => {
      if ((window as any).lastClickedButton === btn) {
        (window as any).lastClickedButton = null;
      }
    }, 0);
  }
}, true);

function decrementButtonRequests(config: any) {
  if (config && config.triggerButton) {
    const btn = config.triggerButton;
    const activeRequests = Math.max(0, parseInt(btn.dataset.activeRequests || '0', 10) - 1);
    btn.dataset.activeRequests = activeRequests.toString();
    if (activeRequests === 0) {
      btn.disabled = false;
    }
  }
}

// Fix double /api/api/ prefix issue for raw axios requests (like in auth store)
axios.interceptors.request.use((config: any) => {
    if (config.url && config.url.includes('/api/api/')) {
        config.url = config.url.replace('/api/api/', '/api/');
    }

    const lastClickedButton = (window as any).lastClickedButton;
    if (lastClickedButton) {
        config.triggerButton = lastClickedButton;
        const activeRequests = parseInt(lastClickedButton.dataset.activeRequests || '0', 10) + 1;
        lastClickedButton.dataset.activeRequests = activeRequests.toString();
        lastClickedButton.disabled = true;
    }

    return config;
});

axios.interceptors.response.use(
    (response) => {
        decrementButtonRequests(response.config);
        return response;
    },
    (error) => {
        if (error.config) {
            decrementButtonRequests(error.config);
        }
        return Promise.reject(error);
    }
);

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

