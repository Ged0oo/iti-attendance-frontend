<script setup>
import { computed } from 'vue'

const props = defineProps({
  timeline: { type: Array, required: true },
  maxTotal: { type: Number, required: true }
})

const points = computed(() => {
  const len = props.timeline.length
  if (len === 0) return []
  if (len === 1) {
    const p = props.timeline[0]
    if (!p) return []
    return [{
      cx: 50,
      cy: 100 - (p.running_total / props.maxTotal) * 100,
      val: p.running_total,
      week: p.week
    }]
  }

  return props.timeline.map((p, i) => {
    const cx = (i / (len - 1)) * 100
    const cy = 100 - (p.running_total / (props.maxTotal || 1)) * 100
    return { cx, cy, val: p.running_total, week: p.week }
  })
})

const polylineStr = computed(() => {
  return points.value.map(p => `${p.cx},${p.cy}`).join(' ')
})



// Calculate evenly spaced X axis labels based on available data
const xAxisLabels = computed(() => {
  if (props.timeline.length === 0) return []
  const len = props.timeline.length

  const t0   = props.timeline[0]
  const tEnd = props.timeline[len - 1]
  const t1   = props.timeline[Math.floor(len / 3)]
  const t2   = props.timeline[Math.floor((len * 2) / 3)]

  if (len <= 4) return props.timeline.map(t => `W${t.week}`)

  return [
    t0   ? `W${t0.week}`   : '',
    t1   ? `W${t1.week}`   : '',
    t2   ? `W${t2.week}`   : '',
    tEnd ? `W${tEnd.week}` : '',
  ]
})
</script>

<template>
  <div class="bg-surface rounded-[16px] shadow-sm p-6 flex-1 border border-transparent flex flex-col justify-between min-h-[300px]" style="background-color: var(--color-surface);">
    <div class="flex justify-between items-center mb-4">
      <span class="font-label text-label text-on-surface-variant" style="color: var(--color-text-secondary);">Running Total</span>
      <span class="font-mono text-mono px-2 py-1 rounded" style="color: var(--color-primary); background-color: var(--color-primary-mist);">
        Week {{ timeline.length > 0 ? timeline[timeline.length - 1]?.week ?? 0 : 0 }}
      </span>
    </div>

    <!-- Simulated Sparkline Chart -->
    <div class="relative w-full h-48 flex items-end justify-between px-2 pb-6 border-b border-l mt-auto" style="border-color: #E5E7EB;">
      
      <!-- Y Axis Labels -->
      <div class="absolute -left-2 bottom-6 transform -translate-x-full font-mono text-[10px]" style="color: var(--color-text-secondary);">0</div>
      <div class="absolute -left-2 top-0 transform -translate-x-full font-mono text-[10px]" style="color: var(--color-text-secondary);">{{ maxTotal }}</div>

      <!-- Area Graphic Simulation using SVG -->
      <svg v-if="points.length > 0" class="absolute inset-0 w-full h-full pb-6 pl-1" preserveAspectRatio="none" viewBox="0 0 100 100">
        <!-- Area Fill -->
        <polygon 
          style="fill: var(--color-primary-mist);" 
          :points="`0,100 ${points[0]?.cx ?? 0},${points[0]?.cy ?? 100} ` + polylineStr + ` ${points[points.length-1]?.cx ?? 100},100`"
        ></polygon>
        <!-- Line -->
        <polyline 
          fill="none" 
          :points="polylineStr" 
          style="stroke: var(--color-primary);" 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2"
        ></polyline>
        <!-- Points -->
        <circle 
          v-for="(p, index) in points" 
          :key="index"
          :cx="p.cx" 
          :cy="p.cy" 
          style="fill: var(--color-primary);" 
          :r="index === points.length - 1 ? 3 : 2"
          :class="{'animate-pulse': index === points.length - 1}"
        >
          <title>Week {{ p.week }}: {{ Math.round(p.val) }}</title>
        </circle>
      </svg>
      
      <div v-else class="absolute inset-0 flex items-center justify-center text-sm" style="color: var(--color-text-secondary);">
        No data available
      </div>

      <!-- X Axis Labels -->
      <div class="absolute -bottom-5 w-full flex justify-between pr-2 font-mono text-[10px]" style="color: var(--color-text-secondary);">
        <span v-for="label in xAxisLabels" :key="label">{{ label }}</span>
      </div>
    </div>
  </div>
</template>
