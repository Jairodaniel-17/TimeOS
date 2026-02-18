'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white',
        'shadow-[var(--shadow-elevation-low)]',
        onClick && 'cursor-pointer hover:shadow-[var(--shadow-elevation-high)] transition-shadow duration-[var(--duration-micro)]',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export function KPICard({ label, value, trend, trendValue, icon, onClick }: KPICardProps) {
  return (
    <Card
      onClick={onClick}
      className={clsx(onClick && 'cursor-pointer hover:border-[var(--color-primary)]')}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{value}</p>
          {trend && trendValue && (
            <p
              className={clsx(
                'mt-1 text-xs font-medium',
                trend === 'up' && 'text-[var(--color-success)]',
                trend === 'down' && 'text-[var(--color-error)]',
                trend === 'stable' && 'text-[var(--color-text-secondary)]'
              )}
            >
              {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-[var(--radius-md)] bg-[var(--color-primary-light)] p-2 text-[var(--color-primary)]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
