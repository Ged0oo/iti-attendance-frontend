<template>
  <main class="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop bg-canvas min-h-screen">
    <div class="max-w-6xl mx-auto space-y-6">
      
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button @click="router.back()" class="flex items-center text-on-surface-variant hover:text-primary transition-colors mb-2 font-label">
            <span class="material-symbols-outlined text-[20px] mr-1">arrow_back</span>
            Back to Schedule
          </button>
          <h1 class="font-h2 text-primary font-bold">Session Attendance</h1>
          <p class="font-body-sm text-on-surface-variant mt-1">Review student scans and finalize the session log.</p>
        </div>
        
        <div class="flex gap-3">
          <button @click="fetchAttendance" class="px-4 py-2 bg-surface border border-outline-variant rounded-lg font-label text-on-surface hover:bg-surface-variant/50 transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
          <button 
            @click="closeSession" 
            :disabled="isClosing"
            class="px-5 py-2 bg-danger text-white rounded-lg font-label shadow-sm hover:bg-danger/90 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            <span v-if="isClosing" class="material-symbols-outlined animate-spin text-[18px]">sync</span>
            <span v-else class="material-symbols-outlined text-[18px]">lock</span>
            Close Session
          </button>
        </div>
      </header>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-soft">
          <p class="font-label text-on-surface-variant text-[12px] uppercase tracking-wider">Total Enrolled</p>
          <p class="font-h2 text-on-surface mt-1">{{ stats.total }}</p>
        </div>
        <div class="bg-surface p-4 rounded-xl border border-success/30 shadow-soft">
          <p class="font-label text-success text-[12px] uppercase tracking-wider">Present</p>
          <p class="font-h2 text-success mt-1">{{ stats.present }}</p>
        </div>
        <div class="bg-surface p-4 rounded-xl border border-danger/30 shadow-soft">
          <p class="font-label text-danger text-[12px] uppercase tracking-wider">Absent</p>
          <p class="font-h2 text-danger mt-1">{{ stats.absent }}</p>
        </div>
        <div class="bg-surface p-4 rounded-xl border border-warning/30 shadow-soft">
          <p class="font-label text-warning text-[12px] uppercase tracking-wider">Excused</p>
          <p class="font-h2 text-warning mt-1">{{ stats.excused }}</p>
        </div>
      </div>

      <div class="bg-surface rounded-2xl shadow-elevated border border-outline-variant/30 overflow-hidden">
        
        <div v-if="loading" class="p-12 flex justify-center">
          <span class="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
        </div>
        
        <div v-else-if="records.length === 0" class="p-12 text-center">
          <span class="material-symbols-outlined text-on-surface-variant/50 text-[48px] mb-3">group_off</span>
          <p class="font-body-md text-on-surface-variant">No attendance records found for this session.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-sunken border-b border-outline-variant/30 font-label-caps text-[12px] text-on-surface-variant uppercase tracking-wider">
                <th class="p-4 font-medium">Student Name</th>
                <th class="p-4 font-medium">Status</th>
                <th class="p-4 font-medium">Arrived At</th>
                <th class="p-4 font-medium">Left At</th>
              </tr>
            </thead>
            <tbody class="font-body-sm text-on-surface divide-y divide-outline-variant/20">
              <tr v-for="record in records" :key="record.id" class="hover:bg-surface-variant/20 transition-colors">
                <td class="p-4 font-medium">{{ record.student?.user?.name || 'Unknown' }}</td>
                <td class="p-4">
                  <span :class="getStatusBadgeClass(record.status)">
                    {{ record.status }}
                  </span>
                </td>
                <td class="p-4 font-mono text-[13px] text-on-surface-variant">
                  {{ formatTime(record.arrived_at) }}
                </td>
                <td class="p-4 font-mono text-[13px] text-on-surface-variant">
                  {{ formatTime(record.left_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();
const sessionId = route.params.id;

const loading = ref(true);
const isClosing = ref(false);
const records = ref([]);

const fetchAttendance = async () => {
  loading.value = true;
  try {
    const response = await api.get(`/sessions/${sessionId}/attendance`);
    records.value = response.data.data || response.data;
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    alert("Could not load attendance data.");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAttendance();
});

const closeSession = async () => {
  if (!confirm("Are you sure you want to close this session? Any student who hasn't scanned will be marked absent and receive a 25-point deduction.")) {
    return;
  }
  
  isClosing.value = true;
  try {
    await api.post(`/sessions/${sessionId}/close`);
    alert("Session closed successfully.");
    await fetchAttendance(); // Refresh to show the new 'absent' records
  } catch (error) {
    console.error("Failed to close session:", error);
    alert(error.response?.data?.message || "Failed to close the session.");
  } finally {
    isClosing.value = false;
  }
};

// Computed Stats
const stats = computed(() => {
  return {
    total: records.value.length,
    present: records.value.filter(r => r.status === 'present').length,
    absent: records.value.filter(r => r.status === 'absent').length,
    excused: records.value.filter(r => r.status === 'excused').length,
  };
});

// UI Utilities
const getStatusBadgeClass = (status) => {
  const base = "px-2.5 py-1 rounded-full text-[11px] font-label-caps uppercase tracking-wider border ";
  switch (status) {
    case 'present': return base + "bg-success-mist text-success border-success/20";
    case 'absent': return base + "bg-danger-mist text-danger border-danger/20";
    case 'excused': return base + "bg-warning-mist text-warning border-warning/20";
    default: return base + "bg-surface-variant text-on-surface-variant border-outline-variant";
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return '--:--';
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(dateStr));
};
</script>