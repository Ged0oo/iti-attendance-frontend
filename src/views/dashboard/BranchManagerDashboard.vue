<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import { useCohortStore } from '../../stores/cohort'

const store = useCohortStore()

const atRisk = ref([])
const billingRecords = ref([])
const attendanceRate = ref(null)

function num(v) {
  return Number(v || 0)
}
function fmt(n) {
  return num(n).toLocaleString('en-US')
}

const activeTracks = computed(() => store.tracks.length)
const pendingBilling = computed(() =>
  billingRecords.value
    .filter((b) => b.status === 'draft')
    .reduce((sum, b) => sum + num(b.total_amount), 0),
)

const kpis = computed(() => [
  { label: 'Active Tracks', value: String(activeTracks.value), icon: 'layers', tone: 'primary', path: 'M0 35 Q 15 10, 30 25 T 60 15 T 100 5' },
  { label: 'At-Risk Students', value: String(atRisk.value.length), icon: 'warning', tone: 'warning', mono: true, valueTone: atRisk.value.length ? 'warning' : null, path: 'M0 30 Q 20 35, 40 20 T 70 10 T 100 25' },
  { label: 'Avg Attendance Rate', value: attendanceRate.value === null ? '—' : attendanceRate.value + '%', icon: 'trending_up', tone: 'success', path: 'M0 38 L 20 30 L 40 32 L 60 20 L 80 15 L 100 5' },
  { label: 'Pending Billing (EGP)', value: fmt(pendingBilling.value), icon: 'account_balance_wallet', tone: 'warning', mono: true, valueTone: 'warning', path: 'M0 10 Q 25 5, 50 25 T 75 35 T 100 15' },
])
const kpiTone = {
  primary: { bg: 'bg-primary-mist', text: 'text-primary-ember', hover: 'group-hover:bg-primary-ember' },
  info: { bg: 'bg-info-mist', text: 'text-info', hover: 'group-hover:bg-info' },
  success: { bg: 'bg-success-mist', text: 'text-success', hover: 'group-hover:bg-success' },
  warning: { bg: 'bg-warning-mist', text: 'text-warning', hover: 'group-hover:bg-warning' },
}

const billing = computed(() => {
  const rows = {}
  for (const b of billingRecords.value) {
    const key = b.cohort_id
    rows[key] ??= { track: `Cohort ${b.cohort_id}`, internal: 0, external: 0, total: 0 }
    if (b.compensation_type === 'internal') rows[key].internal += num(b.delivered_hours)
    else rows[key].external += num(b.delivered_hours)
    rows[key].total += num(b.total_amount)
  }
  return Object.values(rows)
})
const billingTotal = computed(() => fmt(billing.value.reduce((s, r) => s + r.total, 0)))

onMounted(async () => {
  if (!store.tracks.length) await store.fetchTracks()
  try {
    atRisk.value = await store.fetchAtRiskStudents()
  } catch (e) { /* ignore */ }
  try {
    billingRecords.value = await store.fetchBilling()
  } catch (e) { /* ignore */ }
  try {
    const rate = await store.fetchAttendanceRate()
    attendanceRate.value = rate.attendance_rate
  } catch (e) { /* ignore */ }
})
</script>

<template>
  <MainLayout title="Branch Overview">
    <div class="max-w-[1400px] mx-auto w-full space-y-6">
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="kpi in kpis"
          :key="kpi.label"
          class="bg-surface rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-transparent hover:border-primary-mist group"
        >
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-label-caps text-label-caps text-secondary uppercase tracking-wider">{{ kpi.label }}</h3>
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 group-hover:text-white"
              :class="[kpiTone[kpi.tone].bg, kpiTone[kpi.tone].text, kpiTone[kpi.tone].hover]"
            >
              <span class="material-symbols-outlined">{{ kpi.icon }}</span>
            </div>
          </div>
          <div class="flex items-end gap-3">
            <div class="font-kpi text-kpi" :class="[kpi.valueTone === 'warning' ? 'text-warning' : 'text-on-surface', kpi.mono ? 'font-mono' : '']">{{ kpi.value }}</div>
            <div v-if="kpi.note" class="text-on-surface-variant font-body-sm text-body-sm mb-1 opacity-70">{{ kpi.note }}</div>
          </div>
          <div class="mt-2 h-10 w-full">
            <svg class="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path :d="kpi.path" fill="none" stroke="#8B1A1A" stroke-width="2" vector-effect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-surface rounded-xl p-6 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-h3 text-h3 text-on-surface">Tracks Overview</h2>
            <router-link :to="{ name: 'tracks' }" class="text-secondary hover:text-primary transition-colors text-sm font-medium flex items-center gap-1">
              Manage Tracks <span class="material-symbols-outlined text-[16px]">chevron_right</span>
            </router-link>
          </div>
          <div class="space-y-3 max-h-72 overflow-y-auto">
            <p v-if="!store.tracks.length" class="text-on-surface-variant font-body-sm text-body-sm py-6 text-center">No tracks yet.</p>
            <div
              v-for="t in store.tracks"
              :key="t.id"
              class="flex items-center justify-between p-3 rounded-lg bg-canvas hover:bg-primary-mist transition-colors"
            >
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-success"></span>
                <span class="font-body-md text-body-md font-medium text-on-surface">{{ t.name }}</span>
              </div>
              <span class="font-mono text-mono text-on-surface-variant">TRK-{{ t.id }}</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 bg-surface rounded-xl p-6 shadow-sm flex flex-col">
          <h2 class="font-h3 text-h3 text-on-surface mb-6">Student Health</h2>
          <div class="flex-1 flex items-center justify-center relative">
            <div
              class="w-48 h-48 rounded-full relative shadow-inner"
              :style="{ background: atRisk.length ? 'conic-gradient(#DC2626 0% 12%, #059669 12% 100%)' : 'conic-gradient(#059669 0% 100%)' }"
            >
              <div class="absolute inset-4 bg-surface rounded-full flex flex-col items-center justify-center shadow-sm">
                <span class="font-label text-label text-secondary">At-Risk</span>
                <span class="font-mono text-h2 text-on-surface mt-1">{{ atRisk.length }}</span>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-center gap-6">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-[#DC2626]"></div>
              <span class="font-body-sm text-on-surface-variant">At-Risk ({{ atRisk.length }})</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-[#059669]"></div>
              <span class="font-body-sm text-on-surface-variant">Healthy</span>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        <div class="bg-surface rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div class="p-5 border-b border-outline-variant flex justify-between items-center bg-danger">
            <h2 class="font-h3 text-h3 text-white flex items-center gap-2">
              <span class="material-symbols-outlined">warning</span> At-Risk Students
            </h2>
            <button class="hover:opacity-80 transition-opacity text-sm font-medium text-white">View All</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-outline-variant bg-surface-bright">
                  <th class="py-3 px-5 font-label-caps text-label-caps text-secondary uppercase">Name</th>
                  <th class="py-3 px-5 font-label-caps text-label-caps text-secondary uppercase">National ID</th>
                  <th class="py-3 px-5 font-label-caps text-label-caps text-secondary uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-variant">
                <tr v-if="!atRisk.length">
                  <td colspan="3" class="py-8 px-5 text-center text-on-surface-variant font-body-sm text-body-sm">
                    No at-risk students.
                  </td>
                </tr>
                <tr v-for="s in atRisk" :key="s.id" class="hover:bg-primary-mist/50 transition-colors">
                  <td class="py-3 px-5 font-body-sm font-medium text-on-surface">{{ s.user?.name || 'Student #' + s.id }}</td>
                  <td class="py-3 px-5 font-mono text-mono text-on-surface-variant">{{ s.national_id || '—' }}</td>
                  <td class="py-3 px-5 text-right">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger-mist text-danger border border-danger/20">At-Risk</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-surface rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div class="p-5 border-b border-outline-variant flex justify-between items-center bg-shell">
            <h2 class="font-h3 text-h3 text-white">Billing Summary</h2>
            <button aria-label="Download" class="text-outline hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
              <span class="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
          <div class="overflow-x-auto flex-1 flex flex-col">
            <table class="w-full text-left border-collapse flex-1">
              <thead>
                <tr class="border-b border-outline-variant bg-surface-bright">
                  <th class="py-3 px-5 font-label-caps text-label-caps text-secondary uppercase">Track</th>
                  <th class="py-3 px-5 font-label-caps text-label-caps text-secondary uppercase text-right">Internal Hrs</th>
                  <th class="py-3 px-5 font-label-caps text-label-caps text-secondary uppercase text-right">External Hrs</th>
                  <th class="py-3 px-5 font-label-caps text-label-caps text-secondary uppercase text-right">Total EGP</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-variant">
                <tr v-if="!billing.length">
                  <td colspan="4" class="py-8 px-5 text-center text-on-surface-variant font-body-sm text-body-sm">
                    No billing records yet.
                  </td>
                </tr>
                <tr v-for="b in billing" :key="b.track" class="hover:bg-primary-mist/50 transition-colors">
                  <td class="py-3 px-5 font-body-sm font-medium text-on-surface">{{ b.track }}</td>
                  <td class="py-3 px-5 font-mono text-on-surface-variant text-right">{{ b.internal }}</td>
                  <td class="py-3 px-5 font-mono text-on-surface-variant text-right">{{ b.external }}</td>
                  <td class="py-3 px-5 font-mono font-medium text-on-surface text-right">{{ fmt(b.total) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-surface-variant border-t border-outline-variant">
                  <td class="py-4 px-5 font-label-caps text-label-caps text-on-surface uppercase font-bold" colspan="3">GRAND TOTAL</td>
                  <td class="py-4 px-5 font-mono font-bold text-primary-deep text-right text-lg">{{ billingTotal }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>
    </div>
  </MainLayout>
</template>
