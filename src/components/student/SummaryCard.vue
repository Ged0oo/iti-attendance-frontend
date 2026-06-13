<template>
  <div class="summary-card group" :class="`variant-${variant}`">
    <div class="summary-card__bg"></div>
    <div class="relative z-10 flex flex-col h-full justify-between flex-1">
      <div>
        <div class="flex justify-between items-start mb-2">
          <h3 class="summary-card__title">{{ title }}</h3>
          <span class="material-symbols-outlined summary-card__icon">{{ icon }}</span>
        </div>
        <slot></slot>
      </div>
      <div v-if="$slots.footer" class="mt-auto">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  variant: { type: String, default: 'primary' }
});
</script>

<style scoped>
.summary-card {
  background-color: var(--color-surface, #FFFFFF);
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.04);
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  height: 100%;
}
.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0,0,0,0.08);
  border-color: rgba(0,0,0,0.08);
}
.summary-card__bg {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  opacity: 0;
  transition: opacity 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  pointer-events: none;
}
.summary-card:hover .summary-card__bg {
  opacity: 1;
}
.summary-card__title {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary, #6B7280);
  margin: 0;
  transition: color 0.3s;
}
.summary-card:hover .summary-card__title {
  color: var(--color-text, #1A1A2E);
}
.summary-card__icon {
  font-size: 24px;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), color 0.3s;
}
.summary-card:hover .summary-card__icon {
  transform: scale(1.15) rotate(5deg);
}

/* Variants */
.variant-success .summary-card__bg {
  background: radial-gradient(circle at top right, rgba(5, 150, 105, 0.12), transparent 70%);
}
.variant-success .summary-card__icon {
  color: var(--color-success, #059669);
}

.variant-primary .summary-card__bg {
  background: radial-gradient(circle at top right, rgba(139, 26, 26, 0.12), transparent 70%);
}
.variant-primary .summary-card__icon {
  color: var(--color-primary, #8B1A1A);
}

.variant-warning .summary-card__bg {
  background: radial-gradient(circle at top right, rgba(217, 119, 6, 0.12), transparent 70%);
}
.variant-warning .summary-card__icon {
  color: var(--color-warning, #D97706);
}

.variant-at-risk .summary-card__bg {
  background: radial-gradient(circle at top right, rgba(220, 38, 38, 0.15), transparent 70%);
}
.variant-at-risk .summary-card__icon {
  color: #DC2626;
}
.variant-at-risk {
  border: 1px solid rgba(220, 38, 38, 0.2);
}
.variant-at-risk:hover {
  border-color: rgba(220, 38, 38, 0.4);
  box-shadow: 0 12px 24px -8px rgba(220, 38, 38, 0.15);
}
</style>
