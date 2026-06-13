<template>
  <div
    class="bg-surface rounded-[20px] border border-black/[0.04] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col transition-all duration-400 h-full hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] hover:border-black/[0.08] group"
    :class="{
      'border-danger/20 hover:border-danger/40 hover:shadow-[0_12px_24px_-8px_rgba(220,38,38,0.15)]': variant === 'at-risk'
    }"
  >
    <div
      class="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none group-hover:opacity-100"
      :class="{
        'bg-[radial-gradient(circle_at_top_right,rgba(5,150,105,0.12),transparent_70%)]': variant === 'success',
        'bg-[radial-gradient(circle_at_top_right,rgba(139,26,26,0.12),transparent_70%)]': variant === 'primary',
        'bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.12),transparent_70%)]': variant === 'warning',
        'bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent_70%)]': variant === 'at-risk'
      }"
    ></div>
    <div class="relative z-10 flex flex-col h-full justify-between flex-1">
      <div>
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-body-md text-[11px] font-semibold tracking-[0.08em] uppercase text-on-surface-variant m-0 transition-colors duration-300 group-hover:text-on-surface">{{ title }}</h3>
          <span
            class="material-symbols-outlined text-2xl transition-transform duration-400 group-hover:scale-[1.15] group-hover:rotate-[5deg]"
            :class="{
              'text-success': variant === 'success',
              'text-primary': variant === 'primary',
              'text-warning': variant === 'warning',
              'text-danger': variant === 'at-risk'
            }"
          >{{ icon }}</span>
        </div>
        <slot></slot>
      </div>
      <div v-if="$slots.footer" class="mt-auto">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  variant: { type: String, default: 'primary' }
})
</script>
