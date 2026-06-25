import type { ReactNode } from 'react';

type BadgeVariant = 'status' | 'waste' | 'role' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  color?: string; // Tailwind classes for custom colors
  children: ReactNode;
  className?: string;
}

const defaultStyles: Record<string, string> = {
  OPEN: 'bg-status-alert/10 text-status-alert',
  IN_PROGRESS: 'bg-secondary-container/20 text-secondary',
  RESOLVED: 'bg-waste-organic/10 text-waste-organic',
  CLOSED: 'bg-surface-container-high text-on-surface-variant',
  ORGANIC: 'bg-waste-organic/10 text-waste-organic',
  RECYCLABLE: 'bg-waste-recyclable/10 text-waste-recyclable',
  NON_RECYCLABLE: 'bg-surface-container-high text-on-surface-variant',
  HAZARDOUS: 'bg-status-alert/10 text-status-alert',
  ADMIN: 'bg-primary/10 text-primary',
  CITIZEN: 'bg-secondary-container/20 text-secondary',
  DRIVER: 'bg-tertiary-container/20 text-tertiary',
};

export function Badge({ variant: _variant = 'neutral', color, children, className = '' }: BadgeProps) {
  const colorClass = typeof children === 'string' && defaultStyles[children.toUpperCase()]
    ? defaultStyles[children.toUpperCase()]
    : color ?? 'bg-surface-container-high text-on-surface-variant';

  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[0.05em]
      ${colorClass} ${className}
    `}>
      {children}
    </span>
  );
}
