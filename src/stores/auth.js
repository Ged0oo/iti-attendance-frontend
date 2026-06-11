import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')),
    token: localStorage.getItem('auth_token'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
  },

  actions: {
    async login(email, password) {
      const { data } = await api.post('/api/login', { email, password })
      this.token = data.token
      this.user = data.user
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    },

    async fetchUser() {
      const { data } = await api.get('/api/me')
      this.user = data
      localStorage.setItem('user', JSON.stringify(data))
    },

    async logout() {
      try {
        await api.post('/api/logout')
      } catch (e) {
      
      }
      this.token = null
      this.user = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    },
  },
})
