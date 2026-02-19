'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="flex h-screen bg-[var(--color-bg-page)]">
      <Sidebar />
      <main 
        className={clsx(
          'flex-1 overflow-hidden transition-all duration-300',
          isCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        {children}
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

import { clsx } from 'clsx';
