<template>
  <div class="bg-[#0D0505] min-h-screen flex flex-col items-center justify-center relative font-body-md">
    <main class="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto p-8 relative z-10">
      
      <div class="text-center mb-12 space-y-4">
        <h1 class="font-h1 text-[48px] tracking-tight leading-tight text-white drop-shadow-md">
          Laravel Basics — Lab Session
        </h1>
        <p class="font-mono text-[20px] text-gray-400">
          Jun 2, 2026 · 09:00 - 13:00
        </p>
      </div>

      <div class="relative flex flex-col items-center">
        <div class="relative bg-white rounded-xl p-4 mb-8">
          <div class="absolute inset-[-6px] rounded-2xl border-[6px] border-primary-container animate-pulse-border z-0"></div>
          
          <div class="w-[380px] h-[380px] bg-white flex items-center justify-center relative z-10 rounded-lg shadow-inner">
            <div v-if="loading" class="text-primary font-bold text-xl animate-pulse">
              Generating Secure Token...
            </div>
            <qrcode-vue 
              v-else-if="qrPayload"
              :value="qrPayload" 
              :size="340" 
              level="H" 
              render-as="svg"
            />
          </div>
        </div>

        <div class="flex items-center space-x-6 text-white text-xl">
          <span class="font-medium tracking-wide">Scan to check in · Valid for {{ validSeconds }}s</span>
          <div class="relative w-16 h-16 flex items-center justify-center">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="45" stroke="#2D1515" stroke-width="8"></circle>
              <circle 
                class="timer-ring" 
                cx="50" cy="50" fill="none" r="45" 
                stroke="#A82020" stroke-linecap="round" stroke-width="8"
                :style="{ animationDuration: `${validSeconds}s` }"
                :key="qrPayload" 
              ></circle>
            </svg>
            <span class="font-mono font-bold text-2xl z-10">{{ countdown }}</span>
          </div>
        </div>
      </div>
    </main>

    <footer class="w-full h-24 bg-[#140A0A] border-t border-[#2D1515] flex items-center justify-between px-12 z-20">
      <div class="flex items-center space-x-3 text-white font-mono text-[28px] font-bold">
        <span class="material-symbols-outlined text-success text-4xl">check_circle</span>
        <span>{{ checkedInCount }} / 24 <span class="font-body-md text-[20px] font-normal text-gray-400 ml-2">checked in</span></span>
      </div>
      <span class="bg-engagement-lab text-white font-bold text-lg px-6 py-2 rounded-full uppercase tracking-wider">
        Lab
      </span>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import axios from 'axios';

const API_URL = 'http://13.60.179.178/api';
const TOKEN = '31|loQlk5mlGuzdSq00qcYuPNMZMyAn3DkInSGydvjh9e36a4a2';

const qrPayload = ref('');
const loading = ref(true);
const validSeconds = ref(15);
const countdown = ref(15);
const checkedInCount = ref(0);

let intervalId = null;
let countdownId = null;

const fetchNewQrCode = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_URL}/sessions/1/qr-code`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    qrPayload.value = response.data.qr_payload;
    validSeconds.value = response.data.expires_in;
    countdown.value = response.data.expires_in;
    
    // Optional: Fetch current attendance count to update the footer
    const attResponse = await axios.get(`${API_URL}/sessions/1/attendance`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
    }
    });
    checkedInCount.value = attResponse.data.length;

  } catch (error) {
    console.error("Failed to fetch QR", error);
  } finally {
    loading.value = false;
  }
};

const startRotation = () => {
  fetchNewQrCode();
  
  // Timer for the visual countdown number
  countdownId = setInterval(() => {
    if (countdown.value > 0) countdown.value--;
  }, 1000);

  // Interval to fetch a new code right as the old one expires
  intervalId = setInterval(() => {
    fetchNewQrCode();
  }, validSeconds.value * 1000);
};

onMounted(() => {
  startRotation();
});

onUnmounted(() => {
  clearInterval(intervalId);
  clearInterval(countdownId);
});
</script>

<style scoped>
.timer-ring {
  stroke-dasharray: 283;
  stroke-dashoffset: 283;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  animation-name: countdown;
  animation-timing-function: linear;
}

@keyframes countdown {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: 283; }
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 20px rgba(139, 26, 26, 0.3); }
  50% { box-shadow: 0 0 60px rgba(139, 26, 26, 0.8); }
  100% { box-shadow: 0 0 20px rgba(139, 26, 26, 0.3); }
}
.animate-pulse-border {
  animation: pulse-border 2s infinite ease-in-out;
}
</style>