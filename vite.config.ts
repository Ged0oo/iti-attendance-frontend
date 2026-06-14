import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'https://13.60.179.178',
                changeOrigin: true,
                secure: false,      // Accept self-signed / untrusted backend cert
                // No rewrite needed — backend expects /api/... paths
            }
        },
        watch: {
            ignored: [
                '**/node_modules/**',
                '**/dist/**',
                '**/.git/**',
                '**/storage/**',
            ]
        }
    }
})
