<template>
  <main class="flex-1 flex flex-col min-w-0 bg-canvas min-h-screen items-center justify-center p-4 md:p-8">
    
    <div v-if="loading" class="flex flex-col items-center justify-center">
      <span class="material-symbols-outlined animate-spin text-primary text-[64px]">progress_activity</span>
      <p class="font-h3 mt-4 text-on-surface-variant animate-pulse">Generating Secure QR Code...</p>
    </div>

    <div v-else-if="errorMessage" class="bg-danger-mist border border-danger/20 rounded-2xl p-8 max-w-lg text-center shadow-elevated">
      <span class="material-symbols-outlined text-danger text-[64px] mb-4 block">error</span>
      <h2 class="font-h2 text-danger">Failed to Load Session</h2>
      <p class="font-body-md text-on-surface-variant mt-2">{{ errorMessage }}</p>
      <button @click="router.push('/dashboard')" class="mt-6 px-6 py-3 bg-surface border border-outline-variant rounded-lg font-label hover:bg-surface-variant/50 transition-colors">
        Return to Dashboard
      </button>
    </div>

    <div v-else class="w-full max-w-3xl bg-surface rounded-[2rem] shadow-elevated border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row">
      
      <div class="bg-primary-mist/30 p-8 md:p-12 md:w-2/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-outline-variant/30">
        <span class="inline-block px-3 py-1 bg-primary/10 text-primary font-label-caps text-[12px] rounded-full w-fit mb-4 uppercase tracking-wider">
          Active Session
        </span>
        <h1 class="font-h2 text-on-surface mb-2 leading-tight">{{ sessionDetails?.course_name || 'Loading Course...' }}</h1>
        <p class="font-body-lg text-on-surface-variant mb-6">{{ sessionDetails?.type || 'Lecture' }}</p>
        
        <div class="space-y-4 font-body-md text-on-surface">
          <div class="flex items-center gap-3 bg-surface p-3 rounded-xl shadow-soft">
            <span class="material-symbols-outlined text-primary">calendar_today</span>
            {{ formatDate(sessionDetails?.date) }}
          </div>
          <div class="flex items-center gap-3 bg-surface p-3 rounded-xl shadow-soft">
            <span class="material-symbols-outlined text-primary">schedule</span>
            {{ formatTime(sessionDetails?.start_time) }} - {{ formatTime(sessionDetails?.end_time) }}
          </div>
        </div>
      </div>

      <div class="p-8 md:p-16 flex flex-col items-center justify-center flex-1 bg-white">
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/20 mb-6 relative group">
          <qrcode-vue 
            :value="qrString" 
            :size="300" 
            level="H" 
            render-as="svg"
            class="transition-transform duration-300 group-hover:scale-105"
          />
          
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="bg-white p-1 rounded-full">
              <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold font-mono text-sm">
                ITI
              </div>
            </div>
          </div>
        </div>

        <p class="font-label text-on-surface-variant text-center max-w-xs">
          Open your ITI Student App and scan this code to register your attendance.
        </p>

        <button @click="fetchQrCode" class="mt-8 flex items-center gap-2 text-primary font-label hover:text-primary-deep transition-colors">
          <span class="material-symbols-outlined text-[20px]">refresh</span>
          Refresh QR Code
        </button>
      </div>
    </div>

  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import QrcodeVue from 'qrcode.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const errorMessage = ref('');
const qrString = ref('');
const sessionDetails = ref(null);

const sessionId = route.params.id;

const fetchQrCode = async () => {
  loading.value = true;
  errorMessage.value = '';
  
  try {
    const qrResponse = await api.get(`/sessions/${sessionId}/qr-code`);
    
    console.log("Backend QR Response:", qrResponse.data);
    const payload = qrResponse.data.data || qrResponse.data;
    
    qrString.value = payload.qr_payload || payload.qr_code || (typeof payload === 'string' ? payload : 'INVALID_QR_PAYLOAD');

    const sessionResponse = await api.get(`/sessions/${sessionId}`);
    sessionDetails.value = sessionResponse.data.data || sessionResponse.data;

  } catch (error) {
    console.error("Failed to load QR code:", error);
    errorMessage.value = error.response?.data?.message || "Could not retrieve session data.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!sessionId) {
    errorMessage.value = "No session ID provided.";
    loading.value = false;
    return;
  }
  fetchQrCode();
});

const formatDate = (dateStr) => {
  if (!dateStr) return 'Today';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  const [hours, minutes] = timeStr.split(':');
  const d = new Date();
  d.setHours(hours, minutes);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
</script>