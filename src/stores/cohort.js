import { defineStore } from 'pinia'
import api from '../services/api'

export const useCohortStore = defineStore('cohort', {
  state: () => ({
    tracks: [],
    cohorts: [],
    announcements: [],
    loading: false,
  }),

  actions: {

    async fetchTracks() {
      this.loading = true
      const { data } = await api.get('/api/tracks')
      this.tracks = data
      this.loading = false
    },

    async createTrack(payload) {
      const { data } = await api.post('/api/tracks', payload)
      this.tracks.push(data)
      return data
    },

    async updateTrack(id, payload) {
      const { data } = await api.put(`/api/tracks/${id}`, payload)
      const idx = this.tracks.findIndex((t) => t.id === id)
      if (idx !== -1) this.tracks[idx] = data
      return data
    },

    async deleteTrack(id) {
      await api.delete(`/api/tracks/${id}`)
      this.tracks = this.tracks.filter((t) => t.id !== id)
    },


    async fetchTrackAdmins(trackId) {
      const { data } = await api.get(`/api/tracks/${trackId}/admins`)
      return data
    },

    async assignTrackAdmin(trackId, userId) {
      const { data } = await api.post(`/api/tracks/${trackId}/admins`, { user_id: userId })
      return data
    },

    async removeTrackAdmin(trackId, userId) {
      await api.delete(`/api/tracks/${trackId}/admins/${userId}`)
    },


    async fetchCohorts() {
      this.loading = true
      const { data } = await api.get('/api/cohorts')
      this.cohorts = data
      this.loading = false
    },

    async createCohort(payload) {
      const { data } = await api.post('/api/cohorts', payload)
      this.cohorts.push(data)
      return data
    },

    async updateCohort(id, payload) {
      const { data } = await api.put(`/api/cohorts/${id}`, payload)
      const idx = this.cohorts.findIndex((c) => c.id === id)
      if (idx !== -1) this.cohorts[idx] = data
      return data
    },

    async deleteCohort(id) {
      await api.delete(`/api/cohorts/${id}`)
      this.cohorts = this.cohorts.filter((c) => c.id !== id)
    },

    async transitionCohort(id, status) {
      const { data } = await api.patch(`/api/cohorts/${id}/transition`, { status })
      const idx = this.cohorts.findIndex((c) => c.id === id)
      if (idx !== -1) this.cohorts[idx] = data
      return data
    },


    async fetchAnnouncements(cohortId) {
      this.loading = true
      const { data } = await api.get(`/api/cohorts/${cohortId}/announcements`)
      this.announcements = data
      this.loading = false
    },

    async createAnnouncement(payload) {
      const { data } = await api.post('/api/announcements', payload)
      this.announcements.unshift(data)
      return data
    },

    async updateAnnouncement(id, payload) {
      const { data } = await api.put(`/api/announcements/${id}`, payload)
      const idx = this.announcements.findIndex((a) => a.id === id)
      if (idx !== -1) this.announcements[idx] = data
      return data
    },

    async deleteAnnouncement(id) {
      await api.delete(`/api/announcements/${id}`)
      this.announcements = this.announcements.filter((a) => a.id !== id)
    },

    async fetchCourses(cohortId) {
      const { data } = await api.get(`/api/cohorts/${cohortId}/courses`)
      return data.data ?? data
    },

    async fetchCourseComponents(courseId) {
      const { data } = await api.get(`/api/courses/${courseId}/components`)
      return data.data ?? data
    },

    async fetchStudents(cohortId) {
      const { data } = await api.get(`/api/cohorts/${cohortId}/students`)
      return data.data ?? data
    },

    async fetchAtRiskStudents() {
      const { data } = await api.get('/api/students/at-risk')
      return data.data ?? data
    },

    async fetchBilling() {
      const { data } = await api.get('/api/billing')
      return data.data ?? data
    },
  },
})
