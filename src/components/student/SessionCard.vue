<template>
  <div
    class="min-w-[280px] md:min-w-[320px] bg-surface rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-t-4 p-5 relative overflow-hidden transition-all duration-300 shrink-0 flex flex-col hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] group"
    :class="{
      'border-t-primary': safeType === 'lecture',
      'border-t-role-instructor': safeType === 'lab',
      'border-t-warning': safeType === 'business'
    }"
  >
    <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity duration-300 group-hover:opacity-10">
      <span class="material-symbols-outlined text-[64px]">{{ backgroundIcon }}</span>
    </div>
    <div class="relative z-[2] flex flex-col h-full">
      <div class="flex justify-between items-start mb-4">
        <span class="font-mono text-sm text-on-surface-variant">{{ date }}</span>
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
          :class="{
            'bg-primary/10 text-primary': safeType === 'lecture',
            'bg-role-instructor/10 text-role-instructor': safeType === 'lab',
            'bg-warning/10 text-warning': safeType === 'business'
          }"
        >{{ type || 'Lecture' }}</span>
      </div>
      <h3 class="font-body-md text-xl font-semibold text-on-surface m-0 mb-1">{{ title }}</h3>
      <p class="font-body-md text-xs text-on-surface-variant m-0 mb-4">{{ instructor }}</p>
      <div class="flex items-center gap-2 mt-auto pt-4 border-t border-black/5 text-on-surface-variant">
        <span class="material-symbols-outlined text-base">schedule</span>
        <span class="font-mono text-sm">{{ time }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  date: { type: String, required: true },
  type: { type: String, default: 'Lecture' },
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  time: { type: String, required: true }
})

// Guard: always a non-empty lowercase string so class bindings never crash
const safeType = computed(() => (props.type || 'lecture').toLowerCase())

const backgroundIcon = computed(() => {
  if (safeType.value === 'lecture') return 'menu_book'
  if (safeType.value === 'lab') return 'computer'
  if (safeType.value === 'business' || safeType.value === 'soft skills') return 'business_center'
  return 'event'
})
</script>
