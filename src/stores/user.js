import { defineStore } from 'pinia'
import api from '@/services/api'

export const useUserStore = defineStore('user', {
    state: () => ({
        users: [],
        meta: { total: 0, lastPage: 1, currentPage: 1 },
        loading: false,
        error: null,
    }),

    actions: {
        async fetchUsers(params = {}) {
            this.loading = true
            this.error = null
            try {
                const { data } = await api.get('/users', { params })
                this.users = data.data ?? data
                this.meta = {
                    total: data.total ?? 0,
                    lastPage: data.last_page ?? 1,
                    currentPage: data.current_page ?? 1,
                }
            } catch (e) {
                this.error = e.response?.data?.message || 'Failed to load users'
                throw e
            } finally {
                this.loading = false
            }
        },

        async createUser(payload) {
            const { data } = await api.post('/users', payload)
            this.users.unshift(data.user)
            this.meta.total += 1
            return data.user
        },

        async updateUser(id, payload) {
            const { data } = await api.patch(`/users/${id}`, payload)
            const idx = this.users.findIndex((u) => u.id === id)

            if (idx !== -1) {
                this.users[idx] = { ...this.users[idx], ...data.user }
            }

            return data.user
        },
    },
})