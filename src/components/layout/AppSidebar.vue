<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { currentUser, userRole } = useAuth()

// Detect mobile on mount (same logic as QrScannerView)
const isMobile = ref(true)
onMounted(() => {
  const uaTouch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0
  isMobile.value = uaTouch || (hasTouch && window.innerWidth < 1024)
})

const allLinks = [
  // ── Shared ──────────────────────────────────────────────────────────
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard', roles: ['branch_manager', 'track_admin', 'instructor', 'student'] },
  { label: 'Users', icon: 'manage_accounts', to: '/users', roles: ['branch_manager', 'track_admin'] },
  { label: 'Tracks', icon: 'school', to: '/tracks', roles: ['branch_manager', 'track_admin'] },
  { label: 'Cohorts', icon: 'groups', to: '/cohorts', roles: ['branch_manager', 'track_admin'] },
  { label: 'Students', icon: 'group', to: '/students', roles: ['branch_manager', 'track_admin', 'instructor'] },
  { label: 'Instructors', icon: 'badge', to: '/instructors', roles: ['branch_manager', 'track_admin'] },
  { label: 'Grade Entry', icon: 'edit_note', to: '/grading/entry', roles: ['branch_manager', 'track_admin', 'instructor'] },
  { label: 'Grade Cards', icon: 'grading', to: '/grading/students', roles: ['branch_manager', 'track_admin', 'instructor'] },
  { label: 'Tags & Notes', icon: 'sell', to: '/grading/tags-notes', roles: ['branch_manager', 'track_admin', 'instructor'] },
  { label: 'Course Setup', icon: 'menu_book', to: '/scheduling/courses', roles: ['branch_manager', 'track_admin'] },
  { label: 'Scheduling', icon: 'calendar_month', to: '/scheduling/engagements', roles: ['branch_manager', 'track_admin'] },
  { label: 'Billing', icon: 'payments', to: '/billing', roles: ['branch_manager'] },

  // ── Student Portal ──────────────────────────────────────────────────
  { label: 'Attendance',    icon: 'event_available', to: '/attendance/ledger', roles: ['student'] },
  { label: 'QR Scanner',   icon: 'qr_code_scanner', to: '/attendance/scan',   roles: ['student'], mobileOnly: true },
  { label: 'Grades',       icon: 'grade',           to: '/student/grades',    roles: ['student'] },
  { label: 'Submit Excuse', icon: 'description',    to: '/excuses/submit',    roles: ['student'] },
]

const links = computed(() =>
  allLinks.filter((link) => {
    if (!link.roles.includes(userRole.value)) return false
    if (link.mobileOnly && !isMobile.value) return false
    return true
  }),
)

const userName = computed(() => currentUser.value?.name || 'User')
const userEmail = computed(() => currentUser.value?.email || '')
const userInitials = computed(() => {
  const parts = (currentUser.value?.name || 'U').split(' ')
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
})

const roleLabel = computed(() => {
  const map = {
    branch_manager: 'Branch Manager',
    track_admin: 'Track Admin',
    instructor: 'Instructor',
    student: 'Student',
  }
  return map[userRole.value] || ''
})

async function logout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <nav class="sidebar">
    <!-- ── Brand wordmark ─────────────────────────── -->
    <div class="brand">
      <div class="brand-acronym">ITI</div>
      <div class="brand-text">
        <span class="brand-title">Platform</span>
        <span class="brand-sub">Management System</span>
      </div>
      <div class="brand-dot"></div>
    </div>

    <!-- ── Navigation ────────────────────────────── -->
    <div class="nav-scroll">
      <router-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="nav-item"
        active-class="nav-item--active"
        exact-active-class="nav-item--active"
      >
        <span class="nav-icon material-symbols-outlined">{{ link.icon }}</span>
        <span class="nav-label">{{ link.label }}</span>
        <span class="nav-glow"></span>
      </router-link>
    </div>

    <!-- ── User footer ───────────────────────────── -->
    <div class="user-footer">
      <div class="user-avatar">{{ userInitials }}</div>
      <div class="user-info">
        <span class="user-name">{{ userName }}</span>
        <span class="user-role">{{ roleLabel }}</span>
      </div>
      <button class="logout-btn" title="Logout" @click="logout">
        <span class="material-symbols-outlined">logout</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* ── Shell ─────────────────────────────────────────────────────────── */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 240px;
  height: 100vh;
  background: #0E0505;
  display: flex;
  flex-direction: column;
  z-index: 20;
  /* Subtle right-edge glow */
  box-shadow: 1px 0 0 rgba(139, 26, 26, 0.18), 4px 0 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

/* Top crimson accent line */
.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #8B1A1A 0%, #C0392B 50%, transparent 100%);
}

/* Left rail — persistent crimson thread */
.sidebar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(139, 26, 26, 0.8) 0%,
    rgba(139, 26, 26, 0.25) 60%,
    transparent 100%
  );
  pointer-events: none;
}

/* ── Brand ─────────────────────────────────────────────────────────── */
.brand {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 28px 20px 24px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.brand-acronym {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #8B1A1A;
  line-height: 1;
  flex-shrink: 0;
  /* Subtle text shadow for depth */
  text-shadow: 0 0 24px rgba(139, 26, 26, 0.5);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.brand-title {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.brand-sub {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 10px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.32);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.2;
}

/* Decorative dot — the memorable accent */
.brand-dot {
  position: absolute;
  top: 28px;
  right: 18px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8B1A1A;
  box-shadow: 0 0 8px 2px rgba(139, 26, 26, 0.5);
}

/* ── Navigation scroll area ────────────────────────────────────────── */
.nav-scroll {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 10px;
  overflow-y: auto;
  scrollbar-width: none;
}

.nav-scroll::-webkit-scrollbar {
  display: none;
}

/* ── Nav item ──────────────────────────────────────────────────────── */
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px 9px 14px;
  border-radius: 8px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.38);
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;
  overflow: hidden;
}

.nav-item:hover {
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.05);
}

/* Active state — frosted crimson pill */
.nav-item--active {
  color: #FFFFFF !important;
  background: rgba(139, 26, 26, 0.22) !important;
  border: 1px solid rgba(139, 26, 26, 0.35);
}

/* Active glow */
.nav-item--active .nav-glow {
  opacity: 1;
}

/* Active icon pulse */
.nav-item--active .nav-icon {
  color: #E57373 !important;
}

/* Left active indicator bar */
.nav-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  background: #8B1A1A;
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
  transition: color 0.18s ease;
  font-variation-settings: 'FILL' 0, 'wght' 300;
}

.nav-item--active .nav-icon {
  font-variation-settings: 'FILL' 1, 'wght' 400;
}

.nav-label {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
}

/* Radial glow behind active item */
.nav-glow {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(139, 26, 26, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

/* ── User footer ───────────────────────────────────────────────────── */
.user-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 20px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #8B1A1A, #6B1212);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(139, 26, 26, 0.4);
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.user-role {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.32);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: block;
}

.logout-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.28);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.logout-btn:hover {
  color: #E57373;
  background: rgba(139, 26, 26, 0.18);
}

.logout-btn .material-symbols-outlined {
  font-size: 16px;
}

/* ── Mobile View (Bottom Navigation) ───────────────────────────────── */
@media (max-width: 1023px) {
  .sidebar {
    top: auto;
    bottom: 0;
    width: 100%;
    height: 72px;
    flex-direction: row;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
    z-index: 50;
  }

  .sidebar::before {
    height: 1px; /* Thinner top accent */
  }

  .sidebar::after {
    display: none; /* Hide left rail */
  }

  .brand, .user-footer {
    display: none;
  }

  .nav-scroll {
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 0;
    width: 100%;
  }

  .nav-item {
    flex-direction: column;
    padding: 8px 4px;
    border-radius: 0;
    gap: 4px;
    background: transparent !important;
    border: none !important;
    flex: 1;
    justify-content: center;
  }

  .nav-label {
    font-size: 10px;
    text-align: center;
  }

  .nav-icon {
    font-size: 24px;
  }

  .nav-glow {
    display: none;
  }

  /* Top active indicator bar for mobile */
  .nav-item--active::before {
    left: 20%;
    right: 20%;
    top: 0;
    bottom: auto;
    width: auto;
    height: 3px;
    border-radius: 0 0 3px 3px;
  }
}
</style>
