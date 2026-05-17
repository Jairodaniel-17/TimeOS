'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, Flag, Diamond } from 'lucide-react';
import { clsx } from 'clsx';

export type ViewMode = 'Day' | 'Week' | 'Month' | 'Quarter';

export interface GanttTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  isEpic?: boolean;
  isMilestone?: boolean;
  parentId?: string;
  dependencies?: string[];
  assignee?: string;
  project?: string;
  baselineStart?: string;
  baselineEnd?: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
  viewMode?: ViewMode;
  onTaskClick?: (task: GanttTask) => void;
  onTaskDblClick?: (task: GanttTask) => void;
  onDateChange?: (task: GanttTask, newStartDate: string, newEndDate: string) => void;
}

// ── Constants ────────────────────────────────────────────────
const ROW_H = 40;
const HEADER_H = 56;
const LEFT_W = 300;
const INDENT_W = 18;
const MAX_VISIBLE_H = 560;

const CELL_W: Record<ViewMode, number> = {
  Day: 36,
  Week: 26,
  Month: 18,
  Quarter: 10,
};

// ── Helpers ──────────────────────────────────────────────────
function parseDate(s: string): Date {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

function floorDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function daysPerCell(mode: ViewMode): number {
  if (mode === 'Day')     return 1;
  if (mode === 'Week')    return 7;
  if (mode === 'Month')   return 30;
  return 91;
}

function cellLabel(d: Date, mode: ViewMode): string {
  if (mode === 'Day')     return d.getDate().toString();
  if (mode === 'Week')    return `S${weekNum(d)}`;
  if (mode === 'Month')   return d.toLocaleString('es', { month: 'short' });
  return `Q${Math.floor(d.getMonth() / 3) + 1}`;
}

function groupLabel(d: Date, mode: ViewMode): string {
  if (mode === 'Day')   return d.toLocaleString('es', { month: 'long', year: 'numeric' });
  if (mode === 'Week')  return `${d.toLocaleString('es', { month: 'short' })} ${d.getFullYear()}`;
  return d.getFullYear().toString();
}

function weekNum(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((diffDays(start, d) + start.getDay() + 1) / 7);
}

// ── Status → colors (CSS vars for dark mode) ─────────────────
const STATUS = {
  todo:        { bg: 'var(--bg-hover)',            progress: 'var(--text-tertiary)',  border: 'var(--border-default)',  text: 'var(--text-secondary)' },
  in_progress: { bg: 'var(--color-primary-muted)', progress: 'var(--color-primary)',  border: 'var(--color-primary)',   text: 'var(--color-primary)' },
  done:        { bg: 'var(--color-success-light)', progress: 'var(--color-success)',  border: 'var(--color-success)',   text: 'var(--color-success)' },
} as Record<string, { bg: string; progress: string; border: string; text: string }>;

const PRIORITY_DOT: Record<string, string> = {
  high:   'var(--color-error)',
  medium: 'var(--color-warning)',
  low:    'var(--text-tertiary)',
};

// ── Build columns ─────────────────────────────────────────────
function buildCells(start: Date, end: Date, mode: ViewMode): Date[] {
  const cells: Date[] = [];
  const step = daysPerCell(mode);
  let cur = floorDay(start);
  const fin = floorDay(addDays(end, step));
  while (cur <= fin) { cells.push(cur); cur = addDays(cur, step); }
  return cells;
}

// ── Group header segments ─────────────────────────────────────
function buildGroups(cells: Date[], cw: number, mode: ViewMode) {
  type Group = { label: string; x: number; w: number };
  const groups: Group[] = [];
  let cur: string | null = null;
  let gx = 0; let gw = 0;
  cells.forEach((d, i) => {
    const lbl = groupLabel(d, mode);
    if (lbl !== cur) {
      if (cur !== null) groups.push({ label: cur, x: gx, w: gw });
      gx = i * cw; gw = cw; cur = lbl;
    } else { gw += cw; }
  });
  if (cur) groups.push({ label: cur, x: gx, w: gw });
  return groups;
}

// ── Component ─────────────────────────────────────────────────
function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function GanttChart({ tasks, viewMode = 'Week', onTaskClick, onTaskDblClick, onDateChange }: GanttChartProps) {
  const headerRef  = useRef<HTMLDivElement>(null);
  const leftRef    = useRef<HTMLDivElement>(null);
  const mainRef    = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hovered,   setHovered]   = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    taskId: string;
    startX: number;
    origStart: Date;
    origEnd: Date;
  } | null>(null);
  const [dragDx, setDragDx] = useState(0);
  const today = useMemo(() => floorDay(new Date()), []);

  // ── Date range ────────────────────────────────────────────
  const { minDate, maxDate } = useMemo(() => {
    if (!tasks.length) return { minDate: addDays(today, -14), maxDate: addDays(today, 45) };
    const starts = tasks.map(t => parseDate(t.startDate));
    const ends   = tasks.map(t => parseDate(t.endDate));
    const min = new Date(Math.min(...starts.map(d => d.getTime())));
    const max = new Date(Math.max(...ends.map(d => d.getTime())));
    return { minDate: addDays(floorDay(min), -7), maxDate: addDays(floorDay(max), 14) };
  }, [tasks, today]);

  const cw = CELL_W[viewMode];
  const step = daysPerCell(viewMode);
  const cells = useMemo(() => buildCells(minDate, maxDate, viewMode), [minDate, maxDate, viewMode]);
  const groups = useMemo(() => buildGroups(cells, cw, viewMode), [cells, cw, viewMode]);
  const totalW = cells.length * cw;

  // ── Today x ──────────────────────────────────────────────
  const todayX = (diffDays(minDate, today) / step) * cw;

  // ── Visible tasks ─────────────────────────────────────────
  const visible = useMemo(() => {
    return tasks.filter(t => {
      if (!t.parentId) return true;
      return !collapsed.has(t.parentId);
    });
  }, [tasks, collapsed]);

  const hasChildren = useCallback((id: string) => tasks.some(t => t.parentId === id), [tasks]);

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Bar geometry ──────────────────────────────────────────
  const barGeo = useCallback((task: GanttTask) => {
    const s = floorDay(parseDate(task.startDate));
    const e = floorDay(parseDate(task.endDate));
    const x = (diffDays(minDate, s) / step) * cw;
    const w = Math.max(((diffDays(s, e) + 1) / step) * cw, task.isMilestone ? 14 : 6);
    return { x, w };
  }, [minDate, step, cw]);

  // ── Scroll sync ───────────────────────────────────────────
  const onMainScroll = useCallback(() => {
    if (!mainRef.current) return;
    const { scrollLeft, scrollTop } = mainRef.current;
    if (headerRef.current) headerRef.current.scrollLeft = scrollLeft;
    if (leftRef.current)   leftRef.current.scrollTop   = scrollTop;
  }, []);

  // ── Scroll to today on mount ──────────────────────────────
  useEffect(() => {
    if (mainRef.current && todayX > 0) {
      mainRef.current.scrollLeft = Math.max(0, todayX - 200);
    }
  }, [todayX]);

  // ── Drag-to-reschedule ────────────────────────────────────
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => setDragDx(e.clientX - dragging.startX);

    const onUp = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dayOffset = Math.round((dx / cw) * step);
      if (dayOffset !== 0 && onDateChange) {
        const task = tasks.find(t => t.id === dragging.taskId);
        if (task) {
          onDateChange(
            task,
            fmtDate(addDays(dragging.origStart, dayOffset)),
            fmtDate(addDays(dragging.origEnd, dayOffset)),
          );
        }
      }
      setDragging(null);
      setDragDx(0);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [dragging, cw, step, tasks, onDateChange]);

  // ── Layout dimensions ─────────────────────────────────────
  const bodyH = visible.length * ROW_H;
  const totalH = Math.min(bodyH + HEADER_H, MAX_VISIBLE_H);

  return (
    <div
      className="flex flex-col border border-redwood-border rounded-xl overflow-hidden bg-redwood-surface"
      style={{ height: Math.max(totalH, 280) }}
    >
      {/* ══ Top row: fixed headers ═══════════════════════════ */}
      <div className="flex flex-shrink-0 border-b border-redwood-border" style={{ height: HEADER_H }}>
        {/* Left col header */}
        <div
          className="flex-shrink-0 flex items-end px-3 pb-2 bg-redwood-surface-soft border-r border-redwood-border z-20"
          style={{ width: LEFT_W }}
        >
          <span className="text-[11px] font-semibold text-redwood-muted uppercase tracking-wider">Tarea</span>
        </div>
        {/* Timeline header — mirrors main scroll */}
        <div ref={headerRef} className="flex-1 overflow-hidden bg-redwood-surface-soft" style={{ position: 'relative' }}>
          <div style={{ width: totalW, height: HEADER_H, position: 'relative' }}>
            {/* Group labels */}
            {groups.map((g, i) => (
              <div
                key={i}
                className="absolute top-0 flex items-center px-2 border-r border-redwood-border/40"
                style={{ left: g.x, width: g.w, height: 26 }}
              >
                <span className="text-[10px] font-semibold text-redwood-muted uppercase tracking-wide truncate">{g.label}</span>
              </div>
            ))}
            {/* Cell labels */}
            {cells.map((d, i) => {
              const isToday = viewMode === 'Day' && diffDays(today, d) === 0;
              const isWeekend = viewMode === 'Day' && (d.getDay() === 0 || d.getDay() === 6);
              return (
                <div
                  key={i}
                  className={clsx(
                    'absolute flex items-center justify-center text-[10px] border-r border-redwood-border/30',
                    isToday ? 'font-bold text-redwood-primary' : isWeekend ? 'text-redwood-muted/60' : 'text-redwood-muted'
                  )}
                  style={{ left: i * cw, top: 26, width: cw, height: 30 }}
                >
                  {cellLabel(d, viewMode)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ Body row: task list + gantt bars ════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column — scrolls vertically in sync */}
        <div
          ref={leftRef}
          className="flex-shrink-0 overflow-hidden bg-redwood-surface border-r border-redwood-border z-10"
          style={{ width: LEFT_W }}
        >
          <div style={{ height: bodyH }}>
            {visible.map((task, idx) => {
              const depth = task.parentId ? 1 : 0;
              const isHov = hovered === task.id;
              const col = STATUS[task.status] ?? STATUS.todo;
              return (
                <div
                  key={task.id}
                  className={clsx(
                    'flex items-center gap-1 border-b border-redwood-border/50 cursor-pointer select-none transition-colors',
                    isHov ? 'bg-redwood-hover-bg' : idx % 2 === 1 ? 'bg-redwood-surface-soft' : 'bg-redwood-surface'
                  )}
                  style={{ height: ROW_H, paddingLeft: 6 + depth * INDENT_W, paddingRight: 6 }}
                  onMouseEnter={() => setHovered(task.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onTaskClick?.(task)}
                  onDoubleClick={() => onTaskDblClick?.(task)}
                >
                  {/* Expand toggle */}
                  {hasChildren(task.id) ? (
                    <button
                      className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-redwood-muted hover:text-redwood-text"
                      onClick={e => { e.stopPropagation(); toggleCollapse(task.id); }}
                    >
                      {collapsed.has(task.id)
                        ? <ChevronRight className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />}
                    </button>
                  ) : (
                    <span className="w-4 flex-shrink-0" />
                  )}

                  {/* Type icon */}
                  {task.isMilestone ? (
                    <Diamond className="h-3 w-3 flex-shrink-0 text-redwood-warning" />
                  ) : task.isEpic ? (
                    <Flag className="h-3 w-3 flex-shrink-0 text-redwood-primary" />
                  ) : (
                    <span
                      className="flex-shrink-0 w-2 h-2 rounded-sm"
                      style={{ backgroundColor: PRIORITY_DOT[task.priority] ?? 'var(--text-tertiary)' }}
                    />
                  )}

                  {/* Name */}
                  <span
                    className={clsx('text-xs truncate flex-1 mx-1', task.isEpic ? 'font-semibold' : '')}
                    style={{ color: isHov ? 'var(--text-primary)' : task.isEpic ? 'var(--text-primary)' : 'var(--text-primary)' }}
                    title={task.name}
                  >
                    {task.name}
                  </span>

                  {/* Progress */}
                  <span className="text-[10px] text-redwood-muted flex-shrink-0">{task.progress}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel — main scroll (both axes) */}
        <div
          ref={mainRef}
          className="flex-1 overflow-auto"
          onScroll={onMainScroll}
        >
          <div style={{ width: totalW, height: bodyH, position: 'relative' }}>
            {/* ── Row backgrounds ───────────────────────────── */}
            {visible.map((task, idx) => (
              <div
                key={`bg-${task.id}`}
                className={clsx(
                  'absolute left-0 right-0 border-b border-redwood-border/40 transition-colors',
                  hovered === task.id ? 'bg-redwood-hover-bg' : idx % 2 === 1 ? 'bg-redwood-surface-soft/60' : 'bg-transparent'
                )}
                style={{ top: idx * ROW_H, height: ROW_H, width: totalW }}
                onMouseEnter={() => setHovered(task.id)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}

            {/* ── Weekend shading ───────────────────────────── */}
            {viewMode === 'Day' && cells.map((d, i) => {
              if (d.getDay() !== 0 && d.getDay() !== 6) return null;
              return (
                <div
                  key={`wk-${i}`}
                  className="absolute pointer-events-none"
                  style={{ left: i * cw, top: 0, width: cw, height: bodyH, backgroundColor: 'var(--bg-hover)', opacity: 0.45 }}
                />
              );
            })}

            {/* ── Vertical grid lines ───────────────────────── */}
            {cells.map((_, i) => (
              <div
                key={`gl-${i}`}
                className="absolute pointer-events-none"
                style={{ left: i * cw, top: 0, width: 1, height: bodyH, backgroundColor: 'var(--border-default)', opacity: 0.35 }}
              />
            ))}

            {/* ── Today line ────────────────────────────────── */}
            {todayX >= 0 && todayX <= totalW && (
              <div
                className="absolute pointer-events-none z-10"
                style={{ left: todayX + (viewMode === 'Day' ? cw / 2 : 0), top: -4, width: 2, height: bodyH + 4 }}
              >
                <div style={{ position: 'absolute', top: 4, left: 0, width: 2, height: bodyH, backgroundColor: 'var(--color-error)', opacity: 0.65 }} />
                <div style={{ position: 'absolute', top: 4, left: -3, width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-error)', opacity: 0.85 }} />
              </div>
            )}

            {/* ── Baseline bars ─────────────────────────────── */}
            {visible.map((task, idx) => {
              if (!task.baselineStart || !task.baselineEnd) return null;
              const bs = floorDay(parseDate(task.baselineStart));
              const be = floorDay(parseDate(task.baselineEnd));
              const bx = (diffDays(minDate, bs) / step) * cw;
              const bw = Math.max(((diffDays(bs, be) + 1) / step) * cw, 4);
              return (
                <div
                  key={`bl-${task.id}`}
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    left: bx,
                    top: idx * ROW_H + ROW_H * 0.82,
                    width: bw,
                    height: 3,
                    backgroundColor: 'var(--color-warning)',
                    opacity: 0.5,
                  }}
                />
              );
            })}

            {/* ── Task bars ─────────────────────────────────── */}
            {visible.map((task, idx) => {
              const { x, w } = barGeo(task);
              const isDraggingThis = dragging?.taskId === task.id;
              const barX = isDraggingThis ? x + dragDx : x;
              const top = idx * ROW_H;
              const isHov = hovered === task.id;
              const col = STATUS[task.status] ?? STATUS.todo;

              // Milestone diamond
              if (task.isMilestone) {
                const cx = barX + cw / 2;
                const cy = top + ROW_H / 2;
                const r = 8;
                return (
                  <svg
                    key={task.id}
                    className="absolute cursor-grab"
                    style={{ left: cx - r - 1, top: cy - r - 1, width: (r + 1) * 2, height: (r + 1) * 2, overflow: 'visible' }}
                    onClick={() => onTaskClick?.(task)}
                    onDoubleClick={() => onTaskDblClick?.(task)}
                    onMouseDown={e => { e.preventDefault(); setDragging({ taskId: task.id, startX: e.clientX, origStart: parseDate(task.startDate), origEnd: parseDate(task.endDate) }); }}
                  >
                    <polygon
                      points={`${r},0 ${r*2},${r} ${r},${r*2} 0,${r}`}
                      fill="var(--color-warning)"
                      stroke="var(--bg-surface)"
                      strokeWidth={isHov ? 2.5 : 1.5}
                      opacity={isHov ? 1 : 0.9}
                    />
                  </svg>
                );
              }

              // Epic bar (wider, taller, rounded)
              if (task.isEpic) {
                const bh = ROW_H * 0.4;
                return (
                  <div
                    key={task.id}
                    className="absolute cursor-grab overflow-hidden transition-opacity"
                    style={{
                      left: barX, top: top + (ROW_H - bh) / 2,
                      width: Math.max(w, 6), height: bh,
                      backgroundColor: 'var(--color-primary)',
                      borderRadius: 4,
                      opacity: isHov ? 1 : 0.88,
                      boxShadow: isHov ? '0 2px 8px rgba(0,0,0,.2)' : 'none',
                    }}
                    onMouseEnter={() => setHovered(task.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => onTaskClick?.(task)}
                    onDoubleClick={() => onTaskDblClick?.(task)}
                    onMouseDown={e => { e.preventDefault(); setDragging({ taskId: task.id, startX: e.clientX, origStart: parseDate(task.startDate), origEnd: parseDate(task.endDate) }); }}
                    title={`${task.name} · ${task.progress}%`}
                  >
                    <div style={{ width: `${task.progress}%`, height: '100%', backgroundColor: 'rgba(255,255,255,0.28)' }} />
                    {w > 48 && (
                      <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-white truncate">
                        {task.name}
                      </span>
                    )}
                  </div>
                );
              }

              // Normal task bar
              const bh = ROW_H * 0.5;
              return (
                <div
                  key={task.id}
                  className="absolute cursor-grab overflow-hidden transition-shadow"
                  style={{
                    left: barX,
                    top: top + (ROW_H - bh) / 2,
                    width: Math.max(w, 4),
                    height: bh,
                    backgroundColor: col.bg,
                    border: `1.5px solid ${col.border}`,
                    borderRadius: 4,
                    boxShadow: isHov ? '0 2px 8px rgba(0,0,0,.16)' : '0 1px 2px rgba(0,0,0,.06)',
                  }}
                  onMouseEnter={() => setHovered(task.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onTaskClick?.(task)}
                  onDoubleClick={() => onTaskDblClick?.(task)}
                  onMouseDown={e => { e.preventDefault(); setDragging({ taskId: task.id, startX: e.clientX, origStart: parseDate(task.startDate), origEnd: parseDate(task.endDate) }); }}
                  title={`${task.name} · ${task.progress}% · ${task.status}`}
                >
                  {/* Progress fill */}
                  <div
                    style={{
                      width: `${task.progress}%`,
                      height: '100%',
                      backgroundColor: col.progress,
                      opacity: 0.38,
                      borderRadius: '3px 0 0 3px',
                      transition: 'width 0.3s',
                    }}
                  />
                  {/* Label */}
                  {w > 52 && (
                    <span
                      className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium truncate"
                      style={{ color: col.text }}
                    >
                      {task.name}
                    </span>
                  )}
                </div>
              );
            })}

            {/* ── Dependency arrows ─────────────────────────── */}
            <svg
              className="absolute pointer-events-none"
              style={{ left: 0, top: 0, width: totalW, height: bodyH, overflow: 'visible' }}
            >
              <defs>
                <marker id="gantt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0.5 L0,5.5 L5,3 z" fill="var(--border-strong)" />
                </marker>
              </defs>
              {visible.map((task, toIdx) => {
                if (!task.dependencies?.length) return null;
                return task.dependencies.map(depId => {
                  const fromIdx = visible.findIndex(t => t.id === depId);
                  if (fromIdx === -1) return null;
                  const from = visible[fromIdx];
                  const { x: fx, w: fw } = barGeo(from);
                  const { x: tx } = barGeo(task);
                  const x1 = fx + fw;
                  const y1 = fromIdx * ROW_H + ROW_H / 2;
                  const x2 = tx;
                  const y2 = toIdx * ROW_H + ROW_H / 2;
                  const mid = (x1 + x2) / 2;
                  return (
                    <path
                      key={`dep-${task.id}-${depId}`}
                      d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                      fill="none"
                      stroke="var(--border-strong)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      opacity="0.6"
                      markerEnd="url(#gantt-arrow)"
                    />
                  );
                });
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
