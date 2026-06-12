<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import ConfirmModal from '../../components/common/ConfirmModal.vue'
import { useEngagementStore } from '../../stores/engagement'
import api from '../../services/api'

const store = useEngagementStore()

const cohorts = ref([])
const cohortId = ref('')
const loadingCohorts = ref(true)
const busy = ref(false)
const error = ref('')

const records = ref([])
const summary = ref(null)
const instructors = ref([])

const period = ref({ start: '2026-01-01', end: '2026-12-31' })

const confirmState = ref({ open: false, title: '', message: '', confirmLabel: 'Confirm', action: null })

const cohortLabel = (c) => (c.track?.name ? `${c.name} — ${c.track.name}` : c.name)
const instructorMap = computed(() => Object.fromEntries(instructors.value.map((i) => [i.user_id, i.user_name || `Instructor #${i.user_id}`])))
const money = (n) => Number(n || 0).toLocaleString('en-EG', { maximumFractionDigits: 2 })

const totalDelivered = computed(() => records.value.reduce((s, r) => s + Number(r.delivered_hours || 0), 0))
const totalScheduled = computed(() => records.value.reduce((s, r) => s + Number(r.scheduled_hours || 0), 0))

onMounted(async () => {
  try {
    const { data } = await api.get('/api/cohorts')
    cohorts.value = data.data ?? data ?? []
    if (cohorts.value.length) cohortId.value = cohorts.value[0].id
  } catch (e) {
    error.value = 'Could not load cohorts.'
  } finally {
    loadingCohorts.value = false
  }
  if (cohortId.value) await load()
})

async function load() {
  if (!cohortId.value) return
  error.value = ''
  busy.value = true
  try {
    const [res, inst] = await Promise.all([store.fetchBilling(cohortId.value), store.fetchInstructors()])
    records.value = [...(res.data || [])]
    summary.value = res.summary || null
    instructors.value = [...(inst || [])]
  } catch (e) {
    error.value = store.error || 'Could not load billing.'
  } finally {
    busy.value = false
  }
}

async function calculate() {
  if (!period.value.start || !period.value.end) {
    error.value = 'Pick a billing period.'
    return
  }
  error.value = ''
  busy.value = true
  try {
    const rows = await store.calculateBilling({
      cohort_id: cohortId.value,
      billing_period_start: period.value.start,
      billing_period_end: period.value.end,
    })
    records.value = [...(rows || [])]
    // refresh the split totals
    const res = await store.fetchBilling(cohortId.value)
    summary.value = res.summary || null
  } catch (e) {
    error.value = store.error || 'Could not calculate billing.'
  } finally {
    busy.value = false
  }
}

function requestFinalize(record) {
  confirmState.value = {
    open: true,
    title: 'Finalize record',
    message: `Finalize ${instructorMap.value[record.user_id] || 'this instructor'}'s billing of EGP ${money(record.total_amount)}? It will be locked.`,
    confirmLabel: 'Finalize',
    action: () => finalize(record),
  }
}
async function finalize(record) {
  error.value = ''
  try {
    const updated = await store.finalizeBilling(record.id)
    const i = records.value.findIndex((r) => r.id === record.id)
    if (i !== -1) records.value[i] = updated
  } catch (e) {
    error.value = store.error || 'Could not finalize the record.'
  }
}

function exportCsv() {
  const head = ['Instructor', 'Type', 'Scheduled Hrs', 'Delivered Hrs', 'Rate', 'Total (EGP)', 'Status']
  const lines = records.value.map((r) => [
    instructorMap.value[r.user_id] || `Instructor #${r.user_id}`,
    r.compensation_type,
    r.scheduled_hours,
    r.delivered_hours,
    r.hourly_rate ?? r.fixed_salary ?? '',
    r.total_amount,
    r.status,
  ])
  const csv = [head, ...lines].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `billing-cohort-${cohortId.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function closeConfirm() {
  confirmState.value.open = false
}
function runConfirm() {
  const action = confirmState.value.action
  closeConfirm()
  if (action) action()
}
</script>

<template>
  <MainLayout title="Billing Rollup">
    <div class="max-w-canvas mx-auto w-full">
      <header class="mb-8">
        <h2 class="font-h1 text-h1 text-on-surface mb-1">Billing Rollup</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant">Review and export instructional costs per cohort.</p>
      </header>

      <!-- controls -->
      <div class="flex items-end gap-4 flex-wrap mb-8">
        <label class="flex flex-col gap-1">
          <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Cohort</span>
          <select
            v-model="cohortId"
            @change="load"
            :disabled="loadingCohorts"
            class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container disabled:opacity-60"
          >
            <option v-if="loadingCohorts" value="">Loading…</option>
            <option v-for="c in cohorts" :key="c.id" :value="c.id">{{ cohortLabel(c) }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Period start</span>
          <input v-model="period.start" type="date" class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Period end</span>
          <input v-model="period.end" type="date" class="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
        </label>
        <button class="h-11 px-5 rounded-lg bg-primary-container text-white font-label text-label flex items-center gap-2 hover:bg-primary transition-colors shadow-elevated" @click="calculate">
          <span class="material-symbols-outlined text-[18px]">calculate</span> Calculate
        </button>
      </div>

      <p v-if="error" class="mb-4 rounded-lg bg-danger-mist text-danger border border-danger/20 px-4 py-2 font-body-sm text-body-sm">{{ error }}</p>

      <div v-if="loadingCohorts || busy" class="py-12 flex items-center justify-center gap-2 text-on-surface-variant font-body-sm">
        <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
        {{ loadingCohorts ? 'Loading cohorts…' : 'Working…' }}
      </div>

      <div v-else>
        <!-- KPI row -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
          <div class="bg-surface rounded-xl shadow-elevated p-6">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Total delivered hours</span>
            <div class="font-kpi text-kpi text-primary-deep mt-2">{{ totalDelivered }} <span class="font-h3 text-h3 text-on-surface-variant">hrs</span></div>
          </div>
          <div class="bg-surface rounded-xl shadow-elevated p-6">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">External instructor cost</span>
            <div class="font-kpi text-kpi text-on-surface mt-2">EGP {{ money(summary?.external_total) }}</div>
          </div>
          <div class="bg-surface rounded-xl shadow-elevated p-6">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Internal instructor cost</span>
            <div class="font-kpi text-kpi text-on-surface mt-2">EGP {{ money(summary?.internal_total) }}</div>
          </div>
        </section>

        <p v-if="!records.length" class="py-12 text-center text-on-surface-variant font-body-sm">
          No billing records for this cohort yet. Pick a period and press Calculate.
        </p>

        <!-- table -->
        <section v-else class="bg-surface rounded-xl shadow-elevated overflow-hidden mb-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-shell text-text-inverse">
                  <th class="py-4 px-6 font-label-caps text-label-caps uppercase">Instructor</th>
                  <th class="py-4 px-6 font-label-caps text-label-caps uppercase">Type</th>
                  <th class="py-4 px-6 font-label-caps text-label-caps uppercase text-right">Scheduled</th>
                  <th class="py-4 px-6 font-label-caps text-label-caps uppercase text-right">Delivered</th>
                  <th class="py-4 px-6 font-label-caps text-label-caps uppercase text-right">Rate</th>
                  <th class="py-4 px-6 font-label-caps text-label-caps uppercase text-right">Total (EGP)</th>
                  <th class="py-4 px-6 font-label-caps text-label-caps uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody class="font-body-md text-body-md">
                <tr v-for="(r, idx) in records" :key="r.id" class="border-b border-surface-variant" :class="idx % 2 ? 'bg-neutral-50' : ''">
                  <td class="py-4 px-6 font-medium text-on-surface">{{ instructorMap[r.user_id] || `Instructor #${r.user_id}` }}</td>
                  <td class="py-4 px-6">
                    <span
                      class="inline-flex px-2.5 py-0.5 rounded-full font-label text-label capitalize"
                      :class="r.compensation_type === 'external' ? 'border-[1.5px] border-primary-ember text-primary-ember' : 'bg-surface-sunken text-on-surface-variant'"
                    >{{ r.compensation_type }}</span>
                  </td>
                  <td class="py-4 px-6 text-right font-mono text-mono">{{ r.scheduled_hours }}</td>
                  <td class="py-4 px-6 text-right font-mono text-mono" :class="Number(r.delivered_hours) < Number(r.scheduled_hours) ? 'text-warning font-semibold' : ''">{{ r.delivered_hours }}</td>
                  <td class="py-4 px-6 text-right font-mono text-mono">{{ r.hourly_rate ?? r.fixed_salary ?? '—' }}</td>
                  <td class="py-4 px-6 text-right font-mono text-mono font-bold">{{ money(r.total_amount) }}</td>
                  <td class="py-4 px-6 text-right">
                    <span v-if="r.status === 'finalized'" class="inline-flex items-center gap-1 font-label text-label text-success"><span class="material-symbols-outlined text-[16px]">lock</span>Finalized</span>
                    <button v-else class="font-label text-label text-primary-container hover:text-primary" @click="requestFinalize(r)">Finalize</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-shell text-text-inverse font-bold">
                  <td class="py-5 px-6 font-label-caps text-label-caps uppercase" colspan="2">Grand total</td>
                  <td class="py-5 px-6 text-right font-mono text-mono">{{ totalScheduled }}</td>
                  <td class="py-5 px-6 text-right font-mono text-mono">{{ totalDelivered }}</td>
                  <td class="py-5 px-6 text-right font-mono text-mono">—</td>
                  <td class="py-5 px-6 text-right font-mono text-mono" colspan="2">EGP {{ money(summary?.grand_total) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <!-- actions -->
        <div v-if="records.length" class="flex flex-wrap justify-between items-center gap-4 pt-2">
          <div class="flex gap-3">
            <button class="bg-primary-container text-white font-label text-label py-3 px-5 rounded-lg hover:bg-primary transition-colors flex items-center gap-2" @click="exportCsv">
              <span class="material-symbols-outlined text-[18px]">download</span> Export CSV
            </button>
            <button class="border-[1.5px] border-primary-ember text-primary-ember hover:bg-primary-mist font-label text-label py-3 px-5 rounded-lg transition-colors flex items-center gap-2" @click="() => window.print()">
              <span class="material-symbols-outlined text-[18px]">print</span> Print
            </button>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Forwarded to Central Accounting · Ministry of Communications and IT</p>
        </div>
      </div>
    </div>

    <ConfirmModal
      :open="confirmState.open"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-label="confirmState.confirmLabel"
      :danger="false"
      @confirm="runConfirm"
      @cancel="closeConfirm"
    />
  </MainLayout>
</template>
