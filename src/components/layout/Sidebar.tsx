'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  GanttChart,
  Users,
  BarChart3,
  FolderOpen,
  Settings,
  ListTodo,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  DollarSign,
  Briefcase,
  Calculator,
} from 'lucide-react';
import type { Permission } from '@/hooks/usePermissions';
import { useEffect, useState } from 'react';

const navItems: Array<{
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission: Permission | null;
  badge?: number;
}> = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', permission: null },
  { to: '/projects', icon: Briefcase, label: 'Proyectos', permission: 'projects:read' },
  { to: '/timesheet', icon: Clock, label: 'Tiempos', permission: null },
  { to: '/approvals', icon: CheckCircle, label: 'Aprobaciones', permission: 'approvals:read' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks', permission: 'tasks:read' },
  { to: '/planning', icon: GanttChart, label: 'Planificación', permission: null },
  { to: '/spreadsheet', icon: Calculator, label: 'Hoja de Cálculo', permission: null },
  { to: '/resources', icon: Users, label: 'Recursos', permission: 'resources:read' },
  { to: '/reports', icon: BarChart3, label: 'Reportes', permission: 'reports:read' },
  { to: '/costs', icon: DollarSign, label: 'Costos', permission: 'reports:costs' },
  { to: '/users', icon: UserCircle, label: 'Usuarios', permission: 'users:read' },
  { to: '/documents', icon: FolderOpen, label: 'Documentos', permission: null },
  { to: '/settings', icon: Settings, label: 'Configuración', permission: 'settings:read' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    fetch('/api/approvals?status=pending')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setPendingApprovals(data.data.length);
        }
      })
      .catch(() => {});
  }, []);

  const filteredNavItems = navItems.filter(item => 
    item.permission === null || hasPermission(item.permission)
  );

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-full border-r border-[var(--color-border-subtle)] bg-white flex flex-col z-40 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-60'
    )}>
      <div className={clsx('flex h-16 items-center gap-3 border-b border-[var(--color-border-subtle)]', isCollapsed ? 'px-3 justify-center' : 'px-5')}>
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]">
          <Clock className="h-5 w-5 text-white" />
        </div>
        {!isCollapsed && (
          <div>
            <div className="text-sm font-semibold text-[var(--color-text-primary)]">TimeOS</div>
            <div className="text-[10px] text-[var(--color-text-secondary)]">Workspace</div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            'p-1 rounded hover:bg-gray-100 text-gray-500',
            isCollapsed ? 'absolute -right-3 top-4 bg-white border shadow-sm' : 'ml-auto'
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.to || 
              (item.to !== '/' && pathname.startsWith(item.to));
            const badge = item.to === '/approvals' ? pendingApprovals : item.badge;
            return (
              <li key={item.to}>
                <Link
                  href={item.to}
                  className={clsx(
                    'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium',
                    'transition-all duration-[var(--duration-instant)]',
                    isActive
                      ? 'bg-[rgba(11,92,255,0.08)] text-[var(--color-primary)] border-l-[3px] border-[var(--color-primary)] -ml-[3px] pl-[calc(0.75rem+3px)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[#F1F4F9] hover:text-[var(--color-text-primary)]',
                    isCollapsed && 'justify-center px-2'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {badge && badge > 0 && (
                        <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-white">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && badge && badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--color-border-subtle)] p-4">
        {user ? (
          <div className={clsx('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-sm font-medium text-[var(--color-primary)]">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user.name}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] capitalize">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[var(--radius-sm)] transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={clsx(
              'flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors',
              isCollapsed ? 'py-2 px-0' : 'py-2 px-4 w-full'
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Iniciar sesión</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}
