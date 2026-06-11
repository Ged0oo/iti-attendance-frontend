<script setup lang="ts">
const navItems = [
  { label: 'Grade Entry', to: '/grading/entry' },
  { label: 'Grade Card', to: '/grading/students' },
  { label: 'Tags & Notes', to: '/grading/tags-notes' },
  { label: 'Track Dashboard', to: '/dashboards/track-admin' },
  { label: 'Instructor Dashboard', to: '/dashboards/instructor' },
]
</script>

<template>
  <div class="min-h-screen bg-canvas text-on-surface">
    <aside class="fixed inset-y-0 left-0 hidden w-64 border-r border-[#2D1515] bg-[#1A0A0A] px-5 py-6 text-white lg:block">
      <div class="mb-8 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container font-serif text-lg">
          ITI
        </div>
        <div>
          <h1 class="text-lg font-semibold">ITI Portal</h1>
          <p class="text-xs text-white/55">Grading workspace</p>
        </div>
      </div>

      <nav class="space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="block rounded-lg px-4 py-3 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
          active-class="border-l-4 border-primary-container bg-white/10 pl-3 text-white"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="lg:pl-64">
      <header class="sticky top-0 z-20 border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-primary-container">ITI Portal</p>
            <h2 class="font-serif text-2xl text-on-surface">Grading & Student Support</h2>
          </div>
          <nav class="flex gap-2 overflow-x-auto lg:hidden">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium"
              active-class="border-primary-container bg-primary-container text-white"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>
      </header>

      <main class="p-5 lg:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped></style>
