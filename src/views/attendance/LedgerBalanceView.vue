<template>
  <div class="ledger-view">

    <!-- ── LOADING STATE ─────────────────────────────── -->
    <template v-if="ledgerStore.loading">
      <!-- Hero skeleton -->
      <div class="skeleton-hero">
        <div class="skeleton skeleton--label"></div>
        <div class="skeleton skeleton--kpi"></div>
        <div class="skeleton skeleton--bar"></div>
        <div class="skeleton skeleton--warning"></div>
      </div>
      <!-- Timeline skeletons -->
      <div class="skeleton-panel">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton-timeline">
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div class="skeleton skeleton--date"></div>
            <div class="skeleton skeleton--dot"></div>
            <div class="skeleton skeleton--text"></div>
            <div class="skeleton skeleton--badge"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── ERROR STATE ───────────────────────────────── -->
    <div v-else-if="ledgerStore.error" class="error-banner" role="alert">
      <span class="material-symbols-outlined">error</span>
      <span>Could not load your ledger. Please try again later.</span>
    </div>

    <!-- ── CONTENT ───────────────────────────────────── -->
    <template v-else>

      <!-- Hero card -->
      <BalanceHeroCard
        :balance="ledgerStore.balance"
        :max="ledgerStore.max"
        :is-at-risk="ledgerStore.isAtRisk"
      />

      <!-- Deduction history section -->
      <section class="ledger-section">
        <div class="section-header">
          <h2 class="section-title">Deduction History</h2>
          <span class="section-count">{{ ledgerStore.entries.length }} events</span>
        </div>

        <LedgerTimeline :entries="ledgerStore.entries" />
      </section>

      <!-- CTA — only when there are deductions -->
      <section v-if="hasDeductions" class="cta-section">
        <button class="cta-btn" @click="goToExcuse">
          <span class="material-symbols-outlined">post_add</span>
          Submit an Excuse Request →
        </button>
      </section>

    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useLedgerStore } from '@/stores/ledger';
import BalanceHeroCard from '@/components/attendance/BalanceHeroCard.vue';
import LedgerTimeline from '@/components/attendance/LedgerTimeline.vue';

const router    = useRouter();
const authStore  = useAuthStore();
const ledgerStore = useLedgerStore();

const hasDeductions = computed(() =>
  ledgerStore.entries.some((e: any) => e.delta < 0)
);

function goToExcuse() {
  router.push({ name: 'ExcuseForm' });
}

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchMe();
  }

  const studentId = authStore.studentId;
  if (studentId) {
    await ledgerStore.fetchLedger(studentId);
  }
});
</script>

<style scoped>
/* ── Page shell ── */
.ledger-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 640px) {
  .ledger-view {
    padding: 16px;
    gap: 16px;
  }
}

/* ── Error banner ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
}

/* ── Deduction history section ── */
.ledger-section {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.section-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 20px;
  font-weight: 400;
  color: #1A1A2E;
  margin: 0;
}

.section-count {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  color: #6B7280;
  background: #F3F4F6;
  padding: 2px 10px;
  border-radius: 9999px;
}

/* ── CTA button ── */
.cta-section {
  padding-bottom: 8px;
}

.cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 52px;
  background: #8B1A1A;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background-color 0.25s ease, box-shadow 0.25s ease, transform 0.1s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.cta-btn:hover {
  background: #6B1212;
  box-shadow:
    0 10px 15px -3px rgba(139, 26, 26, 0.12),
    0 4px 6px -2px rgba(139, 26, 26, 0.08);
}

.cta-btn:active {
  transform: scale(0.99);
}

.cta-btn .material-symbols-outlined {
  font-size: 18px;
}

/* ── Skeleton loading ── */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}

.skeleton-hero {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton--label  { height: 12px; width: 160px; }
.skeleton--kpi    { height: 72px; width: 200px; border-radius: 8px; }
.skeleton--bar    { height: 10px; width: 100%; border-radius: 5px; }
.skeleton--warning{ height: 14px; width: 280px; }

.skeleton-panel {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton--title { height: 20px; width: 200px; }

.skeleton-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 120px 24px 1fr auto;
  align-items: center;
  gap: 12px;
}

.skeleton--date  { height: 13px; width: 90px; }
.skeleton--dot   { width: 12px; height: 12px; border-radius: 50%; }
.skeleton--text  { height: 14px; width: 100%; }
.skeleton--badge { height: 24px; width: 64px; border-radius: 9999px; }
</style>
