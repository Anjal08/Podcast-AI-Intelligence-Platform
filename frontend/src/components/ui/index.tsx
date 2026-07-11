import React from 'react';
import { cn } from '@/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-medium rounded-full border',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
      variant === 'default' && 'bg-[#27272A] border-[#3F3F46] text-[#A1A1AA]',
      variant === 'primary' && 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      variant === 'secondary' && 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      variant === 'success' && 'bg-green-500/10 border-green-500/20 text-green-400',
      variant === 'warning' && 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
      variant === 'danger' && 'bg-red-500/10 border-red-500/20 text-red-400',
      variant === 'outline' && 'bg-transparent border-[#3F3F46] text-[#A1A1AA]',
      className
    )}>
      {children}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-xl cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'text-xs px-3 py-1.5 rounded-lg',
        size === 'md' && 'text-sm px-4 py-2',
        size === 'lg' && 'text-base px-6 py-3 rounded-2xl',
        size === 'icon' && 'w-9 h-9 rounded-xl',
        variant === 'primary' && [
          'bg-indigo-600 text-white border border-indigo-500/50',
          'hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25',
          'active:scale-95',
        ],
        variant === 'secondary' && [
          'bg-purple-600 text-white border border-purple-500/50',
          'hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25',
          'active:scale-95',
        ],
        variant === 'ghost' && [
          'bg-transparent text-[#A1A1AA] border border-transparent',
          'hover:bg-[#27272A] hover:text-white',
          'active:scale-95',
        ],
        variant === 'outline' && [
          'bg-transparent text-white border border-[#3F3F46]',
          'hover:bg-[#27272A] hover:border-[#52525B]',
          'active:scale-95',
        ],
        variant === 'danger' && [
          'bg-red-600 text-white border border-red-500/50',
          'hover:bg-red-500',
          'active:scale-95',
        ],
        className
      )}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className, hover = false, glow = false }: CardProps) {
  return (
    <div className={cn(
      'bg-[#18181B] border border-[#27272A] rounded-2xl',
      hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3F3F46] hover:shadow-xl hover:shadow-black/40',
      glow && 'hover:shadow-indigo-500/10',
      className
    )}>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('shimmer rounded-lg', className)} />
  );
}

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'gradient';
  size?: 'sm' | 'md';
}

export function Progress({ value, max = 100, className, variant = 'default', size = 'md' }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn(
      'w-full bg-[#27272A] rounded-full overflow-hidden',
      size === 'sm' ? 'h-1' : 'h-2',
      className
    )}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          variant === 'default' ? 'bg-indigo-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-[#27272A]', className)} />;
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}
export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-[#27272A] border border-[#3F3F46] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {content}
      </div>
    </div>
  );
}
