'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { clsx } from 'clsx';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      <Sidebar />
      <main
        className={clsx(
          'flex-1 flex flex-col overflow-hidden transition-all duration-300',
          isCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
