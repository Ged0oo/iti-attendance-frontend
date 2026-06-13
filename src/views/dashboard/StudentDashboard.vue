<template>
  <div class="dashboard-container">
    <!-- Header Section -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="greeting-row">
          <h1 class="greeting">Good morning, {{ authStore.user?.name || 'Student' }} <span class="animate-wave inline-block">👋</span></h1>
          <span v-if="authStore.user?.cohort" class="cohort-badge">
            {{ authStore.user?.cohort?.name }}
          </span>
        </div>
        <p class="subtitle">Here is your daily academic overview.</p>
      </div>
      <div class="header-right">
        <button class="notification-btn">
          <span class="material-symbols-outlined">notifications</span>
          <span class="notification-dot" v-if="pendingActionsCount > 0"></span>
        </button>
        <div class="profile-avatar hidden md-block">
          <img src="https://ui-avatars.com/api/?name=Student&background=8B1A1A&color=fff" alt="Profile" />
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your dashboard...</p>
    </div>

    <template v-else>
      <!-- Row 1: Summary Cards -->
      <div class="summary-cards-grid">
        <!-- Card 1: Attendance Balance -->
        <SummaryCard
          title="Attendance Balance"
          icon="calendar_month"
          :variant="ledgerStore.isAtRisk ? 'at-risk' : 'success'"
        >
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="kpi-value">{{ ledgerStore.balance }}</span>
              <span class="kpi-total">/ 250 pts</span>
            </div>
          </div>
          <div class="mt-6">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill bg-success" :style="{ width: `${Math.min(100, Math.max(0, (ledgerStore.balance / 250) * 100))}%` }"></div>
            </div>
            <div class="status-text" :class="{ 'text-danger': ledgerStore.isAtRisk }">
              <span class="material-symbols-outlined text-[14px]">warning</span>
              <span>{{ ledgerStore.isAtRisk ? 'At-risk below 150 pts' : 'Good standing' }}</span>
            </div>
          </div>
        </SummaryCard>

        <!-- Card 2: Grand Total Score -->
        <SummaryCard title="Grand Total Score" icon="emoji_events" variant="primary">
          <div class="mt-4 flex-between">
            <div class="flex items-baseline gap-2">
              <span class="kpi-value">{{ grandTotal }}</span>
              <span class="kpi-total">/ {{ maxGrandTotal }}</span>
            </div>
            <div class="flex-center gap-3">
              <span class="grade-badge">{{ currentGrade }}</span>
              <GrandTotalRing :total="grandTotal" :max="maxGrandTotal" :grade-letter="currentGrade" />
            </div>
          </div>
          <div class="mt-6 text-right text-sm text-secondary">
            <span>+0 pts since last week</span>
          </div>
        </SummaryCard>

        <!-- Card 3: Pending Actions -->
        <SummaryCard title="Pending Actions" icon="assignment_late" variant="warning">
          <div class="mt-4 flex-col-center">
            <span class="kpi-value text-warning">{{ pendingActionsCount }}</span>
            <span class="kpi-subtitle mt-2">Unanswered items</span>
          </div>
        </SummaryCard>
      </div>

      <!-- Row 2: Panels -->
      <div class="panels-grid">
        <!-- Left Panel: Announcements -->
        <div class="panel col-5">
          <div class="panel-header">
            <h2 class="panel-title">Recent Announcements</h2>
            <span class="material-symbols-outlined text-secondary">campaign</span>
          </div>
          <div class="announcements-list">
            <div v-if="announcements.length === 0" class="empty-state">No recent announcements.</div>
            <div v-for="ann in announcements.slice(0,3)" :key="ann.id" class="announcement-item">
              <div class="announcement-header">
                <div class="announcer-info">
                  <span class="announcer-name">{{ ann.author_name || 'Admin' }}</span>
                  <span class="role-badge">{{ ann.author_role || 'Staff' }}</span>
                </div>
                <span class="announcement-time">{{ formatDateShort(ann.created_at) }}</span>
              </div>
              <p class="announcement-title">{{ ann.title }}</p>
            </div>
          </div>
          <div class="panel-footer">
            <a href="#" class="view-all-link">
              View All <span class="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
        </div>

        <!-- Right Panel: Course Grades -->
        <div class="panel col-7 no-padding">
          <div class="panel-header-padded">
            <h2 class="panel-title">My Course Grades</h2>
            <button class="icon-btn"><span class="material-symbols-outlined">more_vert</span></button>
          </div>
          <div class="course-grades-list">
            <CourseGradeBar 
              v-for="grade in courseGrades" 
              :key="grade.course.name"
              :course-obj="grade"
            />
            <div v-if="courseGrades.length === 0" class="empty-state py-4 text-center">
              No grades available yet.
            </div>
          </div>
        </div>
      </div>

      <!-- Row 3: Upcoming Sessions -->
      <div class="sessions-section">
        <div class="sessions-header">
          <h2 class="panel-title">Upcoming Sessions</h2>
          <div class="sessions-nav">
            <button class="nav-btn" @click="scrollSessions(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
            <button class="nav-btn" @click="scrollSessions(1)"><span class="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
        <div class="sessions-scroll" ref="sessionsScrollRef">
          <div v-if="sessions.length === 0" class="empty-state">No upcoming sessions scheduled.</div>
          <SessionCard 
            v-for="session in sessions"
            :key="session.id"
            :date="formatDateShort(session.start_time)"
            :type="session.type || 'Lecture'"
            :title="session.title || 'Session'"
            :instructor="session.instructor_name || 'TBA'"
            :time="formatTimeRange(session.start_time, session.end_time)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useLedgerStore } from '@/stores/ledger';
import api from '@/services/api';

import SummaryCard from '@/components/student/SummaryCard.vue';
import GrandTotalRing from '@/components/student/GrandTotalRing.vue';
import CourseGradeBar from '@/components/student/CourseGradeBar.vue';
import SessionCard from '@/components/student/SessionCard.vue';

const authStore = useAuthStore();
const ledgerStore = useLedgerStore();

const isLoading = ref(true);
const announcements = ref([]);
const sessions = ref([]);
const courseGrades = ref([]);
const pendingActionsCount = ref(0);

const sessionsScrollRef = ref(null);

const scrollSessions = (direction) => {
  if (sessionsScrollRef.value) {
    const scrollAmount = 344; // Card width + gap
    sessionsScrollRef.value.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
  }
};

const grandTotal = computed(() => {
  // Grand Total = Attendance Ledger + Sum of Course Normalized Scores
  const courseSum = courseGrades.value.reduce((sum, g) => sum + (g.total_score || 0), 0);
  return ledgerStore.balance + courseSum;
});

const maxGrandTotal = computed(() => {
  const courseMax = courseGrades.value.reduce((sum, g) => sum + (g.course?.max_score || 100), 0)
  return 250 + courseMax;
});

const currentGrade = computed(() => {
  if (maxGrandTotal.value === 0) return 'N/A';
  const pct = grandTotal.value / maxGrandTotal.value;
  if (pct >= 0.9) return 'A';
  if (pct >= 0.85) return 'A-';
  if (pct >= 0.8) return 'B+';
  if (pct >= 0.75) return 'B';
  if (pct >= 0.7) return 'C+';
  return 'C';
});

onMounted(async () => {
  try {
    if (!authStore.user) {
      await authStore.fetchMe();
    }
    
    const studentId = authStore.user?.student_id;
    const cohortId = authStore.user?.cohort_id;

    if (studentId) {
      // Don't await here directly if we want parallel fetching
      ledgerStore.fetchLedger(studentId).catch(() => {});
    }

    const promises = [];

    // Fetch sessions
    promises.push(
      api.get('/sessions').then(res => {
        sessions.value = res.data.data || res.data || [];
      }).catch(() => {})
    );

    // Fetch announcements
    if (cohortId) {
      promises.push(
        api.get(`/cohorts/${cohortId}/announcements`).then(res => {
          announcements.value = res.data.data || res.data || [];
        }).catch(() => {})
      );
    }

    // Fetch excuse requests (for pending actions count)
    promises.push(
      api.get('/excuse-requests').then(res => {
        const requests = res.data.data || res.data || [];
        pendingActionsCount.value = requests.filter((r) => r.status === 'pending').length;
      }).catch(() => {})
    );

    // Fetch real course grades from grade-card endpoint
    if (studentId) {
      promises.push(
        api.get(`/students/${studentId}/grade-card`).then(res => {
          const gradeCardData = res.data?.data || res.data
          courseGrades.value = (gradeCardData?.courses || []).map((c) => ({
            course: {
              name: c.course?.name || c.name || 'Course',
              max_score: Number(c.course?.max_score) || Number(c.max_score) || 100
            },
            total_score: Number(c.total_score) || 0,
            components: (c.components || []).map((comp) => ({
              effective_score: Number(comp.effective_score) || 0,
              grade_component: {
                name: comp.grade_component?.name || comp.name || 'Component',
                weight: Number(comp.grade_component?.weight) || Number(comp.weight) || 100
              }
            }))
          }))
        }).catch(() => {
          courseGrades.value = []
        })
      )
    }

    await Promise.allSettled(promises);
  } catch {
    // silently fail on dashboard load
  } finally {
    isLoading.value = false;
  }
});

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTimeRange = (start, end) => {
  if (!start) return '';
  const formatTime = (timeStr) => {
    const d = new Date(timeStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  return `${formatTime(start)} - ${end ? formatTime(end) : '?'}`;
};
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
    gap: 24px;
  }
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.greeting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.greeting {
  font-family: "DM Serif Display", "Playfair Display", serif;
  font-size: 36px;
  line-height: 1.15;
  color: var(--color-text, #1A1A2E);
  margin: 0;
}

.cohort-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background-color: var(--color-primary-mist, #F9EAEA);
  color: var(--color-primary, #8B1A1A);
  border: 1px solid rgba(139, 26, 26, 0.2);
}

.subtitle {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  color: var(--color-text-secondary, #6B7280);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-surface, #FFFFFF);
  border: 1px solid rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary, #6B7280);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.notification-btn:hover {
  color: var(--color-primary, #8B1A1A);
  background-color: var(--color-primary-mist, #F9EAEA);
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background-color: var(--color-danger, #DC2626);
  border-radius: 50%;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.1);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hidden {
  display: none;
}
@media (min-width: 768px) {
  .md-block {
    display: block;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  color: var(--color-text-secondary, #6B7280);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(139, 26, 26, 0.1);
  border-top-color: var(--color-primary, #8B1A1A);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 24px;
}

@media (min-width: 768px) {
  .summary-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.kpi-value {
  font-family: "DM Serif Display", "Playfair Display", serif;
  font-size: 40px;
  line-height: 1;
  color: var(--color-text, #1A1A2E);
}

.kpi-total {
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-secondary, #6B7280);
}

.kpi-subtitle {
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-secondary, #6B7280);
}

.progress-bar-bg {
  width: 100%;
  background-color: rgba(0,0,0,0.05);
  border-radius: 9999px;
  height: 6px;
  margin-bottom: 8px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease-out;
}

.bg-success { background-color: var(--color-success, #059669); }

.status-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary, #6B7280);
}

.text-danger {
  color: var(--color-danger, #DC2626);
}
.text-warning {
  color: var(--color-warning, #D97706);
}
.text-secondary {
  color: var(--color-text-secondary, #6B7280);
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  align-items: center;
}

.flex-col-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  height: 100%;
}

.grade-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: bold;
  background-color: rgba(139, 26, 26, 0.1);
  color: var(--color-primary, #8B1A1A);
}

.panels-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 1024px) {
  .panels-grid {
    grid-template-columns: repeat(12, 1fr);
  }
  .col-5 { grid-column: span 5 / span 5; }
  .col-7 { grid-column: span 7 / span 7; }
}

.panel {
  background-color: var(--color-surface, #FFFFFF);
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.panel.no-padding {
  padding: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-header-padded {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.panel-title {
  font-family: "DM Serif Display", "Playfair Display", serif;
  font-size: 28px;
  color: var(--color-text, #1A1A2E);
  margin: 0;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary, #6B7280);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: color 0.2s, background-color 0.2s;
}

.icon-btn:hover {
  color: var(--color-primary, #8B1A1A);
  background-color: rgba(0,0,0,0.05);
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.announcement-item {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  cursor: pointer;
  transition: background-color 0.2s;
}

.announcement-item:hover {
  background-color: rgba(0,0,0,0.02);
}

.announcement-item:hover .announcement-title {
  color: var(--color-primary, #8B1A1A);
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.announcer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.announcer-name {
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #1A1A2E);
}

.role-badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  background-color: rgba(13, 148, 136, 0.1);
  color: #0D9488;
}

.announcement-time {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: var(--color-text-secondary, #6B7280);
}

.announcement-title {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: var(--color-text, #1A1A2E);
  margin: 0;
  transition: color 0.2s;
}

.panel-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0,0,0,0.05);
  text-align: center;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary, #8B1A1A);
  text-decoration: none;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: var(--color-primary-deep, #6B1212);
}

.view-all-link .material-symbols-outlined {
  font-size: 16px;
}

.course-grades-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.sessions-section {
  display: flex;
  flex-direction: column;
}

.sessions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.sessions-nav {
  display: flex;
  gap: 8px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary, #6B7280);
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background-color: rgba(0,0,0,0.05);
}

.sessions-scroll {
  display: flex;
  overflow-x: auto;
  gap: 24px;
  padding-bottom: 16px;
  scroll-snap-type: x mandatory;
}

.sessions-scroll::-webkit-scrollbar {
  display: none;
}
.sessions-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.empty-state {
  color: var(--color-text-secondary, #6B7280);
  font-style: italic;
  padding: 16px;
}

@keyframes wave {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}
.animate-wave {
  transform-origin: 70% 70%;
  animation: wave 2.5s infinite;
  display: inline-block;
}
</style>
