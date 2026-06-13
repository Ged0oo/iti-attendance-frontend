<template>
  <MainLayout title="User Management">
    <div class="space-y-6">
      <!-- ── Page Header ── -->
      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 class="font-h2 text-h2 text-on-surface m-0 mb-1">
            Accounts Directory
          </h2>
          <p class="font-body-md text-body-md text-on-surface-variant m-0">
            All platform accounts — provisioned top-down
          </p>
        </div>
        <!-- Only show "New User" if this role can create anyone -->
        <div v-if="creatableRoles.length > 0" class="flex items-center gap-3">
          <button
            class="bg-primary-container text-white py-2 px-4 rounded font-label text-label hover:bg-primary-deep transition-colors duration-200 flex items-center gap-2 shadow-[0_2px_8px_rgba(139,26,26,0.2)]"
            @click="openCreate"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            New User
          </button>
        </div>
      </div>

      <!-- ── Filter Bar ── -->
      <div
        class="bg-surface p-4 rounded-xl shadow-sm border border-surface-container-high flex flex-col md:flex-row gap-4 items-center"
      >
        <!-- Search -->
        <div class="relative w-full md:w-96">
          <span
            class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            >search</span
          >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users by name or email..."
            class="w-full pl-10 pr-4 h-[44px] rounded-lg border border-surface-container-highest bg-surface-bright focus:border-primary-ember focus:ring-1 focus:ring-primary-ember font-body-md text-body-md placeholder:text-outline text-on-surface outline-none transition-all"
          />
        </div>
        <div
          class="h-8 w-px bg-surface-container-high hidden md:block mx-2"
        ></div>
        <!-- Role filter — triggers server-side refetch via watcher -->
        <select
          v-model="roleFilter"
          class="h-[44px] rounded-lg border border-surface-container-highest bg-surface-bright focus:border-primary-ember focus:ring-1 focus:ring-primary-ember font-body-md text-body-md text-on-surface outline-none pl-4 pr-8 min-w-[180px]"
        >
          <option value="all">Role: All Roles</option>
          <option value="track_admin">Track Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>
      </div>

      <!-- ── Loading ── -->
      <div v-if="userStore.loading" class="flex justify-center py-16">
        <span
          class="material-symbols-outlined animate-spin text-primary text-[36px]"
          >progress_activity</span
        >
      </div>

      <!-- ── Error ── -->
      <div
        v-else-if="userStore.error"
        class="p-4 rounded-xl bg-danger-mist text-danger font-body-md"
      >
        {{ userStore.error }}
      </div>

      <!-- ── Table Card ── -->
      <div
        v-else
        class="bg-surface shadow-sm rounded-xl overflow-hidden border border-surface-container-high"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#1A0A0A] text-on-primary">
                <th
                  class="py-4 px-6 font-label-caps text-label-caps uppercase tracking-wider w-[22%]"
                >
                  Name
                </th>
                <th
                  class="py-4 px-6 font-label-caps text-label-caps uppercase tracking-wider w-[28%]"
                >
                  Email
                </th>
                <th
                  class="py-4 px-6 font-label-caps text-label-caps uppercase tracking-wider w-[15%]"
                >
                  Role
                </th>
                <th
                  class="py-4 px-6 font-label-caps text-label-caps uppercase tracking-wider w-[12%]"
                >
                  Status
                </th>
                <th
                  class="py-4 px-6 font-label-caps text-label-caps uppercase tracking-wider w-[13%]"
                >
                  Expiry Date
                </th>
                <th
                  class="py-4 px-6 font-label-caps text-label-caps uppercase tracking-wider w-[10%] text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="font-body-md text-body-md">
              <tr
                v-for="(user, index) in filteredUsers"
                :key="user.id"
                :class="index % 2 === 0 ? 'bg-surface' : 'bg-[#FAFAFA]'"
                class="hover:bg-surface-container-lowest transition-colors border-b border-surface-container-high group"
              >
                <!-- Name -->
                <td class="py-4 px-6 font-medium text-on-surface">
                  {{ user.name }}
                </td>

                <!-- Email -->
                <td class="py-4 px-6 text-on-surface-variant">
                  {{ user.email }}
                </td>

                <!-- Role badge -->
                <td class="py-4 px-6">
                  <span
                    :class="roleBadgeClass(user.role)"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                  >
                    {{ roleLabel(user.role) }}
                  </span>
                </td>

                <!-- Status dot -->
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <div
                      :class="
                        isExpired(user.expires_at)
                          ? 'bg-danger shadow-[0_0_4px_rgba(220,38,38,0.4)]'
                          : 'bg-success shadow-[0_0_4px_rgba(5,150,105,0.4)]'
                      "
                      class="w-2 h-2 rounded-full flex-shrink-0"
                    ></div>
                    <span
                      :class="
                        isExpired(user.expires_at)
                          ? 'text-danger font-medium'
                          : 'text-on-surface-variant'
                      "
                      class="text-sm"
                    >
                      {{ isExpired(user.expires_at) ? "Expired" : "Active" }}
                    </span>
                  </div>
                </td>

                <!-- Expiry date -->
                <td
                  :class="
                    isExpired(user.expires_at)
                      ? 'text-danger'
                      : 'text-on-surface-variant'
                  "
                  class="py-4 px-6 font-mono text-mono"
                >
                  {{ formatDate(user.expires_at) }}
                </td>

                <!-- Row actions — visible on hover -->
                <td class="py-4 px-6 text-right">
                  <div
                    class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      v-if="canEditUser(user)"
                      class="p-1.5 text-on-surface-variant hover:text-primary-container hover:bg-primary-mist rounded transition-colors"
                      title="Edit user"
                      @click="openEdit(user)"
                    >
                      <span class="material-symbols-outlined text-[20px]"
                        >edit</span
                      >
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty state -->
              <tr v-if="filteredUsers.length === 0">
                <td
                  colspan="6"
                  class="py-16 text-center text-on-surface-variant font-body-md"
                >
                  No users match your search.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination footer -->
        <div
          class="bg-surface border-t border-surface-container-high px-6 py-4 flex items-center justify-between"
        >
          <!-- Count label -->
          <span class="font-body-sm text-body-sm text-on-surface-variant">
            Showing {{ userStore.users.length }} of
            {{ userStore.meta.total }} users
          </span>

          <!-- Page controls — only render if more than 1 page -->
          <div
            v-if="userStore.meta.lastPage > 1"
            class="flex items-center gap-1"
          >
            <!-- Prev -->
            <button
              :disabled="currentPage === 1"
              class="p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed"
              @click="fetchPage(currentPage - 1)"
            >
              <span class="material-symbols-outlined text-[20px]"
                >chevron_left</span
              >
            </button>

            <!-- Page number buttons -->
            <template v-for="page in userStore.meta.lastPage" :key="page">
              <button
                :class="
                  page === currentPage
                    ? 'bg-primary-mist text-primary-container border border-primary-container/20 font-medium'
                    : 'text-on-surface hover:bg-surface-container-high'
                "
                class="w-8 h-8 rounded text-sm transition-colors"
                @click="fetchPage(page)"
              >
                {{ page }}
              </button>
            </template>

            <!-- Next -->
            <button
              :disabled="currentPage === userStore.meta.lastPage"
              class="p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed"
              @click="fetchPage(currentPage + 1)"
            >
              <span class="material-symbols-outlined text-[20px]"
                >chevron_right</span
              >
            </button>
          </div>
        </div>
      </div>

      <!-- ── CREATE Modal ── -->
      <Teleport to="body">
        <div
          v-if="showCreateModal"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            class="absolute inset-0 bg-black/40 backdrop-blur-sm"
            @click="showCreateModal = false"
          ></div>
          <div
            class="relative bg-surface rounded-xl shadow-xl w-full max-w-md mx-4 p-8 animate-[fadeInUp_0.2s_ease]"
          >
            <h3 class="font-h3 text-h3 text-on-surface mb-6">New User</h3>

            <div
              v-if="formError"
              class="mb-4 p-3 rounded-lg bg-danger-mist text-danger font-body-sm"
            >
              {{ formError }}
            </div>

            <form class="space-y-4" @submit.prevent="handleCreate">
              <div>
                <label
                  class="block font-label text-label text-on-surface-variant mb-1"
                  >Full Name</label
                >
                <input
                  v-model="createForm.name"
                  type="text"
                  required
                  placeholder="e.g. Ahmed El-Sayed"
                  class="w-full h-[44px] px-4 rounded-lg border border-surface-container-highest bg-surface focus:border-primary-ember focus:ring-1 focus:ring-primary-ember outline-none font-body-md text-body-md transition-all"
                />
              </div>

              <div>
                <label
                  class="block font-label text-label text-on-surface-variant mb-1"
                  >Email Address</label
                >
                <input
                  v-model="createForm.email"
                  type="email"
                  required
                  placeholder="e.g. a.elsayed@iti.edu.eg"
                  class="w-full h-[44px] px-4 rounded-lg border border-surface-container-highest bg-surface focus:border-primary-ember focus:ring-1 focus:ring-primary-ember outline-none font-body-md text-body-md transition-all"
                />
              </div>

              <div>
                <label
                  class="block font-label text-label text-on-surface-variant mb-1"
                  >Role</label
                >
                <!-- Options are computed from UserPolicy — no hardcoded list -->
                <select
                  v-model="createForm.role"
                  required
                  class="w-full h-[44px] px-4 rounded-lg border border-surface-container-highest bg-surface focus:border-primary-ember focus:ring-1 focus:ring-primary-ember outline-none font-body-md text-body-md transition-all"
                >
                  <option
                    v-for="opt in creatableRoles"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <div>
                <label
                  class="block font-label text-label text-on-surface-variant mb-1"
                >
                  Expires At <span class="text-danger">*</span>
                </label>
                <input
                  v-model="createForm.expires_at"
                  type="date"
                  required
                  class="w-full h-[44px] px-4 rounded-lg border border-surface-container-highest bg-surface focus:border-primary-ember focus:ring-1 focus:ring-primary-ember outline-none font-body-md text-body-md transition-all"
                />
                <p
                  class="mt-1 font-body-sm text-body-sm text-on-surface-variant"
                >
                  Must be a future date.
                </p>
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 h-[44px] rounded-lg border-2 border-primary-container text-primary-container font-label text-label hover:bg-primary-mist transition-colors"
                  @click="showCreateModal = false"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="formLoading"
                  class="flex-1 h-[44px] rounded-lg bg-primary-container text-white font-label text-label hover:bg-primary-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span
                    v-if="formLoading"
                    class="material-symbols-outlined animate-spin text-[18px]"
                    >progress_activity</span
                  >
                  {{ formLoading ? "Creating…" : "Create User" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>

      <!-- ── EDIT Modal ── -->
      <Teleport to="body">
        <div
          v-if="showEditModal"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            class="absolute inset-0 bg-black/40 backdrop-blur-sm"
            @click="showEditModal = false"
          ></div>
          <div
            class="relative bg-surface rounded-xl shadow-xl w-full max-w-md mx-4 p-8"
          >
            <h3 class="font-h3 text-h3 text-on-surface mb-1">Edit User</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Editing:
              <span class="font-medium text-on-surface">{{
                selectedUser?.name
              }}</span>
            </p>

            <div
              v-if="formError"
              class="mb-4 p-3 rounded-lg bg-danger-mist text-danger font-body-sm"
            >
              {{ formError }}
            </div>

            <form class="space-y-4" @submit.prevent="handleUpdate">
              <div>
                <label
                  class="block font-label text-label text-on-surface-variant mb-1"
                  >Full Name</label
                >
                <input
                  v-model="editForm.name"
                  type="text"
                  class="w-full h-[44px] px-4 rounded-lg border border-surface-container-highest bg-surface focus:border-primary-ember focus:ring-1 focus:ring-primary-ember outline-none font-body-md text-body-md transition-all"
                />
              </div>

              <div>
                <label
                  class="block font-label text-label text-on-surface-variant mb-1"
                  >Email Address</label
                >
                <input
                  v-model="editForm.email"
                  type="email"
                  class="w-full h-[44px] px-4 rounded-lg border border-surface-container-highest bg-surface focus:border-primary-ember focus:ring-1 focus:ring-primary-ember outline-none font-body-md text-body-md transition-all"
                />
              </div>

              <div>
                <label
                  class="block font-label text-label text-on-surface-variant mb-1"
                  >Role</label
                >
                <select
                  v-model="editForm.role"
                  class="w-full h-[44px] px-4 rounded-lg border border-surface-container-highest bg-surface focus:border-primary-ember focus:ring-1 focus:ring-primary-ember outline-none font-body-md text-body-md transition-all"
                >
                  <option value="track_admin">Track Admin</option>
                  <option value="instructor">Instructor</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div>
                <label
                  class="block font-label text-label text-on-surface-variant mb-1"
                  >Expires At</label
                >
                <input
                  v-model="editForm.expires_at"
                  type="date"
                  class="w-full h-[44px] px-4 rounded-lg border border-surface-container-highest bg-surface focus:border-primary-ember focus:ring-1 focus:ring-primary-ember outline-none font-body-md text-body-md transition-all"
                />
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 h-[44px] rounded-lg border-2 border-primary-container text-primary-container font-label text-label hover:bg-primary-mist transition-colors"
                  @click="showEditModal = false"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="formLoading"
                  class="flex-1 h-[44px] rounded-lg bg-primary-container text-white font-label text-label hover:bg-primary-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span
                    v-if="formLoading"
                    class="material-symbols-outlined animate-spin text-[18px]"
                    >progress_activity</span
                  >
                  {{ formLoading ? "Saving…" : "Save Changes" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import MainLayout from "@/components/layout/MainLayout.vue";
import { useUserStore } from "@/stores/user";
import { useAuth } from "@/composables/useAuth";

const userStore = useUserStore();
const { userRole } = useAuth();

const searchQuery = ref("");
const roleFilter = ref("all");

const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedUser = ref(null);

const currentPage = ref(1);

const createForm = ref({
  name: "",
  email: "",
  role: "",
  expires_at: "",
});

const editForm = ref({ name: "", email: "", role: "", expires_at: "" });
const formLoading = ref(false);
const formError = ref(null);
const createSuccess = ref(null);

const creatableRoles = computed(() => {
  if (userRole.value === "branch_manager") {
    return [{ value: "track_admin", label: "Track Admin" }];
  }
  if (userRole.value === "track_admin") {
    return [
      { value: "instructor", label: "Instructor" },
      { value: "student", label: "Student" },
    ];
  }
  return [];
});

function openCreate() {
  createForm.value = {
    name: "",
    email: "",
    role: creatableRoles.value[0]?.value ?? "",
    expires_at: "",
  };
  formError.value = null;
  showCreateModal.value = true;
}

const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return userStore.users;
  return userStore.users.filter(
    (u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );
});

watch(roleFilter, () => {
  fetchPage(1);
});

onMounted(() => fetchPage(1));

function openEdit(user) {
  selectedUser.value = user;
  editForm.value = {
    name: user.name,
    email: user.email,
    role: user.role,
    expires_at: user.expires_at ? user.expires_at.substring(0, 10) : "",
  };
  formError.value = null;
  showEditModal.value = true;
}

function canEditUser(targetUser) {
  if (userRole.value === "branch_manager") {
    return ["track_admin"].includes(targetUser.role);
  }

  if (userRole.value === "track_admin") {
    return ["instructor", "student"].includes(targetUser.role);
  }

  return false;
}

async function fetchPage(page) {
  currentPage.value = page;
  const params = { page };
  if (roleFilter.value !== "all") params.role = roleFilter.value;
  await userStore.fetchUsers(params);
}

async function handleCreate() {
  formLoading.value = true;
  formError.value = null;
  createSuccess.value = null;

  try {
    await userStore.createUser(createForm.value);
    createSuccess.value = `Account created. ${createForm.value.email} will receive a login invitation.`;
    showCreateModal.value = false;
    createForm.value = {
      name: "",
      email: "",
      role: creatableRoles.value[0]?.value ?? "",
      expires_at: "",
    };
  } catch (e) {
    formError.value = e.response?.data?.message || "Failed to create user.";
  } finally {
    formLoading.value = false;
  }
}

async function handleUpdate() {
  formLoading.value = true;
  formError.value = null;
  try {
    await userStore.updateUser(selectedUser.value.id, editForm.value);
    showEditModal.value = false;
  } catch (e) {
    formError.value = e.response?.data?.message || "Failed to update user.";
  } finally {
    formLoading.value = false;
  }
}

const ROLE_BADGE = {
  branch_manager: "bg-role-bm text-white",
  track_admin: "bg-role-ta text-white",
  instructor: "bg-role-instructor text-white",
  student: "bg-role-student text-white",
};

const ROLE_LABEL = {
  branch_manager: "Branch Manager",
  track_admin: "Track Admin",
  instructor: "Instructor",
  student: "Student",
};

function roleBadgeClass(role) {
  return ROLE_BADGE[role] ?? "bg-neutral-200 text-neutral-700";
}
function roleLabel(role) {
  return ROLE_LABEL[role] ?? role;
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return dateStr.substring(0, 10);
}
</script>
