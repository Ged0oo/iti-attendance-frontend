<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '../../components/layout/MainLayout.vue'
import { useAuth } from '../../composables/useAuth'
import { useCohortStore } from '../../stores/cohort'
import { initials } from '../../composables/useUtils'

const route = useRoute()
const cohortId = route.params.id
const store = useCohortStore()
const { currentUser, hasRole } = useAuth()

const canCompose = computed(() => hasRole('track_admin', 'instructor', 'branch_manager'))

const filter = ref('all')
const selectedId = ref(null)
const showModal = ref(false)
const form = ref({ title: '', body: '' })

const filtered = computed(() => {
  if (filter.value === 'ta') return store.announcements.filter((a) => a.poster?.role === 'track_admin')
  if (filter.value === 'instructor') return store.announcements.filter((a) => a.poster?.role === 'instructor')
  return store.announcements
})

const selected = computed(() =>
  store.announcements.find((a) => a.id === selectedId.value) || store.announcements[0] || null,
)

const roleStyles = {
  track_admin: { label: 'Track Admin', cls: 'bg-role-ta/10 text-role-ta' },
  instructor: { label: 'Instructor', cls: 'bg-role-instructor/10 text-role-instructor' },
  branch_manager: { label: 'Branch Manager', cls: 'bg-role-bm/10 text-role-bm' },
  student: { label: 'Student', cls: 'bg-role-student/10 text-role-student' },
}
function badge(role) {
  return roleStyles[role] || roleStyles.student
}
async function submitPost() {
  if (!form.value.title || !form.value.body) return
  const created = await store.createAnnouncement({
    cohort_id: cohortId,
    title: form.value.title,
    body: form.value.body,
  })
  selectedId.value = created.id
  form.value = { title: '', body: '' }
  showModal.value = false
}

async function removeSelected() {
  if (!selected.value) return
  await store.deleteAnnouncement(selected.value.id)
  selectedId.value = null
}

onMounted(() => store.fetchAnnouncements(cohortId))
</script>

<template>
  <MainLayout title="Announcements">
    <div class="flex flex-1 -m-margin-desktop h-[calc(100vh-64px)] overflow-hidden">
      <div class="w-[38%] border-r border-outline-variant bg-surface flex flex-col">
        <div class="p-6 pb-4 border-b border-outline-variant shrink-0">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-h1 text-h1 text-on-surface">Announcements</h2>
            <button
              v-if="canCompose"
              class="bg-primary hover:bg-primary-deep text-on-primary font-label text-label px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              @click="showModal = true"
            >
              <span class="material-symbols-outlined text-[18px]">add</span>
              New Post
            </button>
          </div>
          <div class="flex space-x-6 border-b border-outline-variant">
            <button
              v-for="tab in [{ k: 'all', t: 'All' }, { k: 'ta', t: 'From Track Admin' }, { k: 'instructor', t: 'From Instructors' }]"
              :key="tab.k"
              class="pb-3 border-b-2 font-label text-label transition-colors"
              :class="filter === tab.k ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'"
              @click="filter = tab.k"
            >{{ tab.t }}</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <p v-if="!filtered.length" class="text-center text-on-surface-variant font-body-sm text-body-sm py-10">
            No announcements yet.
          </p>
          <div
            v-for="a in filtered"
            :key="a.id"
            class="p-4 rounded-xl cursor-pointer transition-all hover:bg-surface-bright"
            :class="selected && selected.id === a.id ? 'bg-surface border-l-[3px] border-primary shadow-sm' : 'bg-surface border border-transparent hover:shadow-sm'"
            @click="selectedId = a.id"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-label text-label" :class="badge(a.poster?.role).cls">
                {{ initials(a.poster?.name) }}
              </div>
              <div>
                <p class="font-label text-label font-bold">{{ a.poster?.name || 'Unknown' }}</p>
                <span class="inline-block px-2 py-0.5 rounded-full font-label-caps text-label-caps mt-0.5" :class="badge(a.poster?.role).cls">
                  {{ badge(a.poster?.role).label }}
                </span>
              </div>
            </div>
            <h3 class="font-h3 text-h3 mb-2 line-clamp-1">{{ a.title }}</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-3">{{ a.body }}</p>
            <div class="flex justify-end">
              <span class="font-mono text-mono text-on-surface-variant opacity-70">{{ a.published_at }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="w-[62%] bg-canvas flex flex-col overflow-y-auto">
        <div v-if="selected" class="max-w-3xl w-full mx-auto p-10 pt-12">
          <div class="flex justify-between items-start mb-8">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full flex items-center justify-center font-h3 text-h3" :class="badge(selected.poster?.role).cls">
                {{ initials(selected.poster?.name) }}
              </div>
              <div>
                <div class="flex items-center gap-3">
                  <p class="font-label text-label font-bold text-on-surface">{{ selected.poster?.name || 'Unknown' }}</p>
                  <span class="inline-block px-2 py-0.5 rounded-full font-label-caps text-label-caps" :class="badge(selected.poster?.role).cls">
                    {{ badge(selected.poster?.role).label }}
                  </span>
                </div>
                <p class="font-mono text-mono text-on-surface-variant mt-1">Posted {{ selected.published_at }}</p>
              </div>
            </div>
            <div v-if="canCompose && (selected.posted_by === currentUser?.id || hasRole('track_admin'))" class="flex items-center gap-2">
              <button class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-mist rounded-full transition-colors" title="Edit">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="p-2 text-on-surface-variant hover:text-danger hover:bg-danger-mist rounded-full transition-colors" title="Delete" @click="removeSelected">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>

          <article>
            <h1 class="font-display text-display text-on-surface mb-8">{{ selected.title }}</h1>
            <div class="font-body-lg text-body-lg text-on-surface leading-relaxed whitespace-pre-line">{{ selected.body }}</div>
          </article>
        </div>

        <div v-else class="flex-1 flex items-center justify-center text-on-surface-variant font-body-md text-body-md">
          Select an announcement to read it.
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm"
      @click.self="showModal = false"
    >
      <div class="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 class="font-h3 text-h3 text-on-surface">Create New Announcement</h3>
          <button class="text-on-surface-variant hover:text-on-surface" @click="showModal = false">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-8 flex-1 overflow-y-auto">
          <form class="space-y-6" @submit.prevent="submitPost">
            <input
              v-model="form.title"
              autofocus
              class="w-full border-none p-0 focus:ring-0 font-h2 text-h2 text-on-surface placeholder:text-outline"
              placeholder="Announcement Title"
              type="text"
            />
            <div class="h-px w-full bg-outline-variant"></div>
            <textarea
              v-model="form.body"
              class="w-full resize-none border-none p-0 focus:ring-0 font-body-lg text-body-lg text-on-surface placeholder:text-outline"
              placeholder="Write your announcement here..."
              style="min-height: 200px;"
            ></textarea>
          </form>
        </div>
        <div class="p-6 border-t border-outline-variant bg-surface-bright flex justify-end items-center gap-4">
          <button class="font-label text-label text-on-surface-variant hover:text-on-surface transition-colors" @click="showModal = false">
            Cancel
          </button>
          <button
            class="bg-primary hover:bg-primary-deep text-on-primary font-label text-label px-6 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!form.title || !form.body"
            @click="submitPost"
          >
            Post Announcement
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
