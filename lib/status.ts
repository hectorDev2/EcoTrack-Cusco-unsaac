export const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  OPEN: { label: 'Abierto', style: 'bg-status-alert/10 text-status-alert' },
  IN_PROGRESS: { label: 'En proceso', style: 'bg-secondary-container/20 text-secondary' },
  RESOLVED: { label: 'Resuelto', style: 'bg-waste-organic/10 text-waste-organic' },
  CLOSED: { label: 'Cerrado', style: 'bg-surface-container-high text-on-surface-variant' },
};

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  CONTAINER_DAMAGED: 'Contenedor dañado',
  MISSED_COLLECTION: 'Recolección no realizada',
  ILLEGAL_DUMPING: 'Vertido ilegal',
  OTHER: 'Otro',
};
