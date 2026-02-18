'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  GanttChart,
  Users,
  BarChart3,
  FolderOpen,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/timesheet', icon: Clock, label: 'Tiempos' },
  { to: '/approvals', icon: CheckCircle, label: 'Aprobaciones', badge: 3 },
  { to: '/planning', icon: GanttChart, label: 'Planificación' },
  { to: '/resources', icon: Users, label: 'Recursos' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/documents', icon: FolderOpen, label: 'Documentos' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 border-r border-[var(--color-border-subtle)] bg-white flex flex-col z-40">
      <div className="flex h-16 items-center gap-3 px-5 border-b border-[var(--color-border-subtle)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--color-text-primary)]">TimeOS</div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">Workspace Operations</div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.to || 
              (item.to !== '/' && pathname.startsWith(item.to));
            return (
              <li key={item.to}>
                <Link
                  href={item.to}
                  className={clsx(
                    'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium',
                    'transition-all duration-[var(--duration-instant)]',
                    isActive
                      ? 'bg-[rgba(11,92,255,0.08)] text-[var(--color-primary)] border-l-[3px] border-[var(--color-primary)] -ml-[3px] pl-[calc(0.75rem+3px)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[#F1F4F9] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--color-border-subtle)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-sm font-medium text-[var(--color-primary)]">
            AG
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">Ana García</div>
            <div className="text-xs text-[var(--color-text-secondary)]">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
