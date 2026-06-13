<template>
  <div class="excuse-view">
    
    <!-- Toast Error Banner -->
    <div v-if="toastError" class="toast-error" role="alert">
      <span class="material-symbols-outlined">error</span>
      <span>{{ toastError }}</span>
    </div>

    <!-- STATE 1: Form -->
    <div v-if="!excuseStore.submitted" class="card form-card">
      <div class="card-header">
        <h2 class="title">Submit an Excuse Request</h2>
        <p class="subtitle">Your Track Admin will review within 24 hours</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        
        <!-- Missed Session Dropdown -->
        <div class="form-group">
          <label for="missed-session" class="form-label">Missed Session</label>
          <div class="select-wrapper">
            <select
              id="missed-session"
              v-model="form.attendance_record_id"
              class="form-select"
              :class="{ 'has-error': excuseStore.fieldErrors.attendance_record_id }"
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
            <span class="material-symbols-outlined select-icon">expand_more</span>
          </div>
          <p v-if="excuseStore.fieldErrors.attendance_record_id" class="error-text">
            {{ excuseStore.fieldErrors.attendance_record_id[0] }}
          </p>
          <p v-if="availableItems.length === 0 && !loadingData" class="helper-text">
            No unexcused past sessions found.
          </p>
        </div>

        <!-- Reason Textarea -->
        <div class="form-group">
          <label for="reason" class="form-label">Reason for Absence</label>
          <textarea
            id="reason"
            v-model="form.reason"
            rows="4"
            class="form-textarea"
            :class="{ 'has-error': excuseStore.fieldErrors.reason || reasonLength > 200 }"
            placeholder="Briefly describe why you were absent..."
          ></textarea>
          <div class="textarea-footer">
            <p v-if="excuseStore.fieldErrors.reason" class="error-text">
              {{ excuseStore.fieldErrors.reason[0] }}
            </p>
            <div class="spacer"></div>
            <span class="char-counter" :class="{ 'is-over-limit': reasonLength > 190 }">
              {{ reasonLength }}/200
            </span>
          </div>
        </div>

        <!-- Upload Zone -->
        <div class="form-group">
          <label class="form-label">Supporting Document (optional)</label>
          <ExcuseUploadZone 
            v-model="form.attachment"
            @validation-error="handleValidationError"
          />
          <p v-if="excuseStore.fieldErrors.attachment" class="error-text">
            {{ excuseStore.fieldErrors.attachment[0] }}
          </p>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="submit-btn" 
          :disabled="excuseStore.submitting || !isFormValid"
        >
          <template v-if="excuseStore.submitting">
            <span class="spinner"></span>
            Submitting...
          </template>
          <template v-else>
            Submit Request
          </template>
        </button>

      </form>
    </div>

    <!-- STATE 2: Success -->
    <div v-else class="card success-card">
      <div class="success-icon-wrapper">
        <span class="material-symbols-outlined success-icon" style="font-variation-settings: 'FILL' 1;">check_circle</span>
      </div>
      
      <h3 class="success-title">Excuse Submitted Successfully</h3>
      
      <div class="success-details">
        <p class="session-name">{{ submittedSessionLabel }}</p>
        <p class="expected-response">Expected response within 24 hours.</p>
      </div>
      
      <button class="back-link" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span>
        Back to Ledger
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useExcuseStore } from '@/stores/excuse';
import api from '@/services/api';
import ExcuseUploadZone from '@/components/attendance/ExcuseUploadZone.vue';

const router = useRouter();
const authStore = useAuthStore();
const excuseStore = useExcuseStore();

const form = ref({
  attendance_record_id: '',
  reason: '',
  attachment: null
});

const reasonLength = computed(() => form.value.reason.length);
const isFormValid = computed(() => {
  return form.value.attendance_record_id && 
         form.value.reason.length >= 10 && 
         form.value.reason.length <= 200;
});

// Data state
const availableItems = ref([]);
const loadingData = ref(true);
const toastError = ref('');

// To show which session was just submitted
const submittedSessionLabel = computed(() => {
  const item = availableItems.value.find(i => String(i.attendance_record_id) === String(form.value.attendance_record_id));
  return item ? item.label : 'Session';
});

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchMe();
  }
  const studentId = authStore.studentId;

  try {
    // 1. Fetch past sessions
    const sessionsRes = await api.get('/sessions');
    const allSessions = sessionsRes.data?.data ?? sessionsRes.data ?? [];
    
    const pastSessions = allSessions.filter((s) => {
      const d = s.date ?? s.starts_at;
      return d && new Date(d) < new Date();
    });

    // 2. Fetch student's existing excuse requests
    await excuseStore.fetchExcuseRequests();
    const excusedRecordIds = excuseStore.excuseRequests.map((e) => String(e['attendance_record_id']));

    // 3. Fetch student's ledger entries
    const entriesRes = await api.get(`/students/${studentId}/ledger/entries`);
    const entries = entriesRes.data?.data ?? entriesRes.data ?? [];

    // Build dropdown options
    const options = (pastSessions.map((session) => {
      const entry = entries.find((e) => 
        e.attendance_record?.session_id === session.id ||
        e.session_id === session.id
      );
      
      if (!entry) return null;
      
      const recordId = entry.attendance_record_id ?? entry.attendance_record?.id;
      if (!recordId) return null;
      
      const recordIdStr = String(recordId);
      if (excusedRecordIds.includes(recordIdStr)) return null;

      const dateStr = formatDate(session.date ?? session.starts_at);
      const typeStr = session.type ?? session.engagement?.type ?? 'Session';
      
      return {
        label: `${dateStr} — ${typeStr}`,
        attendance_record_id: recordIdStr
      };
    }).filter(Boolean));

    availableItems.value = options;

  } catch {
    showToast('Failed to load sessions. Please try again later.');
  } finally {
    loadingData.value = false;
  }
});

onUnmounted(() => {
  excuseStore.reset();
});

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function handleValidationError(message) {
  showToast(message);
}

function showToast(message) {
  toastError.value = message;
  setTimeout(() => {
    toastError.value = '';
  }, 4000);
}

async function handleSubmit() {
  if (!isFormValid.value) return;

  try {
    await excuseStore.submitExcuse({
      attendance_record_id: form.value.attendance_record_id,
      reason: form.value.reason,
      attachment: form.value.attachment
    });
    
  } catch (err) {
    // Network errors or non-422 errors
    if (!err.response || err.response.status !== 422) {
      showToast('An error occurred while submitting your request.');
    }
  }
}

function goBack() {
  router.push({ name: 'LedgerBalance' });
}
</script>

<style scoped>
.excuse-view {
  min-height: calc(100vh - 64px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ── Card Container ── */
.card {
  width: 100%;
  max-width: 580px;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: box-shadow 0.3s ease;
}

@media (max-width: 640px) {
  .excuse-view {
    padding: 16px;
    align-items: flex-start;
  }
  .card {
    padding: 24px;
  }
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.form-card {
  background-color: #FFFFFF;
  border: 1px solid #e0bfbc; /* outline-variant */
  margin-bottom: 40px;
}

/* ── Form Header ── */
.card-header {
  margin-bottom: 32px;
}

.title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  color: #1A1A2E; /* on-surface */
  letter-spacing: -0.01em;
  margin: 0 0 8px 0;
}

.subtitle {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  color: #715858; /* secondary */
  margin: 0;
}

/* ── Form Fields ── */
.space-y-6 > * + * {
  margin-top: 24px;
}

/* Spacer utility */
.spacer {
  flex: 1;
}

/* Helper text below empty dropdown */
.helper-text {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 12px;
  color: #6B7280;
  margin: 4px 0 0 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #1A1A2E;
}

/* Select */
.select-wrapper {
  position: relative;
}

.form-select {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  border: 1px solid #8c716e; /* outline */
  background-color: #FFFFFF;
  padding: 0 16px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  color: #1A1A2E;
  appearance: none;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #690008; /* primary */
  box-shadow: 0 0 0 3px rgba(139, 26, 26, 0.12);
}

.form-select.has-error {
  border-color: #ba1a1a; /* error */
}

.form-select.has-error:focus {
  box-shadow: 0 0 0 3px rgba(186, 26, 26, 0.12);
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8c716e;
  pointer-events: none;
}

/* Textarea */
.form-textarea {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #8c716e;
  background-color: #FFFFFF;
  padding: 16px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  color: #1A1A2E;
  resize: none;
  transition: all 0.2s ease;
}

.form-textarea::placeholder {
  color: #8c716e;
}

.form-textarea:focus {
  outline: none;
  border-color: #690008;
  box-shadow: 0 0 0 3px rgba(139, 26, 26, 0.12);
}

.form-textarea.has-error {
  border-color: #ba1a1a;
}

.form-textarea.has-error:focus {
  box-shadow: 0 0 0 3px rgba(186, 26, 26, 0.12);
}

.textarea-footer {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  margin-top: 4px;
}

.char-counter {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: #715858;
}

.char-counter.is-over-limit {
  color: #DC2626;
  font-weight: 500;
}

.error-text {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 12px;
  color: #ba1a1a;
  margin: 0;
}

/* ── Submit Button ── */
.submit-btn {
  width: 100%;
  height: 52px;
  background-color: #8b1a1a; /* primary-container */
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.submit-btn:hover:not(:disabled) {
  background-color: #6B1212; /* primary-deep */
  box-shadow: 0 4px 14px 0 rgba(139, 26, 26, 0.25);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Toast Error ── */
.toast-error {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ba1a1a;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  z-index: 100;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { transform: translate(-50%, -100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

/* ── Success State ── */
.success-card {
  background-color: #ECFDF5; /* success-mist */
  border: 1px solid #A7F3D0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.success-icon-wrapper {
  width: 64px;
  height: 64px;
  background-color: rgba(5, 150, 105, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.success-icon {
  color: #059669; /* success */
  font-size: 32px;
}

.success-title {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 8px 0;
}

.success-details {
  background-color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(5, 150, 105, 0.2);
  border-radius: 8px;
  padding: 16px 24px;
  width: 100%;
  margin-bottom: 24px;
}

.session-name {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #1A1A2E;
  margin: 0 0 4px 0;
}

.expected-response {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 12px;
  color: #059669;
  margin: 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #6B7280; /* role-student */
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0;
}

.back-link:hover {
  color: #1A1A2E;
}

.back-link .material-symbols-outlined {
  font-size: 18px;
}
</style>
