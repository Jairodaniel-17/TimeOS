'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button } from '@/components/ui';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Filter,
  Download,
  FolderTree,
  Edit2,
  Trash2,
  Pause
} from 'lucide-react';
import { PermissionGate } from '@/hooks/usePermissions';
import type { Task, Project, User } from '@/types';
import { PROJECT_PHASES } from '@/types';

interface TaskWithHierarchy extends Task {
  estimatedHours: number;
  actualHours: number;
  remainingHours: number;
  overHours: number;
  variance: number;
  hasSubtasks: boolean;
  subtaskCount: number;
  timeStatus: 'on_track' | 'over_budget' | 'under_budget' | 'not_started';
  subtasks?: TaskWithHierarchy[];
  level?: number;
}

const STATUS_COLORS = {
  todo: { bg: 'bg-redwood-surface', text: 'text-redwood-muted', label: 'Por hacer' },
  in_progress: { bg: 'bg-badge-subtle-info-bg', text: 'text-redwood-text', label: 'En progreso' },
  done: { bg: 'bg-badge-subtle-success-bg', text: 'text-redwood-text', label: 'Completado' },
};

const PRIORITY_COLORS = {
  low: { bg: 'bg-redwood-surface', text: 'text-redwood-muted', label: 'Baja' },
  medium: { bg: 'bg-badge-subtle-warning-bg', text: 'text-redwood-text', label: 'Media' },
  high: { bg: 'bg-badge-subtle-danger-bg', text: 'text-redwood-text', label: 'Alta' },
};

const TIME_STATUS_COLORS = {
  on_track: { color: 'text-redwood-green', bg: 'bg-badge-subtle-success-bg', icon: CheckCircle, label: 'En tiempo' },
  over_budget: { color: 'text-redwood-danger', bg: 'bg-badge-subtle-danger-bg', icon: AlertTriangle, label: 'Sobrepasado' },
  under_budget: { color: 'text-redwood-primary', bg: 'bg-badge-subtle-info-bg', icon: Clock, label: 'Por debajo' },
  not_started: { color: 'text-redwood-muted', bg: 'bg-redwood-surface', icon: Pause, label: 'Sin iniciar' },
};

export default function TasksAdminPage() {
  const [tasks, setTasks] = useState<TaskWithHierarchy[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithHierarchy | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithHierarchy | null>(null);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    projectId: '',
    parentId: '',
    phaseId: '',
    assigneeId: '',
    estimatedHours: 0,
    startDate: '',
    endDate: '',
    priority: 'medium',
  });
  const [timeEntry, setTimeEntry] = useState({
    hours: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/tasks?includeHierarchy=true'),
        fetch('/api/projects'),
        fetch('/api/users'),
      ]);

      const [tasksData, projectsData, usersData] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        usersRes.json(),
      ]);

      if (tasksData.success) setTasks(tasksData.data);
      if (projectsData.success) setProjects(projectsData.data);
      if (usersData.success) setUsers(usersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const flattenTasks = (tasks: TaskWithHierarchy[], level = 0): TaskWithHierarchy[] => {
    const result: TaskWithHierarchy[] = [];
    tasks.forEach(task => {
      result.push({ ...task, level });
      if (task.subtasks && expandedTasks.has(task.id)) {
        result.push(...flattenTasks(task.subtasks, level + 1));
      }
    });
    return result;
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    if (selectedProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === selectedProject);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }
    
    return flattenTasks(filtered);
  }, [tasks, selectedProject, selectedStatus, expandedTasks]);

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          parentId: newTask.parentId || undefined,
          phaseId: newTask.phaseId || undefined,
          assigneeId: newTask.assigneeId || undefined,
          startDate: newTask.startDate || new Date().toISOString().split('T')[0],
          endDate: newTask.endDate || new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowCreateModal(false);
        setNewTask({
          name: '',
          description: '',
          projectId: '',
          parentId: '',
          phaseId: '',
          assigneeId: '',
          estimatedHours: 0,
          startDate: '',
          endDate: '',
          priority: 'medium',
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTask.id,
          name: editingTask.name,
          description: editingTask.description,
          assigneeId: editingTask.assigneeId,
          estimatedHours: editingTask.estimatedHours,
          priority: editingTask.priority,
          status: editingTask.status,
          progress: editingTask.progress,
        }),
      });

      await fetchData();
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea? Se eliminarán también todas las subtareas.')) return;
    
    try {
      await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddTimeEntry = async () => {
    if (!selectedTask) return;
    
    try {
      const response = await fetch('/api/task-time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTask.id,
          userId: selectedTask.assigneeId || '1', // Default to admin if not assigned
          projectId: selectedTask.projectId,
          hours: timeEntry.hours,
          date: timeEntry.date,
          description: timeEntry.description,
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowTimeEntryModal(false);
        setTimeEntry({ hours: 0, date: new Date().toISOString().split('T')[0], description: '' });
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Error adding time entry:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Proyecto', 'Tarea', 'Descripción', 'Asignado', 'Estimado (h)', 'Real (h)', 'Restante (h)', 'Sobrante (h)', 'Progreso', 'Estado', 'Prioridad'].join(','),
      ...filteredTasks.map(t => [
        t.id,
        t.project?.name,
        '  '.repeat(t.level || 0) + t.name,
        t.description || '',
        t.assignee?.name || 'Sin asignar',
        t.estimatedHours,
        t.actualHours,
        t.remainingHours,
        t.overHours,
        t.progress + '%',
        STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]?.label || t.status,
        PRIORITY_COLORS[t.priority as keyof typeof PRIORITY_COLORS]?.label || t.priority,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tasks-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-redwood-danger';
    if (variance < 0) return 'text-redwood-primary';
    return 'text-redwood-green';
  };

  const getVarianceIcon = (timeStatus: string) => {
    const config = TIME_STATUS_COLORS[timeStatus as keyof typeof TIME_STATUS_COLORS];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  if (loading) {
    return (
      <PageLayout>
        <Header
          title="Gestión de Tasks"
          breadcrumbs={[{ label: 'TimeOS' }, { label: 'Tasks' }]}
        />
        <PageContent>
          <div className="flex gap-3 mb-4">
            <div className="h-9 w-48 rounded-[14px] animate-pulse bg-redwood-solid-bg" />
            <div className="h-9 w-36 rounded-[14px] animate-pulse bg-redwood-solid-bg" />
            <div className="h-9 w-24 rounded-[14px] animate-pulse bg-redwood-solid-bg ml-auto" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-[14px] animate-pulse bg-redwood-solid-bg" style={{ opacity: 1 - i * 0.08 }} />
            ))}
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Gestión de Tasks"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Tasks' }]}
        actions={
          <>
            <PermissionGate permission="tasks:create">
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
                Nueva Task
              </Button>
            </PermissionGate>
            <Button variant="subtle" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Exportar Excel
            </Button>
          </>
        }
      />
      <PageContent className="p-0">
        {/* Filters */}
        <div className="flex items-center gap-4 p-4 border-b border-redwood-border bg-redwood-surface">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-redwood-muted" />
            <select
              className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="all">Todos los proyectos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-redwood-muted" />
            <select
              className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="done">Completado</option>
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto text-sm text-redwood-muted">
            <span>Total: <strong>{filteredTasks.length}</strong> tasks</span>
          </div>
        </div>

        {/* Excel-like Grid */}
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-redwood-page sticky top-0 z-10">
              <tr className="text-left text-xs font-medium text-redwood-muted border-b border-redwood-border">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 min-w-[300px]">Tarea</th>
                <th className="px-4 py-3 min-w-[120px]">Proyecto</th>
                <th className="px-4 py-3 min-w-[150px]">Asignado</th>
                <th className="px-4 py-3 text-right w-24">Estimado</th>
                <th className="px-4 py-3 text-right w-24">Real</th>
                <th className="px-4 py-3 text-right w-24">Restante</th>
                <th className="px-4 py-3 text-right w-24">Sobrante</th>
                <th className="px-4 py-3 text-center w-24">Dif.</th>
                <th className="px-4 py-3 text-center w-24">Progreso</th>
                <th className="px-4 py-3 text-center w-24">Estado</th>
                <th className="px-4 py-3 text-center w-24">Prioridad</th>
                <th className="px-4 py-3 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-redwood-border">
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className={`text-sm hover:bg-redwood-hover-bg ${
                    task.level && task.level > 0 ? 'bg-redwood-surface/50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    {task.hasSubtasks && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="text-redwood-muted hover:text-redwood-muted"
                      >
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span style={{ marginLeft: `${(task.level || 0) * 20}px` }}>
                        {task.hasSubtasks && (
                          <span className="text-xs text-redwood-muted mr-1">({task.subtaskCount})</span>
                        )}
                      </span>
                      <span className="font-medium">{task.name}</span>
                    </div>
                    {task.description && (
                      <div className="text-xs text-redwood-muted mt-1 ml-4">{task.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-redwood-muted">{task.project?.name}</td>
                  <td className="px-4 py-3">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-xs font-medium text-redwood-primary">
                          {task.assignee.name.charAt(0)}
                        </div>
                        <span>{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-redwood-muted italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{task.estimatedHours}h</td>
                  <td className="px-4 py-3 text-right">
                    <span className={task.actualHours > task.estimatedHours ? 'text-redwood-danger font-medium' : ''}>
                      {task.actualHours}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-redwood-green">{task.remainingHours}h</td>
                  <td className="px-4 py-3 text-right text-redwood-danger">{task.overHours}h</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getVarianceIcon(task.timeStatus)}
                      <span className={`text-xs font-medium ${getVarianceColor(task.variance)}`}>
                        {task.variance > 0 ? `+${task.variance}` : task.variance}h
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-redwood-solid-bg rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-redwood-primary"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-redwood-muted w-8">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]?.bg} ${STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]?.text}`}>
                      {STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]?.bg} ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]?.text}`}>
                      {PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setSelectedTask(task); setShowTimeEntryModal(true); }}
                        className="p-1 hover:bg-redwood-surface rounded"
                        title="Agregar horas"
                      >
                        <Clock className="h-4 w-4 text-redwood-primary" />
                      </button>
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-1 hover:bg-redwood-surface rounded"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4 text-redwood-muted" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 hover:bg-redwood-surface rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-redwood-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="border-t border-redwood-border bg-redwood-page p-4">
          <div className="grid grid-cols-6 gap-4 text-sm">
            <div className="bg-redwood-surface p-3 rounded-[10px] border border-redwood-border">
              <div className="text-redwood-muted text-xs">Total Estimado</div>
              <div className="text-lg font-bold">{filteredTasks.reduce((sum, t) => sum + t.estimatedHours, 0)}h</div>
            </div>
            <div className="bg-redwood-surface p-3 rounded-[10px] border border-redwood-border">
              <div className="text-redwood-muted text-xs">Total Real</div>
              <div className="text-lg font-bold text-redwood-primary">{filteredTasks.reduce((sum, t) => sum + t.actualHours, 0)}h</div>
            </div>
            <div className="bg-redwood-surface p-3 rounded-[10px] border border-redwood-border">
              <div className="text-redwood-muted text-xs">Varianza</div>
              <div className={`text-lg font-bold ${filteredTasks.reduce((sum, t) => sum + t.variance, 0) > 0 ? 'text-redwood-danger' : 'text-redwood-green'}`}>
                {filteredTasks.reduce((sum, t) => sum + t.variance, 0) > 0 ? '+' : ''}{filteredTasks.reduce((sum, t) => sum + t.variance, 0)}h
              </div>
            </div>
            <div className="bg-redwood-surface p-3 rounded-[10px] border border-redwood-border">
              <div className="text-redwood-muted text-xs">En tiempo</div>
              <div className="text-lg font-bold text-redwood-green">
                {filteredTasks.filter(t => t.timeStatus === 'on_track').length}
              </div>
            </div>
            <div className="bg-redwood-surface p-3 rounded-[10px] border border-redwood-border">
              <div className="text-redwood-muted text-xs">Sobrepasados</div>
              <div className="text-lg font-bold text-redwood-danger">
                {filteredTasks.filter(t => t.timeStatus === 'over_budget').length}
              </div>
            </div>
            <div className="bg-redwood-surface p-3 rounded-[10px] border border-redwood-border">
              <div className="text-redwood-muted text-xs">Completados</div>
              <div className="text-lg font-bold text-redwood-muted">
                {filteredTasks.filter(t => t.status === 'done').length}
              </div>
            </div>
          </div>
        </div>
      </PageContent>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-redwood-surface rounded-[14px] p-6 w-[600px] max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Nueva Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Nombre *</label>
                <input
                  type="text"
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="Nombre de la tarea"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Descripción</label>
                <textarea
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Descripción detallada"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Proyecto *</label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Task Padre (Opcional)</label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newTask.parentId}
                    onChange={(e) => setNewTask({ ...newTask, parentId: e.target.value })}
                  >
                    <option value="">Ninguno (Task principal)</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {newTask.projectId && (
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Fase del Proyecto</label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newTask.phaseId}
                    onChange={(e) => setNewTask({ ...newTask, phaseId: e.target.value })}
                  >
                    <option value="">Sin fase</option>
                    {PROJECT_PHASES.map((phase) => (
                      <option key={phase.id} value={phase.id}>{phase.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Asignado a</label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newTask.assigneeId}
                    onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                  >
                    <option value="">Sin asignar</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Horas Estimadas</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Fecha Inicio</label>
                  <input
                    type="date"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Fecha Fin</label>
                  <input
                    type="date"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newTask.endDate}
                    onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Prioridad</label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="subtle" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCreateTask}
                disabled={!newTask.name || !newTask.projectId}
              >
                Crear Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-redwood-surface rounded-[14px] p-6 w-[500px]">
            <h2 className="text-lg font-semibold mb-4">Editar Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Nombre</label>
                <input
                  type="text"
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Descripción</label>
                <textarea
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Asignado a</label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={editingTask.assigneeId || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, assigneeId: e.target.value || undefined })}
                  >
                    <option value="">Sin asignar</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Horas Estimadas</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={editingTask.estimatedHours}
                    onChange={(e) => setEditingTask({ ...editingTask, estimatedHours: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Estado</label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as Task['status'] })}
                  >
                    <option value="todo">Por hacer</option>
                    <option value="in_progress">En progreso</option>
                    <option value="done">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Prioridad</label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Progreso ({editingTask.progress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full"
                  value={editingTask.progress}
                  onChange={(e) => setEditingTask({ ...editingTask, progress: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="subtle" onClick={() => setEditingTask(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleUpdateTask}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Time Entry Modal */}
      {showTimeEntryModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-redwood-surface rounded-[14px] p-6 w-[400px]">
            <h2 className="text-lg font-semibold mb-2">Registrar Horas</h2>
            <p className="text-sm text-redwood-muted mb-4">{selectedTask.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Horas</label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={timeEntry.hours}
                  onChange={(e) => setTimeEntry({ ...timeEntry, hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Fecha</label>
                <input
                  type="date"
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={timeEntry.date}
                  onChange={(e) => setTimeEntry({ ...timeEntry, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Descripción del trabajo</label>
                <textarea
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={timeEntry.description}
                  onChange={(e) => setTimeEntry({ ...timeEntry, description: e.target.value })}
                  placeholder="¿Qué hiciste?"
                  rows={3}
                />
              </div>
              <div className="bg-redwood-surface p-3 rounded text-sm">
                <div className="flex justify-between">
                  <span>Estimado:</span>
                  <span className="font-medium">{selectedTask.estimatedHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual:</span>
                  <span className="font-medium">{selectedTask.actualHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Después:</span>
                  <span className={`font-medium ${selectedTask.actualHours + timeEntry.hours > selectedTask.estimatedHours ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedTask.actualHours + timeEntry.hours}h
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="subtle" onClick={() => { setShowTimeEntryModal(false); setSelectedTask(null); }}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAddTimeEntry}
                disabled={timeEntry.hours <= 0}
              >
                Registrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
