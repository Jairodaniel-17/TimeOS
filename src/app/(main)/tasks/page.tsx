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
  todo: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Por hacer' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En progreso' },
  done: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completado' },
};

const PRIORITY_COLORS = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Baja' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Media' },
  high: { bg: 'bg-red-100', text: 'text-red-700', label: 'Alta' },
};

const TIME_STATUS_COLORS = {
  on_track: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'En tiempo' },
  over_budget: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, label: 'Sobrepasado' },
  under_budget: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock, label: 'Por debajo' },
  not_started: { color: 'text-gray-500', bg: 'bg-gray-50', icon: Pause, label: 'Sin iniciar' },
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
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-blue-600';
    return 'text-green-600';
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
        <PageContent className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando...</span>
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
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Exportar Excel
            </Button>
          </>
        }
      />
      <PageContent className="p-0">
        {/* Filters */}
        <div className="flex items-center gap-4 p-4 border-b border-[var(--color-border-subtle)] bg-white">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-gray-500" />
            <select
              className="border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2 text-sm"
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
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2 text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="done">Completado</option>
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto text-sm text-gray-600">
            <span>Total: <strong>{filteredTasks.length}</strong> tasks</span>
          </div>
        </div>

        {/* Excel-like Grid */}
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-bg-page)] sticky top-0 z-10">
              <tr className="text-left text-xs font-medium text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)]">
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
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filteredTasks.map((task) => (
                <tr 
                  key={task.id} 
                  className={`text-sm hover:bg-[var(--color-hover-row)] ${
                    task.level && task.level > 0 ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    {task.hasSubtasks && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="text-gray-500 hover:text-gray-700"
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
                          <span className="text-xs text-gray-400 mr-1">({task.subtaskCount})</span>
                        )}
                      </span>
                      <span className="font-medium">{task.name}</span>
                    </div>
                    {task.description && (
                      <div className="text-xs text-gray-500 mt-1 ml-4">{task.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{task.project?.name}</td>
                  <td className="px-4 py-3">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-xs font-medium text-[var(--color-primary)]">
                          {task.assignee.name.charAt(0)}
                        </div>
                        <span>{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{task.estimatedHours}h</td>
                  <td className="px-4 py-3 text-right">
                    <span className={task.actualHours > task.estimatedHours ? 'text-red-600 font-medium' : ''}>
                      {task.actualHours}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">{task.remainingHours}h</td>
                  <td className="px-4 py-3 text-right text-red-600">{task.overHours}h</td>
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
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-[var(--color-primary)]"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-8">{task.progress}%</span>
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
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Agregar horas"
                      >
                        <Clock className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-4">
          <div className="grid grid-cols-6 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg border border-[var(--color-border-subtle)]">
              <div className="text-gray-500 text-xs">Total Estimado</div>
              <div className="text-lg font-bold">{filteredTasks.reduce((sum, t) => sum + t.estimatedHours, 0)}h</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[var(--color-border-subtle)]">
              <div className="text-gray-500 text-xs">Total Real</div>
              <div className="text-lg font-bold text-blue-600">{filteredTasks.reduce((sum, t) => sum + t.actualHours, 0)}h</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[var(--color-border-subtle)]">
              <div className="text-gray-500 text-xs">Varianza</div>
              <div className={`text-lg font-bold ${filteredTasks.reduce((sum, t) => sum + t.variance, 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {filteredTasks.reduce((sum, t) => sum + t.variance, 0) > 0 ? '+' : ''}{filteredTasks.reduce((sum, t) => sum + t.variance, 0)}h
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[var(--color-border-subtle)]">
              <div className="text-gray-500 text-xs">En tiempo</div>
              <div className="text-lg font-bold text-green-600">
                {filteredTasks.filter(t => t.timeStatus === 'on_track').length}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[var(--color-border-subtle)]">
              <div className="text-gray-500 text-xs">Sobrepasados</div>
              <div className="text-lg font-bold text-red-600">
                {filteredTasks.filter(t => t.timeStatus === 'over_budget').length}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[var(--color-border-subtle)]">
              <div className="text-gray-500 text-xs">Completados</div>
              <div className="text-lg font-bold text-gray-600">
                {filteredTasks.filter(t => t.status === 'done').length}
              </div>
            </div>
          </div>
        </div>
      </PageContent>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-md)] p-6 w-[600px] max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Nueva Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="Nombre de la tarea"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Descripción detallada"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Proyecto *</label>
                  <select
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
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
                  <label className="block text-sm font-medium mb-1">Task Padre (Opcional)</label>
                  <select
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Asignado a</label>
                  <select
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
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
                  <label className="block text-sm font-medium mb-1">Horas Estimadas</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={newTask.endDate}
                    onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridad</label>
                  <select
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
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
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
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
          <div className="bg-white rounded-[var(--radius-md)] p-6 w-[500px]">
            <h2 className="text-lg font-semibold mb-4">Editar Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Asignado a</label>
                  <select
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
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
                  <label className="block text-sm font-medium mb-1">Horas Estimadas</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={editingTask.estimatedHours}
                    onChange={(e) => setEditingTask({ ...editingTask, estimatedHours: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as Task['status'] })}
                  >
                    <option value="todo">Por hacer</option>
                    <option value="in_progress">En progreso</option>
                    <option value="done">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridad</label>
                  <select
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">Progreso ({editingTask.progress}%)</label>
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
              <Button variant="secondary" onClick={() => setEditingTask(null)}>
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
          <div className="bg-white rounded-[var(--radius-md)] p-6 w-[400px]">
            <h2 className="text-lg font-semibold mb-2">Registrar Horas</h2>
            <p className="text-sm text-gray-600 mb-4">{selectedTask.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Horas</label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                  value={timeEntry.hours}
                  onChange={(e) => setTimeEntry({ ...timeEntry, hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                  value={timeEntry.date}
                  onChange={(e) => setTimeEntry({ ...timeEntry, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción del trabajo</label>
                <textarea
                  className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                  value={timeEntry.description}
                  onChange={(e) => setTimeEntry({ ...timeEntry, description: e.target.value })}
                  placeholder="¿Qué hiciste?"
                  rows={3}
                />
              </div>
              <div className="bg-gray-50 p-3 rounded text-sm">
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
              <Button variant="secondary" onClick={() => { setShowTimeEntryModal(false); setSelectedTask(null); }}>
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
