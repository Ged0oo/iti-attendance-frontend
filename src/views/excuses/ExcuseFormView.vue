<template>
  <main class="flex-1 flex flex-col min-w-0 p-margin-desktop bg-canvas min-h-screen">
    <div class="max-w-2xl mx-auto w-full">
      
      <header class="mb-8">
        <button @click="router.back()" class="flex items-center text-on-surface-variant hover:text-primary transition-colors mb-4 font-label">
          <span class="material-symbols-outlined text-[20px] mr-1">arrow_back</span>
          Back to Ledger
        </button>
        <h1 class="font-h2 text-primary font-bold">Submit Excuse Request</h1>
        <p class="font-body-sm text-on-surface-variant mt-2">Upload official documentation to reclaim points for an unexcused absence.</p>
      </header>

      <div class="bg-surface rounded-2xl shadow-elevated border border-outline-variant/30 p-6 md:p-8">
        
        <div v-if="successMessage" class="bg-success-mist border border-success/20 rounded-xl p-6 text-center mb-6">
          <span class="material-symbols-outlined text-success text-[48px] mb-2">check_circle</span>
          <h3 class="font-h3 text-success">Request Submitted</h3>
          <p class="font-body-sm text-on-surface-variant mt-1">{{ successMessage }}</p>
          <button @click="router.push('/attendance/ledger')" class="mt-4 px-6 py-2 bg-success text-white rounded-lg font-label shadow-sm hover:bg-success/90 transition-colors">
            Return to Dashboard
          </button>
        </div>

        <form v-else @submit.prevent="submitExcuse" class="space-y-6">
          
          <div v-if="errorMessage" class="bg-danger-mist border border-danger/20 text-danger px-4 py-3 rounded-lg font-body-sm flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">error</span>
            {{ errorMessage }}
          </div>

          <div>
            <label for="absence" class="block font-label text-on-surface mb-1">Select Absence to Excuse <span class="text-danger">*</span></label>
            <select id="absence" v-model="form.attendance_record_id" required :disabled="eligibleAbsences.length === 0"
              class="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-body-md outline-none disabled:opacity-50 disabled:bg-surface-variant">
              
              <option value="" disabled>
                {{ eligibleAbsences.length === 0 ? 'No eligible absences found' : 'Select a missed session...' }}
              </option>
              
                <option v-for="entry in eligibleAbsences" :key="entry.id" :value="entry.attendance_record_id">
                {{ new Date(entry.created_at).toLocaleDateString() }} — {{ entry.reason }}
                </option>

            </select>
            <p v-if="eligibleAbsences.length === 0" class="text-on-surface-variant font-body-sm mt-1">You currently have no unexcused absences to dispute.</p>
          </div>

          <div>
            <label for="reason" class="block font-label text-on-surface mb-1">Detailed Reason <span class="text-danger">*</span></label>
            <textarea id="reason" v-model="form.reason" rows="4" required
              class="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-body-md outline-none resize-none"
              placeholder="Briefly explain why you were unable to attend..."></textarea>
          </div>

          <div>
            <label class="block font-label text-on-surface mb-1">Supporting Document <span class="text-danger">*</span></label>
            <div 
              class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center"
              :class="file ? 'border-primary bg-primary-mist/30' : 'border-outline-variant hover:border-primary hover:bg-surface-variant/30'"
            >
              <input type="file" @change="handleFileUpload" accept=".pdf,.jpg,.jpeg,.png" required
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              
              <div v-if="!file" class="pointer-events-none">
                <span class="material-symbols-outlined text-[40px] text-on-surface-variant mb-2">upload_file</span>
                <p class="font-label text-on-surface">Click or drag file to upload</p>
                <p class="font-body-sm text-on-surface-variant mt-1">PDF, JPG, or PNG (Max 1MB)</p>
              </div>
              
              <div v-else class="pointer-events-none flex flex-col items-center">
                <span class="material-symbols-outlined text-[40px] text-success mb-2">task</span>
                <p class="font-label text-on-surface">{{ file.name }}</p>
                <p class="font-body-sm text-on-surface-variant mt-1">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</p>
                <button type="button" @click.stop.prevent="file = null" class="mt-3 text-danger font-label hover:underline pointer-events-auto">
                  Remove File
                </button>
              </div>
            </div>
          </div>

          <div class="pt-4">
            <button type="submit" :disabled="isSubmitting || eligibleAbsences.length === 0"
              class="w-full h-[52px] bg-primary text-white font-label rounded-lg shadow-soft hover:bg-primary-deep transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]">
              <span v-if="isSubmitting" class="material-symbols-outlined animate-spin">progress_activity</span>
              <span v-else class="material-symbols-outlined">send</span>
              {{ isSubmitting ? 'Submitting...' : 'Submit Excuse' }}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import { useLedgerStore } from '@/stores/ledger';
import { useAuthStore } from '@/stores/auth'; // Added to ensure auth is ready

const router = useRouter();
const ledgerStore = useLedgerStore();
const authStore = useAuthStore();

const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const file = ref(null);

const form = reactive({
  attendance_record_id: '',
  reason: ''
});

// The strict computed property
const eligibleAbsences = computed(() => {
  // Trap 1: What does the store actually have?
  console.log("1. Ledger History in Store:", ledgerStore.history);

  if (!ledgerStore.history || !Array.isArray(ledgerStore.history)) {
    console.log("2. History is empty or not an array.");
    return [];
  }

  const filtered = ledgerStore.history.filter(entry => {
    // Strictly check against the 'delta' key from your live DB
    return Number(entry.delta) === -25; 
  });

  // Trap 2: Did the filter work?
  console.log("3. Filtered Eligible Absences:", filtered);
  return filtered;
});

onMounted(async () => {
  // Aggressively force a fresh fetch every time the component mounts
  console.log("0. Component mounted. Fetching ledger data...");
  await ledgerStore.fetchLedgerData();
});

const handleFileUpload = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    if (selectedFile.size > 1 * 1024 * 1024) {
      errorMessage.value = "File exceeds the 1MB limit. Please compress it and try again.";
      file.value = null;
      event.target.value = ''; 
      return;
    }
    file.value = selectedFile;
    errorMessage.value = '';
  }
};

const submitExcuse = async () => {
  if (!file.value) {
    errorMessage.value = "Please upload a supporting document.";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  const formData = new FormData();
  formData.append('attendance_record_id', form.attendance_record_id);
  formData.append('reason', form.reason);
  formData.append('attachment', file.value);

  try {
    await api.post('/excuse-requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    successMessage.value = "Your excuse has been successfully forwarded to the branch manager for review.";
    await ledgerStore.fetchLedgerData();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to submit excuse. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.shadow-elevated {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
}
.shadow-soft {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}
</style>