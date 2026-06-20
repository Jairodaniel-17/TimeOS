'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import {
  Target, Plus, ChevronDown, ChevronRight, Trash2, Link2, Waves, Swords,
  TrendingUp, ListChecks, X, Check,
} from 'lucide-react';
import { PermissionGate, usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import type {
  ObjectiveWithDetails, KeyResultWithScore, Initiative, OkrLevel,
  StrategicTheme, Confidence, User, Project,
} from '@/types';

const LEVEL_LABELS: Record<OkrLevel, string> = { company: 'Empresa', team: 'Equipo', individual: 'Individual' };
const THEME_LABELS: Record<StrategicTheme, string> = {
  blue_ocean: 'Océano Azul', red_ocean: 'Océano Rojo', growth: 'Crecimiento',
  efficiency: 'Eficiencia', customer: 'Cliente', none: 'Sin tema',
};
const CONFIDENCE: Record<Confidence, { label: string; cls: string }> = {
  on_track: { label: 'En camino', cls: 'bg-badge-subtle-success-bg text-redwood-green' },
  at_risk: { label: 'En riesgo', cls: 'bg-badge-subtle-warning-bg text-redwood-warning' },
  off_track: { label: 'Desviado', cls: 'bg-badge-subtle-danger-bg text-redwood-danger' },
};

const inputCls = 'w-full h-10 px-3 bg-redwood-surface border border-redwood-border rounded-lg text-sm text-redwood-text focus:border-redwood-focus-ring focus:outline-none focus:ring-2 focus:ring-redwood-focus-ring/20 transition-all';
const labelCls = 'block text-xs font-medium mb-1 text-redwood-muted';

function progressColor(pct: number): string {
  if (pct >= 70) return 'bg-redwood-green';
  if (pct >= 40) return 'bg-redwood-primary';
  if (pct > 0) return 'bg-redwood-warning';
  return 'bg-redwood-danger';
}

export default function OkrsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('okrs:manage');

  const [objectives, setObjectives] = useState<ObjectiveWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'tree'>('list');
  const [levelFilter, setLevelFilter] = useState<'all' | OkrLevel>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [okrsRes, usersRes, projectsRes] = await Promise.all([
        fetch('/api/okrs'),
        fetch('/api/users'),
        fetch('/api/projects'),
      ]);
      const [okrs, us, pr] = await Promise.all([okrsRes.json(), usersRes.json(), projectsRes.json()]);
      if (okrs.success) {
        setObjectives(okrs.data);
        // Auto-expand company objectives on first load.
        setExpanded(prev => prev.size === 0 ? new Set(okrs.data.filter((o: ObjectiveWithDetails) => o.level === 'company').map((o: ObjectiveWithDetails) => o.id)) : prev);
      }
      if (us.success) setUsers(us.data);
      if (pr.success) setProjects(pr.data);
    } catch (e) {
      console.error('Error loading OKRs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const userName = useCallback((id?: string) => users.find(u => u.id === id)?.name || '—', [users]);
  const projectName = useCallback((id?: string) => projects.find(p => p.id === id)?.name, [projects]);

  const filtered = useMemo(
    () => objectives.filter(o => levelFilter === 'all' || o.level === levelFilter),
    [objectives, levelFilter],
  );

  const stats = useMemo(() => {
    const total = objectives.length;
    const avg = total ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / total) : 0;
    const atRisk = objectives.filter(o => o.status === 'at_risk' || o.status === 'behind').length;
    const krs = objectives.reduce((s, o) => s + o.keyResults.length, 0);
    return { total, avg, atRisk, krs };
  }, [objectives]);

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const deleteObjective = async (id: string) => {
    if (!confirm('¿Eliminar este objetivo y todos sus resultados clave e iniciativas?')) return;
    await fetch(`/api/okrs/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // Build alignment tree (parent -> children). The tree view ignores the level
  // filter so the full hierarchy stays coherent.
  const roots = useMemo(() => objectives.filter(o => !o.parentId || !objectives.some(p => p.id === o.parentId)), [objectives]);
  const childrenOf = useCallback((id: string) => objectives.filter(o => o.parentId === id), [objectives]);

  const renderNode = (o: ObjectiveWithDetails, depth = 0): React.ReactNode => {
    const kids = childrenOf(o.id);
    return (
      <div key={o.id}>
        <ObjectiveCard
          objective={o} expanded={expanded.has(o.id)} onToggle={() => toggle(o.id)}
          canManage={canManage} users={users} projects={projects} userName={userName} projectName={projectName}
          onChanged={fetchData} onDelete={() => deleteObjective(o.id)} userId={user?.id} nested={depth > 0}
        />
        {kids.length > 0 && (
          <div className="ml-6 mt-3 pl-4 border-l-2 border-redwood-border space-y-3">
            {kids.map(c => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageLayout>
      <Header
        title="OKRs"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Estrategia' }, { label: 'OKRs' }]}
        actions={
          <PermissionGate permission="okrs:manage">
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
              Nuevo objetivo
            </Button>
          </PermissionGate>
        }
      />
      <PageContent>
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Target className="h-5 w-5" />} label="Objetivos" value={stats.total} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Progreso promedio" value={`${stats.avg}%`} accent />
          <StatCard icon={<ListChecks className="h-5 w-5" />} label="Resultados clave" value={stats.krs} />
          <StatCard icon={<Swords className="h-5 w-5" />} label="En riesgo" value={stats.atRisk} danger={stats.atRisk > 0} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 bg-redwood-page rounded-[12px] p-1">
            {(['all', 'company', 'team', 'individual'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className={`px-3 py-1.5 text-sm rounded-[9px] transition-colors ${levelFilter === l ? 'bg-redwood-surface text-redwood-text shadow-sm font-medium' : 'text-redwood-muted hover:text-redwood-text'}`}
              >
                {l === 'all' ? 'Todos' : LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-redwood-page rounded-[12px] p-1">
            {(['list', 'tree'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm rounded-[9px] transition-colors ${view === v ? 'bg-redwood-surface text-redwood-text shadow-sm font-medium' : 'text-redwood-muted hover:text-redwood-text'}`}
              >
                {v === 'list' ? 'Lista' : 'Alineación'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map(i => <div key={i} className="h-28 rounded-[14px] animate-pulse bg-redwood-solid-bg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Target className="h-10 w-10 text-redwood-muted opacity-40" />
              <p className="text-sm text-redwood-muted">No hay objetivos todavía.</p>
              {canManage && <Button variant="subtle" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Crear el primero</Button>}
            </div>
          </Card>
        ) : view === 'list' ? (
          <div className="space-y-4">
            {filtered.map(o => (
              <ObjectiveCard
                key={o.id} objective={o} expanded={expanded.has(o.id)} onToggle={() => toggle(o.id)}
                canManage={canManage} users={users} projects={projects} userName={userName} projectName={projectName}
                onChanged={fetchData} onDelete={() => deleteObjective(o.id)} userId={user?.id}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {roots.map(o => renderNode(o))}
          </div>
        )}
      </PageContent>

      {showCreate && (
        <CreateObjectiveModal
          users={users} objectives={objectives} defaultOwner={user?.id}
          onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchData(); }}
        />
      )}
    </PageLayout>
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

function ThemeTag({ theme }: { theme: StrategicTheme }) {
  if (theme === 'none') return null;
  const isBlue = theme === 'blue_ocean';
  const isRed = theme === 'red_ocean';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
      isBlue ? 'bg-badge-subtle-info-bg text-redwood-primary' : isRed ? 'bg-badge-subtle-danger-bg text-redwood-danger' : 'bg-redwood-page text-redwood-muted'
    }`}>
      {isBlue && <Waves className="h-3 w-3" />}{isRed && <Swords className="h-3 w-3" />}
      {THEME_LABELS[theme]}
    </span>
  );
}

interface CardProps {
  objective: ObjectiveWithDetails; expanded: boolean; onToggle: () => void; canManage: boolean;
  users: User[]; projects: Project[]; userName: (id?: string) => string; projectName: (id?: string) => string | undefined;
  onChanged: () => void; onDelete: () => void; userId?: string; nested?: boolean;
}

function ObjectiveCard({ objective: o, expanded, onToggle, canManage, projects, userName, projectName, onChanged, onDelete }: CardProps) {
  const [addingKr, setAddingKr] = useState(false);
  return (
    <Card padding="none">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <button onClick={onToggle} className="mt-0.5 text-redwood-muted hover:text-redwood-text">
            {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-redwood-page text-redwood-muted">{LEVEL_LABELS[o.level]}</span>
              <ThemeTag theme={o.strategicTheme} />
              {o.type === 'aspirational' && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-badge-subtle-info-bg text-redwood-primary">Aspiracional</span>}
              <span className="text-xs text-redwood-muted">{o.period}</span>
            </div>
            <h3 className="text-base font-semibold text-redwood-text">{o.title}</h3>
            {o.description && <p className="text-sm text-redwood-muted mt-0.5">{o.description}</p>}
            <p className="text-xs text-redwood-muted mt-1">Responsable: {userName(o.ownerId)} · {o.keyResults.length} KR · {o.initiatives.length} iniciativas</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-lg font-bold text-redwood-text">{o.progress}%</div>
              <div className="w-24 h-2 bg-redwood-page rounded-full overflow-hidden mt-1">
                <div className={`h-full rounded-full ${progressColor(o.progress)}`} style={{ width: `${o.progress}%` }} />
              </div>
            </div>
            {canManage && (
              <button onClick={onDelete} className="p-2 text-redwood-muted hover:text-redwood-danger hover:bg-badge-subtle-danger-bg rounded-lg transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-redwood-border px-5 py-4 space-y-3 bg-redwood-page/40">
          {o.keyResults.length === 0 && <p className="text-sm text-redwood-muted">Sin resultados clave.</p>}
          {o.keyResults.map(kr => (
            <KeyResultRow key={kr.id} kr={kr} canManage={canManage} projectName={projectName} onChanged={onChanged} />
          ))}

          {o.initiatives.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-redwood-muted mb-2">Iniciativas</p>
              <div className="space-y-1.5">
                {o.initiatives.map(it => (
                  <InitiativeRow key={it.id} it={it} canManage={canManage} projectName={projectName} onChanged={onChanged} />
                ))}
              </div>
            </div>
          )}

          {canManage && (
            <div className="pt-1">
              {addingKr ? (
                <AddKeyResultForm objectiveId={o.id} projects={projects} onDone={() => { setAddingKr(false); onChanged(); }} onCancel={() => setAddingKr(false)} />
              ) : (
                <button onClick={() => setAddingKr(true)} className="inline-flex items-center gap-1.5 text-sm text-redwood-primary hover:underline">
                  <Plus className="h-4 w-4" /> Agregar resultado clave
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function KeyResultRow({ kr, canManage, projectName, onChanged }: { kr: KeyResultWithScore; canManage: boolean; projectName: (id?: string) => string | undefined; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(kr.currentValue));
  const [confidence, setConfidence] = useState<Confidence>(kr.confidence);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const pct = Math.round(kr.score * 100);
  const conf = CONFIDENCE[kr.confidence];

  const save = async () => {
    setSaving(true);
    await fetch('/api/key-results', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: kr.id, currentValue: Number(value), confidence, lastCheckinNote: note || undefined }),
    });
    setSaving(false); setEditing(false); onChanged();
  };
  const remove = async () => {
    if (!confirm('¿Eliminar este resultado clave?')) return;
    await fetch(`/api/key-results?id=${kr.id}`, { method: 'DELETE' });
    onChanged();
  };

  return (
    <div className="bg-redwood-surface border border-redwood-border rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-redwood-text">{kr.title}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${conf.cls}`}>{conf.label}</span>
            {kr.projectId && <span className="inline-flex items-center gap-1 text-[11px] text-redwood-muted"><Link2 className="h-3 w-3" />{projectName(kr.projectId) || 'Proyecto'}</span>}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 h-2 bg-redwood-page rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-redwood-muted whitespace-nowrap">
              {kr.type === 'binary' ? (kr.currentValue >= kr.targetValue ? 'Hecho' : 'Pendiente') : `${kr.currentValue}${kr.unit || ''} / ${kr.targetValue}${kr.unit || ''}`}
            </span>
            <span className="text-xs font-bold text-redwood-text w-10 text-right">{pct}%</span>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-1">
            <Button variant="subtle" size="compact" onClick={() => setEditing(e => !e)}>Check-in</Button>
            <button onClick={remove} className="p-1.5 text-redwood-muted hover:text-redwood-danger rounded"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-redwood-border grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <div>
            <label className={labelCls}>Valor actual{kr.unit ? ` (${kr.unit})` : ''}</label>
            <input type="number" className={inputCls} value={value} onChange={e => setValue(e.target.value)} step="any" />
          </div>
          <div>
            <label className={labelCls}>Confianza</label>
            <select className={inputCls} value={confidence} onChange={e => setConfidence(e.target.value as Confidence)}>
              <option value="on_track">En camino</option>
              <option value="at_risk">En riesgo</option>
              <option value="off_track">Desviado</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Nota (opcional)" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <Button variant="subtle" size="compact" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button variant="primary" size="compact" loading={saving} icon={<Check className="h-3.5 w-3.5" />} onClick={save}>Guardar check-in</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InitiativeRow({ it, canManage, projectName, onChanged }: { it: Initiative; canManage: boolean; projectName: (id?: string) => string | undefined; onChanged: () => void }) {
  const cycle = async () => {
    const next = it.status === 'todo' ? 'in_progress' : it.status === 'in_progress' ? 'done' : 'todo';
    await fetch('/api/initiatives', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, status: next }) });
    onChanged();
  };
  const dot = it.status === 'done' ? 'bg-redwood-green' : it.status === 'in_progress' ? 'bg-redwood-primary' : 'bg-redwood-muted';
  return (
    <div className="flex items-center gap-2 text-sm">
      <button disabled={!canManage} onClick={cycle} className={`w-2.5 h-2.5 rounded-full ${dot} ${canManage ? 'cursor-pointer' : ''}`} title={it.status} />
      <span className={`${it.status === 'done' ? 'line-through text-redwood-muted' : 'text-redwood-text'}`}>{it.title}</span>
      {it.projectId && <span className="inline-flex items-center gap-1 text-[11px] text-redwood-muted"><Link2 className="h-3 w-3" />{projectName(it.projectId) || 'Proyecto'}</span>}
    </div>
  );
}

function AddKeyResultForm({ objectiveId, projects, onDone, onCancel }: { objectiveId: string; projects: Project[]; onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'metric' | 'binary'>('metric');
  const [unit, setUnit] = useState('');
  const [start, setStart] = useState('0');
  const [target, setTarget] = useState('100');
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await fetch('/api/key-results', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objectiveId, title, type, unit: unit || undefined,
        startValue: Number(start), targetValue: type === 'binary' ? 1 : Number(target),
        currentValue: Number(start), projectId: projectId || undefined,
      }),
    });
    setSaving(false); onDone();
  };

  return (
    <div className="bg-redwood-surface border border-redwood-border rounded-lg p-3 space-y-2">
      <input className={inputCls} placeholder="Resultado clave (ej. Aumentar NPS de 30 a 50)" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <select className={inputCls} value={type} onChange={e => setType(e.target.value as 'metric' | 'binary')}>
          <option value="metric">Métrico</option>
          <option value="binary">Binario</option>
        </select>
        {type === 'metric' && <>
          <input className={inputCls} placeholder="Unidad (%, $)" value={unit} onChange={e => setUnit(e.target.value)} />
          <input className={inputCls} type="number" placeholder="Inicio" value={start} onChange={e => setStart(e.target.value)} />
          <input className={inputCls} type="number" placeholder="Meta" value={target} onChange={e => setTarget(e.target.value)} />
        </>}
        <select className={inputCls} value={projectId} onChange={e => setProjectId(e.target.value)}>
          <option value="">Vincular proyecto…</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="subtle" size="compact" icon={<X className="h-3.5 w-3.5" />} onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" size="compact" loading={saving} icon={<Plus className="h-3.5 w-3.5" />} onClick={save}>Agregar KR</Button>
      </div>
    </div>
  );
}

function CreateObjectiveModal({ users, objectives, defaultOwner, onClose, onCreated }: { users: User[]; objectives: ObjectiveWithDetails[]; defaultOwner?: string; onClose: () => void; onCreated: () => void }) {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  const [form, setForm] = useState({
    title: '', description: '', level: 'company' as OkrLevel, ownerId: defaultOwner || users[0]?.id || '',
    period: `Q${q} ${now.getFullYear()}`, periodType: 'quarterly' as 'quarterly' | 'annual',
    type: 'aspirational' as 'aspirational' | 'committed', strategicTheme: 'none' as StrategicTheme, parentId: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim() || !form.ownerId) return;
    setSaving(true);
    await fetch('/api/okrs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, parentId: form.parentId || undefined }),
    });
    setSaving(false); onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-redwood-text">Nuevo objetivo</h3>
          <button onClick={onClose} className="p-1.5 text-redwood-muted hover:text-redwood-text rounded-lg hover:bg-redwood-hover-bg"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Objetivo</label>
            <input className={inputCls} placeholder="Ej. Convertirnos en el referente de gestión de tiempos en LATAM" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <input className={inputCls} placeholder="Contexto del objetivo (opcional)" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nivel</label>
              <select className={inputCls} value={form.level} onChange={e => set('level', e.target.value)}>
                <option value="company">Empresa</option>
                <option value="team">Equipo</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Responsable</label>
              <select className={inputCls} value={form.ownerId} onChange={e => set('ownerId', e.target.value)}>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Periodo</label>
              <input className={inputCls} value={form.period} onChange={e => set('period', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Cadencia</label>
              <select className={inputCls} value={form.periodType} onChange={e => set('periodType', e.target.value)}>
                <option value="quarterly">Trimestral</option>
                <option value="annual">Anual</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="aspirational">Aspiracional (meta 70%)</option>
                <option value="committed">Comprometido (meta 100%)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tema estratégico</label>
              <select className={inputCls} value={form.strategicTheme} onChange={e => set('strategicTheme', e.target.value)}>
                <option value="none">Sin tema</option>
                <option value="blue_ocean">Océano Azul</option>
                <option value="red_ocean">Océano Rojo</option>
                <option value="growth">Crecimiento</option>
                <option value="efficiency">Eficiencia</option>
                <option value="customer">Cliente</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Alinear con (objetivo superior)</label>
            <select className={inputCls} value={form.parentId} onChange={e => set('parentId', e.target.value)}>
              <option value="">Ninguno (objetivo raíz)</option>
              {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="subtle" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Crear objetivo</Button>
        </div>
      </Card>
    </div>
  );
}
