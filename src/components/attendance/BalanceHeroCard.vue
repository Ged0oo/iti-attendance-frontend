<template>
  <section
    class="bg-surface rounded-[20px] p-8 sm:p-6 relative overflow-hidden shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] transition-shadow duration-300"
    :class="{ 'border border-danger/20': isAtRisk }"
  >
    <div
      class="absolute -right-8 -top-16 w-64 h-64 rounded-full blur-[48px] opacity-45 pointer-events-none transition-all duration-700 group-hover:opacity-[0.65] group-hover:scale-[1.12]"
      :class="isAtRisk ? 'bg-danger-mist' : 'bg-success-mist'"
    ></div>

    <div class="relative z-[2]">
      <p class="font-body-md text-[11px] font-semibold tracking-[0.08em] uppercase text-on-surface-variant m-0 mb-4">Your Attendance Balance</p>

      <div class="flex items-baseline gap-2 mb-6">
        <span class="font-h1 text-[72px] sm:text-[56px] font-bold leading-none transition-colors duration-400" :style="{ color: kpiColor }">{{ balance }}</span>
        <span class="font-body-md text-[28px] sm:text-[22px] font-normal text-on-surface-variant">/ {{ max }} pts</span>
      </div>

      <div class="w-full h-2.5 rounded-[5px] bg-[#F0F0F0] overflow-hidden mb-3">
        <div
          class="h-full rounded-[5px] transition-[width,background-color] duration-600"
          :class="isAtRisk ? 'bg-danger' : 'bg-success'"
          :style="{ width: pct + '%' }"
        ></div>
      </div>

      <div class="flex items-start gap-1.5" :class="isAtRisk ? 'text-danger font-medium' : 'text-on-surface-variant'">
        <span class="material-symbols-outlined text-base shrink-0 mt-px">warning</span>
        <p class="font-body-md text-xs leading-[1.4] m-0" v-if="isAtRisk">
          Students below 150 pts are flagged as At-Risk — contact your Track Admin
        </p>
        <p class="font-body-md text-xs leading-[1.4] m-0" v-else>Students below 150 pts are flagged as At-Risk</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  balance: { type: Number, required: true },
  max: { type: Number, required: true },
  isAtRisk: { type: Boolean, required: true }
})

const pct = computed(() =>
  Math.min(100, Math.max(0, (props.balance / props.max) * 100))
)

const kpiColor = computed(() => (props.isAtRisk ? 'var(--color-danger)' : 'var(--color-success)'))
</script>
