import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accent?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const accentClasses = {
  primary: 'border-l-4 border-l-primary',
  secondary: 'border-l-4 border-l-secondary',
  success: 'border-l-4 border-l-waste-organic',
  warning: 'border-l-4 border-l-status-alert',
  danger: 'border-l-4 border-l-status-alert',
};

export function Card({ children, className = '', padding = 'md', accent }: CardProps) {
  return (
    <div
      className={`
        bg-surface-card rounded-xl border border-outline-variant/20
        ${paddingClasses[padding]}
        ${accent ? accentClasses[accent] : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
