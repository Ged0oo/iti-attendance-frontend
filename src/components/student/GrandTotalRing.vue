<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  total: { type: Number, required: true },
  max: { type: Number, required: true },
  gradeLetter: { type: String, default: '' },
  mini: { type: Boolean, default: false }
})

const isMounted = ref(false)

onMounted(() => {
  setTimeout(() => {
    isMounted.value = true
  }, 100)
})

const percentage = computed(() => {
  if (props.max <= 0) return 0
  return Math.min(100, Math.max(0, (props.total / props.max) * 100))
})

const animatedPercentage = computed(() => {
  return isMounted.value ? percentage.value : 0
})
</script>

<template>
  <div class="relative flex items-center justify-center" :class="mini ? 'w-12 h-12' : 'w-[160px] h-[160px]'">
    <svg class="circular-chart text-primary w-full h-full" viewBox="0 0 36 36">
      <path 
        class="circle-bg" 
        d="M18 2.0845
           a 15.9155 15.9155 0 0 1 0 31.831
           a 15.9155 15.9155 0 0 1 0 -31.831"
      ></path>
      <path 
        class="circle" 
        d="M18 2.0845
           a 15.9155 15.9155 0 0 1 0 31.831
           a 15.9155 15.9155 0 0 1 0 -31.831" 
        stroke="var(--color-primary)" 
        :stroke-dasharray="`${animatedPercentage}, 100`"
      ></path>
    </svg>
    <div v-if="!mini" class="absolute flex flex-col items-center justify-center text-center mt-2">
      <span class="font-kpi text-kpi text-on-surface leading-none mb-1">{{ Math.round(total) }}</span>
      <span class="font-body-sm text-body-sm text-[#6B7280]">/{{ max }} pts</span>
    </div>
    <div 
      v-if="!mini && gradeLetter"
      class="absolute bottom-4 md:bottom-8 right-4 md:right-8 bg-[#8B1A1A] text-white rounded-full px-4 py-1.5 font-h3 text-h3 shadow-sm transform translate-y-4 translate-x-4 md:translate-x-8"
      style="background-color: var(--color-primary);"
    >
      {{ gradeLetter }}
    </div>
  </div>
</template>

<style scoped>
.circular-chart {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 100%;
}
.circle-bg {
  fill: none;
  stroke: var(--color-primary-mist);
  stroke-width: 3.8;
}
.circle {
  fill: none;
  stroke-width: 2.8;
  stroke-linecap: round;
  transition: stroke-dasharray 1s ease-out;
}
</style>
