<template>
  <div class="scanner-page">
    <!-- Header -->
    <header class="scanner-header">
      <div class="header-brand">
        <span class="material-symbols-outlined header-menu-icon" style="font-variation-settings: 'FILL' 0;">menu</span>
        <img src="@/assets/iti-logo.png" alt="ITI Logo" style="height: 24px; object-fit: contain;" />
      </div>
      <h1 class="header-title">Scan</h1>
      <span class="material-symbols-outlined header-notif-icon" style="font-variation-settings: 'FILL' 0;">notifications</span>
    </header>

    <!-- Main: camera + status card -->
    <main class="scanner-main">
      <!-- Camera area -->
      <div class="camera-area">
        <!-- Camera error state -->
        <div v-if="cameraError" class="camera-error">
          <span class="material-symbols-outlined camera-error__icon">no_photography</span>
          <p class="camera-error__text">Camera access required.<br/>Enable in browser settings or ask instructor.</p>
        </div>

        <!-- Canvas for jsQR processing (hidden) -->
        <canvas ref="canvasEl" class="canvas-hidden"></canvas>

        <!-- Visible video stream -->
        <video ref="displayVideoEl" class="camera-video" playsinline autoplay muted v-show="!cameraError"></video>

        <!-- Vignette overlay -->
        <div class="camera-vignette"></div>

        <!-- Scanning UI overlay — only when actively scanning -->
        <div class="scan-overlay" v-show="!cameraError && scanState === 'scanning'">
          <p class="scan-hint">Align QR code within the frame</p>
          <div class="scan-frame">
            <div class="scan-bracket scan-bracket--tl"></div>
            <div class="scan-bracket scan-bracket--tr"></div>
            <div class="scan-bracket scan-bracket--bl"></div>
            <div class="scan-bracket scan-bracket--br"></div>
            <div class="scan-line"></div>
          </div>
        </div>
      </div>

      <!-- Status card -->
      <div class="status-card">
        <!-- State: scanning -->
        <div v-if="scanState === 'scanning'" class="state-scanning">
          <span class="material-symbols-outlined state-scanning__icon">qr_code_scanner</span>
          <p class="state-scanning__text">Point your camera at the session QR code</p>
          <p v-if="loading" class="state-scanning__loading">Processing scan...</p>
        </div>

        <!-- State: checked-in -->
        <div v-else-if="scanState === 'checked-in'" class="state-result state-result--success">
          <div class="state-result__icon-wrap state-result__icon-wrap--success">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; font-size: 24px; color: #fff;">check</span>
          </div>
          <div class="state-result__body">
            <h3 class="state-result__title state-result__title--success">Checked In Successfully</h3>
            <p class="state-result__sub">{{ sessionInfo }}</p>
          </div>
        </div>

        <!-- State: checked-out -->
        <div v-else-if="scanState === 'checked-out'" class="state-result state-result--info">
          <div class="state-result__icon-wrap state-result__icon-wrap--info">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; font-size: 24px; color: #fff;">logout</span>
          </div>
          <div class="state-result__body">
            <h3 class="state-result__title state-result__title--info">Checked Out Successfully</h3>
            <p class="state-result__sub">{{ sessionInfo }}</p>
          </div>
        </div>

        <!-- State: duplicate -->
        <div v-else-if="scanState === 'duplicate'" class="state-result state-result--warning">
          <div class="state-result__icon-wrap state-result__icon-wrap--warning">
            <span class="material-symbols-outlined" style="font-size: 24px; color: #fff;">schedule</span>
          </div>
          <div class="state-result__body">
            <h3 class="state-result__title state-result__title--warning">Already Scanned</h3>
            <p class="state-result__sub">You've already checked out for this session.</p>
          </div>
        </div>

        <!-- State: expired -->
        <div v-else-if="scanState === 'expired'" class="state-result state-result--danger">
          <div class="state-result__icon-wrap state-result__icon-wrap--danger">
            <span class="material-symbols-outlined" style="font-size: 24px; color: #fff;">timer</span>
          </div>
          <div class="state-result__body">
            <h3 class="state-result__title state-result__title--danger">QR Code Expired</h3>
            <p class="state-result__sub">This QR code has expired. Ask your instructor to refresh it.</p>
          </div>
        </div>

        <!-- State: invalid -->
        <div v-else-if="scanState === 'invalid'" class="state-result state-result--danger">
          <div class="state-result__icon-wrap state-result__icon-wrap--danger">
            <span class="material-symbols-outlined" style="font-size: 24px; color: #fff;">error</span>
          </div>
          <div class="state-result__body">
            <h3 class="state-result__title state-result__title--danger">Invalid QR Code</h3>
            <p class="state-result__sub">This QR code is not recognised. Make sure you're scanning the session code.</p>
          </div>
        </div>

        <!-- State: wrong-day -->
        <div v-else-if="scanState === 'wrong-day'" class="state-result state-result--warning">
          <div class="state-result__icon-wrap state-result__icon-wrap--warning">
            <span class="material-symbols-outlined" style="font-size: 24px; color: #fff;">calendar_today</span>
          </div>
          <div class="state-result__body">
            <h3 class="state-result__title state-result__title--warning">Wrong Day</h3>
            <p class="state-result__sub">This session is not scheduled for today.</p>
          </div>
        </div>

        <!-- State: error -->
        <div v-else-if="scanState === 'error'" class="state-result state-result--danger">
          <div class="state-result__icon-wrap state-result__icon-wrap--danger">
            <span class="material-symbols-outlined" style="font-size: 24px; color: #fff;">warning</span>
          </div>
          <div class="state-result__body">
            <h3 class="state-result__title state-result__title--danger">Something Went Wrong</h3>
            <p class="state-result__sub">Check your connection and try again.</p>
          </div>
        </div>

        <!-- Scan again button — shown for all terminal states -->
        <button
          v-if="scanState !== 'scanning'"
          class="scan-again-btn"
          @click="resetAndScanAgain"
        >
          <span class="material-symbols-outlined">refresh</span>
          Scan Again
        </button>
      </div>
    </main>

    <!-- Bottom nav bar -->
    <nav class="bottom-nav">
      <router-link :to="{ name: 'dashboard.student' }" class="nav-item" active-class="nav-item--active">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">home</span>
        <span>Home</span>
      </router-link>
      <router-link to="/attendance/scan" class="nav-item" active-class="nav-item--active">
        <span class="material-symbols-outlined" :style="{ fontVariationSettings: $route.path === '/attendance/scan' ? '\'FILL\' 1' : '\'FILL\' 0' }">qr_code_scanner</span>
        <span>Scan</span>
      </router-link>
      <router-link :to="{ name: 'student-grade-card' }" class="nav-item" active-class="nav-item--active">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">conditions</span>
        <span>Grades</span>
      </router-link>
      <!-- TODO: no /profile route exists yet in the router — confirm with the
           owning member before this link goes live -->
      <router-link :to="{ name: 'dashboard.student' }" class="nav-item" active-class="nav-item--active">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">person</span>
        <span>Profile</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import jsQR from 'jsqr'
import { useAttendanceStore } from '@/stores/attendance'
import { useAuthStore } from '@/stores/auth'

const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

const displayVideoEl = ref(null)
const canvasEl = ref(null)
const cameraError = ref(false)

const scanState = computed(() => attendanceStore.scanState)
const loading = computed(() => attendanceStore.loading)
const lastScanResult = computed(() => attendanceStore.lastScanResult)

const sessionInfo = computed(() => {
  if (!lastScanResult.value?.session) return ''
  const session = lastScanResult.value.session
  // Assuming session object might have name, date, etc. Formatting depending on exact response
  return `${session.title || 'Session'} · ${new Date(session.date || Date.now()).toLocaleDateString()}`
})

let stream = null
let requestAnimationId = null

const startCamera = async () => {
  try {
    cameraError.value = false
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("navigator.mediaDevices.getUserMedia is undefined. Ensure you are using HTTPS or localhost.")
    }
    
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
    } catch (envError) {
      console.warn("Failed to initialize camera with environment facingMode constraint:", envError)
      stream = await navigator.mediaDevices.getUserMedia({
        video: true
      })
    }
    
    if (displayVideoEl.value) {
      displayVideoEl.value.srcObject = stream
      displayVideoEl.value.setAttribute('playsinline', 'true')
      await displayVideoEl.value.play()
      requestAnimationId = requestAnimationFrame(tick)
    }
  } catch (error) {
    console.error("Camera start up error details:", error)
    cameraError.value = true
  }
}

const stopCamera = () => {
  if (requestAnimationId) {
    cancelAnimationFrame(requestAnimationId)
    requestAnimationId = null
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
}

const tick = () => {
  // Always reschedule if camera is active but scanning is paused (loading or non-scanning state)
  if (!displayVideoEl.value || !canvasEl.value || cameraError.value) {
    return
  }

  // If a scan is in-flight or we're in a result state, keep the loop alive but skip processing
  if (attendanceStore.scanState !== 'scanning' || attendanceStore.loading) {
    requestAnimationId = requestAnimationFrame(tick)
    return
  }

  const video = displayVideoEl.value
  const canvas = canvasEl.value
  
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.height = video.videoHeight
    canvas.width = video.videoWidth
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code && code.data) {
        handleScan(code.data)
        // Resume camera scanning tick even after triggering handleScan
        // so it can recover if the user clicks "Scan Again"
        requestAnimationId = requestAnimationFrame(tick)
        return
      }
    }
  }
  
  requestAnimationId = requestAnimationFrame(tick)
}

const handleScan = async (qrValue) => {
  const studentId = authStore.user?.student_id
  await attendanceStore.submitScan(qrValue, studentId)
  // If the scan resulted in an error state or success, we stay in that state.
  // The UI will show the "Scan Again" button which resets the store state.
}

const resetAndScanAgain = () => {
  attendanceStore.resetScan()
  // Resume camera scanning tick
  requestAnimationId = requestAnimationFrame(tick)
}

onMounted(() => {
  attendanceStore.resetScan()
  startCamera()
})

onUnmounted(() => {
  stopCamera()
  attendanceStore.resetScan()
})
</script>

<style scoped>
/* ── Page shell ─────────────────────────────────────────────────────── */
.scanner-page {
  position: relative;
  max-width: 390px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #000;
  border-left: 1px solid #e0bfbc;
  border-right: 1px solid #e0bfbc;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.scanner-header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 390px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  z-index: 50;
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-menu-icon {
  color: #8B1A1A;
  font-size: 24px;
}
.header-logo {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: 18px;
  color: #8B1A1A;
}
.header-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #251817;
  margin: 0;
}
.header-notif-icon {
  color: #6B7280;
  font-size: 24px;
  cursor: pointer;
}

/* ── Main ───────────────────────────────────────────────────────────── */
.scanner-main {
  flex: 1;
  padding-top: 56px;
  padding-bottom: 72px;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ── Camera area ────────────────────────────────────────────────────── */
.camera-area {
  position: relative;
  height: 65%;
  width: 100%;
  background: #1a1a1a;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.canvas-hidden {
  display: none;
}
.camera-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}
.camera-vignette {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  pointer-events: none;
}
.camera-error {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: #fff;
}
.camera-error__icon {
  font-size: 32px;
  color: #DC2626;
  margin-bottom: 8px;
}
.camera-error__text {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

/* ── Scan overlay ────────────────────────────────────────────────────── */
.scan-overlay {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.scan-hint {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 16px;
  border-radius: 999px;
  margin-bottom: 24px;
  backdrop-filter: blur(4px);
}
.scan-frame {
  position: relative;
  width: 240px;
  height: 240px;
}
.scan-bracket {
  position: absolute;
  width: 32px;
  height: 32px;
  border-color: #8B1A1A;
  border-style: solid;
}
.scan-bracket--tl { top: 0; left: 0; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
.scan-bracket--tr { top: 0; right: 0; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
.scan-bracket--bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
.scan-bracket--br { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: #8B1A1A;
  box-shadow: 0 0 8px rgba(139, 26, 26, 0.8);
  animation: scan 2s ease-in-out infinite;
}
@keyframes scan {
  0%, 100% { top: 20%; }
  50% { top: 80%; }
}

/* ── Status card ─────────────────────────────────────────────────────── */
.status-card {
  height: 35%;
  width: 100%;
  background: #fff;
  border-radius: 24px 24px 0 0;
  margin-top: -24px;
  position: relative;
  z-index: 20;
  padding: 32px 24px 24px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
}

/* Scanning state */
.state-scanning {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.7;
}
.state-scanning__icon {
  font-size: 40px;
  color: #6B7280;
}
.state-scanning__text {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  color: #6B7280;
  margin: 8px 0 0;
}
.state-scanning__loading {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  color: #8B1A1A;
  margin: 4px 0 0;
}

/* Result states */
.state-result {
  width: 100%;
  max-width: 320px;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}
.state-result--success { background: #ECFDF5; border: 1px solid rgba(5, 150, 105, 0.2); }
.state-result--info    { background: #EFF6FF; border: 1px solid rgba(37, 99, 235, 0.2); }
.state-result--warning { background: #FFFBEB; border: 1px solid rgba(217, 119, 6, 0.2); }
.state-result--danger  { background: #FEF2F2; border: 1px solid rgba(220, 38, 38, 0.2); }

.state-result__icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.state-result__icon-wrap--success { background: #059669; }
.state-result__icon-wrap--info    { background: #2563EB; }
.state-result__icon-wrap--warning { background: #D97706; }
.state-result__icon-wrap--danger  { background: #DC2626; }

.state-result__body { flex: 1; }
.state-result__title {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
}
.state-result__title--success { color: #059669; }
.state-result__title--info    { color: #2563EB; }
.state-result__title--warning { color: #D97706; }
.state-result__title--danger  { color: #DC2626; }
.state-result__sub {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  color: #6B7280;
  margin: 0;
}

/* Scan again button */
.scan-again-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #8B1A1A;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.scan-again-btn:hover {
  background: #6B1212;
}
.scan-again-btn .material-symbols-outlined {
  font-size: 18px;
}

/* ── Bottom nav ─────────────────────────────────────────────────────── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 390px;
  height: 72px;
  background: #fff;
  border-top: 1px solid #e0bfbc;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  z-index: 50;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6B7280;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 11px;
}
.nav-item .material-symbols-outlined {
  font-size: 22px;
}
.nav-item--active {
  color: #8B1A1A;
}
</style>
