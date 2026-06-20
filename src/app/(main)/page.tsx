'use client';

import { useEffect, useState } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, KPICard, Card, CardHeader, Badge } from '@/components/ui';
import {
  Clock,
  CheckCircle,
  Users,
  Calendar,
  RefreshCw,
  Plus,
  ArrowRight,
  Activity,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { getWeekNumber, getCurrentYear } from '@/lib/utils';

interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  activity: string;
  notes?: string;
  weekNumber: number;
  year: number;
  total: number;
  status: string;
  hours?: Record<string, number>;
  project: { name: string };
}

interface Approval {
  id: string;
  weekNumber: number;
  year: number;
  totalHours: number;
  status: string;
  user: { name: string };
}

interface KPIData {
  totalHours: number;
  pendingApprovals: number;
  usersWithoutEntries: number;
  currentWeek: number;
  projectHours: Record<string, number>;
}

interface TeamMember {
  userId: string;
  name: string;
  logged: number;
  capacity: number;
  allocated: number;
  submission: 'approved' | 'pending' | 'changes_requested' | 'rejected' | 'none';
}

interface DayBar {
  day: string;
  pct: number;
  hours: number;
}

const CHART_COLORS = [
  'var(--color-redwood-primary)',
  'var(--color-redwood-green)',
  '#cd7d1a',
  'var(--color-oracle-red)',
  '#7c6452',
];

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalHours: 0,
    pendingApprovals: 0,
    usersWithoutEntries: 0,
    currentWeek: getWeekNumber(),
    projectHours: {},
  });
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [weekDayBars, setWeekDayBars] = useState<DayBar[]>(
    DAY_LABELS.map(day => ({ day, pct: 0, hours: 0 }))
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentWeek = getWeekNumber();
      const currentYear = getCurrentYear();

      const [entriesRes, approvalsRes, usersRes, resourcesRes, allocationsRes, weekApprovalsRes] = await Promise.all([
        fetch(`/api/timesheets?weekNumber=${currentWeek}&year=${currentYear}&limit=500`),
        fetch('/api/approvals?status=pending&limit=5'),
        fetch('/api/users'),
        fetch('/api/resources'),
        fetch('/api/allocations'),
        fetch('/api/approvals?limit=500'),
      ]);

      const [entriesData, approvalsData, usersData, resourcesData, allocationsData, weekApprovalsData] = await Promise.all([
        entriesRes.json(),
        approvalsRes.json(),
        usersRes.json(),
        resourcesRes.json(),
        allocationsRes.json(),
        weekApprovalsRes.json(),
      ]);

      if (entriesData.success) {
        const entries = entriesData.data as TimeEntry[];
        setRecentEntries(entries.slice(0, 5));

        const totalHours = entries.reduce((sum: number, e: TimeEntry) => sum + e.total, 0);

        const projectHours: Record<string, number> = {};
        entries.forEach((e: TimeEntry) => {
          const name = e.project?.name || 'Sin proyecto';
          projectHours[name] = (projectHours[name] || 0) + e.total;
        });

        // Compute real hours per weekday
        const dayTotals = DAY_KEYS.map(key =>
          entries.reduce((sum, e) => sum + (e.hours?.[key] || 0), 0)
        );
        const maxH = Math.max(...dayTotals, 1);
        setWeekDayBars(dayTotals.map((h, i) => ({
          day: DAY_LABELS[i],
          pct: Math.round((h / maxH) * 100),
          hours: Math.round(h * 10) / 10,
        })));

        // --- Team summary for the current week (PM oversight) ---
        const users = (usersData.success ? usersData.data : []) as { id: string; name: string }[];
        const resources = (resourcesData.success ? resourcesData.data : []) as { id: string; userId: string; capacity?: number }[];
        const allocations = (allocationsData.success ? allocationsData.data : []) as { resourceId: string; allocatedHours: number; weekNumber: number; year: number }[];
        const weekApprovals = (weekApprovalsData.success ? weekApprovalsData.data : []) as { userId: string; weekNumber: number; year: number; status: string }[];

        const loggedByUser = new Map<string, number>();
        entries.forEach(e => loggedByUser.set(e.userId, (loggedByUser.get(e.userId) || 0) + e.total));

        const summary: TeamMember[] = resources.map(r => {
          const u = users.find(x => x.id === r.userId);
          const allocated = allocations
            .filter(a => a.resourceId === r.id && a.weekNumber === currentWeek && a.year === currentYear)
            .reduce((s, a) => s + a.allocatedHours, 0);
          const approval = weekApprovals.find(a => a.userId === r.userId && a.weekNumber === currentWeek && a.year === currentYear);
          return {
            userId: r.userId,
            name: u?.name || 'Sin nombre',
            logged: loggedByUser.get(r.userId) || 0,
            capacity: r.capacity || 40,
            allocated,
            submission: (approval?.status as TeamMember['submission']) || 'none',
          };
        }).sort((a, b) => a.name.localeCompare(b.name));

        setTeam(summary);
        const usersWithoutEntries = summary.filter(m => m.logged === 0).length;
        setKpiData(prev => ({ ...prev, totalHours, projectHours, usersWithoutEntries }));
      }

      if (approvalsData.success) {
        const approvals = approvalsData.data as Approval[];
        setPendingApprovals(approvals.slice(0, 5));
        setKpiData(prev => ({ ...prev, pendingApprovals: approvals.length }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh ("near real-time" sin websockets): refresca el dashboard cada
    // 30s, solo cuando la pestaña está visible, para no machacar al servidor.
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData();
      }
    }, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageLayout>
      <Header
        title="Dashboard"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Link href="/timesheet">
              <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
                Registrar horas
              </Button>
            </Link>
            <Button
              variant="subtle"
              size="icon"
              icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchData}
              disabled={loading}
            />
          </>
        }
      />
      <PageContent>
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[132px] rounded-[14px] animate-pulse bg-redwood-solid-bg" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-64 rounded-[14px] animate-pulse bg-redwood-solid-bg" />
              <div className="h-64 rounded-[14px] animate-pulse bg-redwood-solid-bg" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/reports" className="block">
                <KPICard
                  label="Horas esta semana"
                  value={`${kpiData.totalHours}h`}
                  subtitle={`Semana ${kpiData.currentWeek}`}
                  trend="vs semana anterior"
                  accent="primary"
                />
              </Link>
              <Link href="/approvals" className="block">
                <KPICard
                  label="Pendientes aprobación"
                  value={kpiData.pendingApprovals}
                  subtitle={kpiData.pendingApprovals > 0 ? 'requieren acción' : 'Al día'}
                  accent={kpiData.pendingApprovals > 0 ? 'warning' : 'success'}
                />
              </Link>
              <KPICard
                label="Usuarios sin registro"
                value={kpiData.usersWithoutEntries}
                subtitle="esta semana"
                accent={kpiData.usersWithoutEntries > 0 ? 'danger' : 'neutral'}
              />
              <KPICard
                label="Semana actual"
                value={`Sem. ${kpiData.currentWeek}`}
                subtitle={new Date().getFullYear().toString()}
                accent="neutral"
              />
            </div>

            {/* Main content row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Approvals table */}
              <div className="lg:col-span-2">
                <Card padding="none">
                  <CardHeader
                    actions={
                      <Link href="/approvals">
                        <Button variant="ghost" size="compact">
                          Ver todas
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    }
                  >
                    Aprobaciones pendientes
                  </CardHeader>
                  <div className="divide-y divide-redwood-border">
                    {pendingApprovals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <CheckCircle className="h-8 w-8 text-redwood-green opacity-40" />
                        <p className="text-sm text-redwood-muted">
                          No hay aprobaciones pendientes
                        </p>
                      </div>
                    ) : (
                      pendingApprovals.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-redwood-hover-bg transition-colors"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-oracle-sidebar text-[11px] font-semibold text-white">
                            {item.user.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-redwood-text">
                                {item.user.name}
                              </span>
                              <Badge status="pending">Pendiente</Badge>
                            </div>
                            <span className="text-xs text-redwood-muted">
                              Semana {item.weekNumber} · {item.totalHours}h
                            </span>
                          </div>
                          <Link href="/approvals">
                            <Button variant="primary" size="compact">
                              Aprobar
                            </Button>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Recent entries */}
              <div>
                <Card padding="none">
                  <CardHeader>Entradas recientes</CardHeader>
                  <div className="divide-y divide-redwood-border">
                    {recentEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Activity className="h-8 w-8 text-redwood-muted opacity-40" />
                        <p className="text-sm text-redwood-muted">
                          Sin actividad esta semana
                        </p>
                      </div>
                    ) : (
                      recentEntries.map(entry => (
                        <div key={entry.id} className="px-5 py-3 hover:bg-redwood-hover-bg transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-redwood-text truncate">
                              {entry.project?.name || 'Sin proyecto'}
                            </p>
                            <span className="text-xs font-bold text-redwood-primary flex-shrink-0">
                              {entry.total}h
                            </span>
                          </div>
                          <p className="text-xs text-redwood-muted truncate mt-0.5">
                            {entry.activity || 'Sin actividad'}
                          </p>
                          {entry.notes?.trim() && (
                            <p className="text-xs text-redwood-muted/80 line-clamp-2 mt-1 leading-relaxed">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Team summary — PM oversight for the current week */}
            <Card padding="none">
              <CardHeader
                actions={
                  <Link href="/resources">
                    <Button variant="ghost" size="compact">
                      Ver recursos
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                }
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-redwood-muted" />
                  Equipo · Semana {kpiData.currentWeek}
                </span>
              </CardHeader>
              {team.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Users className="h-8 w-8 text-redwood-muted opacity-40" />
                  <p className="text-sm text-redwood-muted">Sin miembros del equipo configurados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-redwood-border text-left">
                        <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-redwood-muted">Miembro</th>
                        <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-redwood-muted w-[42%]">Horas registradas vs. capacidad</th>
                        <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-redwood-muted text-center">Asignado</th>
                        <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-redwood-muted text-center">Timesheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-redwood-border">
                      {team.map(m => {
                        const pct = m.capacity > 0 ? Math.min(Math.round((m.logged / m.capacity) * 100), 100) : 0;
                        const over = m.allocated > m.capacity;
                        const barColor = m.logged === 0 ? 'bg-redwood-danger' : pct < 60 ? 'bg-redwood-warning' : 'bg-redwood-primary';
                        const sub = {
                          approved: { label: 'Aprobado', cls: 'bg-badge-subtle-success-bg text-redwood-green' },
                          pending: { label: 'Enviado', cls: 'bg-badge-subtle-info-bg text-redwood-primary' },
                          changes_requested: { label: 'Cambios', cls: 'bg-badge-subtle-warning-bg text-redwood-warning' },
                          rejected: { label: 'Rechazado', cls: 'bg-badge-subtle-danger-bg text-redwood-danger' },
                          none: { label: 'Sin enviar', cls: 'bg-redwood-page text-redwood-muted' },
                        }[m.submission];
                        return (
                          <tr key={m.userId} className="hover:bg-redwood-hover-bg transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-oracle-sidebar text-[11px] font-semibold text-white">
                                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-redwood-text">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-redwood-page rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(pct, m.logged > 0 ? 4 : 0)}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-redwood-text whitespace-nowrap w-16 text-right">
                                  {m.logged}h / {m.capacity}h
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${over ? 'text-redwood-danger' : 'text-redwood-muted'}`}>
                                {m.allocated}h
                                {over && <span title="Sobreasignado">⚠</span>}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${sub.cls}`}>
                                {sub.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar chart */}
              <Card>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted mb-1">
                      Semana {kpiData.currentWeek}
                    </p>
                    <h3 className="text-base font-bold text-redwood-text">
                      Horas por día
                    </h3>
                  </div>
                  <TrendingUp className="h-4 w-4 text-redwood-muted" />
                </div>
                <div className="flex items-end gap-2 h-36">
                  {weekDayBars.map(({ day, pct, hours }) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full flex items-end" style={{ height: '112px' }}>
                        <div
                          className="w-full rounded-t-[6px] bg-redwood-primary opacity-80 hover:opacity-100 transition-opacity cursor-pointer group relative"
                          style={{ height: `${Math.max(pct, 2)}%` }}
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center bg-oracle-sidebar text-white text-[10px] px-2 py-1 rounded-[6px] whitespace-nowrap shadow-rw z-10">
                            {hours}h
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-redwood-muted">{day}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Donut chart */}
              <Card>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted mb-1">
                      Esta semana
                    </p>
                    <h3 className="text-base font-bold text-redwood-text">
                      Distribución por proyecto
                    </h3>
                  </div>
                  <Clock className="h-4 w-4 text-redwood-muted" />
                </div>
                {Object.keys(kpiData.projectHours).length > 0 && kpiData.totalHours > 0 ? (
                  <div className="flex items-center gap-6">
                    <div className="relative w-28 h-28 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50" cy="50" r="40"
                          fill="none"
                          stroke="var(--color-redwood-border)"
                          strokeWidth="10"
                        />
                        {Object.entries(kpiData.projectHours).slice(0, 5).map(([, hours], idx) => {
                          const prevPct = Object.entries(kpiData.projectHours)
                            .slice(0, idx)
                            .reduce((sum, [, h]) => sum + (h / kpiData.totalHours) * 100, 0);
                          const pct = (hours / kpiData.totalHours) * 100;
                          const circ = 2 * Math.PI * 40;
                          return (
                            <circle
                              key={idx}
                              cx="50" cy="50" r="40"
                              fill="none"
                              stroke={CHART_COLORS[idx]}
                              strokeWidth="10"
                              strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                              strokeDashoffset={-(prevPct / 100) * circ}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base font-bold text-redwood-text">
                          {kpiData.totalHours}h
                        </span>
                        <span className="text-[10px] text-redwood-muted">total</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      {Object.entries(kpiData.projectHours)
                        .slice(0, 5)
                        .map(([name, hours], idx) => (
                          <div key={name} className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: CHART_COLORS[idx] }}
                            />
                            <span className="text-xs text-redwood-muted flex-1 truncate">
                              {name}
                            </span>
                            <span className="text-xs font-bold text-redwood-text">
                              {hours}h
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Activity className="h-8 w-8 text-redwood-muted opacity-40" />
                    <p className="text-sm text-redwood-muted">Sin datos esta semana</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
