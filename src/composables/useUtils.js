export function initials(name) {
  return (name || '?').split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase()
}

export const statusColors = {
  open: 'bg-info-mist text-info border-info/20',
  configuring: 'bg-warning-mist text-warning border-warning/20',
  delivering: 'bg-success-mist text-success border-success/20',
  participating: 'bg-primary-mist text-primary-container border-primary-container/20',
  rolled_up: 'bg-surface-sunken text-on-surface-variant border-outline-variant',
}

export const statusIcons = {
  open: 'lock_open',
  configuring: 'settings',
  delivering: 'play_circle',
  participating: 'groups',
  rolled_up: 'archive',
}
