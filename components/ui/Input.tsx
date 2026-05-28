import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = '', ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="space-y-1">
        {label && (
          <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary px-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-surface-container-low border-2 rounded-lg p-4
            text-[16px] leading-[24px] transition-colors
            focus:outline-none focus:ring-0
            ${hasError
              ? 'border-status-alert/50 focus:border-status-alert'
              : 'border-outline-variant/30 focus:border-primary'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-[12px] text-status-alert px-1">{error}</p>
        )}
        {helper && !error && (
          <p className="text-[12px] text-on-surface-variant px-1">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
