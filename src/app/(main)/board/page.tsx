'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import {
  Plus, X, Layers, BookOpen, CheckSquare, Bug, Play, CheckCircle2,
  CircleDashed, Flag, Clock,
} from 'lucide-react';
import { PermissionGate } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import type { Task, Sprint, Project, User, IssueType } from '@/types';

const inputCls = 'w-full h-10 px-3 bg-redwood-surface border border-redwood-border rounded-lg text-sm text-redwood-text focus:border-redwood-focus-ring focus:outline-none focus:ring-2 focus:ring-redwood-focus-ring/20 transition-all';
const labelCls = 'block text-xs font-medium mb-1 text-redwood-muted';

type Status = 'todo' | 'in_progress' | 'done';
type Priority = 'low' | 'medium' | 'high';

const COLUMNS: { id: Status; label: string }[] = [
  { id: 'todo', label: 'Por hacer' },
  { id: 'in_progress', label: 'En progreso' },
  { id: 'done', label: 'Hecho' },
];

const ISSUE_TYPES: Record<IssueType, { label: string; icon: typeof Layers; cls: string }> = {
  epic: { label: 'Epic', icon: Layers, cls: 'bg-badge-subtle-info-bg text-violet-600' },
  story: { label: 'Story', icon: BookOpen, cls: 'bg-badge-subtle-success-bg text-redwood-green' },
  task: { label: 'Task', icon: CheckSquare, cls: 'bg-badge-subtle-info-bg text-redwood-primary' },
  bug: { label: 'Bug', icon: Bug, cls: 'bg-badge-subtle-danger-bg text-redwood-danger' },
};

const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  high: { label: 'Alta', cls: 'bg-badge-subtle-danger-bg text-redwood-danger' },
  medium: { label: 'Media', cls: 'bg-badge-subtle-warning-bg text-redwood-warning' },
  low: { label: 'Baja', cls: 'bg-redwood-page text-redwood-muted' },
};

const SPRINT_STATUS: Record<Sprint['status'], { label: string; cls: string; next: Sprint['status']; nextLabel: string }> = {
  planned: { label: 'Planificado', cls: 'bg-redwood-page text-redwood-muted', next: 'active', nextLabel: 'Iniciar sprint' },
  active: { label: 'Activo', cls: 'bg-badge-subtle-success-bg text-redwood-green', next: 'completed', nextLabel: 'Completar sprint' },
  completed: { label: 'Completado', cls: 'bg-badge-subtle-info-bg text-redwood-primary', next: 'planned', nextLabel: 'Reabrir sprint' },
};

function initials(name?: string): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '—';
}

export default function BoardPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [sprintFilter, setSprintFilter] = useState<string>(''); // '' = todos, sprintId, or 'backlog'
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showCreateSprint, setShowCreateSprint] = useState(false);

  // Load projects + users once, default-select first active project.
  useEffect(() => {
    (async () => {
      setLoadingBase(true);
      try {
        const [pRes, uRes] = await Promise.all([fetch('/api/projects'), fetch('/api/users')]);
        const [pJson, uJson] = await Promise.all([pRes.json(), uRes.json()]);
        if (pJson.success) {
          const list: Project[] = pJson.data;
          setProjects(list);
          const firstActive = list.find(p => p.status === 'active') || list[0];
          if (firstActive) setProjectId(firstActive.id);
        }
        if (uJson.success) setUsers(uJson.data);
      } catch (e) {
        console.error('Error loading board base data:', e);
      } finally {
        setLoadingBase(false);
      }
    })();
  }, []);

  const fetchSprints = useCallback(async (pid: string) => {
    try {
      const res = await fetch(`/api/sprints?projectId=${encodeURIComponent(pid)}`);
      const json = await res.json();
      if (json.success) setSprints(json.data);
    } catch (e) {
      console.error('Error loading sprints:', e);
    }
  }, []);

  const fetchTasks = useCallback(async (pid: string, sprint: string) => {
    if (!pid) { setTasks([]); return; }
    setLoadingTasks(true);
    try {
      const params = new URLSearchParams({ board: 'true', projectId: pid });
      if (sprint) params.set('sprintId', sprint);
      const res = await fetch(`/api/tasks?${params.toString()}`);
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } catch (e) {
      console.error('Error loading tasks:', e);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // Refetch sprints when project changes; reset sprint filter.
  useEffect(() => {
    if (!projectId) return;
    setSprintFilter('');
    fetchSprints(projectId);
  }, [projectId, fetchSprints]);

  // Refetch tasks when project or sprint filter changes.
  useEffect(() => {
    if (!projectId) return;
    fetchTasks(projectId, sprintFilter);
  }, [projectId, sprintFilter, fetchTasks]);

  const selectedSprint = useMemo(
    () => sprints.find(s => s.id === sprintFilter),
    [sprints, sprintFilter],
  );

  const grouped = useMemo(() => {
    const g: Record<Status, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) g[t.status]?.push(t);
    return g;
  }, [tasks]);

  // --- Drag & drop (native HTML5) ---
  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = async (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === status) return;

    const prevStatus = task.status;
    // Optimistic update.
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status } : t)));
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'update failed');
    } catch (err) {
      console.error('Error moving task:', err);
      // Revert on failure.
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: prevStatus } : t)));
    }
  };

  const cycleSprintStatus = async () => {
    if (!selectedSprint) return;
    const next = SPRINT_STATUS[selectedSprint.status].next;
    try {
      await fetch('/api/sprints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSprint.id, status: next }),
      });
      await fetchSprints(projectId);
    } catch (e) {
      console.error('Error updating sprint:', e);
    }
  };

  const userName = useCallback((id?: string) => users.find(u => u.id === id)?.name, [users]);

  return (
    <PageLayout>
      <Header
        title="Tablero"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Gestión' }, { label: 'Tablero' }]}
        actions={
          <>
            <select
              className="h-9 px-3 bg-redwood-surface border border-redwood-border rounded-lg text-sm text-redwood-text focus:border-redwood-focus-ring focus:outline-none focus:ring-2 focus:ring-redwood-focus-ring/20 transition-all"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              disabled={projects.length === 0}
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              className="h-9 px-3 bg-redwood-surface border border-redwood-border rounded-lg text-sm text-redwood-text focus:border-redwood-focus-ring focus:outline-none focus:ring-2 focus:ring-redwood-focus-ring/20 transition-all"
              value={sprintFilter}
              onChange={e => setSprintFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {sprints.map(s => (
                <option key={s.id} value={s.id}>{s.name}{s.status === 'active' ? ' • activo' : ''}</option>
              ))}
              <option value="backlog">Backlog</option>
            </select>
            <PermissionGate permission="tasks:create">
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateIssue(true)} disabled={!projectId}>
                Nuevo issue
              </Button>
            </PermissionGate>
          </>
        }
      />
      <PageContent>
        {loadingBase ? (
          <div className="space-y-4">
            <div className="h-20 rounded-[14px] animate-pulse bg-redwood-solid-bg" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => <div key={i} className="h-64 rounded-[14px] animate-pulse bg-redwood-solid-bg" />)}
            </div>
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Layers className="h-10 w-10 text-redwood-muted opacity-40" />
              <p className="text-sm text-redwood-muted">No hay proyectos.</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Sprint bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              {selectedSprint ? (
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${SPRINT_STATUS[selectedSprint.status].cls}`}>
                    {SPRINT_STATUS[selectedSprint.status].label}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-redwood-text truncate">{selectedSprint.name}</h2>
                    {selectedSprint.goal && <p className="text-xs text-redwood-muted truncate">{selectedSprint.goal}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-redwood-muted">
                  {sprintFilter === 'backlog' ? 'Backlog del proyecto' : 'Todos los issues del proyecto'}
                </p>
              )}
              <div className="flex items-center gap-2">
                {selectedSprint && (
                  <PermissionGate permission="tasks:update">
                    <Button
                      variant="ghost"
                      size="compact"
                      icon={selectedSprint.status === 'active'
                        ? <CheckCircle2 className="h-4 w-4" />
                        : <Play className="h-4 w-4" />}
                      onClick={cycleSprintStatus}
                    >
                      {SPRINT_STATUS[selectedSprint.status].nextLabel}
                    </Button>
                  </PermissionGate>
                )}
                <PermissionGate permission="tasks:create">
                  <Button variant="subtle" size="compact" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateSprint(true)}>
                    Nuevo sprint
                  </Button>
                </PermissionGate>
              </div>
            </div>

            {/* Kanban */}
            <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-[840px] lg:min-w-0">
                {COLUMNS.map(col => {
                  const colTasks = grouped[col.id];
                  const hours = colTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
                  const isOver = dragOverCol === col.id;
                  return (
                    <div
                      key={col.id}
                      onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
                      onDragLeave={() => setDragOverCol(prev => (prev === col.id ? null : prev))}
                      onDrop={e => onDrop(e, col.id)}
                      className={`rounded-[14px] border bg-redwood-page/40 transition-colors ${isOver ? 'border-redwood-primary bg-redwood-selected-bg/40' : 'border-redwood-border'}`}
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-redwood-border">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-redwood-text">{col.label}</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-redwood-page text-redwood-muted">{colTasks.length}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-redwood-muted">
                          <Clock className="h-3 w-3" />{hours}h
                        </span>
                      </div>
                      <div className="p-3 space-y-3 min-h-[120px]">
                        {loadingTasks ? (
                          [0, 1].map(i => <div key={i} className="h-24 rounded-xl animate-pulse bg-redwood-solid-bg" />)
                        ) : colTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                            <CircleDashed className="h-6 w-6 text-redwood-muted opacity-40" />
                            <p className="text-xs text-redwood-muted">Sin issues en este sprint</p>
                          </div>
                        ) : (
                          colTasks.map(t => (
                            <IssueCard key={t.id} task={t} assigneeName={t.assignee?.name || userName(t.assigneeId)} onDragStart={onDragStart} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </PageContent>

      {showCreateIssue && (
        <CreateIssueModal
          projects={projects}
          users={users}
          defaultProjectId={projectId}
          defaultSprintId={selectedSprint?.id}
          defaultAssignee={user?.id}
          onClose={() => setShowCreateIssue(false)}
          onCreated={() => { setShowCreateIssue(false); fetchTasks(projectId, sprintFilter); }}
        />
      )}

      {showCreateSprint && (
        <CreateSprintModal
          projectId={projectId}
          onClose={() => setShowCreateSprint(false)}
          onCreated={() => { setShowCreateSprint(false); fetchSprints(projectId); }}
        />
      )}
    </PageLayout>
  );
}

function IssueCard({ task, assigneeName, onDragStart }: {
  task: Task;
  assigneeName?: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const tCfg = ISSUE_TYPES[task.type || 'task'];
  const TIcon = tCfg.icon;
  const prio = PRIORITY[task.priority];
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      className="bg-redwood-surface border border-redwood-border rounded-xl p-3 shadow-rw cursor-grab active:cursor-grabbing transition-all duration-100 hover:shadow-rw-dropdown hover:-translate-y-px"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${tCfg.cls}`}>
          <TIcon className="h-3 w-3" />{tCfg.label}
        </span>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${prio.cls}`}>
          <Flag className="h-2.5 w-2.5" />{prio.label}
        </span>
      </div>
      <p className="text-sm font-medium text-redwood-text leading-snug mb-3">{task.name}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-redwood-muted">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{task.estimatedHours || 0}h</span>
          <span>· {task.progress || 0}%</span>
        </div>
        <div
          title={assigneeName || 'Sin asignar'}
          className="w-7 h-7 rounded-full bg-redwood-page flex items-center justify-center text-[10px] font-bold text-redwood-primary"
        >
          {initials(assigneeName)}
        </div>
      </div>
    </div>
  );
}

function CreateIssueModal({ projects, users, defaultProjectId, defaultSprintId, defaultAssignee, onClose, onCreated }: {
  projects: Project[];
  users: User[];
  defaultProjectId: string;
  defaultSprintId?: string;
  defaultAssignee?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    projectId: defaultProjectId,
    name: '',
    type: 'task' as IssueType,
    priority: 'medium' as Priority,
    assigneeId: defaultAssignee || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.projectId) return;
    setSaving(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId,
          name: form.name.trim(),
          type: form.type,
          priority: form.priority,
          assigneeId: form.assigneeId || undefined,
          status: 'todo',
          sprintId: defaultSprintId || undefined,
        }),
      });
      onCreated();
    } catch (e) {
      console.error('Error creating issue:', e);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-redwood-text">Nuevo issue</h3>
          <button onClick={onClose} className="p-1.5 text-redwood-muted hover:text-redwood-text rounded-lg hover:bg-redwood-hover-bg"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Proyecto</label>
            <select className={inputCls} value={form.projectId} onChange={e => set('projectId', e.target.value)}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Título</label>
            <input className={inputCls} placeholder="Ej. Implementar login con SSO" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tipo</label>
              <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="epic">Epic</option>
                <option value="story">Story</option>
                <option value="task">Task</option>
                <option value="bug">Bug</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Prioridad</label>
              <select className={inputCls} value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Responsable</label>
            <select className={inputCls} value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)}>
              <option value="">Sin asignar</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="subtle" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Crear issue</Button>
        </div>
      </Card>
    </div>
  );
}

function CreateSprintModal({ projectId, onClose, onCreated }: {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !projectId) return;
    setSaving(true);
    try {
      await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: name.trim(), goal: goal.trim() || undefined, status: 'planned' }),
      });
      onCreated();
    } catch (e) {
      console.error('Error creating sprint:', e);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-redwood-text">Nuevo sprint</h3>
          <button onClick={onClose} className="p-1.5 text-redwood-muted hover:text-redwood-text rounded-lg hover:bg-redwood-hover-bg"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Nombre</label>
            <input className={inputCls} placeholder="Ej. Sprint 1" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Objetivo</label>
            <input className={inputCls} placeholder="Meta del sprint (opcional)" value={goal} onChange={e => setGoal(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="subtle" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Crear sprint</Button>
        </div>
      </Card>
    </div>
  );
}
