'use client';

import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'default' | 'compact' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[#003A99] disabled:bg-[var(--color-border-subtle)] disabled:text-[var(--color-text-secondary)]',
  secondary: 'border border-[var(--color-border-subtle)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-bg-page)] active:bg-[var(--color-border-subtle)] disabled:bg-white disabled:text-[var(--color-text-secondary)]',
  ghost: 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-page)] active:bg-[var(--color-border-subtle)] disabled:text-[var(--color-text-secondary)]',
  destructive: 'bg-[var(--color-error)] text-white hover:bg-[#B83232] active:bg-[#9A2828] disabled:bg-[var(--color-border-subtle)] disabled:text-[var(--color-text-secondary)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-9 px-4 text-sm',
  compact: 'h-8 px-3 text-xs',
  icon: 'h-8 w-8 p-0',
};

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium transition-all',
        'duration-[var(--duration-micro)] ease-[var(--ease-standard)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
        'disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {size !== 'icon' && children}
    </button>
  );
}
