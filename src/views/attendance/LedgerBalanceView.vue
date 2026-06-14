<template>
  <MainLayout title="Attendance Ledger">
    <div class="max-w-[800px] mx-auto flex flex-col gap-6">
      <template v-if="ledgerStore.loading">
        <div class="bg-white rounded-[20px] p-8 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)] flex flex-col gap-4">
          <div class="h-3 w-40 rounded-md bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:800px_100%] animate-shimmer"></div>
          <div class="h-[72px] w-[200px] rounded-lg bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:800px_100%] animate-shimmer"></div>
          <div class="h-2.5 w-full rounded-[5px] bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:800px_100%] animate-shimmer"></div>
          <div class="h-3.5 w-[280px] rounded-md bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:800px_100%] animate-shimmer"></div>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col gap-5">
          <div class="h-5 w-[200px] rounded-md bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:800px_100%] animate-shimmer"></div>
          <div v-for="i in 5" :key="i" class="grid grid-cols-[120px_24px_1fr_auto] items-center gap-3">
            <div class="h-[13px] w-[90px] rounded-md bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:800px_100%] animate-shimmer"></div>
            <div class="w-3 h-3 rounded-full bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:800px_100%] animate-shimmer"></div>
            <div class="h-3.5 w-full rounded-md bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:800px_100%] animate-shimmer"></div>
            <div class="h-6 w-16 rounded-full bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:800px_100%] animate-shimmer"></div>
          </div>
        </div>
      </template>

      <div v-else-if="ledgerStore.error" class="flex items-center gap-2.5 px-5 py-4 bg-danger-mist text-danger border border-danger/20 rounded-xl font-body-md text-sm font-medium" role="alert">
        <span class="material-symbols-outlined">error</span>
        <span>Could not load your ledger. Please try again later.</span>
      </div>

      <template v-else>
        <BalanceHeroCard
          :balance="ledgerStore.balance"
          :max="ledgerStore.max"
          :is-at-risk="ledgerStore.isAtRisk"
        />

        <section class="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
          <div class="flex items-center gap-3 mb-6">
            <h2 class="font-h1 text-xl font-normal text-on-surface m-0">Deduction History</h2>
            <span class="font-body-md text-sm text-on-surface-variant bg-[#F3F4F6] px-2.5 py-0.5 rounded-full">{{ ledgerStore.entries.length }} events</span>
          </div>
          <LedgerTimeline :entries="ledgerStore.entries" />
        </section>

        <section v-if="hasDeductions" class="pb-2">
          <button
            class="flex items-center justify-center gap-2 w-full h-[52px] bg-primary text-white border-none rounded-lg font-body-md text-sm font-medium tracking-[0.01em] cursor-pointer transition-all shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:bg-primary-deep hover:shadow-[0_10px_15px_-3px_rgba(139,26,26,0.12),0_4px_6px_-2px_rgba(139,26,26,0.08)] active:scale-[0.99]"
            @click="goToExcuse"
          >
            <span class="material-symbols-outlined text-lg">post_add</span>
            Submit an Excuse Request →
          </button>
        </section>
      </template>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLedgerStore } from '@/stores/ledger'
import MainLayout from '@/components/layout/MainLayout.vue'
import BalanceHeroCard from '@/components/attendance/BalanceHeroCard.vue'
import LedgerTimeline from '@/components/attendance/LedgerTimeline.vue'

const router = useRouter()
const authStore = useAuthStore()
const ledgerStore = useLedgerStore()

const hasDeductions = computed(() =>
  ledgerStore.entries.some((e) => e.delta < 0)
)

function goToExcuse() {
  router.push({ name: 'submit-excuse' })
}

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchMe()
  }
  const studentId = authStore.user?.student_id
  if (studentId) {
    await ledgerStore.fetchLedger(studentId)
  }
})
</script>
