<template>
  <div class="session-card" :class="[`type-${type.toLowerCase()}`]">
    <div class="session-card__icon-bg">
      <span class="material-symbols-outlined">{{ backgroundIcon }}</span>
    </div>
    <div class="session-card__content">
      <div class="session-card__header">
        <span class="session-card__date">{{ date }}</span>
        <span class="session-card__badge">{{ type }}</span>
      </div>
      <h3 class="session-card__title">{{ title }}</h3>
      <p class="session-card__instructor">{{ instructor }}</p>
      <div class="session-card__footer">
        <span class="material-symbols-outlined">schedule</span>
        <span class="session-card__time">{{ time }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  date: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  time: { type: String, required: true }
});

const backgroundIcon = computed(() => {
  const t = props.type.toLowerCase();
  if (t === 'lecture') return 'menu_book';
  if (t === 'lab') return 'computer';
  if (t === 'business' || t === 'soft skills') return 'business_center';
  return 'event';
});
</script>

<style scoped>
.session-card {
  min-width: 280px;
  background-color: var(--color-surface, #FFFFFF);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border-top: 4px solid var(--color-primary, #8B1A1A);
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .session-card {
    min-width: 320px;
  }
}

.session-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.session-card__icon-bg {
  position: absolute;
  top: 0;
  right: 0;
  padding: 16px;
  opacity: 0.05;
  transition: opacity 0.3s;
  pointer-events: none;
}
.session-card:hover .session-card__icon-bg {
  opacity: 0.1;
}
.session-card__icon-bg .material-symbols-outlined {
  font-size: 64px;
}

.session-card__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.session-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.session-card__date {
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
  color: var(--color-text-secondary, #6B7280);
}

.session-card__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  background-color: rgba(139, 26, 26, 0.1);
  color: var(--color-primary, #8B1A1A);
}

.session-card__title {
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text, #1A1A2E);
  margin: 0 0 4px 0;
}

.session-card__instructor {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  color: var(--color-text-secondary, #6B7280);
  margin: 0 0 16px 0;
}

.session-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(0,0,0,0.05);
  color: var(--color-text-secondary, #6B7280);
}
.session-card__footer .material-symbols-outlined {
  font-size: 16px;
}
.session-card__time {
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
}

/* Types */
.type-lecture { border-top-color: var(--color-primary, #8B1A1A); }
.type-lecture .session-card__badge {
  background-color: rgba(139, 26, 26, 0.1);
  color: var(--color-primary, #8B1A1A);
}

.type-lab { border-top-color: var(--color-role-instructor, #0D9488); }
.type-lab .session-card__badge {
  background-color: rgba(13, 148, 136, 0.1);
  color: var(--color-role-instructor, #0D9488);
}

.type-business { border-top-color: var(--color-warning, #D97706); }
.type-business .session-card__badge {
  background-color: rgba(217, 119, 6, 0.1);
  color: var(--color-warning, #D97706);
}
</style>
