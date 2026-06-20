'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Card } from '@/components/ui';
import {
  Activity, TrendingUp, Target, CheckCircle2, Percent, CalendarClock,
  CircleDashed, Play, Flag,
} from 'lucide-react';
import type { Task, Sprint, Project } from '@/types';

type Status = 'todo' | 'in_progress' | 'done';

interface SprintMetrics {
  sprint: Sprint;
  committed: number;   // sum estimatedHours of all the sprint's tasks
  completed: number;   // sum estimatedHours of DONE tasks
  byStatus: Record<Status, number>; // issue counts
}

const selectCls = 'h-9 px-3 bg-redwood-surface border border-redwood-border rounded-lg text-sm text-redwood-text focus:border-redwood-focus-ring focus:outline-none focus:ring-2 focus:ring-redwood-focus-ring/20 transition-all';

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Inclusive list of calendar days between two ISO dates. */
function sprintDays(start?: string, end?: string): Date[] {
  if (!start || !end) return [];
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return [];
  const days: Date[] = [];
  const cur = new Date(s);
  // Cap to a sane horizon to avoid runaway loops on bad data.
  for (let i = 0; i < 365 && cur <= e; i++) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function SprintsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintId, setSprintId] = useState<string>('');
  const [metrics, setMetrics] = useState<SprintMetrics[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Load projects once, default-select first active project.
  useEffect(() => {
    (async () => {
      setLoadingBase(true);
      try {
        const res = await fetch('/api/projects');
        const json = await res.json();
        if (json.success) {
          const list: Project[] = json.data;
          setProjects(list);
          const firstActive = list.find(p => p.status === 'active') || list[0];
          if (firstActive) setProjectId(firstActive.id);
        }
      } catch (e) {
        console.error('Error loading projects:', e);
      } finally {
        setLoadingBase(false);
      }
    })();
  }, []);

  // Load sprints + per-sprint task metrics when project changes.
  const loadProjectData = useCallback(async (pid: string) => {
    if (!pid) { setSprints([]); setMetrics([]); return; }
    setLoadingMetrics(true);
    try {
      const sRes = await fetch(`/api/sprints?projectId=${encodeURIComponent(pid)}`);
      const sJson = await sRes.json();
      const list: Sprint[] = sJson.success ? sJson.data : [];
      setSprints(list);
      // Default sprint selection: active sprint, else most recent.
      setSprintId(prev => {
        if (prev && list.some(s => s.id === prev)) return prev;
        const active = list.find(s => s.status === 'active');
        return active?.id || list[0]?.id || '';
      });

      // Fetch DONE-aware task set per sprint to compute velocity & burndown.
      const results = await Promise.all(list.map(async (sp): Promise<SprintMetrics> => {
        const params = new URLSearchParams({ board: 'true', projectId: pid, sprintId: sp.id });
        const tRes = await fetch(`/api/tasks?${params.toString()}`);
        const tJson = await tRes.json();
        const tasks: Task[] = tJson.success ? tJson.data : [];
        let committed = 0;
        let completed = 0;
        const byStatus: Record<Status, number> = { todo: 0, in_progress: 0, done: 0 };
        for (const t of tasks) {
          const h = t.estimatedHours || 0;
          committed += h;
          byStatus[t.status] = (byStatus[t.status] || 0) + 1;
          if (t.status === 'done') completed += h;
        }
        return { sprint: sp, committed, completed, byStatus };
      }));
      setMetrics(results);
    } catch (e) {
      console.error('Error loading sprint metrics:', e);
      setSprints([]);
      setMetrics([]);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    if (!projectId) return;
    loadProjectData(projectId);
  }, [projectId, loadProjectData]);

  const selected = useMemo(
    () => metrics.find(m => m.sprint.id === sprintId),
    [metrics, sprintId],
  );

  const maxCommitted = useMemo(
    () => Math.max(1, ...metrics.map(m => Math.max(m.committed, m.completed))),
    [metrics],
  );

  const avgVelocity = useMemo(() => {
    const completedSprints = metrics.filter(m => m.sprint.status === 'completed');
    if (completedSprints.length === 0) return 0;
    return Math.round(completedSprints.reduce((s, m) => s + m.completed, 0) / completedSprints.length);
  }, [metrics]);

  return (
    <PageLayout>
      <Header
        title="Reportes de Sprint"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Gestión' }, { label: 'Sprints' }]}
        actions={
          <>
            <select
              className={selectCls}
              value={projectId}
              onChange={e => { setSprintId(''); setProjectId(e.target.value); }}
              disabled={projects.length === 0}
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              className={selectCls}
              value={sprintId}
              onChange={e => setSprintId(e.target.value)}
              disabled={sprints.length === 0}
            >
              {sprints.length === 0 && <option value="">Sin sprints</option>}
              {sprints.map(s => (
                <option key={s.id} value={s.id}>{s.name}{s.status === 'active' ? ' • activo' : ''}</option>
              ))}
            </select>
          </>
        }
      />
      <PageContent>
        {loadingBase ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-[14px] animate-pulse bg-redwood-solid-bg" />)}
            </div>
            <div className="h-72 rounded-[14px] animate-pulse bg-redwood-solid-bg" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Activity className="h-10 w-10 text-redwood-muted opacity-40" />
              <p className="text-sm text-redwood-muted">No hay proyectos.</p>
            </div>
          </Card>
        ) : sprints.length === 0 && !loadingMetrics ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Activity className="h-10 w-10 text-redwood-muted opacity-40" />
              <p className="text-sm text-redwood-muted">Este proyecto no tiene sprints todavía.</p>
              <p className="text-xs text-redwood-muted">Crea sprints desde el Tablero para ver sus reportes.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <KpiStrip selected={selected} avgVelocity={avgVelocity} loading={loadingMetrics} />
            <VelocityChart metrics={metrics} maxCommitted={maxCommitted} selectedId={sprintId} loading={loadingMetrics} onSelect={setSprintId} />
            <BurndownChart selected={selected} loading={loadingMetrics} />
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ── KPIs ── */
function KpiStrip({ selected, avgVelocity, loading }: { selected?: SprintMetrics; avgVelocity: number; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-[14px] animate-pulse bg-redwood-solid-bg" />)}
      </div>
    );
  }

  const committed = selected?.committed || 0;
  const completed = selected?.completed || 0;
  const pct = committed > 0 ? Math.round((completed / committed) * 100) : 0;

  const days = sprintDays(selected?.sprint.startDate, selected?.sprint.endDate);
  let daysLeft: number | null = null;
  if (days.length > 0) {
    const todayKey = dayKey(new Date());
    const remaining = days.filter(d => dayKey(d) >= todayKey).length;
    daysLeft = remaining;
  }

  const st = selected?.byStatus || { todo: 0, in_progress: 0, done: 0 };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={<Target className="h-5 w-5" />} label="Horas comprometidas" value={`${committed}h`} />
      <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Horas completadas" value={`${completed}h`} accent />
      <StatCard icon={<Percent className="h-5 w-5" />} label="% completado" value={`${pct}%`} accent />
      <StatCard
        icon={<CalendarClock className="h-5 w-5" />}
        label="Días restantes"
        value={daysLeft === null ? '—' : `${daysLeft}`}
        danger={daysLeft !== null && daysLeft === 0}
      />
      <div className="col-span-2 lg:col-span-4">
        <Card>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <CircleDashed className="h-4 w-4 text-redwood-muted" />
              <span className="text-sm text-redwood-muted">Por hacer</span>
              <span className="text-sm font-bold text-redwood-text">{st.todo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-redwood-primary" />
              <span className="text-sm text-redwood-muted">En progreso</span>
              <span className="text-sm font-bold text-redwood-text">{st.in_progress}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-redwood-green" />
              <span className="text-sm text-redwood-muted">Hecho</span>
              <span className="text-sm font-bold text-redwood-text">{st.done}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-redwood-muted">
              <TrendingUp className="h-3.5 w-3.5" />
              Velocidad promedio (sprints completados): <span className="font-bold text-redwood-text">{avgVelocity}h</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent, danger }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean; danger?: boolean }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-redwood-muted uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${danger ? 'text-redwood-danger' : accent ? 'text-redwood-primary' : 'text-redwood-text'}`}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-redwood-page flex items-center justify-center text-redwood-muted">{icon}</div>
      </div>
    </Card>
  );
}

/* ── Velocity (completed vs committed per sprint) ── */
function VelocityChart({ metrics, maxCommitted, selectedId, loading, onSelect }: {
  metrics: SprintMetrics[];
  maxCommitted: number;
  selectedId: string;
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-redwood-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-redwood-primary" />
          <h3 className="text-base font-semibold text-redwood-text">Velocity</h3>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-redwood-muted">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-redwood-primary" />Completado</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-redwood-page border border-redwood-border" />Comprometido</span>
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-56 rounded-xl animate-pulse bg-redwood-solid-bg" />
        ) : metrics.length === 0 ? (
          <p className="py-12 text-center text-sm text-redwood-muted">Sin datos de velocidad.</p>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex items-end gap-6 min-h-[224px]" style={{ minWidth: `${metrics.length * 88}px` }}>
              {metrics.map(m => {
                const committedPct = (m.committed / maxCommitted) * 100;
                const completedPct = (m.completed / maxCommitted) * 100;
                const isSel = m.sprint.id === selectedId;
                return (
                  <button
                    key={m.sprint.id}
                    onClick={() => onSelect(m.sprint.id)}
                    className="flex-1 min-w-[72px] flex flex-col items-center gap-2 group"
                    title={`${m.sprint.name}: ${m.completed}h de ${m.committed}h`}
                  >
                    <div className="relative w-full h-44 flex items-end justify-center">
                      {/* committed (background) */}
                      <div
                        className="absolute bottom-0 w-12 rounded-t-md bg-redwood-page border border-redwood-border"
                        style={{ height: `${committedPct}%` }}
                      />
                      {/* completed (foreground) */}
                      <div
                        className={`absolute bottom-0 w-12 rounded-t-md transition-colors ${isSel ? 'bg-redwood-primary' : 'bg-redwood-primary/70 group-hover:bg-redwood-primary'}`}
                        style={{ height: `${completedPct}%` }}
                      />
                      <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-semibold text-redwood-text">
                        {m.completed}/{m.committed}h
                      </span>
                    </div>
                    <span className={`text-[11px] font-medium truncate max-w-[80px] ${isSel ? 'text-redwood-primary' : 'text-redwood-muted'}`}>
                      {m.sprint.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Burndown (ideal line + current remaining marker) ── */
function BurndownChart({ selected, loading }: { selected?: SprintMetrics; loading: boolean }) {
  const W = 720;
  const H = 260;
  const PAD = { top: 20, right: 24, bottom: 36, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const committed = selected?.committed || 0;
  const completed = selected?.completed || 0;
  const remaining = Math.max(0, committed - completed);
  const days = sprintDays(selected?.sprint.startDate, selected?.sprint.endDate);

  // Index of "today" within the sprint window (clamped to [0, n-1]).
  const todayIdx = useMemo(() => {
    if (days.length === 0) return -1;
    const todayKey = dayKey(new Date());
    let idx = days.findIndex(d => dayKey(d) === todayKey);
    if (idx === -1) {
      // before sprint -> 0; after sprint -> last day
      idx = todayKey < dayKey(days[0]) ? 0 : days.length - 1;
    }
    return idx;
  }, [days]);

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-redwood-border">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-redwood-primary" />
          <h3 className="text-base font-semibold text-redwood-text">Burndown</h3>
          {selected && <span className="text-xs text-redwood-muted">· {selected.sprint.name}</span>}
        </div>
        <div className="flex items-center gap-4 text-[11px] text-redwood-muted">
          <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 bg-redwood-muted" />Ideal</span>
          <span className="inline-flex items-center gap-1.5"><Flag className="h-3 w-3 text-redwood-primary" />Remanente actual</span>
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-64 rounded-xl animate-pulse bg-redwood-solid-bg" />
        ) : !selected ? (
          <p className="py-12 text-center text-sm text-redwood-muted">Selecciona un sprint para ver su burndown.</p>
        ) : days.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-redwood-muted">Este sprint no tiene fechas de inicio/fin definidas.</p>
            <p className="text-xs text-redwood-muted mt-1">
              Remanente actual: <span className="font-bold text-redwood-text">{remaining}h</span> de {committed}h comprometidas.
            </p>
          </div>
        ) : (() => {
          const n = days.length;
          const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
          const yMax = Math.max(1, committed);
          const y = (v: number) => PAD.top + (1 - v / yMax) * plotH;

          // Ideal line: committed -> 0 across the sprint.
          const idealPts = days.map((_, i) => `${x(i)},${y(committed * (1 - (n <= 1 ? 1 : i / (n - 1))))}`).join(' ');

          // Gridlines (4 horizontal).
          const grid = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: Math.round(yMax * (1 - f)), yy: PAD.top + f * plotH }));

          const markerX = x(todayIdx >= 0 ? todayIdx : n - 1);
          const markerY = y(remaining);

          // Tick labels: show first, middle, last day.
          const tickIdx = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];

          return (
            <>
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Gráfico burndown del sprint">
                  {/* grid */}
                  {grid.map((g, i) => (
                    <g key={i}>
                      <line x1={PAD.left} y1={g.yy} x2={W - PAD.right} y2={g.yy} stroke="var(--redwood-border, #e2e2e2)" strokeWidth={1} strokeDasharray="3 3" />
                      <text x={PAD.left - 8} y={g.yy + 3} textAnchor="end" className="fill-redwood-muted" fontSize={10}>{g.v}</text>
                    </g>
                  ))}
                  {/* x ticks */}
                  {tickIdx.map(i => (
                    <text key={i} x={x(i)} y={H - PAD.bottom + 16} textAnchor="middle" className="fill-redwood-muted" fontSize={10}>
                      {days[i].toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}
                    </text>
                  ))}
                  {/* ideal line */}
                  <polyline points={idealPts} fill="none" stroke="var(--redwood-muted, #6b7280)" strokeWidth={2} strokeDasharray="5 4" />
                  {/* today vertical line */}
                  <line x1={markerX} y1={PAD.top} x2={markerX} y2={H - PAD.bottom} stroke="var(--redwood-primary, #4f46e5)" strokeWidth={1} strokeOpacity={0.35} />
                  {/* current remaining marker */}
                  <circle cx={markerX} cy={markerY} r={5} className="fill-redwood-primary" stroke="var(--redwood-surface, #fff)" strokeWidth={2} />
                  <text x={markerX} y={markerY - 10} textAnchor="middle" className="fill-redwood-text" fontSize={11} fontWeight={700}>{remaining}h</text>
                  {/* axes */}
                  <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="var(--redwood-border, #e2e2e2)" strokeWidth={1} />
                  <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="var(--redwood-border, #e2e2e2)" strokeWidth={1} />
                </svg>
              </div>
              <p className="mt-2 text-xs text-redwood-muted">
                La línea ideal baja de {committed}h a 0 a lo largo del sprint. El marcador muestra el remanente actual ({remaining}h);
                sin historial diario, no se traza la curva real día a día.
              </p>
            </>
          );
        })()}
      </div>
    </Card>
  );
}
