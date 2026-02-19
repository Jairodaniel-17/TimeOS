'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, Badge, Input } from '@/components/ui';
import { Plus, Loader2, Trash2, Save, X, Calendar, User, Link2, ChevronDown, ChevronRight, Flag, Layers } from 'lucide-react';
import { Task as GanttTask, ViewMode, Gantt } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
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

interface Resource {
  id: string;
  userId: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  baselineStart?: string;
  baselineEnd?: string;
  baselineBudget?: number;
}

const DEPENDENCY_TYPES = [
  { value: 'FS', label: 'Finish to Start' },
  { value: 'SS', label: 'Start to Start' },
  { value: 'FF', label: 'Finish to Finish' },
  { value: 'SF', label: 'Start to Finish' },
];

export default function PlanningPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskPanel, setShowTaskPanel] = useState(true);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showBaseline, setShowBaseline] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/tasks'),
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
      
      // Map users to resources
      if (usersData.success) {
        setResources(usersData.data.map((u: any) => ({
          id: u.id,
          userId: u.id,
          name: u.name,
        })));
      }

      if (tasksData.success) {
        convertToGanttTasks(tasksData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToGanttTasks = (tasks: Task[]) => {
    // Filter by selected project
    const filteredTasks = selectedProjectId === 'all' 
      ? tasks 
      : tasks.filter(t => t.projectId === selectedProjectId);
    
    const mapped: GanttTask[] = filteredTasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: new Date(t.startDate),
      end: new Date(t.endDate),
      progress: t.progress / 100,
      type: t.isMilestone ? 'milestone' : t.isEpic ? 'project' : 'task',
      dependencies: t.dependencies || [],
      project: t.project?.name || '',
      styles: {
        backgroundColor: t.status === 'done' ? '#10b981' : t.status === 'in_progress' ? '#3b82f6' : '#6b7280',
        progressColor: t.status === 'done' ? '#059669' : t.status === 'in_progress' ? '#2563eb' : '#4b5563',
        progressSelectedColor: '#1d4ed8',
      },
      // Baseline (línea base)
      startAsDate: t.baselineStart ? new Date(t.baselineStart) : undefined,
      endAsDate: t.baselineEnd ? new Date(t.baselineEnd) : undefined,
    }));
    setGanttTasks(mapped);
  };

  // Re-convert when project selection changes
  useEffect(() => {
    if (tasks.length > 0) {
      convertToGanttTasks(tasks);
    }
  }, [selectedProjectId, tasks]);

  const handleTaskChange = useCallback((task: GanttTask) => {
    setGanttTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }, []);

  const handleProgressChange = useCallback(async (task: GanttTask) => {
    setGanttTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, progress: Math.round(task.progress * 100) }),
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, []);

  const handleDblClick = useCallback((task: GanttTask) => {
    const originalTask = tasks.find((t) => t.id === task.id);
    if (originalTask) {
      setEditingTask({ ...originalTask });
    }
  }, [tasks]);

  const handleSelect = useCallback((task: GanttTask, isSelected: boolean) => {
    if (isSelected) {
      const originalTask = tasks.find((t) => t.id === task.id);
      if (originalTask) setSelectedTask(originalTask);
    }
  }, [tasks]);

  const handleSaveTask = async () => {
    if (!editingTask) return;
    
    try {
      const method = tasks.find(t => t.id === editingTask.id) ? 'PUT' : 'POST';
      const res = await fetch('/api/tasks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask),
      });
      
      if (res.ok) {
        setEditingTask(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleCreateTask = () => {
    const newTask = {
      name: 'Nueva Tarea',
      projectId: projects[0]?.id || '',
      assigneeId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedHours: 8,
      actualHours: 0,
      progress: 0,
      priority: 'medium' as const,
      status: 'todo' as const,
      dependencies: [],
    };
    setEditingTask(newTask);
  };

  const toggleEpic = (epicId: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getTaskHierarchy = () => {
    const epics = tasks.filter(t => t.parentId === undefined && t.isEpic);
    const standalone = tasks.filter(t => !t.parentId && !t.isEpic);
    
    return { epics, standalone };
  };

  if (loading) {
    return (
      <PageLayout>
        <Header title="Planificación" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Planificación' }]} />
        <PageContent className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        </PageContent>
      </PageLayout>
    );
  }

  const { epics, standalone } = getTaskHierarchy();

  return (
    <PageLayout>
      <Header
        title="Planificación de Proyectos - Microsoft Project Style"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Planificación' }]}
        actions={
          <div className="flex items-center gap-2">
            {/* Selector de Proyecto */}
            <select
              className="border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2 text-sm bg-white"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="all">Todos los Proyectos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            {/* Toggle Línea Base */}
            <Button 
              variant={showBaseline ? 'primary' : 'secondary'} 
              size="compact" 
              icon={<Layers className="h-4 w-4" />}
              onClick={() => setShowBaseline(!showBaseline)}
            >
              Línea Base
            </Button>
            
            <Button variant={showTaskPanel ? 'primary' : 'secondary'} onClick={() => setShowTaskPanel(!showTaskPanel)}>
              {showTaskPanel ? 'Ocultar' : 'Mostrar'} Panel
            </Button>
            <div className="flex items-center gap-1 bg-[var(--color-bg-page)] rounded-[var(--radius-sm)] p-1">
              <Button variant={viewMode === ViewMode.Day ? 'primary' : 'ghost'} size="compact" onClick={() => setViewMode(ViewMode.Day)}>Día</Button>
              <Button variant={viewMode === ViewMode.Week ? 'primary' : 'ghost'} size="compact" onClick={() => setViewMode(ViewMode.Week)}>Semana</Button>
              <Button variant={viewMode === ViewMode.Month ? 'primary' : 'ghost'} size="compact" onClick={() => setViewMode(ViewMode.Month)}>Mes</Button>
            </div>
            <PermissionGate permission="tasks:create">
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleCreateTask}>Nueva Tarea</Button>
            </PermissionGate>
          </div>
        }
      />
      <PageContent className="p-0">
        <div className="flex h-full">
          {/* Panel de Tareas estilo Excel */}
          {showTaskPanel && (
            <div className="w-[500px] border-r border-[var(--color-border-subtle)] bg-white flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-subtle)] bg-gray-50">
                <h3 className="text-sm font-semibold">Tareas y Subtareas</h3>
                <span className="text-xs text-gray-500">{tasks.length} tareas</span>
              </div>
              
              <div className="flex-1 overflow-auto">
                {/* Encabezados estilo Excel */}
                <div className="grid grid-cols-12 gap-1 px-2 py-2 bg-gray-100 text-xs font-medium text-gray-600 sticky top-0">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">Nombre</div>
                  <div className="col-span-2">Inicio</div>
                  <div className="col-span-2">Fin</div>
                  <div className="col-span-1">%</div>
                  <div className="col-span-1">Asignado</div>
                </div>

                {/* Epics (Expandibles) */}
                {epics.map(epic => (
                  <div key={epic.id}>
                    <div 
                      className="grid grid-cols-12 gap-1 px-2 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                      onClick={() => toggleEpic(epic.id)}
                    >
                      <div className="col-span-1">
                        {expandedEpics.has(epic.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                      <div className="col-span-3 font-medium text-blue-700 flex items-center gap-1">
                        <Flag className="h-3 w-3" /> {epic.name}
                      </div>
                      <div className="col-span-2 text-xs">{epic.startDate}</div>
                      <div className="col-span-2 text-xs">{epic.endDate}</div>
                      <div className="col-span-1 text-xs">{epic.progress}%</div>
                      <div className="col-span-1 text-xs">{epic.assignee?.name || '-'}</div>
                    </div>
                    
                    {/* Subtareas */}
                    {expandedEpics.has(epic.id) && tasks.filter(t => t.parentId === epic.id).map(subtask => (
                      <div 
                        key={subtask.id}
                        className="grid grid-cols-12 gap-1 px-2 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 pl-8"
                        onClick={() => setEditingTask({ ...subtask })}
                      >
                        <div className="col-span-1"></div>
                        <div className="col-span-3 text-sm">{subtask.name}</div>
                        <div className="col-span-2 text-xs">{subtask.startDate}</div>
                        <div className="col-span-2 text-xs">{subtask.endDate}</div>
                        <div className="col-span-1 text-xs">{subtask.progress}%</div>
                        <div className="col-span-1 text-xs">{subtask.assignee?.name || '-'}</div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Tareas independientes */}
                {standalone.map(task => (
                  <div 
                    key={task.id}
                    className="grid grid-cols-12 gap-1 px-2 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    onClick={() => setEditingTask({ ...task })}
                  >
                    <div className="col-span-1"></div>
                    <div className="col-span-3 text-sm">{task.name}</div>
                    <div className="col-span-2 text-xs">{task.startDate}</div>
                    <div className="col-span-2 text-xs">{task.endDate}</div>
                    <div className="col-span-1 text-xs">{task.progress}%</div>
                    <div className="col-span-1 text-xs">{task.assignee?.name || '-'}</div>
                  </div>
                ))}
              </div>

              {/* Panel de edición */}
              {editingTask && (
                <div className="border-t border-[var(--color-border-subtle)] p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Editar Tarea</h4>
                    <button onClick={() => setEditingTask(null)}><X className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-medium">Fecha Fin</label>
                      <input 
                        type="date" 
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.endDate}
                        onChange={e => setEditingTask({ ...editingTask, endDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Línea Base Inicio</label>
                      <input 
                        type="date" 
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.baselineStart || ''}
                        onChange={e => setEditingTask({ ...editingTask, baselineStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Línea Base Fin</label>
                      <input 
                        type="date" 
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.baselineEnd || ''}
                        onChange={e => setEditingTask({ ...editingTask, baselineEnd: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Proyecto</label>
                      <select 
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.projectId}
                        onChange={e => setEditingTask({ ...editingTask, projectId: e.target.value })}
                      >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Asignado a</label>
                      <select 
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.assigneeId || ''}
                        onChange={e => setEditingTask({ ...editingTask, assigneeId: e.target.value })}
                      >
                        <option value="">Sin asignar</option>
                        {resources.map(r => <option key={r.id} value={r.userId}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Fecha Inicio</label>
                      <input 
                        type="date" 
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.startDate}
                        onChange={e => setEditingTask({ ...editingTask, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Fecha Fin</label>
                      <input 
                        type="date" 
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.endDate}
                        onChange={e => setEditingTask({ ...editingTask, endDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Progreso</label>
                      <input 
                        type="number" 
                        min="0" max="100"
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.progress}
                        onChange={e => setEditingTask({ ...editingTask, progress: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Prioridad</label>
                      <select 
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.priority}
                        onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium">Dependencias (IDs separados por coma)</label>
                      <input 
                        type="text" 
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editingTask.dependencies?.join(', ') || ''}
                        onChange={e => setEditingTask({ ...editingTask, dependencies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="task_1, task_2"
                      />
                    </div>
                    <div className="col-span-2 flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-xs">
                        <input 
                          type="checkbox" 
                          checked={editingTask.isEpic || false}
                          onChange={e => setEditingTask({ ...editingTask, isEpic: e.target.checked })}
                        />
                        Es Epic
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input 
                          type="checkbox" 
                          checked={editingTask.isMilestone || false}
                          onChange={e => setEditingTask({ ...editingTask, isMilestone: e.target.checked })}
                        />
                        Es Hito
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="secondary" size="compact" onClick={() => setEditingTask(null)}>Cancelar</Button>
                    <Button variant="primary" size="compact" icon={<Save className="h-4 w-4" />} onClick={handleSaveTask}>Guardar</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gantt Chart */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 min-w-[800px]">
              {/* Leyenda */}
              <div className="flex items-center gap-6 mb-4 px-4 py-2 bg-white rounded-lg border border-[var(--color-border-subtle)]">
                <span className="text-sm font-medium">Leyenda:</span>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-500"></div><span className="text-xs">Pendiente</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500"></div><span className="text-xs">En Progreso</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500"></div><span className="text-xs">Completado</span></div>
                <div className="flex items-center gap-2"><Flag className="h-3 w-3 text-purple-500" /><span className="text-xs">Hito/Epic</span></div>
              </div>

              {ganttTasks.length > 0 ? (
                <Gantt
                  tasks={ganttTasks}
                  viewMode={viewMode}
                  onDateChange={handleTaskChange}
                  onProgressChange={handleProgressChange}
                  onDoubleClick={handleDblClick}
                  onSelect={handleSelect}
                  listCellWidth="180px"
                  columnWidth={viewMode === ViewMode.Day ? 50 : viewMode === ViewMode.Week ? 100 : 200}
                  barFill={70}
                  barCornerRadius={4}
                  handleWidth={8}
                  todayColor="rgba(59, 130, 246, 0.1)"
                  projectBackgroundColor="#8b5cf6"
                  projectProgressColor="#7c3aed"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-secondary)]">
                  <p className="mb-4">No hay tareas para mostrar</p>
                  <PermissionGate permission="tasks:create">
                    <Button variant="primary" onClick={handleCreateTask}>Crear primera tarea</Button>
                  </PermissionGate>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
