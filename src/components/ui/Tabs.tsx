'use client';

import { clsx } from 'clsx';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

/* DashboardTabs — Redwood Build v4 pattern */
export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <nav
      className={clsx(
        'flex gap-1 overflow-x-auto border-b border-redwood-border pb-px',
        className
      )}
    >
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'inline-flex shrink-0 items-center gap-2 rounded-t-lg border border-b-0',
              'px-4 py-3 text-sm font-semibold transition-colors duration-100',
              isActive
                ? 'border-redwood-border bg-redwood-surface text-redwood-text'
                : 'border-transparent text-redwood-muted hover:bg-redwood-hover-bg hover:text-redwood-text'
            )}
          >
            <span>{tab.label}</span>
            {tab.count != null && (
              <small
                className={clsx(
                  'rounded-full border border-redwood-border px-2 py-0.5 text-[11px] font-semibold',
                  isActive ? 'bg-redwood-solid-bg text-redwood-muted' : 'bg-redwood-hover-bg text-redwood-muted'
                )}
              >
                {tab.count}
              </small>
            )}
          </button>
        );
      })}
    </nav>
  );
}
