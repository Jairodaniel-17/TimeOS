'use client';

import { Sidebar } from '@/components/layout/Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--color-bg-page)]">
      <Sidebar />
      <main className="flex-1 ml-60 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
