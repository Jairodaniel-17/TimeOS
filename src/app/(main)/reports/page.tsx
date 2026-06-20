'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { Download, RefreshCw, Loader2, Calendar, Users, Clock, AlertCircle, BarChart3, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';
import { getWeekNumber, getCurrentYear } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts';

interface EmployeeHours {
  userId: string;
  userName: string;
  dailyHours: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
  totalHours: number;
  averageDailyHours: number;
  status: 'green' | 'blue' | 'red' | 'orange' | 'yellow';
  statusLabel: string;
  completionPercentage: number;
}

interface ReportSummary {
  totalEmployees: number;
  completed: number;
  overTime: number;
  noEntry: number;
  lowEntry: number;
  partial: number;
  totalHours: number;
  averageHours: number;
}

const DAYS = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mié' },
  { key: 'thu', label: 'Jue' },
  { key: 'fri', label: 'Vie' },
  { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
];

const STATUS_COLORS = {
  green: { bg: 'bg-badge-subtle-success-bg', text: 'text-redwood-green', border: 'border-redwood-green/30', label: 'Completado (40h)' },
  blue: { bg: 'bg-badge-subtle-info-bg', text: 'text-redwood-info', border: 'border-redwood-info/30', label: 'Horas extra (>40h)' },
  red: { bg: 'bg-badge-subtle-danger-bg', text: 'text-redwood-danger', border: 'border-redwood-danger/30', label: 'Sin registro (0h)' },
  orange: { bg: 'bg-badge-subtle-warning-bg', text: 'text-redwood-warning', border: 'border-redwood-warning/30', label: 'Bajo registro (<30h)' },
  yellow: { bg: 'bg-badge-subtle-warning-bg', text: 'text-redwood-warning', border: 'border-redwood-warning/20', label: 'Parcial (30-39h)' },
};

interface ProjectStats {
  id: string;
  name: string;
  client?: string;
  budget: number;
  actualCost: number;
  budgetHours: number;
  actualHours: number;
  progress: number;
  status: string;
  tasksDone: number;
  tasksTotal: number;
  billable: boolean;
}

const COLORS = ['#227e9e', '#436a28', '#96611c', '#b23021', '#312d2a', '#006692'];

export default function ReportsPage() {
  const [employees, setEmployees] = useState<EmployeeHours[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekNumber, setWeekNumber] = useState(getWeekNumber());
  const [year, setYear] = useState(getCurrentYear());
  const [activeTab, setActiveTab] = useState<'hours' | 'projects'>('hours');
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const { user } = useAuth();
  const { isAdmin, isManager } = usePermissions();

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      // Members can only see their own data
      const userIdParam = (!isAdmin && !isManager && user) ? `&userId=${user.id}` : '';
      const response = await fetch(`/api/reports/employee-hours?weekNumber=${weekNumber}&year=${year}${userIdParam}`);
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.data.employees);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }, [weekNumber, year, user, isAdmin, isManager]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const fetchProjectStats = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const [projRes, taskRes] = await Promise.all([fetch('/api/projects'), fetch('/api/tasks?parentId=null')]);
      const [projData, taskData] = await Promise.all([projRes.json(), taskRes.json()]);
      if (!projData.success) return;
      const projects = projData.data;
      const tasks = taskData.success ? taskData.data : [];

      const stats: ProjectStats[] = projects.map((p: Record<string, unknown>) => {
        const projTasks = tasks.filter((t: Record<string, unknown>) => t.projectId === p.id && !t.parentId);
        const tasksDone = projTasks.filter((t: Record<string, unknown>) => t.status === 'done').length;
        const actualHours = projTasks.reduce((s: number, t: Record<string, unknown>) => s + (Number(t.actualHours) || 0), 0);
        const budgetHours = Number(p.budgetHours) || 0;
        const budget = Number(p.budget) || 0;
        const hourlyRate = Number(p.hourlyRate) || 100;
        return {
          id: String(p.id),
          name: String(p.name),
          client: p.client ? String(p.client) : undefined,
          budget,
          actualCost: actualHours * hourlyRate,
          budgetHours,
          actualHours,
          progress: Number(p.progress) || 0,
          status: String(p.status),
          tasksDone,
          tasksTotal: projTasks.length,
          billable: Boolean(p.billable),
        };
      });
      setProjectStats(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectStats();
  }, [fetchProjectStats]);

  const handleExport = () => {
    const csvContent = [
      ['Empleado', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Total', 'Estado'].join(','),
      ...employees.map(emp => [
        emp.userName,
        emp.dailyHours.mon,
        emp.dailyHours.tue,
        emp.dailyHours.wed,
        emp.dailyHours.thu,
        emp.dailyHours.fri,
        emp.dailyHours.sat,
        emp.dailyHours.sun,
        emp.totalHours,
        emp.statusLabel,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-horas-semana-${weekNumber}.csv`;
    link.click();
  };

  const renderEmployeeCard = (employee: EmployeeHours) => (
    <div
      key={employee.userId}
      className={`
        p-4 rounded-lg border-2 transition-all hover:shadow-md
        ${STATUS_COLORS[employee.status].bg}
        ${STATUS_COLORS[employee.status].border}
        border-opacity-50
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${
            employee.status === 'green' ? 'bg-green-500' :
            employee.status === 'blue' ? 'bg-blue-500' :
            employee.status === 'red' ? 'bg-red-500' :
            employee.status === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'
          }`} />
          <div>
            <h4 className="font-semibold text-redwood-muted">{employee.userName}</h4>
            <p className={`text-sm ${STATUS_COLORS[employee.status].text}`}>
              {employee.statusLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-redwood-muted">{employee.totalHours}h</div>
          <div className="text-xs text-redwood-muted">de 40h objetivo</div>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
        {DAYS.map(day => (
          <div key={day.key} className="bg-redwood-surface/50 rounded p-1">
            <div className="text-redwood-muted">{day.label}</div>
            <div className="font-medium text-redwood-muted">
              {employee.dailyHours[day.key as keyof typeof employee.dailyHours]}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2">
        <div className="h-2 bg-redwood-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              employee.status === 'green' ? 'bg-green-500' :
              employee.status === 'blue' ? 'bg-blue-500' :
              employee.status === 'red' ? 'bg-red-500' :
              employee.status === 'orange' ? 'bg-orange-500' :
              'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(employee.completionPercentage, 100)}%` }}
          />
        </div>
        <div className="text-right text-xs text-redwood-muted mt-1">
          {employee.completionPercentage}%
        </div>
      </div>
    </div>
  );

  const renderStatusColumn = (
    status: EmployeeHours['status'],
    title: string,
    icon: React.ReactNode
  ) => {
    const filtered = employees.filter(emp => emp.status === status);
    return (
      <div className={`p-4 rounded-lg border-2 min-h-[200px] ${STATUS_COLORS[status].bg} border-redwood-border`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-redwood-muted">{title}</h3>
          </div>
          <span className="text-2xl font-bold text-redwood-muted">{filtered.length}</span>
        </div>
        <div className="space-y-2">
          {filtered.map(renderEmployeeCard)}
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-redwood-muted text-center py-4">Sin empleados</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <PageLayout>
        <Header
          title="Reportes"
          breadcrumbs={[{ label: 'TimeOS' }, { label: 'Reportes' }]}
        />
        <PageContent className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-redwood-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando reporte...</span>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Reportes y Análisis"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Reportes' }]}
        actions={
          <>
            <div className="flex items-center gap-2">
              <select
                className="min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value))}
              >
                {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Semana {w}</option>
                ))}
              </select>
              <select
                className="min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => getCurrentYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button variant="subtle" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchReport}>
              Actualizar
            </Button>
            <Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Exportar CSV
            </Button>
          </>
        }
      />
      <PageContent>
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-redwood-border">
          {[
            { id: 'hours', label: 'Horas por Empleado', icon: <Clock className="h-4 w-4" /> },
            { id: 'projects', label: 'Gestión de Proyectos', icon: <BarChart3 className="h-4 w-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'hours' | 'projects')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-redwood-primary text-redwood-primary'
                  : 'border-transparent text-redwood-muted hover:text-redwood-text'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Project Analytics Tab ── */}
        {activeTab === 'projects' && (
          <>
            {projectsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-redwood-primary" />
              </div>
            ) : (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Card>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-redwood-selected-bg rounded-lg"><BarChart3 className="h-5 w-5 text-redwood-primary" /></div>
                      <div>
                        <p className="text-xs text-redwood-muted">Proyectos activos</p>
                        <p className="text-2xl font-bold text-redwood-text">{projectStats.filter(p => p.status === 'active').length}</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-badge-subtle-success-bg rounded-lg"><CheckCircle className="h-5 w-5 text-redwood-green" /></div>
                      <div>
                        <p className="text-xs text-redwood-muted">Tareas completadas</p>
                        <p className="text-2xl font-bold text-redwood-text">{projectStats.reduce((s, p) => s + p.tasksDone, 0)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-badge-subtle-warning-bg rounded-lg"><DollarSign className="h-5 w-5 text-redwood-warning" /></div>
                      <div>
                        <p className="text-xs text-redwood-muted">Presupuesto total</p>
                        <p className="text-2xl font-bold text-redwood-text">${projectStats.reduce((s, p) => s + p.budget, 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-redwood-selected-bg rounded-lg"><TrendingUp className="h-5 w-5 text-redwood-primary" /></div>
                      <div>
                        <p className="text-xs text-redwood-muted">Horas reales totales</p>
                        <p className="text-2xl font-bold text-redwood-text">{projectStats.reduce((s, p) => s + p.actualHours, 0).toFixed(0)}h</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Budget vs Actual */}
                  <Card>
                    <h3 className="text-sm font-semibold text-redwood-text mb-4">Presupuesto vs Costo Real</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={projectStats} margin={{ top: 5, right: 20, bottom: 40, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#dfe4e9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="budget" name="Presupuesto" fill="#227e9e" radius={[3,3,0,0]} />
                        <Bar dataKey="actualCost" name="Costo Real" fill="#b23021" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Hours: Estimated vs Actual */}
                  <Card>
                    <h3 className="text-sm font-semibold text-redwood-text mb-4">Horas: Estimadas vs Reales</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={projectStats} margin={{ top: 5, right: 20, bottom: 40, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#dfe4e9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="budgetHours" name="Horas Est." fill="#436a28" radius={[3,3,0,0]} />
                        <Bar dataKey="actualHours" name="Horas Reales" fill="#96611c" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Task completion */}
                  <Card>
                    <h3 className="text-sm font-semibold text-redwood-text mb-4">Completitud de Tareas por Proyecto</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={projectStats.map(p => ({ name: p.name, completadas: p.tasksDone, pendientes: p.tasksTotal - p.tasksDone }))} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#dfe4e9" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completadas" name="Completadas" stackId="a" fill="#436a28" />
                        <Bar dataKey="pendientes" name="Pendientes" stackId="a" fill="#dfe4e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Project Status Pie */}
                  <Card>
                    <h3 className="text-sm font-semibold text-redwood-text mb-4">Distribución de Estado</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Activos', value: projectStats.filter(p => p.status === 'active').length },
                            { name: 'Completados', value: projectStats.filter(p => p.status === 'completed').length },
                            { name: 'Archivados', value: projectStats.filter(p => p.status === 'archived').length },
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" outerRadius={90} dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Project table */}
                <Card>
                  <h3 className="text-sm font-semibold text-redwood-text mb-4">Detalle por Proyecto</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-redwood-border bg-redwood-surface">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-redwood-muted">Proyecto</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-redwood-muted">Cliente</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-redwood-muted">Presupuesto</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-redwood-muted">Costo Real</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-redwood-muted">Horas Est.</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-redwood-muted">Horas Reales</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-redwood-muted">Avance</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-redwood-muted">Varianza %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectStats.map((p, i) => {
                          const budgetVariance = p.budget > 0 ? ((p.actualCost - p.budget) / p.budget * 100) : 0;
                          return (
                            <tr key={p.id} className={i % 2 === 0 ? 'bg-redwood-surface' : 'bg-redwood-surface-soft'}>
                              <td className="py-2 px-3 font-medium">{p.name}</td>
                              <td className="py-2 px-3 text-redwood-muted">{p.client || '-'}</td>
                              <td className="py-2 px-3 text-right">${p.budget.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right">${p.actualCost.toFixed(0)}</td>
                              <td className="py-2 px-3 text-right">{p.budgetHours}h</td>
                              <td className="py-2 px-3 text-right">{p.actualHours.toFixed(0)}h</td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <div className="w-16 h-1.5 bg-redwood-solid-bg rounded-full overflow-hidden">
                                    <div className="h-full bg-redwood-primary rounded-full" style={{ width: `${Math.min(p.tasksDone / Math.max(p.tasksTotal, 1) * 100, 100)}%` }} />
                                  </div>
                                  <span className="text-xs">{p.tasksTotal > 0 ? Math.round(p.tasksDone / p.tasksTotal * 100) : 0}%</span>
                                </div>
                              </td>
                              <td className={`py-2 px-3 text-right font-medium ${budgetVariance > 10 ? 'text-redwood-danger' : budgetVariance < -5 ? 'text-redwood-green' : 'text-redwood-text'}`}>
                                {budgetVariance > 0 ? '+' : ''}{budgetVariance.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </>
        )}

        {/* ── Employee Hours Tab ── */}
        {activeTab === 'hours' && <>
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-badge-subtle-info-bg rounded-lg">
                  <Users className="h-6 w-6 text-redwood-info" />
                </div>
                <div>
                  <p className="text-sm text-redwood-muted">Total Empleados</p>
                  <p className="text-2xl font-bold">{summary.totalEmployees}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-badge-subtle-success-bg rounded-lg">
                  <Clock className="h-6 w-6 text-redwood-green" />
                </div>
                <div>
                  <p className="text-sm text-redwood-muted">Horas Totales</p>
                  <p className="text-2xl font-bold">{summary.totalHours}h</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-redwood-selected-bg rounded-lg">
                  <Calendar className="h-6 w-6 text-redwood-primary" />
                </div>
                <div>
                  <p className="text-sm text-redwood-muted">Promedio</p>
                  <p className="text-2xl font-bold">{summary.averageHours}h</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-badge-subtle-warning-bg rounded-lg">
                  <AlertCircle className="h-6 w-6 text-redwood-warning" />
                </div>
                <div>
                  <p className="text-sm text-redwood-muted">Sin registro</p>
                  <p className="text-2xl font-bold">{summary.noEntry}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Legend */}
        <Card className="mb-6">
          <h3 className="font-semibold text-redwood-muted mb-3">Leyenda de Colores - Sistema de Horas</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-redwood-muted">Verde: 40h exactas (✓)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm text-redwood-muted">Azul: Más de 40h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm text-redwood-muted">Amarillo: 30-39h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span className="text-sm text-redwood-muted">Naranja: Menos de 30h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-redwood-muted">Rojo: Sin registro</span>
            </div>
          </div>
        </Card>

        {/* Status Board — auto-calculated from actual hours */}
        <div className="grid grid-cols-5 gap-4">
          {renderStatusColumn('green', 'Completado', <div className="w-3 h-3 rounded-full bg-green-500" />)}
          {renderStatusColumn('blue', 'Horas Extra', <div className="w-3 h-3 rounded-full bg-blue-500" />)}
          {renderStatusColumn('yellow', 'Parcial', <div className="w-3 h-3 rounded-full bg-yellow-500" />)}
          {renderStatusColumn('orange', 'Bajo Registro', <div className="w-3 h-3 rounded-full bg-orange-500" />)}
          {renderStatusColumn('red', 'Sin Registro', <div className="w-3 h-3 rounded-full bg-red-500" />)}
        </div>

        </>}
      </PageContent>
    </PageLayout>
  );
}
