'use client';

import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'cta' | 'danger' | 'subtle' | 'ghost' | 'outlined';
type ButtonSize = 'default' | 'compact' | 'mini' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  /* acción principal de navegación / filtro */
  primary: [
    'bg-redwood-primary text-white',
    'hover:bg-redwood-primary-hover',
    'active:scale-[.98]',
    'disabled:bg-redwood-solid-bg disabled:text-redwood-muted',
  ].join(' '),

  /* acción irreversible, exportar */
  cta: [
    'bg-redwood-cta text-white',
    'hover:bg-redwood-cta-hover',
    'active:scale-[.98]',
    'disabled:opacity-40',
  ].join(' '),

  /* eliminar, rechazar */
  danger: [
    'bg-redwood-danger text-white',
    'hover:bg-redwood-danger-hover',
    'active:scale-[.98]',
    'disabled:opacity-40',
  ].join(' '),

  /* cancelar en formularios */
  subtle: [
    'bg-redwood-solid-bg text-redwood-text',
    'hover:bg-redwood-hover-bg',
    'active:scale-[.98]',
    'disabled:opacity-40',
  ].join(' '),

  /* acciones secundarias, "Ver detalle" */
  ghost: [
    'bg-transparent border border-redwood-border text-redwood-text',
    'hover:bg-redwood-hover-bg',
    'active:scale-[.98]',
    'disabled:opacity-40',
  ].join(' '),

  /* outlined con color primario */
  outlined: [
    'border border-redwood-selected-border text-redwood-primary bg-transparent',
    'hover:bg-redwood-hover-bg',
    'active:scale-[.98]',
    'disabled:opacity-40',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-[40px] px-4 text-sm gap-2',
  compact: 'h-9 px-4 text-sm gap-2',
  mini:    'h-[30px] px-2.5 text-[11px] font-bold uppercase tracking-[.08em] gap-1.5',
  icon:    'h-9 w-9 p-0 gap-0',
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
        'inline-flex items-center justify-center rounded-[10px] font-semibold',
        'transition-all duration-[100ms] whitespace-nowrap',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redwood-focus-ring',
        'disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : icon && <span className="flex-shrink-0">{icon}</span>
      }
      {size !== 'icon' && children}
    </button>
  );
}
