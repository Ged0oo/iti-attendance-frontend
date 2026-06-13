<template>
  <div
    class="w-full border-[1.5px] border-dashed border-primary rounded-xl p-8 bg-[#FFF8F7] cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors duration-200 group"
    :class="{
      'bg-primary-mist': isDragOver && !modelValue,
      '!cursor-default !border-solid !border-outline-variant !bg-white !p-4': modelValue
    }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="triggerInput"
  >
    <input
      type="file"
      ref="fileInput"
      class="hidden"
      accept=".pdf,image/jpeg,image/png"
      @change="onFileChange"
    />

    <template v-if="!modelValue">
      <span class="material-symbols-outlined text-primary text-[32px] transition-transform duration-200 group-hover:-translate-y-1">upload_file</span>
      <p class="font-body-md text-sm text-on-surface-variant m-0">Drop PDF, JPG or PNG &middot; Max 1MB</p>
    </template>

    <template v-else>
      <div class="flex items-center gap-3 w-full bg-canvas p-3 rounded-lg border border-outline-variant" @click.stop>
        <span class="material-symbols-outlined text-on-surface-variant text-2xl">description</span>
        <div class="flex-1 flex flex-col overflow-hidden">
          <span class="font-body-md text-sm font-medium text-on-surface whitespace-nowrap overflow-hidden text-ellipsis">{{ modelValue.name }}</span>
          <span class="font-body-md text-xs text-on-surface-variant">{{ formatSize(modelValue.size) }}</span>
        </div>
        <button type="button" class="flex items-center justify-center bg-transparent border-none text-danger cursor-pointer p-1 rounded transition-colors hover:bg-danger-mist" @click.stop="removeFile" aria-label="Remove file">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { default: null }
})

const emit = defineEmits(['update:modelValue', 'validation-error'])

const fileInput = ref(null)
const isDragOver = ref(false)

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SIZE = 1048576

function onDragOver() {
  if (!props.modelValue) {
    isDragOver.value = true
  }
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event) {
  isDragOver.value = false
  if (props.modelValue) return

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files.item(0)
    if (file) handleFile(file)
  }
}

function triggerInput() {
  if (!props.modelValue && fileInput.value) {
    fileInput.value.click()
  }
}

function onFileChange(event) {
  const target = event.target
  if (target.files && target.files.length > 0) {
    const file = target.files.item(0)
    if (file) handleFile(file)
    target.value = ''
  }
}

function handleFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    emit('validation-error', 'Invalid file type. Only PDF, JPG, or PNG are allowed.')
    return
  }

  if (file.size > MAX_SIZE) {
    emit('validation-error', 'File is too large. Maximum size is 1MB.')
    return
  }

  emit('update:modelValue', file)
}

function removeFile() {
  emit('update:modelValue', null)
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>
