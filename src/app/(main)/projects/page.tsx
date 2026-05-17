'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, CardHeader, Badge, KPICard } from '@/components/ui';
import { Plus, Edit2, Trash2, Eye, Calendar, DollarSign, Clock, TrendingUp, AlertTriangle, CheckCircle, Bell, Building2, X, Search } from 'lucide-react';
import { PermissionGate } from '@/hooks/usePermissions';

interface Project {
  id: string;
  name: string;
  code: string;
  client?: string;
  description?: string;
  billable: boolean;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  budget?: number;
  budgetHours?: number;
  actualCost?: number;
  actualHours?: number;
  progress: number;
  hourlyRate?: number;
  currency: string;
  baselineStart?: string;
  baselineEnd?: string;
  baselineBudget?: number;
}

interface ProjectSummary {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  atRisk: number;
  nearDeadline: number;
  totalBudget: number;
  totalActual: number;
}

interface ProjectAlert {
  id: string;
  name: string;
  code: string;
  daysLeft: number;
  progress: number;
  endDate: string;
}

interface Client {
  id: string;
  name: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newProject, setNewProject] = useState({
    name: '',
    code: '',
    client: '',
    description: '',
    billable: true,
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: 0,
    budgetHours: 0,
    hourlyRate: 100,
    currency: 'USD',
  });

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClientName }),
      });
      const data = await res.json();
      if (data.success) {
        setClients([...clients, { id: data.data.id, name: newClientName }]);
        setNewProject({ ...newProject, client: newClientName });
        setShowClientModal(false);
        setNewClientName('');
      }
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects?withCosts=true');
      const data = await res.json();
      if (data.success) {
        const projectsWithProgress = data.data.map((p: Project) => ({
          ...p,
          progress: calculateProgress(p),
          status: p.status || 'active',
        }));
        setProjects(projectsWithProgress);
        calculateSummary(projectsWithProgress);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (project: Project): number => {
    if (!project.actualHours || !project.budgetHours) return 0;
    return Math.min(100, Math.round((project.actualHours / project.budgetHours) * 100));
  };

  const calculateStatus = (project: Project): 'on_track' | 'at_risk' | 'delayed' | 'completed' => {
    if (project.progress >= 100) return 'completed';
    
    const endDate = new Date(project.endDate);
    const now = new Date();
    const expectedProgress = (now.getTime() - new Date(project.startDate).getTime()) / 
      (endDate.getTime() - new Date(project.startDate).getTime()) * 100;
    
    if (project.progress >= expectedProgress - 10) return 'on_track';
    if (project.progress >= expectedProgress - 25) return 'at_risk';
    return 'delayed';
  };

  const calculateSummary = (projects: Project[]) => {
    const nearDeadlineProjects = projects.filter(p => {
      if (p.status !== 'active' || p.progress >= 100) return false;
      const daysLeft = getDaysUntilDeadline(p.endDate);
      return daysLeft >= 0 && daysLeft <= 14;
    });
    
    const summary: ProjectSummary = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.progress >= 100).length,
      onHold: projects.filter(p => p.status === 'on_hold').length,
      atRisk: projects.filter(p => calculateStatus(p) === 'at_risk' || calculateStatus(p) === 'delayed').length,
      nearDeadline: nearDeadlineProjects.length,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      totalActual: projects.reduce((sum, p) => sum + (p.actualCost || 0), 0),
    };
    setSummary(summary);
  };

  const getDaysUntilDeadline = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProjectAlerts = (): ProjectAlert[] => {
    return projects
      .filter(p => {
        if (p.status !== 'active' || p.progress >= 100) return false;
        const daysLeft = getDaysUntilDeadline(p.endDate);
        return daysLeft >= 0 && daysLeft <= 14;
      })
      .map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        daysLeft: getDaysUntilDeadline(p.endDate),
        progress: p.progress,
        endDate: p.endDate,
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const handleCreateProject = async () => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setNewProject({
          name: '', code: '', client: '', description: '', billable: true,
          status: 'active', startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          budget: 0, budgetHours: 0, hourlyRate: 100, currency: 'USD',
        });
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleSetBaseline = async (project: Project) => {
    try {
      await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          baselineStart: project.startDate,
          baselineEnd: project.endDate,
          baselineBudget: project.budget,
        }),
      });
      fetchProjects();
    } catch (error) {
      console.error('Error setting baseline:', error);
    }
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      code: project.code,
      client: project.client || '',
      description: project.description || '',
      billable: project.billable,
      status: project.status,
      startDate: project.startDate || new Date().toISOString().split('T')[0],
      endDate: project.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: project.budget || 0,
      budgetHours: project.budgetHours || 0,
      hourlyRate: project.hourlyRate || 100,
      currency: project.currency || 'USD',
    });
    setShowModal(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      setShowModal(false);
      setEditingProject(null);
      setNewProject({
        name: '', code: '', client: '', description: '', billable: true,
        status: 'active', startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: 0, budgetHours: 0, hourlyRate: 100, currency: 'USD',
      });
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    try {
      await fetch(`/api/projects/${deletingProject.id}`, {
        method: 'DELETE',
      });
      setDeletingProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge severity="success">Activo</Badge>;
      case 'on_hold': return <Badge severity="warning">En Pausa</Badge>;
      case 'completed': return <Badge severity="info">Completado</Badge>;
      case 'archived': return <Badge severity="error">Archivado</Badge>;
      default: return null;
    }
  };

  const fmtDate = (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const getProgressBadge = (status: 'on_track' | 'at_risk' | 'delayed' | 'completed') => {
    switch (status) {
      case 'on_track': return <Badge severity="success">✓ En Tiempo</Badge>;
      case 'at_risk': return <Badge severity="warning">⚠ En Riesgo</Badge>;
      case 'delayed': return <Badge severity="error">✗ Atrasado</Badge>;
      case 'completed': return <Badge severity="info">✓ Completado</Badge>;
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <Header title="Proyectos" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Proyectos' }]} />
        <PageContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-[14px] animate-pulse bg-redwood-solid-bg" />
            ))}
          </div>
          <div className="h-10 w-64 rounded-[14px] animate-pulse bg-redwood-solid-bg mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-[14px] animate-pulse bg-redwood-solid-bg" />
            ))}
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Gestión de Proyectos"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Proyectos' }]}
        actions={
          <PermissionGate permission="projects:create">
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
              Nuevo Proyecto
            </Button>
          </PermissionGate>
        }
      />
      <PageContent>
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <KPICard label="Proyectos Activos" value={summary.active} accent="primary" />
            <KPICard label="Completados" value={summary.completed} accent="success" />
            <KPICard label="En Riesgo" value={summary.atRisk} accent="danger" />
            <KPICard label="Cerca Deadline" value={summary.nearDeadline} accent="warning" />
            <KPICard label="Presupuesto Total" value={`$${summary.totalBudget.toLocaleString()}`} accent="neutral" />
          </div>
        )}

        {/* Alertas de Proyectos Cercanos a Deadline */}
        {getProjectAlerts().length > 0 && (
          <Card className="mb-6 border-badge-strong-warning-bg/20 bg-badge-subtle-warning-bg">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">Alertas de Proyectos</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {getProjectAlerts().slice(0, 6).map(alert => (
                <div key={alert.id} className="bg-redwood-surface-soft rounded-[10px] border border-redwood-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-redwood-muted">{alert.name}</span>
                    <span className={`text-xs font-bold ${alert.daysLeft <= 3 ? 'text-red-600' : alert.daysLeft <= 7 ? 'text-orange-600' : 'text-amber-600'}`}>
                      {alert.daysLeft === 0 ? 'Hoy' : alert.daysLeft === 1 ? '1 día' : `${alert.daysLeft} días`}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-redwood-solid-bg rounded-full overflow-hidden">
                        <div className="h-full bg-redwood-warning rounded-full" style={{ width: `${alert.progress}%` }} />
                      </div>
                      <span className="text-xs text-redwood-muted">{alert.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Projects Table */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-redwood-muted" />
              <input
                type="text"
                placeholder="Buscar proyecto o cliente..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-page text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
              />
            </div>
            {searchQuery && (
              <span className="text-sm text-redwood-muted">
                {projects.filter(p =>
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.client || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.code.toLowerCase().includes(searchQuery.toLowerCase())
                ).length} resultado(s)
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-redwood-border">
                  <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted">Proyecto</th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted">Cliente</th>
                  <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted">Estado</th>
                  <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted">Avance</th>
                  <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted">Estado Tiempo</th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted">Presupuesto</th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted">Fechas</th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[.08em] text-redwood-muted">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-redwood-border">
                {projects.filter(p =>
                  !searchQuery ||
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.client || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.code.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(project => {
                  const progressStatus = calculateStatus(project);
                  return (
                    <tr key={project.id} className="hover:bg-redwood-hover-bg">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-redwood-primary font-bold text-sm">
                            {project.code.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-redwood-text">{project.name}</div>
                            <div className="text-xs text-redwood-muted">{project.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-redwood-muted">{project.client || '—'}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(project.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-redwood-solid-bg rounded-full overflow-hidden">
                            <div className="h-full bg-redwood-primary rounded-full" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-xs font-medium w-10">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{getProgressBadge(progressStatus)}</td>
                      <td className="py-3 px-4 text-sm text-right text-redwood-text">
                        ${(project.budget || 0).toLocaleString()}
                        {project.baselineBudget && (
                          <div className="text-xs text-redwood-muted">Base: ${project.baselineBudget.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-redwood-muted whitespace-nowrap">
                        {fmtDate(project.startDate)} – {fmtDate(project.endDate)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" icon={<Eye className="h-4 w-4" />} onClick={() => handleViewProject(project.id)} title="Ver Detalles" />
                          <PermissionGate permission="projects:update">
                            <Button variant="ghost" size="icon" icon={<Edit2 className="h-4 w-4" />} onClick={() => handleEditProject(project)} title="Editar" />
                            <Button variant="subtle" size="icon" icon={<Calendar className="h-4 w-4" />} onClick={() => handleSetBaseline(project)} title="Establecer Línea Base" />
                            <Button variant="ghost" size="icon" icon={<Trash2 className="h-4 w-4 text-red-500" />} onClick={() => setDeletingProject(project)} title="Eliminar" />
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Nombre del Proyecto</label>
                  <input type="text" className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Código</label>
                  <input type="text" className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors" value={newProject.code} onChange={e => setNewProject({ ...newProject, code: e.target.value })} placeholder="PROJ-001" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Cliente
                  </label>
                  {clients.length > 0 ? (
                    <div className="flex gap-2">
                      <select
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                        value={newProject.client}
                        onChange={e => setNewProject({ ...newProject, client: e.target.value })}
                      >
                        <option value="">Seleccionar cliente...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <Button variant="subtle" size="icon" icon={<Plus className="h-4 w-4" />} onClick={() => setShowClientModal(true)} title="Agregar cliente" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-amber-600">No hay clientes registrados</p>
                      <Button variant="subtle" size="compact" icon={<Plus className="h-4 w-4" />} onClick={() => setShowClientModal(true)}>
                        Crear primer cliente
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Estado</label>
                  <select className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors" value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value as 'active' | 'on_hold' | 'completed' | 'archived' })}>
                    <option value="active">Activo</option>
                    <option value="on_hold">En Pausa</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Fecha Inicio</label>
                  <input type="date" className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors" value={newProject.startDate} onChange={e => setNewProject({ ...newProject, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Fecha Fin</label>
                  <input type="date" className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors" value={newProject.endDate} onChange={e => setNewProject({ ...newProject, endDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Presupuesto ($)</label>
                  <input type="number" className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Horas Presupuestadas</label>
                  <input type="number" className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors" value={newProject.budgetHours} onChange={e => setNewProject({ ...newProject, budgetHours: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Tarifa/Hora ($)</label>
                  <input type="number" className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors" value={newProject.hourlyRate} onChange={e => setNewProject({ ...newProject, hourlyRate: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Facturable</label>
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={newProject.billable} onChange={e => setNewProject({ ...newProject, billable: e.target.checked })} />
                    <span>El proyecto es facturable</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="subtle" onClick={() => {
                  setShowModal(false);
                  setEditingProject(null);
                }}>Cancelar</Button>
                <Button variant="primary" onClick={editingProject ? handleUpdateProject : handleCreateProject}>
                  {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Create Client Modal */}
        {showClientModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Nuevo Cliente</h3>
                <Button variant="subtle" size="icon" icon={<X className="h-4 w-4" />} onClick={() => setShowClientModal(false)} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    placeholder="Nombre de la empresa"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="subtle" onClick={() => setShowClientModal(false)}>Cancelar</Button>
                <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleCreateClient}>
                  Crear Cliente
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-redwood-muted mb-6">
                ¿Estás seguro de que deseas eliminar el proyecto "{deletingProject.name}"? Esta acción eliminará todas las fases, tareas y registros asociados.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="subtle" onClick={() => setDeletingProject(null)}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={handleDeleteProject}>
                  Eliminar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
