<template>
  <main class="flex-1 flex flex-col min-w-0 p-margin-desktop bg-canvas min-h-screen">
    <div class="max-w-md mx-auto w-full">
      
      <header class="mb-6 text-center">
        <h1 class="font-h2 text-primary font-bold">Scan Attendance</h1>
        <p class="font-body-sm text-on-surface-variant mt-2">Point your camera at the instructor's screen to check in or out.</p>
      </header>

      <div class="bg-surface rounded-3xl shadow-elevated overflow-hidden border border-outline-variant/30 relative">
        
        <div v-if="attendanceStore.isProcessing" class="absolute inset-0 bg-surface/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
          <span class="material-symbols-outlined animate-spin text-primary text-[48px]">progress_activity</span>
          <p class="font-label text-primary mt-4 animate-pulse">Verifying...</p>
        </div>

        <div class="aspect-[3/4] bg-black relative">
          <qrcode-stream 
            v-if="!showSuccess"
            @detect="onDetect" 
            @error="onError"
            class="absolute inset-0 object-cover"
          ></qrcode-stream>
          
          <div v-if="!showSuccess" class="absolute inset-0 pointer-events-none border-[40px] border-black/40 flex items-center justify-center">
            <div class="w-full h-full border-2 border-dashed border-white/70 rounded-xl relative">
              <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
              <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
              <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
              <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <div v-if="showSuccess" class="bg-success-mist border border-success/20 rounded-xl p-6 text-center animate-fade-in">
          <span class="material-symbols-outlined text-success text-[48px] mb-2">check_circle</span>
          <h3 class="font-h3 text-success">
            {{ attendanceStore.lastScan?.status === 'left' ? 'Checked Out' : 'Checked In' }}
          </h3>
          <p class="font-body-sm text-on-surface-variant mt-1">{{ attendanceStore.lastScan?.message }}</p>
          <button @click="resetScanner" class="mt-4 px-6 py-2 bg-success text-white rounded-lg font-label w-full hover:bg-success/90 transition-colors">
            Scan Another
          </button>
        </div>

        <div v-if="errorMessage" class="bg-danger-mist border border-danger/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <span class="material-symbols-outlined text-danger shrink-0">error</span>
          <div>
            <h4 class="font-label text-danger">Scan Failed</h4>
            <p class="font-body-sm text-danger/80 mt-1">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import { useAttendanceStore } from '@/stores/attendance';

const attendanceStore = useAttendanceStore();

const showSuccess = ref(false);
const errorMessage = ref('');

// Triggered when a QR code is found in the video feed
const onDetect = async (detectedCodes) => {
  // vue-qrcode-reader returns an array of detected codes
  const rawValue = detectedCodes[0]?.rawValue;
  
  if (!rawValue || attendanceStore.isProcessing) return;

  errorMessage.value = '';
  
  try {
    await attendanceStore.submitScan(rawValue);
    showSuccess.value = true;
    
    // Optional: Use navigator.vibrate for tactile feedback on mobile
    if (navigator.vibrate) navigator.vibrate(200);
    
  } catch (error) {
    errorMessage.value = attendanceStore.lastScan?.message || "An unknown error occurred.";
  }
};

// Handle camera permission errors
const onError = (err) => {
  if (err.name === 'NotAllowedError') {
    errorMessage.value = "Camera permission denied. Please allow access to scan.";
  } else if (err.name === 'NotFoundError') {
    errorMessage.value = "No camera found on this device.";
  } else {
    errorMessage.value = "Camera error: " + err.message;
  }
};

const resetScanner = () => {
  showSuccess.value = false;
  errorMessage.value = '';
  attendanceStore.lastScan = null;
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>