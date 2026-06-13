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

const colorClass = computed(() => {
  if (percentage.value >= 60) return 'bg-primary border-primary-mist text-primary'
  if (percentage.value >= 50) return 'bg-warning border-warning-mist text-warning'
  return 'bg-danger border-danger-mist text-danger'
})

const hoverBorderClass = computed(() => {
  if (percentage.value >= 60) return 'hover:border-[var(--color-primary-mist)]'
  if (percentage.value >= 50) return 'hover:border-[var(--color-warning-mist)]'
  return 'hover:border-[var(--color-danger-mist)]'
})

const barBgClass = computed(() => {
  if (percentage.value >= 60) return 'background-color: var(--color-primary);'
  if (percentage.value >= 50) return 'background-color: var(--color-warning);'
  return 'background-color: var(--color-danger);'
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
    style="background-color: var(--color-surface);"
  >
    <div class="flex justify-between items-center mb-3">
      <span class="font-body-md text-body-md font-bold text-on-surface" style="color: var(--color-text);">
        {{ courseObj.course?.name || 'Unknown Course' }}
      </span>
      <span class="font-mono text-mono text-on-surface" style="color: var(--color-text);">
        {{ Math.round(courseObj.total_score) }} / {{ courseObj.course?.max_score || 0 }}
      </span>
    </div>
    
    <div class="w-full rounded-full h-[6px] overflow-hidden" style="background-color: var(--color-canvas);">
      <div 
        class="h-full rounded-full transition-all duration-500" 
        :style="`width: ${animatedPercentage}%; ${barBgClass}`"
      ></div>
    </div>
    
    <!-- Hover Detail -->
    <div 
      class="h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 group-hover:mt-3 transition-all duration-300 overflow-hidden font-body-sm text-body-sm pt-2"
      style="color: var(--color-text-secondary); border-top: 1px solid var(--color-canvas);"
    >
      {{ componentsText }}
    </div>
  </div>
</template>

<style scoped>
/* Fallback styles in case variables are missed */
.bg-surface {
  background-color: var(--color-surface, #ffffff);
}
</style>
