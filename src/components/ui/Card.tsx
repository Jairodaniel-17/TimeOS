'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/* ── Card base ── */
interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hover?: boolean;
}

const paddingStyles = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
};

export function Card({ children, className, padding = 'md', onClick, hover }: CardProps) {
  const isInteractive = !!onClick || hover;
  return (
    <section
      onClick={onClick}
      className={clsx(
        'overflow-hidden rounded-[14px] border border-redwood-border bg-redwood-surface shadow-rw',
        isInteractive && 'cursor-pointer transition-all duration-100 hover:shadow-rw-dropdown hover:-translate-y-px',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </section>
  );
}

/* ── CardHeader ── */
export function CardHeader({
  children,
  className,
  actions,
}: {
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className={clsx(
        'flex flex-col gap-3 border-b border-redwood-border px-5 py-4',
        'md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <h3 className="text-base font-bold text-redwood-text">{children}</h3>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}

/* ── KPI Stat Card (border-left semántico) ── */
type StatAccent = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const accentBorder: Record<StatAccent, string> = {
  primary: 'border-l-redwood-primary',
  success: 'border-l-redwood-green',
  warning: 'border-l-[#cd7d1a]',
  danger:  'border-l-redwood-danger',
  neutral: 'border-l-redwood-border',
};

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  accent?: StatAccent;
  emphasis?: boolean;
  onClick?: () => void;
}

export function KPICard({
  label,
  value,
  subtitle,
  trend,
  accent = 'primary',
  emphasis,
  onClick,
}: KPICardProps) {
  return (
    <article
      onClick={onClick}
      className={clsx(
        'min-h-[132px] rounded-[14px] border-l-4 border border-redwood-border',
        'bg-redwood-surface px-5 py-4 shadow-rw transition-all duration-100',
        accentBorder[accent],
        onClick && 'cursor-pointer hover:shadow-rw-dropdown hover:-translate-y-px',
        emphasis && 'border-redwood-primary'
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">
        {label}
      </p>
      <p className="mt-2 text-[28px] leading-none font-bold text-redwood-text">
        {value}
      </p>
      {subtitle && (
        <p className="mt-3 text-xs text-redwood-muted">{subtitle}</p>
      )}
      {trend && (
        <p className="mt-2 text-xs font-medium text-redwood-primary">{trend}</p>
      )}
    </article>
  );
}
