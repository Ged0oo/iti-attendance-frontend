import { ref } from 'vue'

const isCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

export function useSidebar() {
  const toggle = () => {
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem('sidebar-collapsed', isCollapsed.value)
  }

  const setCollapsed = (val) => {
    isCollapsed.value = val
    localStorage.setItem('sidebar-collapsed', val)
  }

  return {
    isCollapsed,
    toggle,
    setCollapsed
  }
}
