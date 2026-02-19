'use client';

import { useState, useEffect } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import { Plus, Edit2, Trash2, Eye, Calendar, DollarSign, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects?withCosts=true');
      const data = await res.json();
      if (data.success) {
        const projectsWithProgress = data.data.map((p: any) => ({
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

  const calculateProgress = (project: any): number => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge severity="success">Activo</Badge>;
      case 'on_hold': return <Badge severity="warning">En Pausa</Badge>;
      case 'completed': return <Badge severity="info">Completado</Badge>;
      case 'archived': return <Badge severity="error">Archivado</Badge>;
      default: return null;
    }
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
        <PageContent className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
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
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg"><TrendingUp className="h-6 w-6 text-white" /></div>
                <div><p className="text-sm text-blue-700">Proyectos Activos</p><p className="text-2xl font-bold text-blue-900">{summary.active}</p></div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-lg"><CheckCircle className="h-6 w-6 text-white" /></div>
                <div><p className="text-sm text-green-700">Completados</p><p className="text-2xl font-bold text-green-900">{summary.completed}</p></div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500 rounded-lg"><AlertTriangle className="h-6 w-6 text-white" /></div>
                <div><p className="text-sm text-red-700">En Riesgo</p><p className="text-2xl font-bold text-red-900">{summary.atRisk}</p></div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500 rounded-lg"><Clock className="h-6 w-6 text-white" /></div>
                <div><p className="text-sm text-orange-700">Cerca deadline</p><p className="text-2xl font-bold text-orange-900">{summary.nearDeadline}</p></div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500 rounded-lg"><DollarSign className="h-6 w-6 text-white" /></div>
                <div><p className="text-sm text-purple-700">Presupuesto Total</p><p className="text-2xl font-bold text-purple-900">${summary.totalBudget.toLocaleString()}</p></div>
              </div>
            </Card>
          </div>
        )}

        {/* Alertas de Proyectos Cercanos a Deadline */}
        {getProjectAlerts().length > 0 && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">Alertas de Proyectos</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {getProjectAlerts().slice(0, 6).map(alert => (
                <div key={alert.id} className={`p-3 rounded-lg border ${alert.daysLeft <= 3 ? 'bg-red-100 border-red-200' : alert.daysLeft <= 7 ? 'bg-orange-100 border-orange-200' : 'bg-amber-100 border-amber-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{alert.name}</span>
                    <span className={`text-xs font-bold ${alert.daysLeft <= 3 ? 'text-red-600' : alert.daysLeft <= 7 ? 'text-orange-600' : 'text-amber-600'}`}>
                      {alert.daysLeft === 0 ? 'Hoy' : alert.daysLeft === 1 ? '1 día' : `${alert.daysLeft} días`}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${alert.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{alert.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Projects Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Proyecto</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Cliente</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Estado</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Avance</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Estado Tiempo</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Presupuesto</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Fechas</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {projects.map(project => {
                  const progressStatus = calculateStatus(project);
                  return (
                    <tr key={project.id} className="hover:bg-[var(--color-hover-row)]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-sm">
                            {project.code.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[var(--color-text-primary)]">{project.name}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">{project.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">{project.client || '—'}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(project.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-xs font-medium w-10">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{getProgressBadge(progressStatus)}</td>
                      <td className="py-3 px-4 text-sm text-right text-[var(--color-text-primary)]">
                        ${(project.budget || 0).toLocaleString()}
                        {project.baselineBudget && (
                          <div className="text-xs text-[var(--color-text-secondary)]">Base: ${project.baselineBudget.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-[var(--color-text-secondary)]">
                        {project.startDate} - {project.endDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <PermissionGate permission="projects:update">
                          <Button variant="ghost" size="icon" onClick={() => handleSetBaseline(project)} title="Establecer Línea Base">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Crear Nuevo Proyecto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del Proyecto</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={newProject.code} onChange={e => setNewProject({ ...newProject, code: e.target.value })} placeholder="PROJ-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cliente</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={newProject.client} onChange={e => setNewProject({ ...newProject, client: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select className="w-full border rounded px-3 py-2" value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value as any })}>
                    <option value="active">Activo</option>
                    <option value="on_hold">En Pausa</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                  <input type="date" className="w-full border rounded px-3 py-2" value={newProject.startDate} onChange={e => setNewProject({ ...newProject, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                  <input type="date" className="w-full border rounded px-3 py-2" value={newProject.endDate} onChange={e => setNewProject({ ...newProject, endDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Presupuesto ($)</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Horas Presupuestadas</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={newProject.budgetHours} onChange={e => setNewProject({ ...newProject, budgetHours: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tarifa/Hora ($)</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={newProject.hourlyRate} onChange={e => setNewProject({ ...newProject, hourlyRate: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Facturable</label>
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={newProject.billable} onChange={e => setNewProject({ ...newProject, billable: e.target.checked })} />
                    <span>El proyecto es facturable</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button variant="primary" onClick={handleCreateProject}>Crear Proyecto</Button>
              </div>
            </Card>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
