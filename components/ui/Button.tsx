'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: string; // material symbol name
  iconRight?: string;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98] shadow-sm shadow-primary/20',
  secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 active:scale-[0.98]',
  ghost: 'bg-transparent text-on-surface hover:bg-surface-container-high active:scale-[0.98]',
  danger: 'bg-status-alert text-white hover:bg-status-alert/90 active:scale-[0.98]',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12px] gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-[14px] gap-2 rounded-xl',
  lg: 'px-6 py-3 text-[16px] gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, className = '', children, disabled, ...props }, ref) => {
    const iconSize = size === 'sm' ? 'text-[16px]' : size === 'lg' ? 'text-[24px]' : 'text-[20px]';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-bold tracking-[0.05em]
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        {...props}
      >
        {loading ? (
          <span className={`${iconSize} w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin`} />
        ) : icon ? (
          <span className={`material-symbols-outlined ${iconSize}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{icon}</span>
        ) : null}
        {children}
        {!loading && iconRight && (
          <span className={`material-symbols-outlined ${iconSize}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
