import { defineStore } from 'pinia'
import api from '../services/api'

// Scheduling + billing domain: courses, grade components, instructors,
// lab groups, engagements, sessions and the billing rollup.
export const useEngagementStore = defineStore('engagement', {
  state: () => ({
    cohorts: [],
    courses: [],
    gradeComponents: [],
    instructors: [],
    labGroups: [],
    engagements: [],
    sessions: [],
    billingRecords: [],
    billingSummary: null,
    loading: false,
    error: null,
  }),

  actions: {
    // small wrapper so every call shares loading + error handling
    async _run(work) {
      this.loading = true
      this.error = null
      try {
        return await work()
      } catch (e) {
        this.error = e.response?.data?.message || e.message || 'Something went wrong'
        throw e
      } finally {
        this.loading = false
      }
    },

    // list endpoints are paginated; pull every page (also fine for plain arrays)
    async _all(url, params = {}) {
      const out = []
      let page = 1
      let last = 1
      do {
        const { data } = await api.get(url, { params: { ...params, page } })
        out.push(...(data.data ?? data ?? []))
        last = data.last_page ?? data.meta?.last_page ?? page
        page += 1
      } while (page <= last)
      return out
    },

    // cached: the cohort list is shared across all three screens, so only fetch once
    fetchCohorts(force = false) {
      if (!force && this.cohorts.length) return Promise.resolve(this.cohorts)
      return this._run(async () => {
        this.cohorts = await this._all('/api/cohorts')
        return this.cohorts
      })
    },

    // --- Courses ---
    fetchCourses(cohortId) {
      return this._run(async () => {
        this.courses = await this._all(`/api/cohorts/${cohortId}/courses`)
        return this.courses
      })
    },
    createCourse(payload) {
      return this._run(async () => {
        const { data } = await api.post('/api/courses', payload)
        this.courses.unshift(data.data)
        return data.data
      })
    },
    updateCourse(id, payload) {
      return this._run(async () => {
        const { data } = await api.put(`/api/courses/${id}`, payload)
        const i = this.courses.findIndex((c) => c.id === id)
        if (i !== -1) this.courses[i] = data.data
        return data.data
      })
    },
    deleteCourse(id) {
      return this._run(async () => {
        await api.delete(`/api/courses/${id}`)
        this.courses = this.courses.filter((c) => c.id !== id)
      })
    },

    // --- Grade components ---
    fetchComponents(courseId) {
      return this._run(async () => {
        this.gradeComponents = await this._all(`/api/courses/${courseId}/components`)
        return this.gradeComponents
      })
    },
    createComponent(payload) {
      return this._run(async () => {
        const { data } = await api.post('/api/grade-components', payload)
        this.gradeComponents.push(data.data)
        return data.data
      })
    },
    deleteComponent(id) {
      return this._run(async () => {
        await api.delete(`/api/grade-components/${id}`)
        this.gradeComponents = this.gradeComponents.filter((c) => c.id !== id)
      })
    },

    // --- Instructors ---
    fetchInstructors() {
      return this._run(async () => {
        this.instructors = await this._all('/api/instructors')
        return this.instructors
      })
    },
    createInstructor(payload) {
      return this._run(async () => {
        const { data } = await api.post('/api/instructors', payload)
        this.instructors.unshift(data.data)
        return data.data
      })
    },

    // --- Lab groups ---
    fetchLabGroups(cohortId) {
      return this._run(async () => {
        this.labGroups = await this._all(`/api/cohorts/${cohortId}/lab-groups`)
        return this.labGroups
      })
    },
    createLabGroup(payload) {
      return this._run(async () => {
        const { data } = await api.post('/api/lab-groups', payload)
        this.labGroups.unshift(data.data)
        return data.data
      })
    },

    // --- Engagements ---
    fetchEngagements(cohortId) {
      return this._run(async () => {
        this.engagements = await this._all(`/api/cohorts/${cohortId}/engagements`)
        return this.engagements
      })
    },
    createEngagement(payload) {
      return this._run(async () => {
        const { data } = await api.post('/api/engagements', payload)
        this.engagements.unshift(data.data)
        return data.data
      })
    },
    updateEngagement(id, payload) {
      return this._run(async () => {
        const { data } = await api.put(`/api/engagements/${id}`, payload)
        const i = this.engagements.findIndex((e) => e.id === id)
        if (i !== -1) this.engagements[i] = data.data
        return data.data
      })
    },

    // --- Sessions ---
    fetchSessions(engagementId) {
      return this._run(async () => {
        this.sessions = await this._all(`/api/engagements/${engagementId}/sessions`)
        return this.sessions
      })
    },
    generateSessions(engagementId, payload) {
      return this._run(async () => {
        const { data } = await api.post(`/api/engagements/${engagementId}/sessions/generate`, payload)
        this.sessions = data.data ?? data
        return this.sessions
      })
    },
    deliverSession(id) {
      return this._run(async () => {
        const { data } = await api.patch(`/api/sessions/${id}/deliver`)
        const i = this.sessions.findIndex((s) => s.id === id)
        if (i !== -1) this.sessions[i] = data.data
        return data.data
      })
    },

    // --- Billing ---
    fetchBilling(cohortId) {
      return this._run(async () => {
        const { data } = await api.get('/api/billing', { params: { cohort_id: cohortId } })
        this.billingRecords = data.data ?? []
        this.billingSummary = data.summary ?? null
        return data
      })
    },
    calculateBilling(payload) {
      return this._run(async () => {
        const { data } = await api.post('/api/billing/calculate', payload)
        this.billingRecords = data.data ?? []
        return this.billingRecords
      })
    },
    finalizeBilling(id) {
      return this._run(async () => {
        const { data } = await api.patch(`/api/billing/${id}/finalize`)
        const i = this.billingRecords.findIndex((b) => b.id === id)
        if (i !== -1) this.billingRecords[i] = data.data
        return data.data
      })
    },
  },
})
