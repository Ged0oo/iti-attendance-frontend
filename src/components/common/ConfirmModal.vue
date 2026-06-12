<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  danger: { type: Boolean, default: true },
})
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('cancel')"
    >
      <div class="w-full max-w-md rounded-xl bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <h3 class="font-h3 text-h3 text-on-surface mb-2">{{ title }}</h3>
        <p v-if="message" class="font-body-md text-body-md text-on-surface-variant mb-6">{{ message }}</p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="h-11 px-5 rounded-lg font-label text-label text-on-surface-variant hover:bg-surface-sunken transition-colors"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="h-11 px-5 rounded-lg font-label text-label border-[1.5px] transition-colors"
            :class="danger ? 'border-danger text-danger hover:bg-danger-mist' : 'border-transparent bg-primary-container text-white hover:bg-primary'"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
