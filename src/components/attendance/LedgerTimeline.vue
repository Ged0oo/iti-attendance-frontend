<template>
  <div v-if="!entries || entries.length === 0" class="flex flex-col items-center gap-3 py-12 text-on-surface-variant">
    <span class="material-symbols-outlined text-[48px] opacity-40">history</span>
    <p class="font-body-md text-sm m-0">No deductions recorded yet.</p>
  </div>

  <div v-else class="flex flex-col" role="list">
    <div
      v-for="entry in entries"
      :key="entry.id ?? entry.created_at"
      class="grid grid-cols-[120px_24px_1fr] max-[540px]:grid-cols-[24px_1fr] items-start gap-x-3 py-5 relative border-b border-black/[0.04] last:border-b-0 group"
      role="listitem"
    >
      <div class="flex flex-col items-end pt-0.5 gap-0.5 max-[540px]:hidden">
        <span class="font-mono text-xs text-on-surface-variant whitespace-nowrap">{{ formatDate(entry.created_at) }}</span>
        <span class="font-mono text-[11px] text-[#9CA3AF]">{{ formatDay(entry.created_at) }}</span>
      </div>

      <div class="flex flex-col items-center relative min-h-full">
        <div class="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-[#E5E7EB] -translate-x-1/2"></div>
        <div
          class="w-3 h-3 rounded-full shrink-0 mt-1 relative z-[2] shadow-[0_0_0_3px_#fff] transition-transform duration-200 group-hover:scale-125"
          :class="{
            'bg-danger': entry.delta < 0,
            'bg-success': entry.delta > 0,
            'bg-[#9CA3AF]': entry.delta === 0
          }"
          :title="dotLabel(entry.delta)"
        ></div>
      </div>

      <div class="flex items-start justify-between gap-3 flex-wrap">
        <p class="font-body-md text-sm font-medium text-on-surface m-0 pt-0.5 flex-1 min-w-0">{{ entry.reason || 'Ledger event' }}</p>
        <span
          class="inline-flex items-center px-3 py-1 rounded-full font-body-md text-[13px] font-medium tracking-[0.01em] whitespace-nowrap shrink-0"
          :class="{
            'bg-danger-mist text-danger': entry.delta < 0,
            'bg-success-mist text-success': entry.delta > 0,
            'bg-[#F3F4F6] text-on-surface-variant': entry.delta === 0
          }"
        >
          {{ formatDelta(entry.delta) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  entries: { type: Array, required: true }
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function formatDelta(delta) {
  if (delta == null) return '—'
  return delta >= 0 ? `+${delta} pts` : `${delta} pts`
}

function dotLabel(delta) {
  if (delta < 0) return 'Deduction'
  if (delta > 0) return 'Credit'
  return 'Event'
}
</script>
