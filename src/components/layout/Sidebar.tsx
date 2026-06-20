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
  DollarSign,
  Briefcase,
  Calculator,
  Shield,
  Building2,
  Target,
  KanbanSquare,
  Activity,
} from 'lucide-react';
import type { Permission } from '@/hooks/usePermissions';
import { useEffect, useState } from 'react';

const navItems: Array<{
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission: Permission | null;
}> = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',      permission: null },
  { to: '/projects',      icon: Briefcase,       label: 'Proyectos',      permission: 'projects:read' },
  { to: '/clients',       icon: Building2,       label: 'Clientes',       permission: 'projects:read' },
  { to: '/timesheet',     icon: Clock,           label: 'Tiempos',        permission: null },
  { to: '/okrs',          icon: Target,          label: 'OKRs',           permission: 'okrs:read' },
  { to: '/approvals',     icon: CheckCircle,     label: 'Aprobaciones',   permission: 'approvals:read' },
  { to: '/tasks',         icon: ListTodo,        label: 'Tareas',         permission: 'tasks:read' },
  { to: '/board',         icon: KanbanSquare,    label: 'Tablero',        permission: 'tasks:read' },
  { to: '/sprints',       icon: Activity,        label: 'Sprints',        permission: 'tasks:read' },
  { to: '/planning',      icon: GanttChart,      label: 'Planificación',  permission: null },
  { to: '/spreadsheet',   icon: Calculator,      label: 'Hoja de Cálculo',permission: null },
  { to: '/resources',     icon: Users,           label: 'Recursos',       permission: 'resources:read' },
  { to: '/reports',       icon: BarChart3,       label: 'Reportes',       permission: 'reports:read' },
  { to: '/costs',         icon: DollarSign,      label: 'Costos',         permission: 'reports:costs' },
  { to: '/users',         icon: Users,           label: 'Usuarios',       permission: 'users:read' },
  { to: '/settings/organization', icon: Building2, label: 'Organización',  permission: 'settings:read' },
  { to: '/documents',     icon: FolderOpen,      label: 'Documentos',     permission: null },
  { to: '/settings',      icon: Settings,        label: 'Configuración',  permission: 'settings:read' },
  { to: '/settings/roles',icon: Shield,          label: 'Roles y Permisos',permission: 'settings:update' },
];

/* Nav groups */
const NAV_GROUPS = [
  { label: null,       paths: ['/', '/projects', '/clients', '/timesheet'] },
  { label: 'Estrategia', paths: ['/okrs'] },
  { label: 'Gestión',  paths: ['/approvals', '/tasks', '/board', '/sprints', '/planning', '/spreadsheet'] },
  { label: 'Análisis', paths: ['/resources', '/reports', '/costs'] },
  { label: 'Sistema',  paths: ['/users', '/settings/organization', '/documents', '/settings', '/settings/roles'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    const fetchPending = () => {
      fetch('/api/approvals?status=pending')
        .then(r => r.json())
        .then(d => { if (d.success && d.data) setPendingApprovals(d.data.length); })
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Refresh badge whenever user navigates (e.g. back from approvals page)
  useEffect(() => {
    fetch('/api/approvals?status=pending')
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setPendingApprovals(d.data.length); })
      .catch(() => {});
  }, [pathname]);

  const allowed = navItems.filter(i => i.permission === null || hasPermission(i.permission));
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full flex flex-col z-40',
        'transition-all duration-300',
        'bg-oracle-sidebar',
        isCollapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      {/* ── Brand ── */}
      <div
        className={clsx(
          'flex h-[60px] items-center gap-3 flex-shrink-0',
          'border-b border-white/[.18]',
          isCollapsed ? 'justify-center px-3' : 'px-[18px]'
        )}
      >
        {/* Oracle-red brand mark */}
        <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xl bg-oracle-red font-extrabold tracking-tighter text-white text-[15px]">
          T
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold leading-tight text-white">TimeOS</div>
            <div className="text-xs opacity-70 mt-0.5 text-white">Orvanta ERP</div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            'flex items-center justify-center w-6 h-6 rounded-[6px] text-white/60',
            'hover:text-white hover:bg-white/[.12] transition-colors flex-shrink-0',
            isCollapsed && 'absolute -right-3 top-[17px] w-6 h-6 bg-oracle-sidebar border border-white/[.18] shadow-md rounded-r-[8px]'
          )}
        >
          {isCollapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft  className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-[10px]">
        {NAV_GROUPS.map((group, gi) => {
          const groupItems = allowed.filter(i => group.paths.includes(i.to));
          if (groupItems.length === 0) return null;

          return (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.label && !isCollapsed && (
                <div className="mb-1.5 px-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[.1em] text-white/40">
                    {group.label}
                  </span>
                </div>
              )}
              {isCollapsed && gi > 0 && (
                <div className="h-px bg-white/[.12] mx-2 mb-3 mt-1" />
              )}
              <ul className="grid gap-0.5">
                {groupItems.map(item => {
                  const isActive = pathname === item.to ||
                    (item.to !== '/' && pathname.startsWith(item.to));
                  const badge = item.to === '/approvals' ? pendingApprovals : 0;

                  return (
                    <li key={item.to}>
                      <Link
                        href={item.to}
                        title={isCollapsed ? item.label : undefined}
                        className={clsx(
                          'flex items-center gap-2.5 rounded-[10px] text-sm font-medium',
                          'transition-colors duration-100',
                          isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                          isActive
                            ? 'bg-white/[.12] text-white'
                            : 'text-white/[.82] hover:text-white hover:bg-white/[.12]'
                        )}
                      >
                        {/* icon (always shown — expanded and collapsed) */}
                        <item.icon
                          className={clsx(
                            'h-[18px] w-[18px] flex-shrink-0',
                            isActive ? 'opacity-100' : 'opacity-80'
                          )}
                        />
                        {!isCollapsed && <span className="flex-1">{item.label}</span>}
                        {!isCollapsed && badge > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-oracle-red px-1.5 text-[10px] font-bold text-white">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                        {isCollapsed && badge > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-oracle-red text-[8px] font-bold text-white">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="border-t border-white/[.18] p-3 flex-shrink-0">
        {user ? (
          <div className={clsx('flex items-center gap-2.5', isCollapsed && 'justify-center')}>
            {/* Avatar */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[.18] text-xs font-bold text-white border border-white/[.20]">
              {initials}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-white/60 capitalize mt-0.5">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/[.12] rounded-[6px] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={clsx(
              'flex items-center justify-center gap-2 bg-redwood-primary text-white',
              'rounded-[10px] text-xs font-semibold hover:bg-redwood-primary-hover transition-colors',
              isCollapsed ? 'p-2' : 'py-2 px-3 w-full'
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
