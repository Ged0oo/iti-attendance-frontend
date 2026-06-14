<template>
  <MainLayout title="Submit Excuse">
    <div class="flex flex-col items-center sm:items-start sm:p-4">

      <div v-if="toastError" class="fixed top-6 left-1/2 -translate-x-1/2 bg-danger text-white px-6 py-3 rounded-lg flex items-center gap-3 font-body-md text-sm font-medium z-[100] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] animate-slideDown" role="alert">
        <span class="material-symbols-outlined">error</span>
        <span>{{ toastError }}</span>
      </div>

      <div v-if="!excuseStore.submitted" class="w-full max-w-[580px] rounded-[20px] p-10 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] bg-white border border-outline-variant mb-10">
        <div class="mb-8">
          <h2 class="font-h1 text-[28px] font-normal text-on-surface tracking-[-0.01em] m-0 mb-2">Submit an Excuse Request</h2>
          <p class="font-body-md text-sm text-secondary m-0">Your Track Admin will review within 24 hours</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">

          <div class="flex flex-col gap-2">
            <label for="missed-session" class="font-body-md text-[13px] font-medium tracking-[0.01em] text-on-surface">Missed Session</label>
            <div class="relative">
              <select
                id="missed-session"
                v-model="form.attendance_record_id"
                class="w-full h-11 rounded-lg border border-outline bg-white px-4 font-body-md text-sm text-on-surface appearance-none transition-all duration-200 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.12]"
                :class="{ '!border-danger focus:!ring-danger/[0.12]': excuseStore.fieldErrors.attendance_record_id }"
              >
                <option value="" disabled selected>Select a session</option>
                <option
                  v-for="item in availableItems"
                  :key="item.attendance_record_id"
                  :value="item.attendance_record_id"
                >
                  {{ item.label }}
                </option>
              </select>
              <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
            <p v-if="excuseStore.fieldErrors.attendance_record_id" class="font-body-md text-xs text-danger m-0">
              {{ excuseStore.fieldErrors.attendance_record_id[0] }}
            </p>
            <p v-if="availableItems.length === 0 && !loadingData" class="font-body-md text-xs text-on-surface-variant m-0 mt-1">
              No unexcused past sessions found.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <label for="reason" class="font-body-md text-[13px] font-medium tracking-[0.01em] text-on-surface">Reason for Absence</label>
            <textarea
              id="reason"
              v-model="form.reason"
              rows="4"
              class="w-full rounded-lg border border-outline bg-white p-4 font-body-md text-sm text-on-surface resize-none transition-all duration-200 placeholder:text-outline focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.12]"
              :class="{ '!border-danger focus:!ring-danger/[0.12]': excuseStore.fieldErrors.reason || reasonLength > 200 }"
              placeholder="Briefly describe why you were absent..."
            ></textarea>
            <div class="flex justify-end items-start mt-1">
              <p v-if="excuseStore.fieldErrors.reason" class="font-body-md text-xs text-danger m-0 flex-1">
                {{ excuseStore.fieldErrors.reason[0] }}
              </p>
              <span class="font-mono text-xs text-secondary" :class="{ '!text-danger !font-medium': reasonLength > 190 }">
                {{ reasonLength }}/200
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="font-body-md text-[13px] font-medium tracking-[0.01em] text-on-surface">Supporting Document (optional)</label>
            <ExcuseUploadZone
              v-model="form.attachment"
              @validation-error="handleValidationError"
            />
            <p v-if="excuseStore.fieldErrors.attachment" class="font-body-md text-xs text-danger m-0">
              {{ excuseStore.fieldErrors.attachment[0] }}
            </p>
          </div>

          <button
            type="submit"
            class="w-full h-[52px] bg-primary text-white border-none rounded-lg font-body-md text-[13px] font-medium tracking-[0.01em] cursor-pointer flex items-center justify-center gap-2 mt-8 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-primary-deep hover:shadow-[0_4px_14px_0_rgba(139,26,26,0.25)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="excuseStore.submitting || !isFormValid"
          >
            <template v-if="excuseStore.submitting">
              <span class="w-[18px] h-[18px] border-2 border-white/30 rounded-full border-t-white animate-spin"></span>
              Submitting...
            </template>
            <template v-else>
              Submit Request
            </template>
          </button>

        </form>
      </div>

      <div v-else class="w-full max-w-[580px] rounded-[20px] p-10 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] bg-success-mist border border-[#A7F3D0] flex flex-col items-center text-center">
        <div class="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-success text-[32px]" style="font-variation-settings: 'FILL' 1">check_circle</span>
        </div>

        <h3 class="font-body-md text-xl font-semibold text-on-surface m-0 mb-2">Excuse Submitted Successfully</h3>

        <div class="bg-white/50 border border-success/20 rounded-lg px-6 py-4 w-full mb-6">
          <p class="font-body-md text-[13px] font-medium tracking-[0.01em] text-on-surface m-0 mb-1">{{ submittedSessionLabel }}</p>
          <p class="font-body-md text-xs text-success m-0">Expected response within 24 hours.</p>
        </div>

        <button class="inline-flex items-center gap-2 font-body-md text-[13px] font-medium tracking-[0.01em] text-on-surface-variant bg-transparent border-none cursor-pointer p-0 transition-colors hover:text-on-surface" @click="goBack">
          <span class="material-symbols-outlined text-lg">arrow_back</span>
          Back to Ledger
        </button>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExcuseStore } from '@/stores/excuse'
import api from '@/services/api'
import MainLayout from '@/components/layout/MainLayout.vue'
import ExcuseUploadZone from '@/components/attendance/ExcuseUploadZone.vue'

const router = useRouter()
const authStore = useAuthStore()
const excuseStore = useExcuseStore()

const form = ref({
  attendance_record_id: '',
  reason: '',
  attachment: null
})

const reasonLength = computed(() => form.value.reason.length)
const isFormValid = computed(() => {
  return form.value.attendance_record_id &&
         form.value.reason.length >= 10 &&
         form.value.reason.length <= 200
})

const availableItems = ref([])
const loadingData = ref(true)
const toastError = ref('')

const submittedSessionLabel = computed(() => {
  const item = availableItems.value.find(i => String(i.attendance_record_id) === String(form.value.attendance_record_id))
  return item ? item.label : 'Session'
})

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchMe()
  }
  const studentId = authStore.user?.student_id

  try {
    // Fetch ledger entries (absences) and already-submitted excuses in parallel
    const [entriesRes] = await Promise.all([
      api.get(`/students/${studentId}/ledger/entries`),
      excuseStore.fetchExcuseRequests()
    ])

    const entries = entriesRes.data?.data ?? entriesRes.data ?? []

    // Already-excused record IDs — don't show them again
    const excusedRecordIds = new Set(
      excuseStore.excuseRequests.map((e) => String(e.attendance_record_id))
    )

    // Each ledger entry with a negative delta IS an absence
    // The entry already carries the attendance_record_id we need to submit
    const options = entries
      .filter((entry) => {
        if (!entry.attendance_record_id) return false          // must have a record
        if (Number(entry.delta) >= 0) return false             // skip bonus/neutral entries
        if (excusedRecordIds.has(String(entry.attendance_record_id))) return false  // already excused
        return true
      })
      .map((entry) => {
        const dateStr = formatDate(entry.created_at)
        // Strip the em-dash prefix the backend adds, e.g. "Unexcused Absence — Tinker Test"
        const reasonShort = (entry.reason || 'Absence').replace(/^Unexcused Absence\s*[—–-]+\s*/i, '').trim() || 'Absence'
        return {
          label: `${dateStr} — ${reasonShort} (record #${entry.attendance_record_id})`,
          attendance_record_id: String(entry.attendance_record_id)
        }
      })

    availableItems.value = options

  } catch {
    showToast('Failed to load sessions. Please try again later.')
  } finally {
    loadingData.value = false
  }
})

onUnmounted(() => {
  excuseStore.reset()
})

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function handleValidationError(message) {
  showToast(message)
}

function showToast(message) {
  toastError.value = message
  setTimeout(() => {
    toastError.value = ''
  }, 4000)
}

async function handleSubmit() {
  if (!isFormValid.value) return

  try {
    await excuseStore.submitExcuse({
      attendance_record_id: form.value.attendance_record_id,
      reason: form.value.reason,
      attachment: form.value.attachment
    })
  } catch (err) {
    if (!err.response || err.response.status !== 422) {
      showToast('An error occurred while submitting your request.')
    }
  }
}

function goBack() {
  router.push({ name: 'student-ledger' })
}
</script>
