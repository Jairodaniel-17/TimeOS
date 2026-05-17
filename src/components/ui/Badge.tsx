'use client';

import { clsx } from 'clsx';
import { X } from 'lucide-react';

/* ── Status badge (Build v4 redwood-*) ── */
type BadgeStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'overdue' | 'active' | 'info';

const statusStyles: Record<BadgeStatus, string> = {
  draft:    'bg-badge-subtle-neutral-bg text-redwood-text  border-redwood-border/50',
  pending:  'bg-badge-subtle-warning-bg text-redwood-text  border-badge-strong-warning-bg/20',
  approved: 'bg-badge-subtle-success-bg text-redwood-text  border-redwood-green/20',
  rejected: 'bg-badge-subtle-danger-bg  text-redwood-text  border-redwood-danger/15',
  overdue:  'bg-badge-subtle-danger-bg  text-redwood-text  border-redwood-danger/15',
  active:   'bg-badge-subtle-success-bg text-redwood-text  border-redwood-green/20',
  info:     'bg-badge-subtle-info-bg    text-redwood-text  border-redwood-primary/15',
};

type BadgeSeverity = 'info' | 'warning' | 'error' | 'success' | 'neutral';

const severityStyles: Record<BadgeSeverity, string> = {
  info:    'bg-badge-subtle-info-bg    text-redwood-text border-redwood-primary/15',
  warning: 'bg-badge-subtle-warning-bg text-redwood-text border-badge-strong-warning-bg/20',
  error:   'bg-badge-subtle-danger-bg  text-redwood-text border-redwood-danger/15',
  success: 'bg-badge-subtle-success-bg text-redwood-text border-redwood-green/20',
  neutral: 'bg-badge-subtle-neutral-bg text-redwood-text border-redwood-border/50',
};

interface BadgeProps {
  status?: BadgeStatus;
  severity?: BadgeSeverity;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ status, severity, children, className }: BadgeProps) {
  const styles = status
    ? statusStyles[status]
    : severity
    ? severityStyles[severity]
    : severityStyles.neutral;

  return (
    <span
      className={clsx(
        'inline-flex items-center min-h-6 rounded-full border px-3 py-1',
        'text-[11px] font-semibold whitespace-nowrap',
        styles,
        className
      )}
    >
      {children}
    </span>
  );
}

/* ── Chip (tag filtreable) ── */
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
        'inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-xs font-semibold',
        'transition-colors duration-100',
        selected
          ? 'bg-redwood-selected-bg border border-redwood-selected-border text-redwood-text'
          : 'bg-redwood-surface border border-redwood-border text-redwood-text hover:border-redwood-primary/50',
        className
      )}
    >
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
