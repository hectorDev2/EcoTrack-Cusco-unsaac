export const WASTE_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  ORGANIC: {
    bg: 'bg-waste-organic/10',
    text: 'text-waste-organic',
    border: 'border-waste-organic/20',
    icon: 'eco',
  },
  RECYCLABLE: {
    bg: 'bg-waste-recyclable/10',
    text: 'text-waste-recyclable',
    border: 'border-waste-recyclable/20',
    icon: 'recycling',
  },
  NON_RECYCLABLE: {
    bg: 'bg-surface-container-high',
    text: 'text-on-surface-variant',
    border: 'border-outline',
    icon: 'delete',
  },
  HAZARDOUS: {
    bg: 'bg-status-alert/10',
    text: 'text-status-alert',
    border: 'border-status-alert/20',
    icon: 'warning',
  },
};

export const WASTE_CATEGORY_LABELS: Record<string, string> = {
  ORGANIC: 'Orgánico',
  RECYCLABLE: 'Reciclable',
  NON_RECYCLABLE: 'No Reciclable',
  HAZARDOUS: 'Peligroso',
};
