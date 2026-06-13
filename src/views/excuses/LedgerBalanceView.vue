<template>
  <main class="flex-1 overflow-y-auto w-full relative">
    <div class="max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop py-6 md:py-8 space-y-6 md:space-y-8">
      
      <section class="bg-surface rounded-[20px] p-6 md:p-8 shadow-elevated relative overflow-hidden group">
        <div class="relative z-10">
          <h1 class="font-label-caps text-on-surface-variant uppercase tracking-widest mb-4">Your Attendance Balance</h1>
          
          <div class="flex items-baseline gap-2 mb-6">
            <span :class="['font-kpi', ledgerStore.isAtRisk ? 'text-danger' : 'text-primary']">
              {{ ledgerStore.balance }}
            </span>
            <span class="font-h3 text-on-surface-variant font-normal">/ {{ ledgerStore.maxBalance }} pts</span>
          </div>
          
          <div class="w-full bg-surface-sunken h-3 rounded-full overflow-hidden mb-3">
            <div 
              :class="['h-full rounded-full transition-all duration-1000 ease-out', ledgerStore.isAtRisk ? 'bg-danger' : 'bg-success']" 
              :style="{ width: `${ledgerStore.balancePercentage}%` }">
            </div>
          </div>
          
          <div class="flex items-center gap-1.5 text-secondary">
            <span class="material-symbols-outlined text-[16px]">warning</span>
            <p class="font-body-sm">Students below {{ ledgerStore.threshold }} pts are flagged as At-Risk</p>
          </div>
        </div>
        
        <div class="absolute right-0 top-0 w-64 h-64 bg-primary-mist rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-700"></div>
      </section>

      <section class="bg-surface rounded-2xl p-6 shadow-soft">
        <h2 class="font-h3 text-on-surface mb-6">Deduction History <span class="text-on-surface-variant font-normal text-[16px]">({{ ledgerStore.history.length }} events)</span></h2>
        
        <div class="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-surface-variant">
          
          <div v-for="item in ledgerStore.history" :key="item.id" class="relative pl-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 group">
            <div :class="[
              'absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-surface',
              `bg-${item.type}`
            ]"></div>
            
            <div class="flex flex-col">
              <span class="font-mono text-on-surface-variant">{{ item.date }}</span>
              <span class="font-body-lg text-on-surface font-medium">{{ item.title }}</span>
            </div>
            
            <span :class="[
              'inline-flex items-center px-3 py-1 rounded-full font-label shrink-0',
              item.points > 0 ? 'bg-success-mist text-success' : 'bg-warning-mist text-danger'
            ]">
              {{ item.points }} pts
            </span>
          </div>
          
        </div>
        
        <div class="mt-8 text-center">
          <button class="text-primary font-label hover:underline">View Older Events</button>
        </div>
      </section>

      <section class="pb-8">
        <button @click="openExcuseForm" class="w-full h-[52px] bg-primary-container text-white font-label rounded-lg shadow-soft hover-crimson-shadow transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99]">
          <span class="material-symbols-outlined text-[18px]">post_add</span>
          Submit an Excuse Request
        </button>
      </section>

    </div>
  </main>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLedgerStore } from '@/stores/ledger';

const router = useRouter();
const ledgerStore = useLedgerStore();

onMounted(() => {
    ledgerStore.fetchLedgerData();
});

const openExcuseForm = () => {
    router.push('/excuses/submit'); // Assuming this maps to your ExcuseFormView.vue
};
</script>

<style scoped>
/* Reusing the custom shadows you defined in your design */
.shadow-soft {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}
.shadow-elevated {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
}
.hover-crimson-shadow:hover {
    box-shadow: 0 10px 15px -3px rgba(139, 26, 26, 0.12), 0 4px 6px -2px rgba(139, 26, 26, 0.08);
}
</style>