'use client';

import { clsx } from 'clsx';
import { X } from 'lucide-react';

type BadgeStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'overdue';
type BadgeSeverity = 'info' | 'warning' | 'error' | 'success';

const statusStyles: Record<BadgeStatus, string> = {
  draft: 'bg-[var(--color-readonly-cell)] text-[var(--color-text-secondary)]',
  pending: 'bg-[#FFF4E5] text-[var(--color-warning)]',
  approved: 'bg-[#E5F5ED] text-[var(--color-success)]',
  rejected: 'bg-[#FDEAEA] text-[var(--color-error)]',
  overdue: 'bg-[#FDEAEA] text-[var(--color-error)]',
};

const severityStyles: Record<BadgeSeverity, string> = {
  info: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  warning: 'bg-[#FFF4E5] text-[var(--color-warning)]',
  error: 'bg-[#FDEAEA] text-[var(--color-error)]',
  success: 'bg-[#E5F5ED] text-[var(--color-success)]',
};

interface BadgeProps {
  status?: BadgeStatus;
  severity?: BadgeSeverity;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ status, severity, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        status ? statusStyles[status] : severity ? severityStyles[severity] : '',
        className
      )}
    >
      {children}
    </span>
  );
}

interface ChipProps {
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ selected, removable, onRemove, children, className }: ChipProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium',
        'transition-all duration-[var(--duration-instant)]',
        selected
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-white border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]',
        className
      )}
    >
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full hover:bg-black/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
