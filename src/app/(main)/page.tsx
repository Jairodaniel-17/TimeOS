'use client';

import { useEffect, useState } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, KPICard, Card, Badge } from '@/components/ui';
import { Clock, CheckCircle, Users, Calendar, RefreshCw, Plus, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  activity: string;
  weekNumber: number;
  year: number;
  total: number;
  status: string;
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
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalHours: 0,
    pendingApprovals: 0,
    usersWithoutEntries: 0,
    currentWeek: 8,
  });
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Initialize database first
        await fetch('/api/init', { method: 'POST' });

        // Fetch data in parallel
        const [entriesRes, approvalsRes] = await Promise.all([
          fetch('/api/timesheets?weekNumber=8&year=2025'),
          fetch('/api/approvals?status=pending'),
        ]);

        const entriesData = await entriesRes.json();
        const approvalsData = await approvalsRes.json();

        if (entriesData.success) {
          const entries = entriesData.data as TimeEntry[];
          setRecentEntries(entries.slice(0, 5));
          
          const totalHours = entries.reduce((sum: number, e: TimeEntry) => sum + e.total, 0);
          setKpiData(prev => ({ ...prev, totalHours }));
        }

        if (approvalsData.success) {
          const approvals = approvalsData.data as Approval[];
          setPendingApprovals(approvals.slice(0, 5));
          setKpiData(prev => ({ ...prev, pendingApprovals: approvals.length }));
        }

        // Calculate current week
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
        setKpiData(prev => ({ ...prev, currentWeek: weekNumber }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    window.location.reload();
  };

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
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
              Exportar resumen
            </Button>
            <Button variant="ghost" size="icon" icon={<RefreshCw className="h-4 w-4" />} onClick={handleRefresh} />
          </>
        }
      />
      <PageContent>
        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">Cargando...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Link href="/reports">
                <KPICard
                  label="Horas registradas"
                  value={`${kpiData.totalHours}h`}
                  trend="up"
                  trendValue="+12%"
                  icon={<Clock className="h-5 w-5" />}
                />
              </Link>
              <Link href="/approvals">
                <KPICard
                  label="Pendientes de aprobación"
                  value={kpiData.pendingApprovals}
                  trend="down"
                  trendValue="-3"
                  icon={<CheckCircle className="h-5 w-5" />}
                />
              </Link>
              <KPICard
                label="Usuarios sin registro"
                value={kpiData.usersWithoutEntries}
                icon={<Users className="h-5 w-5" />}
              />
              <KPICard
                label="Periodo en curso"
                value={`Semana ${kpiData.currentWeek}`}
                icon={<Calendar className="h-5 w-5" />}
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <Card padding="none">
                  <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Aprobaciones pendientes
                    </h2>
                    <Link href="/approvals">
                      <Button variant="ghost" size="compact">
                        Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {pendingApprovals.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                        No hay aprobaciones pendientes
                      </div>
                    ) : (
                      pendingApprovals.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-hover-row)] cursor-pointer transition-colors"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-xs font-medium text-[var(--color-primary)]">
                            {item.user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                {item.user.name}
                              </span>
                              <Badge status="pending">Pendiente</Badge>
                            </div>
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              Semana {item.weekNumber} · {item.totalHours}h
                            </span>
                          </div>
                          <Link href="/approvals">
                            <Button variant="primary" size="compact">Aprobar</Button>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              <div className="col-span-1">
                <Card padding="none">
                  <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Entradas recientes
                    </h2>
                  </div>
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {recentEntries.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                        No hay entradas recientes
                      </div>
                    ) : (
                      recentEntries.map((entry) => (
                        <div key={entry.id} className="px-4 py-3">
                          <p className="text-sm text-[var(--color-text-primary)]">
                            <span className="font-medium">{entry.project.name}</span>
                            <span className="text-[var(--color-text-secondary)]"> · {entry.activity}</span>
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            Semana {entry.weekNumber} · {entry.total}h
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                  Horas por día
                </h3>
                <div className="flex items-end gap-2 h-32">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((day, i) => {
                    const heights = [65, 80, 45, 90, 70];
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-[var(--color-primary)] rounded-t-[var(--radius-sm)] hover:bg-[var(--color-primary-hover)] cursor-pointer transition-colors group relative"
                          style={{ height: `${heights[i]}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[var(--color-text-primary)] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {heights[i] / 10}h
                          </div>
                        </div>
                        <span className="text-xs text-[var(--color-text-secondary)]">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                  Distribución por proyecto
                </h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="var(--color-border-subtle)"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="12"
                        strokeDasharray={`${45 * 2.51} ${100 - 45 * 2.51}`}
                      />
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="var(--color-success)"
                        strokeWidth="12"
                        strokeDasharray={`${30 * 2.51} ${100 - 30 * 2.51}`}
                        strokeDashoffset={-45 * 2.51}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-semibold">{kpiData.totalHours}h</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[
                      { name: 'Portal Clientes', hours: 70, color: 'var(--color-primary)' },
                      { name: 'App Móvil', hours: 48, color: 'var(--color-success)' },
                      { name: 'Otros', hours: 38, color: 'var(--color-warning)' },
                    ].map((project) => (
                      <div key={project.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
                        <span className="text-sm text-[var(--color-text-secondary)] flex-1">{project.name}</span>
                        <span className="text-sm font-medium">{project.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
