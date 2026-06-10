<template>
  <div class="h-screen bg-black flex flex-col relative max-w-[390px] mx-auto overflow-hidden">
    <div class="relative h-[65%] w-full bg-on-background overflow-hidden flex items-center justify-center">
      
      <div id="qr-reader" class="w-full h-full object-cover"></div>
      
      <div v-if="attendanceStore.scanStatus !== 'success'" class="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <p class="font-body-sm text-surface mb-6 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
          Align QR code within the frame
        </p>
        <div class="relative w-64 h-64">
          <div class="scanner-bracket bracket-tl"></div>
          <div class="scanner-bracket bracket-tr"></div>
          <div class="scanner-bracket bracket-bl"></div>
          <div class="scanner-bracket bracket-br"></div>
          <div class="absolute left-0 right-0 h-0.5 bg-primary-container shadow-[0_0_8px_rgba(139,26,26,0.8)] animate-scan"></div>
        </div>
      </div>
    </div>

    <div class="h-[35%] w-full bg-surface rounded-t-3xl -mt-6 relative z-20 px-6 py-8 shadow-elevated flex flex-col items-center justify-center">
      
      <div v-if="attendanceStore.scanStatus === 'idle' || attendanceStore.scanStatus === 'scanning'" class="text-center">
        <h3 class="font-h3 text-on-surface">Ready to Scan</h3>
        <p class="font-body-sm text-on-surface-variant mt-1">Point your camera at the instructor's screen.</p>
      </div>

      <div v-else-if="attendanceStore.scanStatus === 'success'" class="w-full max-w-sm bg-success-mist border border-success/20 rounded-xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
        <div class="relative">
          <div class="w-12 h-12 bg-success rounded-full flex items-center justify-center relative z-10 shadow-md">
            <span class="material-symbols-outlined text-surface">check</span>
          </div>
        </div>
        <div>
          <h3 class="font-h3 text-success">Checked in at {{ attendanceStore.lastScanData?.timestamp }}</h3>
          <p class="font-body-sm text-on-surface-variant mt-1">Status: {{ attendanceStore.lastScanData?.status }}</p>
        </div>
      </div>

      <div v-else-if="attendanceStore.scanStatus === 'error'" class="w-full max-w-sm bg-danger-mist border border-danger/20 rounded-xl p-5 shadow-sm flex items-center gap-4">
         <div class="w-12 h-12 bg-danger rounded-full flex items-center justify-center shadow-md">
            <span class="material-symbols-outlined text-surface">error</span>
          </div>
        <div>
          <h3 class="font-h3 text-danger">Scan Failed</h3>
          <p class="font-body-sm text-on-surface-variant mt-1">{{ attendanceStore.scanError }}</p>
        </div>
        <button @click="resetScanner" class="absolute top-2 right-2 text-on-surface-variant hover:text-danger">
            <span class="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAttendanceStore } from '@/stores/attendance';

const attendanceStore = useAttendanceStore();
let html5QrcodeScanner = null;

onMounted(() => {
  // Initialize the scanner
  html5QrcodeScanner = new Html5QrcodeScanner(
    "qr-reader",
    { fps: 10, qrbox: { width: 250, height: 250 } },
    /* verbose= */ false
  );
  
  html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});

onUnmounted(() => {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear().catch(error => console.error("Failed to clear scanner", error));
  }
});

async function onScanSuccess(decodedText) {
  // Prevent multiple scans while processing
  if (attendanceStore.scanStatus === 'scanning' || attendanceStore.scanStatus === 'success') return;
  
  // Pause the scanner visually while processing
  html5QrcodeScanner.pause();
  
  await attendanceStore.scanQrCode(decodedText);
}

function onScanFailure(error) {
  // html5-qrcode throws errors constantly when it doesn't see a QR code. 
  // We ignore these to prevent console spam.
}

function resetScanner() {
    attendanceStore.scanStatus = 'idle';
    if(html5QrcodeScanner) html5QrcodeScanner.resume();
}
</script>

<style scoped>
.scanner-bracket { position: absolute; width: 40px; height: 40px; border-color: #8B1A1A; }
.bracket-tl { top: 0; left: 0; border-top: 4px solid; border-left: 4px solid; border-top-left-radius: 8px; }
.bracket-tr { top: 0; right: 0; border-top: 4px solid; border-right: 4px solid; border-top-right-radius: 8px; }
.bracket-bl { bottom: 0; left: 0; border-bottom: 4px solid; border-left: 4px solid; border-bottom-left-radius: 8px; }
.bracket-br { bottom: 0; right: 0; border-bottom: 4px solid; border-right: 4px solid; border-bottom-right-radius: 8px; }

@keyframes scan { 0% { top: 5%; } 50% { top: 95%; } 100% { top: 5%; } }
.animate-scan { animation: scan 2s ease-in-out infinite; }
</style>