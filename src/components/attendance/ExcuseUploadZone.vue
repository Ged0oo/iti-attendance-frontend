<template>
  <div
    class="upload-zone group"
    :class="{ 'is-dragover': isDragOver, 'has-file': modelValue }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="triggerInput"
  >
    <input
      type="file"
      ref="fileInput"
      class="hidden-input"
      accept=".pdf,image/jpeg,image/png"
      @change="onFileChange"
    />

    <template v-if="!modelValue">
      <span class="material-symbols-outlined upload-icon">upload_file</span>
      <p class="upload-text">Drop PDF, JPG or PNG &middot; Max 1MB</p>
    </template>
    
    <template v-else>
      <div class="file-chip" @click.stop>
        <span class="material-symbols-outlined file-icon">description</span>
        <div class="file-info">
          <span class="file-name">{{ modelValue.name }}</span>
          <span class="file-size">{{ formatSize(modelValue.size) }}</span>
        </div>
        <button type="button" class="remove-btn" @click.stop="removeFile" aria-label="Remove file">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: File | null
}>();

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  'validation-error': [message: string]
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE = 1048576; // 1MB

function onDragOver() {
  if (!props.modelValue) {
    isDragOver.value = true;
  }
}

function onDragLeave() {
  isDragOver.value = false;
}

function onDrop(event: DragEvent) {
  isDragOver.value = false;
  if (props.modelValue) return; // Prevent overwriting without explicit remove

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files.item(0);
    if (file) handleFile(file);
  }
}

function triggerInput() {
  if (!props.modelValue && fileInput.value) {
    fileInput.value.click();
  }
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files.item(0);
    if (file) handleFile(file);
    // Reset input so the same file can be selected again after removal
    target.value = '';
  }
}

function handleFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    emit('validation-error', 'Invalid file type. Only PDF, JPG, or PNG are allowed.');
    return;
  }

  if (file.size > MAX_SIZE) {
    emit('validation-error', 'File is too large. Maximum size is 1MB.');
    return;
  }

  emit('update:modelValue', file);
}

function removeFile() {
  emit('update:modelValue', null);
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
</script>

<style scoped>
.upload-zone {
  width: 100%;
  border: 1.5px dashed #8B1A1A;
  border-radius: 12px;
  padding: 32px;
  background-color: #FFF8F7; /* surface-bright from design */
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.upload-zone:hover:not(.has-file),
.upload-zone.is-dragover {
  background-color: #F9EAEA; /* primary-mist */
}

.upload-zone.has-file {
  cursor: default;
  border-style: solid;
  border-color: #e0bfbc; /* outline-variant */
  background-color: #ffffff;
  padding: 16px;
}

.hidden-input {
  display: none;
}

.upload-icon {
  color: #8b1a1a; /* primary-container */
  font-size: 32px;
  transition: transform 0.2s ease;
}

.upload-zone:hover:not(.has-file) .upload-icon {
  transform: translateY(-4px);
}

.upload-text {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

/* File Chip State */
.file-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background-color: #F7F7F7; /* canvas */
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e0bfbc;
}

.file-icon {
  color: #6B7280;
  font-size: 24px;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-name {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 12px;
  color: #6B7280;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #DC2626; /* crimson */
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.remove-btn:hover {
  background-color: #FEF2F2; /* danger-mist */
}

.remove-btn .material-symbols-outlined {
  font-size: 20px;
}
</style>
