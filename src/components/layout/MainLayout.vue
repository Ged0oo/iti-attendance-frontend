<!-- eslint-disable vue/block-lang -->
<script setup>
import { useSidebar } from '../../composables/useSidebar'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

defineProps({
  title: { type: String, default: 'Academic Portal' },
})

const { isCollapsed } = useSidebar()
</script>

<template>
  <div class="flex w-screen overflow-x-hidden bg-canvas text-on-surface antialiased">
    <AppSidebar />

    <div 
      class="flex-1 pb-[72px] lg:pb-0 min-w-0 min-h-screen flex flex-col overflow-x-hidden transition-all duration-300 ease-in-out"
      :class="isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'"
    >
      <AppHeader :title="title">
        <template #action>
          <slot name="action" />
        </template>
      </AppHeader>

      <main class="flex-1 p-4 lg:p-margin-desktop w-full flex flex-col gap-8">
        <slot />
      </main>
    </div>
  </div>
</template>

