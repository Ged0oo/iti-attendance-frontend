<template>
  <main class="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop bg-canvas min-h-screen">
    <div class="max-w-6xl mx-auto space-y-8">
      
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="font-h2 text-primary font-bold">Welcome back, {{ firstName }}</h1>
          <p class="font-body-md text-on-surface-variant mt-1">Here is your current standing in the ITI program.</p>
        </div>
        
        <button @click="router.push('/attendance/scan')" class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg shadow-soft hover:bg-primary-deep transition-colors font-label">
          <span class="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          Scan Attendance
        </button>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div class="bg-surface rounded-2xl p-6 shadow-elevated border border-outline-variant/30 flex flex-col justify-between group">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-h3 text-on-surface">Attendance Ledger</h2>
              <span class="material-symbols-outlined text-primary bg-primary-mist p-2 rounded-lg">account_balance_wallet</span>
            </div>
            
            <div v-if="ledgerStore.loading" class="animate-pulse flex gap-2 items-end">
              <div class="h-8 w-16 bg-surface-variant rounded"></div>
              <div class="h-4 w-12 bg-surface-variant rounded mb-1"></div>
            </div>
            <div v-else class="flex items-baseline gap-2">
              <span :class="['text-4xl font-bold tracking-tight', ledgerStore.isAtRisk ? 'text-danger' : 'text-primary']">
                {{ ledgerStore.balance }}
              </span>
              <span class="text-on-surface-variant font-label">/ {{ ledgerStore.maxBalance }} pts</span>
            </div>
            
            <p v-if="ledgerStore.isAtRisk" class="mt-3 text-[13px] text-danger flex items-center gap-1 font-medium bg-danger-mist px-2 py-1 rounded w-fit">
              <span class="material-symbols-outlined text-[16px]">warning</span>
              At-Risk Status Active
            </p>
          </div>
          
          <button @click="router.push('/attendance/ledger')" class="mt-6 w-full py-2 border border-outline-variant rounded-lg text-on-surface font-label hover:bg-surface-variant/30 transition-colors">
            View Full History
          </button>
        </div>

        <div class="bg-surface rounded-2xl p-6 shadow-elevated border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-h3 text-on-surface">Excuse Requests</h2>
              <span class="material-symbols-outlined text-warning bg-warning-mist p-2 rounded-lg">pending_actions</span>
            </div>
            
            <div class="space-y-3">
              <p class="text-on-surface-variant font-body-sm">
                Have an unexcused absence? Submit your official documentation to reclaim 20 points.
              </p>
            </div>
          </div>
          
          <div class="mt-6 flex gap-3">
            <button @click="router.push('/excuses/submit')" class="flex-1 py-2 bg-primary-mist text-primary border border-primary/20 rounded-lg font-label hover:bg-primary/10 transition-colors">
              Submit Excuse
            </button>
          </div>
        </div>

        <div class="bg-surface-sunken rounded-2xl p-6 shadow-soft border border-dashed border-outline-variant flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-surface to-surface-sunken opacity-50"></div>
          <div class="relative z-10">
            <span class="material-symbols-outlined text-[48px] text-on-surface-variant/50 mb-3 block">school</span>
            <h2 class="font-h3 text-on-surface-variant mb-1">Academic Progress</h2>
            <p class="font-body-sm text-on-surface-variant/70 mb-4">Module 6 (Grading) integration coming soon.</p>
            <span class="px-3 py-1 bg-surface border border-outline-variant rounded-full text-[12px] font-mono text-on-surface-variant shadow-sm">
              Pending M6 Merge
            </span>
          </div>
        </div>

      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useLedgerStore } from '@/stores/ledger';

const router = useRouter();
const authStore = useAuthStore();
const ledgerStore = useLedgerStore();

const firstName = computed(() => {
  if (!authStore.user?.name) return 'Student';
  return authStore.user.name.split(' ')[0];
});

onMounted(() => {
  ledgerStore.fetchLedgerData();
});
</script>