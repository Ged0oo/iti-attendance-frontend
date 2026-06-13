<template>
  <div class="summary-card" :class="`variant-${variant}`">
    <div class="summary-card__bg"></div>
    <div class="summary-card__content">
      <div class="summary-card__header">
        <h3 class="summary-card__title">{{ title }}</h3>
        <span class="material-symbols-outlined summary-card__icon">{{ icon }}</span>
      </div>
      <slot></slot>
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
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s;
  height: 100%;
}
.summary-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.summary-card__bg {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  opacity: 0;
  transition: opacity 0.3s;
}
.summary-card:hover .summary-card__bg {
  opacity: 1;
}
.summary-card__content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.summary-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.summary-card__title {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary, #6B7280);
  margin: 0;
}
.summary-card__icon {
  font-size: 24px;
}

/* Variants */
.variant-success .summary-card__bg {
  background: linear-gradient(to bottom right, rgba(5, 150, 105, 0.1), transparent);
}
.variant-success .summary-card__icon {
  color: var(--color-success, #059669);
}

.variant-primary .summary-card__bg {
  background: linear-gradient(to bottom right, rgba(139, 26, 26, 0.1), transparent);
}
.variant-primary .summary-card__icon {
  color: var(--color-primary, #8B1A1A);
}

.variant-warning .summary-card__bg {
  background: linear-gradient(to bottom right, rgba(217, 119, 6, 0.1), transparent);
}
.variant-warning .summary-card__icon {
  color: var(--color-warning, #D97706);
}

.variant-at-risk .summary-card__bg {
  background: linear-gradient(to bottom right, rgba(220, 38, 38, 0.12), transparent);
}
.variant-at-risk .summary-card__icon {
  color: #DC2626;
}
.variant-at-risk {
  border: 1px solid rgba(220, 38, 38, 0.2);
}
</style>
