import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function Header({ title, breadcrumbs, actions }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-border-subtle)] bg-white px-6">
      <div className="flex flex-col justify-center">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] mb-1">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[var(--color-primary)]">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col h-screen', className)}>
      {children}
    </div>
  );
}

export function PageContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex-1 overflow-y-auto p-6', className)}>
      {children}
    </div>
  );
}
