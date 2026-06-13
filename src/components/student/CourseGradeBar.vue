<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  courseObj: {
    type: Object,
    required: true
  }
})

const isMounted = ref(false)

onMounted(() => {
  setTimeout(() => {
    isMounted.value = true
  }, 100)
})

const percentage = computed(() => {
  const max = props.courseObj.course?.max_score || 1
  return Math.min(100, Math.max(0, (props.courseObj.total_score / max) * 100))
})

const animatedPercentage = computed(() => {
  return isMounted.value ? percentage.value : 0
})

const barColor = computed(() => {
  if (percentage.value >= 60) return 'var(--color-primary)'
  if (percentage.value >= 50) return 'var(--color-warning)'
  return 'var(--color-danger)'
})

const hoverBorderClass = computed(() => {
  if (percentage.value >= 60) return 'hover:border-primary-mist'
  if (percentage.value >= 50) return 'hover:border-warning-mist'
  return 'hover:border-danger-mist'
})

const componentsText = computed(() => {
  if (!props.courseObj.components || props.courseObj.components.length === 0) {
    return 'No breakdown available'
  }
  return props.courseObj.components
    .filter(c => c.grade_component)
    .map(c => `${c.grade_component.name}: ${Math.round(c.effective_score)}/${c.grade_component.weight}`)
    .join(' · ')
})
</script>

<template>
  <div
    class="bg-surface rounded-xl p-5 shadow-sm hover:shadow-md transition-all group border border-transparent relative overflow-hidden"
    :class="hoverBorderClass"
  >
    <div class="flex justify-between items-center mb-3">
      <span class="font-body-md text-body-md font-bold text-on-surface">
        {{ courseObj.course?.name || 'Unknown Course' }}
      </span>
      <span class="font-mono text-mono text-on-surface">
        {{ Math.round(courseObj.total_score) }} / {{ courseObj.course?.max_score || 0 }}
      </span>
    </div>

    <div class="w-full rounded-full h-[6px] overflow-hidden bg-canvas">
      <div
        class="h-full rounded-full transition-all duration-500"
        :style="`width: ${animatedPercentage}%; background-color: ${barColor}`"
      ></div>
    </div>

    <div
      class="h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 group-hover:mt-3 transition-all duration-300 overflow-hidden font-body-sm text-body-sm text-on-surface-variant pt-2 border-t border-canvas"
    >
      {{ componentsText }}
    </div>
  </div>
</template>
