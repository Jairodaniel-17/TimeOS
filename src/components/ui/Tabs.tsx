'use client';

import { clsx } from 'clsx';

type TabStyle = 'underlined' | 'pills';

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  style?: TabStyle;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, style = 'underlined', className }: TabsProps) {
  return (
    <div className={clsx('flex gap-1', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 text-sm font-medium transition-all',
              'duration-[var(--duration-micro)] ease-[var(--ease-standard)]',
              style === 'underlined' && [
                'relative px-4 py-2',
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                isActive && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--color-primary)]",
              ],
              style === 'pills' && [
                'rounded-[var(--radius-sm)] px-3 py-1.5',
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-page)]',
              ]
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={clsx(
                'rounded-full px-1.5 py-0.5 text-xs',
                style === 'pills' && isActive
                  ? 'bg-white/20'
                  : 'bg-[var(--color-bg-page)]'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
