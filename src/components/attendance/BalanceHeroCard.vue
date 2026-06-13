<template>
  <section class="hero-card" :class="{ 'is-at-risk': isAtRisk }">
    <!-- Decorative background blob -->
    <div class="hero-card__blob" :class="isAtRisk ? 'blob--danger' : 'blob--success'"></div>

    <div class="hero-card__body">
      <p class="hero-card__label">Your Attendance Balance</p>

      <!-- Big KPI number -->
      <div class="hero-card__kpi-row">
        <span class="hero-card__kpi" :style="{ color: kpiColor }">{{ balance }}</span>
        <span class="hero-card__kpi-max">/ {{ max }} pts</span>
      </div>

      <!-- Progress bar -->
      <div class="hero-card__bar-bg">
        <div
          class="hero-card__bar-fill"
          :class="isAtRisk ? 'fill--danger' : 'fill--success'"
          :style="{ width: pct + '%' }"
        ></div>
      </div>

      <!-- Warning row — always visible, but emphasis changes -->
      <div class="hero-card__warning" :class="{ 'warning--active': isAtRisk }">
        <span class="material-symbols-outlined">warning</span>
        <p v-if="isAtRisk">
          ⚠️ Students below 150 pts are flagged as At-Risk — contact your Track Admin
        </p>
        <p v-else>Students below 150 pts are flagged as At-Risk</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  balance: { type: Number, required: true },
  max: { type: Number, required: true },
  isAtRisk: { type: Boolean, required: true }
});

const pct = computed(() =>
  Math.min(100, Math.max(0, (props.balance / props.max) * 100))
);

const kpiColor = computed(() => (props.isAtRisk ? 'var(--color-danger)' : 'var(--color-success)'));
</script>

<style scoped>
.hero-card {
  background: var(--color-surface);
  border-radius: 20px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s;
}

/* decorative blur blob */
.hero-card__blob {
  position: absolute;
  right: -32px;
  top: -64px;
  width: 256px;
  height: 256px;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.45;
  pointer-events: none;
  transition: opacity 0.4s, transform 0.7s;
}
.hero-card:hover .hero-card__blob {
  opacity: 0.65;
  transform: scale(1.12);
}
.blob--success { background: var(--color-success-mist); }
.blob--danger  { background: var(--color-danger-mist); }

.hero-card__body {
  position: relative;
  z-index: 2;
}

/* LABEL */
.hero-card__label {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
}

/* KPI ROW */
.hero-card__kpi-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 24px;
}

.hero-card__kpi {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
  transition: color 0.4s;
}

.hero-card__kpi-max {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

/* PROGRESS BAR */
.hero-card__bar-bg {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: #F0F0F0;
  overflow: hidden;
  margin-bottom: 12px;
}

.hero-card__bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.6s ease, background-color 0.4s ease;
}

.fill--success { background-color: var(--color-success); }
.fill--danger  { background-color: var(--color-danger); }

/* WARNING ROW */
.hero-card__warning {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--color-text-secondary);
}

.hero-card__warning .material-symbols-outlined {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.hero-card__warning p {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
}

.hero-card__warning.warning--active {
  color: var(--color-danger);
  font-weight: 500;
}

@media (max-width: 640px) {
  .hero-card {
    padding: 24px;
  }
  .hero-card__kpi {
    font-size: 56px;
  }
  .hero-card__kpi-max {
    font-size: 22px;
  }
}
</style>
