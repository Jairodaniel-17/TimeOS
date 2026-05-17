'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import {
  Plus, Loader2, Save, X, ChevronDown, ChevronRight, Flag, Diamond,
  Layers, Calendar, User, BarChart3, GitBranch,
} from 'lucide-react';
import { GanttChart, type GanttTask, type ViewMode } from '@/components/planning/GanttChart';
import { PermissionGate } from '@/hooks/usePermissions';

interface Task {
  id: string;
  projectId: string;
  parentId?: string;
  name: string;
  description?: string;
  assigneeId?: string;
  startDate: string;
  endDate: string;
  baselineStart?: string;
  baselineEnd?: string;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  dependencies: string[];
  isEpic?: boolean;
  isMilestone?: boolean;
  project?: { name: string };
  assignee?: { name: string };
}

interface Resource { id: string; userId: string; name: string; }
interface Project { id: string; name: string; baselineStart?: string; baselineEnd?: string; }

const PRIORITY_LABELS: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta' };
const STATUS_LABELS: Record<string, string> = { todo: 'Pendiente', in_progress: 'En Progreso', done: 'Completado' };

export default function PlanningPage() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [projects, setProjects]     = useState<Project[]>([]);
  const [resources, setResources]   = useState<Resource[]>([]);
  const [loading, setLoading]       = useState(true);
  const [viewMode, setViewMode]     = useState<ViewMode>('Week');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [showBaseline, setShowBaseline] = useState(true);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // ── Fetch data ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/users'),
      ]);
      const [td, pd, ud] = await Promise.all([tasksRes.json(), projectsRes.json(), usersRes.json()]);
      if (td.success) setTasks(td.data);
      if (pd.success) setProjects(pd.data);
      if (ud.success) setResources(ud.data.map((u: any) => ({ id: u.id, userId: u.id, name: u.name })));
    } catch (e) {
      console.error('Error fetching planning data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filtered tasks ────────────────────────────────────────
  const filteredTasks = selectedProjectId === 'all'
    ? tasks
    : tasks.filter(t => t.projectId === selectedProjectId);

  // ── Convert to GanttTask ──────────────────────────────────
  const ganttTasks: GanttTask[] = filteredTasks.map(t => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate,
    progress: t.progress,
    status: t.status,
    priority: t.priority,
    isEpic: t.isEpic,
    isMilestone: t.isMilestone,
    parentId: t.parentId,
    dependencies: t.dependencies,
    assignee: t.assignee?.name,
    project: t.project?.name,
    baselineStart: showBaseline ? t.baselineStart : undefined,
    baselineEnd:   showBaseline ? t.baselineEnd   : undefined,
  }));

  // ── Gantt drag-drop reschedule ────────────────────────────
  const [savingDrag, setSavingDrag] = useState(false);
  const handleDateChange = async (task: GanttTask, newStart: string, newEnd: string) => {
    setSavingDrag(true);
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, startDate: newStart, endDate: newEnd }),
      });
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, startDate: newStart, endDate: newEnd } : t
      ));
    } catch (e) {
      console.error('Error updating task dates:', e);
    } finally {
      setSavingDrag(false);
    }
  };

  // ── Save task ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!editingTask) return;
    try {
      const isNew = !editingTask.id || editingTask.id.startsWith('new_');
      const res = await fetch('/api/tasks', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask),
      });
      if (res.ok) { setEditingTask(null); fetchData(); }
    } catch (e) { console.error('Error saving task:', e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      fetchData();
    } catch (e) { console.error('Error deleting task:', e); }
  };

  // ── New task template ─────────────────────────────────────
  const newTaskTemplate = (): Partial<Task> => ({
    name: 'Nueva Tarea',
    projectId: projects[0]?.id ?? '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    estimatedHours: 8,
    actualHours: 0,
    progress: 0,
    priority: 'medium',
    status: 'todo',
    dependencies: [],
  });

  // ── Stats ─────────────────────────────────────────────────
  const stats = {
    total:       filteredTasks.length,
    done:        filteredTasks.filter(t => t.status === 'done').length,
    inProgress:  filteredTasks.filter(t => t.status === 'in_progress').length,
    milestones:  filteredTasks.filter(t => t.isMilestone).length,
    overdue:     filteredTasks.filter(t => t.status !== 'done' && new Date(t.endDate) < new Date()).length,
  };

  if (loading) {
    return (
      <PageLayout>
        <Header title="Planificación" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Planificación' }]} />
        <PageContent className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-redwood-primary" />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Planificación de Proyectos"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Planificación' }]}
        actions={
          <div className="flex items-center gap-2">
            {/* Project filter */}
            <select
              className="min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
            >
              <option value="all">Todos los proyectos</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {/* Baseline toggle */}
            <Button
              variant={showBaseline ? 'primary' : 'subtle'}
              size="compact"
              icon={<GitBranch className="h-4 w-4" />}
              onClick={() => setShowBaseline(b => !b)}
            >
              Línea Base
            </Button>

            {/* View mode */}
            <div className="flex items-center gap-0.5 bg-redwood-page rounded-[10px] p-1">
              {(['Day', 'Week', 'Month', 'Quarter'] as ViewMode[]).map(v => (
                <Button
                  key={v}
                  variant={viewMode === v ? 'primary' : 'ghost'}
                  size="compact"
                  onClick={() => setViewMode(v)}
                >
                  {v === 'Day' ? 'Día' : v === 'Week' ? 'Sem' : v === 'Month' ? 'Mes' : 'Trim'}
                </Button>
              ))}
            </div>

            <PermissionGate permission="tasks:create">
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setEditingTask(newTaskTemplate())}
              >
                Nueva Tarea
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <PageContent className="space-y-4">
        {/* ── KPI strip ──────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-3">
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-redwood-selected-bg rounded-lg"><BarChart3 className="h-4 w-4 text-redwood-primary" /></div>
              <div>
                <p className="text-[11px] text-redwood-muted">Total tareas</p>
                <p className="text-xl font-bold text-redwood-text">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-badge-subtle-success-bg rounded-lg"><Layers className="h-4 w-4 text-redwood-green" /></div>
              <div>
                <p className="text-[11px] text-redwood-muted">Completadas</p>
                <p className="text-xl font-bold text-redwood-text">{stats.done}</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-badge-subtle-info-bg rounded-lg"><Calendar className="h-4 w-4 text-redwood-info" /></div>
              <div>
                <p className="text-[11px] text-redwood-muted">En progreso</p>
                <p className="text-xl font-bold text-redwood-text">{stats.inProgress}</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-badge-subtle-warning-bg rounded-lg"><Diamond className="h-4 w-4 text-redwood-warning" /></div>
              <div>
                <p className="text-[11px] text-redwood-muted">Hitos</p>
                <p className="text-xl font-bold text-redwood-text">{stats.milestones}</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-badge-subtle-danger-bg rounded-lg"><Flag className="h-4 w-4 text-redwood-danger" /></div>
              <div>
                <p className="text-[11px] text-redwood-muted">Vencidas</p>
                <p className="text-xl font-bold text-redwood-text">{stats.overdue}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Gantt ──────────────────────────────────────── */}
        {ganttTasks.length > 0 ? (
          <div className="relative">
            {savingDrag && (
              <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-redwood-surface border border-redwood-border rounded-lg px-3 py-1.5 text-xs text-redwood-muted shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                Guardando...
              </div>
            )}
            <GanttChart
              tasks={ganttTasks}
              viewMode={viewMode}
              onTaskClick={t => {
                const orig = tasks.find(x => x.id === t.id);
                if (orig) { setSelectedTask(orig); setShowDetail(true); }
              }}
              onTaskDblClick={t => {
                const orig = tasks.find(x => x.id === t.id);
                if (orig) setEditingTask({ ...orig });
              }}
              onDateChange={handleDateChange}
            />
          </div>
        ) : (
          <Card className="py-16 text-center">
            <BarChart3 className="h-12 w-12 text-redwood-muted mx-auto mb-4" />
            <p className="text-redwood-muted mb-4">No hay tareas para mostrar en este proyecto.</p>
            <PermissionGate permission="tasks:create">
              <Button variant="primary" onClick={() => setEditingTask(newTaskTemplate())}>
                Crear primera tarea
              </Button>
            </PermissionGate>
          </Card>
        )}

        {/* ── Legend ─────────────────────────────────────── */}
        <div className="flex items-center gap-6 px-4 py-2 bg-redwood-surface rounded-lg border border-redwood-border text-xs text-redwood-muted">
          <span className="font-medium text-redwood-text">Leyenda:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-3 rounded border border-[var(--text-tertiary)] bg-[var(--bg-hover)]" />
            Pendiente
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-3 rounded border border-[var(--color-primary)] bg-[var(--color-primary-muted)]" />
            En progreso
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-3 rounded border border-[var(--color-success)] bg-[var(--color-success-light)]" />
            Completado
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rotate-45 bg-[var(--color-warning)] rounded-sm inline-block" />
            Hito
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-[var(--color-warning)] opacity-60 rounded" />
            Línea base
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-0.5 h-4 bg-[var(--color-error)] opacity-70" />
            Hoy
          </div>
        </div>
      </PageContent>

      {/* ── Task Detail Side Panel ──────────────────────── */}
      {showDetail && selectedTask && (
        <div className="fixed inset-y-0 right-0 w-80 bg-redwood-surface border-l border-redwood-border shadow-rw-lg z-40 flex flex-col animate-[slideIn_150ms_ease]">
          <div className="flex items-center justify-between p-4 border-b border-redwood-border">
            <h3 className="font-semibold text-sm text-redwood-text truncate pr-2">{selectedTask.name}</h3>
            <button onClick={() => setShowDetail(false)} className="text-redwood-muted hover:text-redwood-text">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge severity={selectedTask.status === 'done' ? 'success' : selectedTask.status === 'in_progress' ? 'info' : 'neutral'}>
                {STATUS_LABELS[selectedTask.status]}
              </Badge>
              <Badge severity={selectedTask.priority === 'high' ? 'error' : selectedTask.priority === 'medium' ? 'warning' : 'neutral'}>
                {PRIORITY_LABELS[selectedTask.priority]}
              </Badge>
              {selectedTask.isEpic && <Badge severity="info">Epic</Badge>}
              {selectedTask.isMilestone && <Badge severity="warning">Hito</Badge>}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-redwood-muted">Inicio</span>
                <span className="font-medium">{selectedTask.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-redwood-muted">Fin</span>
                <span className="font-medium">{selectedTask.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-redwood-muted">Progreso</span>
                <span className="font-medium">{selectedTask.progress}%</span>
              </div>
              {selectedTask.assignee && (
                <div className="flex justify-between">
                  <span className="text-redwood-muted">Asignado</span>
                  <span className="font-medium">{selectedTask.assignee.name}</span>
                </div>
              )}
              {selectedTask.project && (
                <div className="flex justify-between">
                  <span className="text-redwood-muted">Proyecto</span>
                  <span className="font-medium truncate max-w-[140px]">{selectedTask.project.name}</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <p className="text-xs text-redwood-muted mb-1">Progreso</p>
              <div className="h-2 bg-redwood-solid-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-redwood-primary rounded-full transition-all"
                  style={{ width: `${selectedTask.progress}%` }}
                />
              </div>
            </div>

            {/* Hours */}
            <div className="p-3 bg-redwood-surface-soft rounded-lg border border-redwood-border text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-redwood-muted">Horas est.</span>
                <span className="font-medium">{selectedTask.estimatedHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-redwood-muted">Horas reales</span>
                <span className="font-medium">{selectedTask.actualHours}h</span>
              </div>
            </div>

            {/* Dependencies */}
            {selectedTask.dependencies?.length > 0 && (
              <div>
                <p className="text-xs text-redwood-muted mb-1">Dependencias</p>
                <div className="space-y-1">
                  {selectedTask.dependencies.map(depId => {
                    const dep = tasks.find(t => t.id === depId);
                    return dep ? (
                      <div key={depId} className="text-xs px-2 py-1 bg-redwood-selected-bg rounded text-redwood-primary">
                        {dep.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-redwood-border flex gap-2">
            <Button variant="subtle" size="compact" className="flex-1" onClick={() => setShowDetail(false)}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              size="compact"
              className="flex-1"
              onClick={() => { setEditingTask({ ...selectedTask }); setShowDetail(false); }}
            >
              Editar
            </Button>
          </div>
        </div>
      )}

      {/* ── Edit / Create Task Modal ────────────────────── */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">
                {editingTask.id ? 'Editar Tarea' : 'Nueva Tarea'}
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-redwood-muted hover:text-redwood-text">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Name */}
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.name ?? ''}
                  onChange={e => setEditingTask({ ...editingTask, name: e.target.value })}
                />
              </div>

              {/* Proyecto */}
              <div>
                <label className="block text-xs font-medium mb-1">Proyecto</label>
                <select
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.projectId ?? ''}
                  onChange={e => setEditingTask({ ...editingTask, projectId: e.target.value })}
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Asignado */}
              <div>
                <label className="block text-xs font-medium mb-1">Asignado a</label>
                <select
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.assigneeId ?? ''}
                  onChange={e => setEditingTask({ ...editingTask, assigneeId: e.target.value })}
                >
                  <option value="">Sin asignar</option>
                  {resources.map(r => <option key={r.id} value={r.userId}>{r.name}</option>)}
                </select>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-xs font-medium mb-1">Fecha inicio</label>
                <input
                  type="date"
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.startDate ?? ''}
                  onChange={e => setEditingTask({ ...editingTask, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Fecha fin</label>
                <input
                  type="date"
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.endDate ?? ''}
                  onChange={e => setEditingTask({ ...editingTask, endDate: e.target.value })}
                />
              </div>

              {/* Baseline */}
              <div>
                <label className="block text-xs font-medium mb-1">Línea base inicio</label>
                <input
                  type="date"
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.baselineStart ?? ''}
                  onChange={e => setEditingTask({ ...editingTask, baselineStart: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Línea base fin</label>
                <input
                  type="date"
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.baselineEnd ?? ''}
                  onChange={e => setEditingTask({ ...editingTask, baselineEnd: e.target.value })}
                />
              </div>

              {/* Status & Priority */}
              <div>
                <label className="block text-xs font-medium mb-1">Estado</label>
                <select
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.status ?? 'todo'}
                  onChange={e => setEditingTask({ ...editingTask, status: e.target.value as Task['status'] })}
                >
                  <option value="todo">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="done">Completado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Prioridad</label>
                <select
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.priority ?? 'medium'}
                  onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              {/* Progress & Hours */}
              <div>
                <label className="block text-xs font-medium mb-1">Progreso (%)</label>
                <input
                  type="number" min="0" max="100"
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.progress ?? 0}
                  onChange={e => setEditingTask({ ...editingTask, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Horas estimadas</label>
                <input
                  type="number" min="0"
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={editingTask.estimatedHours ?? 8}
                  onChange={e => setEditingTask({ ...editingTask, estimatedHours: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Flags */}
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-redwood-border text-redwood-primary focus:ring-redwood-focus-ring"
                    checked={!!editingTask.isEpic}
                    onChange={e => setEditingTask({ ...editingTask, isEpic: e.target.checked })}
                  />
                  <Flag className="h-3.5 w-3.5 text-redwood-primary" />
                  Es Epic
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-redwood-border text-redwood-primary focus:ring-redwood-focus-ring"
                    checked={!!editingTask.isMilestone}
                    onChange={e => setEditingTask({ ...editingTask, isMilestone: e.target.checked })}
                  />
                  <Diamond className="h-3.5 w-3.5 text-redwood-warning" />
                  Es Hito
                </label>
              </div>

              {/* Dependencies */}
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Dependencias (IDs separados por coma)</label>
                <input
                  type="text"
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={(editingTask.dependencies ?? []).join(', ')}
                  onChange={e => setEditingTask({ ...editingTask, dependencies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="task_1, task_2"
                />
              </div>
            </div>

            <div className="flex justify-between mt-5">
              {editingTask.id && (
                <Button
                  variant="danger"
                  size="compact"
                  onClick={() => { handleDelete(editingTask.id!); setEditingTask(null); }}
                >
                  Eliminar
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="subtle" size="compact" onClick={() => setEditingTask(null)}>Cancelar</Button>
                <Button variant="primary" size="compact" icon={<Save className="h-4 w-4" />} onClick={handleSave}>
                  Guardar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
