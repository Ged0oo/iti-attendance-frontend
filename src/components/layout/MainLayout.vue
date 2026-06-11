<script setup>
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

defineProps({
  title: { type: String, default: 'Academic Portal' },
})
</script>

<template>
  <div class="flex bg-canvas text-on-surface antialiased">
    <AppSidebar />

    <div class="flex-1 ml-[240px] min-h-screen flex flex-col">
      <AppHeader :title="title">
        <template #action>
          <slot name="action" />
        </template>
      </AppHeader>

      <main class="flex-1 p-margin-desktop max-w-[1600px] w-full mx-auto flex flex-col gap-8">
        <slot />
      </main>
    </div>
  </div>
</template>
