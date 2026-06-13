<template>
  <main class="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop bg-canvas min-h-screen">
    <div class="max-w-6xl mx-auto space-y-8">

      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="font-h2 text-primary font-bold">Pending Excuse Requests</h1>
          <p class="font-body-sm text-on-surface-variant mt-2">
            Review and resolve student absences. Approvals automatically refund 20 ledger points.
          </p>
        </div>

        <div class="flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
          <span class="material-symbols-outlined text-warning">pending_actions</span>
          <span class="font-label text-on-surface">{{ pendingExcuses.length }} Pending</span>
        </div>
      </header>

      <div v-if="loading" class="flex justify-center py-12">
        <span class="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
      </div>

      <div v-else-if="pendingExcuses.length === 0" class="bg-surface rounded-2xl p-12 text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-outline-variant/30">
        <span class="material-symbols-outlined text-[64px] text-success-mist/80 mb-4 block">task_alt</span>
        <h3 class="font-h3 text-on-surface">All Caught Up!</h3>
        <p class="font-body-md text-on-surface-variant mt-2">There are no pending excuse requests to review at this time.</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          v-for="excuse in pendingExcuses"
          :key="excuse.id"
          class="bg-surface rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden flex flex-col"
        >
          <div class="p-6 border-b border-outline-variant/30 flex justify-between items-start bg-surface-sunken">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-primary-mist flex items-center justify-center text-primary font-h3 font-bold uppercase shrink-0">
                {{ getInitials(excuse.student?.name || 'S') }}
              </div>
              <div>
                <h3 class="font-label text-on-surface">{{ excuse.student?.name || 'Unknown Student' }}</h3>
                <p class="font-mono text-[12px] text-on-surface-variant mt-1">{{ excuse.student?.email }}</p>
              </div>
            </div>
            <span class="text-[12px] font-mono text-on-surface-variant bg-surface px-2 py-1 rounded shadow-sm border border-outline-variant/50">
              {{ formatDate(excuse.created_at) }}
            </span>
          </div>

          <div class="p-6 flex-1 space-y-4">
            <div>
              <span class="font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px] mb-2 block">Student's Reason</span>
              <p class="font-body-md text-on-surface bg-canvas p-4 rounded-lg border border-outline-variant/20 italic">
                "{{ excuse.notes }}"
              </p>
            </div>

            <div v-if="excuse.attachment_path">
              <span class="font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px] mb-2 block">Supporting Document</span>
              <a
                :href="getStorageUrl(excuse.attachment_path)"
                target="_blank"
                class="inline-flex items-center gap-2 px-4 py-2 bg-surface-variant/30 hover:bg-primary-mist/30 text-primary border border-primary/20 rounded-lg transition-colors font-label text-[14px]"
              >
                <span class="material-symbols-outlined text-[18px]">description</span>
                View Attachment
                <span class="material-symbols-outlined text-[16px] ml-1">open_in_new</span>
              </a>
            </div>
          </div>

          <div class="p-4 bg-surface-sunken border-t border-outline-variant/30 flex gap-3">
            <button
              @click="reviewExcuse(excuse.id, 'rejected')"
              :disabled="isProcessing === excuse.id"
              class="flex-1 py-2.5 rounded-lg border border-danger/30 text-danger font-label hover:bg-danger-mist transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              @click="reviewExcuse(excuse.id, 'approved')"
              :disabled="isProcessing === excuse.id"
              class="flex-1 py-2.5 rounded-lg bg-success text-white font-label shadow-sm hover:bg-success/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              <span v-if="isProcessing === excuse.id" class="material-symbols-outlined animate-spin text-[18px]">sync</span>
              <span v-else class="material-symbols-outlined text-[18px]">check_circle</span>
              Approve (+20 pts)
            </button>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const pendingExcuses = ref([])
const loading = ref(true)
const isProcessing = ref(null)

const STORAGE_BASE_URL = 'http://13.60.179.178/storage'

const fetchPendingExcuses = async () => {
  loading.value = true
  try {
    const response = await api.get('/excuse-requests')
    pendingExcuses.value = response.data.data || response.data
  } catch (error) {
    console.error('Failed to fetch excuses:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPendingExcuses()
})

const reviewExcuse = async (id, decision) => {
  isProcessing.value = id
  try {
    await api.patch(`/excuse-requests/${id}/review`, { decision })
    pendingExcuses.value = pendingExcuses.value.filter(excuse => excuse.id !== id)
  } catch (error) {
    console.error(`Failed to ${decision} excuse:`, error)
  } finally {
    isProcessing.value = null
  }
}

const getStorageUrl = (path) => {
  if (!path) return '#'
  return `${STORAGE_BASE_URL}/${path}`
}

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(date)
}
</script>
