interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-[2px]',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <span className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin ${className}`} />
    </div>
  );
}
