<template>
  <div v-if="!isMobile" class="min-h-screen flex items-center justify-center bg-canvas p-6">
    <div class="flex flex-col items-center text-center bg-white rounded-[20px] p-14 sm:p-12 max-w-[440px] w-full shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.06)] border border-black/[0.06]">
      <span class="material-symbols-outlined text-[52px] text-primary mb-5 opacity-85" style="font-variation-settings: 'FILL' 0, 'wght' 200">smartphone</span>
      <h2 class="font-h1 text-[28px] font-normal text-on-surface m-0 mb-3 tracking-[-0.01em]">Mobile Only</h2>
      <p class="font-body-md text-[15px] leading-[1.65] text-on-surface-variant m-0 mb-8">
        QR attendance scanning requires a mobile device with a camera.
        Open this page on your phone to check in.
      </p>
      <router-link :to="{ name: 'dashboard.student' }" class="inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-lg no-underline font-body-md text-[13px] font-medium tracking-[0.01em] transition-colors hover:bg-primary-deep">
        <span class="material-symbols-outlined text-base">arrow_back</span>
        Back to Dashboard
      </router-link>
    </div>
  </div>

  <div v-else class="relative max-w-[390px] mx-auto h-screen flex flex-col overflow-hidden bg-black border-x border-outline-variant">
    <header class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-14 flex items-center justify-between px-4 bg-white z-50">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-2xl" style="font-variation-settings: 'FILL' 0">menu</span>
        <img src="@/assets/iti-logo.png" alt="ITI Logo" class="h-6 object-contain" />
      </div>
      <h1 class="absolute left-1/2 -translate-x-1/2 font-body-md text-base font-semibold text-on-surface m-0">Scan</h1>
      <span class="material-symbols-outlined text-on-surface-variant text-2xl cursor-pointer" style="font-variation-settings: 'FILL' 0">notifications</span>
    </header>

    <main class="flex-1 pt-14 pb-[72px] flex flex-col relative">
      <div class="relative h-[65%] w-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
        <div v-if="cameraError" class="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center p-6 text-center text-white">
          <span class="material-symbols-outlined text-[32px] text-danger mb-2">no_photography</span>
          <p class="font-body-md text-sm leading-[1.5] m-0">Camera access required.<br/>Enable in browser settings or ask instructor.</p>
        </div>

        <canvas ref="canvasEl" class="hidden"></canvas>
        <video ref="displayVideoEl" class="absolute inset-0 w-full h-full object-cover opacity-85" playsinline autoplay muted v-show="!cameraError"></video>
        <div class="absolute inset-0 bg-black/35 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col items-center" v-show="!cameraError && scanState === 'scanning'">
          <p class="font-body-md text-[13px] text-white bg-black/50 px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">Align QR code within the frame</p>
          <div class="relative w-60 h-60">
            <div class="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary rounded-tl"></div>
            <div class="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary rounded-tr"></div>
            <div class="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary rounded-bl"></div>
            <div class="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary rounded-br"></div>
            <div class="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(139,26,26,0.8)] animate-qrscan"></div>
          </div>
        </div>
      </div>

      <div class="h-[35%] w-full bg-white rounded-t-3xl -mt-6 relative z-20 px-6 pt-8 pb-6 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center text-center gap-4">
        <div v-if="scanState === 'scanning'" class="flex flex-col items-center opacity-70">
          <span class="material-symbols-outlined text-[40px] text-on-surface-variant">qr_code_scanner</span>
          <p class="font-body-md text-sm text-on-surface-variant mt-2 m-0">Point your camera at the session QR code</p>
          <p v-if="loading" class="font-body-md text-[13px] text-primary mt-1 m-0">Processing scan...</p>
        </div>

        <div v-else-if="scanState === 'checked-in'" class="w-full max-w-[320px] rounded-xl px-5 py-4 flex items-center gap-4 text-left bg-success-mist border border-success/20">
          <div class="w-11 h-11 rounded-full shrink-0 flex items-center justify-center bg-success">
            <span class="material-symbols-outlined text-white text-2xl" style="font-variation-settings: 'FILL' 1">check</span>
          </div>
          <div class="flex-1">
            <h3 class="font-body-md text-[15px] font-semibold text-success m-0 mb-1">Checked In Successfully</h3>
            <p class="font-body-md text-[13px] text-on-surface-variant m-0">{{ sessionInfo }}</p>
          </div>
        </div>

        <div v-else-if="scanState === 'checked-out'" class="w-full max-w-[320px] rounded-xl px-5 py-4 flex items-center gap-4 text-left bg-info-mist border border-info/20">
          <div class="w-11 h-11 rounded-full shrink-0 flex items-center justify-center bg-info">
            <span class="material-symbols-outlined text-white text-2xl" style="font-variation-settings: 'FILL' 1">logout</span>
          </div>
          <div class="flex-1">
            <h3 class="font-body-md text-[15px] font-semibold text-info m-0 mb-1">Checked Out Successfully</h3>
            <p class="font-body-md text-[13px] text-on-surface-variant m-0">{{ sessionInfo }}</p>
          </div>
        </div>

        <div v-else-if="scanState === 'duplicate'" class="w-full max-w-[320px] rounded-xl px-5 py-4 flex items-center gap-4 text-left bg-warning-mist border border-warning/20">
          <div class="w-11 h-11 rounded-full shrink-0 flex items-center justify-center bg-warning">
            <span class="material-symbols-outlined text-white text-2xl">schedule</span>
          </div>
          <div class="flex-1">
            <h3 class="font-body-md text-[15px] font-semibold text-warning m-0 mb-1">Already Scanned</h3>
            <p class="font-body-md text-[13px] text-on-surface-variant m-0">You've already checked out for this session.</p>
          </div>
        </div>

        <div v-else-if="scanState === 'expired'" class="w-full max-w-[320px] rounded-xl px-5 py-4 flex items-center gap-4 text-left bg-danger-mist border border-danger/20">
          <div class="w-11 h-11 rounded-full shrink-0 flex items-center justify-center bg-danger">
            <span class="material-symbols-outlined text-white text-2xl">timer</span>
          </div>
          <div class="flex-1">
            <h3 class="font-body-md text-[15px] font-semibold text-danger m-0 mb-1">QR Code Expired</h3>
            <p class="font-body-md text-[13px] text-on-surface-variant m-0">This QR code has expired. Ask your instructor to refresh it.</p>
          </div>
        </div>

        <div v-else-if="scanState === 'invalid'" class="w-full max-w-[320px] rounded-xl px-5 py-4 flex items-center gap-4 text-left bg-danger-mist border border-danger/20">
          <div class="w-11 h-11 rounded-full shrink-0 flex items-center justify-center bg-danger">
            <span class="material-symbols-outlined text-white text-2xl">error</span>
          </div>
          <div class="flex-1">
            <h3 class="font-body-md text-[15px] font-semibold text-danger m-0 mb-1">Invalid QR Code</h3>
            <p class="font-body-md text-[13px] text-on-surface-variant m-0">This QR code is not recognised. Make sure you're scanning the session code.</p>
          </div>
        </div>

        <div v-else-if="scanState === 'wrong-day'" class="w-full max-w-[320px] rounded-xl px-5 py-4 flex items-center gap-4 text-left bg-warning-mist border border-warning/20">
          <div class="w-11 h-11 rounded-full shrink-0 flex items-center justify-center bg-warning">
            <span class="material-symbols-outlined text-white text-2xl">calendar_today</span>
          </div>
          <div class="flex-1">
            <h3 class="font-body-md text-[15px] font-semibold text-warning m-0 mb-1">Wrong Day</h3>
            <p class="font-body-md text-[13px] text-on-surface-variant m-0">This session is not scheduled for today.</p>
          </div>
        </div>

        <div v-else-if="scanState === 'error'" class="w-full max-w-[320px] rounded-xl px-5 py-4 flex items-center gap-4 text-left bg-danger-mist border border-danger/20">
          <div class="w-11 h-11 rounded-full shrink-0 flex items-center justify-center bg-danger">
            <span class="material-symbols-outlined text-white text-2xl">warning</span>
          </div>
          <div class="flex-1">
            <h3 class="font-body-md text-[15px] font-semibold text-danger m-0 mb-1">Something Went Wrong</h3>
            <p class="font-body-md text-[13px] text-on-surface-variant m-0">Check your connection and try again.</p>
          </div>
        </div>

        <button
          v-if="scanState !== 'scanning'"
          class="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white border-none rounded-lg font-body-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-deep"
          @click="resetAndScanAgain"
        >
          <span class="material-symbols-outlined text-lg">refresh</span>
          Scan Again
        </button>
      </div>
    </main>

    <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-[72px] bg-white border-t border-outline-variant flex items-center justify-around px-2 z-50">
      <router-link :to="{ name: 'dashboard.student' }" class="flex flex-col items-center gap-0.5 px-4 py-2 bg-transparent border-none cursor-pointer text-on-surface-variant font-body-md text-[11px] no-underline" active-class="!text-primary">
        <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 0">home</span>
        <span>Home</span>
      </router-link>
      <router-link to="/attendance/scan" class="flex flex-col items-center gap-0.5 px-4 py-2 bg-transparent border-none cursor-pointer text-on-surface-variant font-body-md text-[11px] no-underline" active-class="!text-primary">
        <span class="material-symbols-outlined text-[22px]" :style="{ fontVariationSettings: $route.path === '/attendance/scan' ? '\'FILL\' 1' : '\'FILL\' 0' }">qr_code_scanner</span>
        <span>Scan</span>
      </router-link>
      <router-link :to="{ name: 'student-grade-card' }" class="flex flex-col items-center gap-0.5 px-4 py-2 bg-transparent border-none cursor-pointer text-on-surface-variant font-body-md text-[11px] no-underline" active-class="!text-primary">
        <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 0">conditions</span>
        <span>Grades</span>
      </router-link>
      <router-link :to="{ name: 'dashboard.student' }" class="flex flex-col items-center gap-0.5 px-4 py-2 bg-transparent border-none cursor-pointer text-on-surface-variant font-body-md text-[11px] no-underline" active-class="!text-primary">
        <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 0">person</span>
        <span>Profile</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import jsQR from 'jsqr'
import { useAttendanceStore } from '@/stores/attendance'
import { useAuthStore } from '@/stores/auth'

const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

const isMobile = ref(true)

function detectMobile() {
  const uaTouch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0
  const narrowScreen = window.innerWidth < 1024
  return uaTouch || (hasTouch && narrowScreen)
}

const displayVideoEl = ref(null)
const canvasEl = ref(null)
const cameraError = ref(false)

const scanState = computed(() => attendanceStore.scanState)
const loading = computed(() => attendanceStore.loading)
const lastScanResult = computed(() => attendanceStore.lastScanResult)

const sessionInfo = computed(() => {
  if (!lastScanResult.value?.session) return ''
  const session = lastScanResult.value.session
  return `${session.title || 'Session'} · ${new Date(session.date || Date.now()).toLocaleDateString()}`
})

let stream = null
let requestAnimationId = null

const startCamera = async () => {
  try {
    cameraError.value = false

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("navigator.mediaDevices.getUserMedia is undefined.")
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
    } catch (envError) {
      console.warn("Failed with environment facingMode:", envError)
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
    console.error("Camera error:", error)
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
  if (!displayVideoEl.value || !canvasEl.value || cameraError.value) {
    return
  }

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
}

const resetAndScanAgain = () => {
  attendanceStore.resetScan()
  if (requestAnimationId) {
    cancelAnimationFrame(requestAnimationId)
    requestAnimationId = null
  }
  requestAnimationId = requestAnimationFrame(tick)
}

onMounted(() => {
  isMobile.value = detectMobile()
  if (!isMobile.value) return
  attendanceStore.resetScan()
  startCamera()
})

onUnmounted(() => {
  stopCamera()
  attendanceStore.resetScan()
})
</script>
