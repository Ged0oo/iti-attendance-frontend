<script setup>
import { onMounted } from 'vue';
import { useAttendanceStore } from '@/stores/attendance';
import StatusBadge from '@/components/common/StatusBadge.vue';

const attendanceStore = useAttendanceStore();

onMounted(() => {
  attendanceStore.fetchLogs(1);
  console.log("API Response Data:", attendanceStore.attendanceRecords);
});
</script>

<template>
  <main class="flex-1 flex flex-col min-w-0 p-margin-desktop">
    <header class="mb-6">
      <h2 class="font-h2 text-primary font-bold">Attendance Log</h2>
      <p class="font-body-sm text-on-surface-variant mt-1">Manage and review daily attendance records.</p>
    </header>

    <div class="bg-surface rounded-lg shadow-sm border border-outline-variant/30">
      <table class="w-full text-left">
        <thead class="bg-shell-border text-on-primary font-label">
          <tr>
            <th class="py-4 px-6">Student Name</th>
            <th class="py-4 px-6">Check-In</th>
            <th class="py-4 px-6">Status</th>
          </tr>
        </thead>
            <tbody class="divide-y divide-outline-variant/20">
            <tr v-if="attendanceStore.loading">
                <td colspan="3" class="py-4 px-6 text-center">Loading records...</td>
            </tr>
            <tr v-else-if="!attendanceStore.attendanceRecords?.length">
                <td colspan="3" class="py-4 px-6 text-center text-on-surface-variant">No attendance records found.</td>
            </tr>
            
            <tr v-for="record in attendanceStore.attendanceRecords" :key="record.id" v-else>
                <td class="py-4 px-6 font-bold">{{ record.student_name || 'N/A' }}</td>
                <td class="py-4 px-6 font-mono">{{ record.arrived_at || '--:--' }}</td>
                <td class="py-4 px-6">
                <StatusBadge :status="record.status" />
                </td>
            </tr>
            </tbody>
      </table>
    </div>
  </main>
</template>