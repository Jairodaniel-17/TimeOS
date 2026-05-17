'use client';

import { clsx } from 'clsx';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Search, X, Calendar, ChevronDown } from 'lucide-react';

type InputVariant = 'text' | 'search' | 'dropdown' | 'date';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  error?: boolean;
  icon?: ReactNode;
  onClear?: () => void;
}

const baseInput = [
  'w-full min-h-[40px] px-3 py-2 rounded-[10px] border',
  'bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted',
  'transition-colors duration-100',
  'focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20',
  'disabled:bg-redwood-surface-soft disabled:text-redwood-muted disabled:cursor-not-allowed',
].join(' ');

export function Input({
  variant = 'text',
  error = false,
  icon,
  className,
  onClear,
  ...props
}: InputProps) {
  const icons: Record<InputVariant, ReactNode | undefined> = {
    text:     icon,
    search:   <Search className="h-4 w-4 text-redwood-muted" />,
    dropdown: <ChevronDown className="h-4 w-4 text-redwood-muted" />,
    date:     <Calendar className="h-4 w-4 text-redwood-muted" />,
  };

  const leadingIcon = icons[variant];

  return (
    <div className="relative flex items-center">
      {leadingIcon && (
        <span className="pointer-events-none absolute left-3 flex items-center">
          {leadingIcon}
        </span>
      )}
      <input
        className={clsx(
          baseInput,
          error
            ? 'border-redwood-danger focus:ring-redwood-danger/20'
            : 'border-redwood-border hover:border-redwood-primary/50',
          leadingIcon ? 'pl-10' : 'pl-3',
          (variant === 'dropdown' || (variant === 'search' && props.value)) ? 'pr-10' : 'pr-3',
          className
        )}
        {...props}
      />
      {variant === 'search' && props.value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 flex items-center text-redwood-muted hover:text-redwood-text transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ── Compact input (h-9 — filter toolbar) ── */
export function CompactInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'h-9 w-full rounded-sm border border-redwood-border bg-redwood-surface px-3',
        'text-sm text-redwood-text placeholder:text-redwood-muted outline-none transition',
        'focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20',
        className
      )}
      {...props}
    />
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error = false, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={clsx(
        'w-full px-3 py-2.5 rounded-[10px] border',
        'bg-redwood-surface-soft text-sm text-redwood-text placeholder:text-redwood-muted',
        'resize-y outline-none leading-[1.6] transition-all',
        'focus:border-redwood-primary focus:ring-2 focus:ring-redwood-primary/12',
        error
          ? 'border-redwood-danger'
          : 'border-redwood-border',
        className
      )}
      {...props}
    />
  );
}
