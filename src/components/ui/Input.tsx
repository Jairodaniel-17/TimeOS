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

export function Input({
  variant = 'text',
  error = false,
  icon,
  className,
  onClear,
  ...props
}: InputProps) {
  const icons: Record<InputVariant, ReactNode | undefined> = {
    text: icon,
    search: <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />,
    dropdown: <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />,
    date: <Calendar className="h-4 w-4 text-[var(--color-text-secondary)]" />,
  };

  return (
    <div className="relative flex items-center">
      {icons[variant] && (
        <span className="pointer-events-none absolute left-3 flex items-center">
          {icons[variant]}
        </span>
      )}
      <input
        className={clsx(
          'h-9 w-full rounded-[var(--radius-sm)] border bg-white text-sm',
          'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]',
          'transition-all duration-[var(--duration-micro)] ease-[var(--ease-standard)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]',
          'disabled:bg-[var(--color-readonly-cell)] disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed',
          error
            ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-secondary)]',
          icons[variant] ? 'pl-10' : 'pl-3',
          variant === 'dropdown' || (variant === 'search' && props.value) ? 'pr-10' : 'pr-3',
          className
        )}
        {...props}
      />
      {variant === 'search' && props.value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error = false, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-[var(--radius-sm)] border bg-white px-3 py-2 text-sm',
        'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]',
        'transition-all duration-[var(--duration-micro)] ease-[var(--ease-standard)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]',
        'disabled:bg-[var(--color-readonly-cell)] disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed',
        error
          ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
          : 'border-[var(--color-border-subtle)] hover:border-[var(--color-secondary)]',
        className
      )}
      {...props}
    />
  );
}
