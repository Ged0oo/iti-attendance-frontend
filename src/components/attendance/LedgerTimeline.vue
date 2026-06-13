<template>
  <!-- Empty state -->
  <div v-if="!entries || entries.length === 0" class="timeline-empty">
    <span class="material-symbols-outlined">history</span>
    <p>No deductions recorded yet.</p>
  </div>

  <!-- Timeline -->
  <div v-else class="timeline" role="list">
    <div
      v-for="entry in entries"
      :key="entry.id ?? entry.created_at"
      class="timeline__item"
      role="listitem"
    >
      <!-- LEFT: date column -->
      <div class="timeline__date">
        <span class="timeline__date-text">{{ formatDate(entry.created_at) }}</span>
        <span class="timeline__day-text">{{ formatDay(entry.created_at) }}</span>
      </div>

      <!-- CENTER: track line + dot -->
      <div class="timeline__spine">
        <div class="timeline__line"></div>
        <div
          class="timeline__dot"
          :class="dotClass(entry.delta)"
          :title="dotLabel(entry.delta)"
        ></div>
      </div>

      <!-- RIGHT: reason + badge -->
      <div class="timeline__content">
        <p class="timeline__reason">{{ entry.reason || 'Ledger event' }}</p>
        <span
          class="timeline__badge"
          :class="entry.delta < 0 ? 'badge--deduction' : entry.delta > 0 ? 'badge--credit' : 'badge--neutral'"
        >
          {{ formatDelta(entry.delta) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  entries: { type: Array, required: true }
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatDelta(delta) {
  if (delta == null) return '—';
  return delta >= 0 ? `+${delta} pts` : `${delta} pts`;
}

function dotClass(delta) {
  if (delta < 0) return 'dot--danger';
  if (delta > 0) return 'dot--success';
  return 'dot--neutral';
}

function dotLabel(delta) {
  if (delta < 0) return 'Deduction';
  if (delta > 0) return 'Credit';
  return 'Event';
}
</script>

<style scoped>
/* ── Empty state ── */
.timeline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  color: #6B7280;
}
.timeline-empty .material-symbols-outlined {
  font-size: 48px;
  opacity: 0.4;
}
.timeline-empty p {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  margin: 0;
}

/* ── Timeline wrapper ── */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Single row ── */
.timeline__item {
  display: grid;
  /* date | spine | content */
  grid-template-columns: 120px 24px 1fr;
  align-items: flex-start;
  gap: 0 12px;
  padding: 20px 0;
  position: relative;
}
.timeline__item:not(:last-child) {
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

/* ── Date column ── */
.timeline__date {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-top: 2px;
  gap: 2px;
}
.timeline__date-text {
  font-family: "JetBrains Mono", "Courier New", monospace;
  font-size: 12px;
  color: #6B7280;
  white-space: nowrap;
}
.timeline__day-text {
  font-family: "JetBrains Mono", "Courier New", monospace;
  font-size: 11px;
  color: #9CA3AF;
}

/* ── Spine ── */
.timeline__spine {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-height: 100%;
}
.timeline__line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1.5px;
  background: #E5E7EB;
  transform: translateX(-50%);
}
/* Hide line top cap on first item, bottom cap on last */
.timeline__item:first-child .timeline__line {
  top: 14px;
}
.timeline__item:last-child .timeline__line {
  bottom: calc(100% - 14px);
}

.timeline__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  position: relative;
  z-index: 2;
  box-shadow: 0 0 0 3px #fff;
  transition: transform 0.2s;
}
.timeline__item:hover .timeline__dot {
  transform: scale(1.25);
}
.dot--danger  { background-color: #DC2626; }
.dot--success { background-color: #059669; }
.dot--neutral { background-color: #9CA3AF; }

/* ── Content column ── */
.timeline__content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.timeline__reason {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
  margin: 0;
  padding-top: 2px;
  flex: 1;
  min-width: 0;
}

/* ── Delta badge ── */
.timeline__badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge--deduction {
  background: #FEF2F2;
  color: #DC2626;
}
.badge--credit {
  background: #ECFDF5;
  color: #059669;
}
.badge--neutral {
  background: #F3F4F6;
  color: #6B7280;
}

/* ── Mobile: collapse date into content ── */
@media (max-width: 540px) {
  .timeline__item {
    grid-template-columns: 24px 1fr;
  }
  .timeline__date {
    display: none;
  }
  .timeline__reason::before {
    /* inject date as a visible prefix on mobile via attr trick — handled in parent */
    display: none;
  }
}
</style>
