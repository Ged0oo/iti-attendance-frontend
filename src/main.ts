import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'

// Fix double /api/api/ prefix issue for raw axios requests (like in auth store)
axios.interceptors.request.use((config) => {
    if (config.url && config.url.includes('/api/api/')) {
        config.url = config.url.replace('/api/api/', '/api/');
    }
    return config;
});

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

