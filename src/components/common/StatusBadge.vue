<script setup>
import { computed } from 'vue';

const props = defineProps({ status: String });

const statusClasses = computed(() => {
  // Add a safety check for undefined/null status
  const status = props.status || 'unknown'; 
  switch (status.toLowerCase()) {
    case 'present': return 'bg-success-mist text-success border-success/20';
    case 'absent': return 'bg-danger-mist text-danger border-danger/20';
    case 'excused': return 'bg-warning-mist text-warning border-warning/20';
    default: return 'bg-surface-variant text-on-surface-variant border-outline-variant';
  }
});

const statusText = computed(() => {
  const status = props.status || 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
});
</script>