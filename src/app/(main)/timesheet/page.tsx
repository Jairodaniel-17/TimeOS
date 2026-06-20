'use client';

import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import {
  Send, Save, Copy, History, Plus, Clock,
  DollarSign, Calendar, ChevronLeft, ChevronRight,
  AlertCircle, Sparkles, Layers, Trash2, FileText, X
} from 'lucide-react';
import type { Project, TimeEntry } from '@/types';
import { getWeekNumber, getCurrentYear, getWeekDates } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const daysKey = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export default function TimesheetPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [weekOffset, setWeekOffset] = useState(0);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [animatingSave, setAnimatingSave] = useState(false);
  const [animatingSubmit, setAnimatingSubmit] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ weekNumber: number; year: number; total: number; entries: number }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { user } = useAuth();

  const weekNumber = getWeekNumber() + weekOffset;
  const year = getCurrentYear();
  const weekDates = useMemo(() => getWeekDates(weekNumber, year), [weekNumber, year]);

  useEffect(() => {
    async function fetchData() {
      try {
        const userIdParam = user ? `&userId=${user.id}` : '';
        const [entriesRes, projectsRes] = await Promise.all([
          fetch(`/api/timesheets?weekNumber=${weekNumber}&year=${year}${userIdParam}`),
          fetch('/api/projects'),
        ]);

        const entriesData = await entriesRes.json();
        const projectsData = await projectsRes.json();

        if (entriesData.success) setEntries(entriesData.data);
        if (projectsData.success) setProjects(projectsData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [weekNumber, year, user]);

  const handleCellChange = useCallback((entryId: string, day: typeof daysKey[number], value: number) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry;
      const newHours = { ...entry.hours, [day]: value };
      const total = Object.values(newHours).reduce((a: number, b: number) => a + b, 0);
      return { ...entry, hours: newHours, total };
    }));
    setHasChanges(true);
  }, []);

  const handleNotesChange = useCallback((entryId: string, value: string) => {
    setEntries(prev => prev.map(entry =>
      entry.id === entryId ? { ...entry, notes: value } : entry
    ));
    setHasChanges(true);
  }, []);

  const toggleExpand = useCallback((entryId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }, []);

  const handleAddRow = () => {
    const newEntry: TimeEntry = {
      id: `new_${Date.now()}`,
      userId: user?.id || '1',
      projectId: '',
      activity: '',
      billable: true,
      weekNumber,
      year,
      hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      total: 0,
      status: 'draft',
    };
    setEntries([...entries, newEntry]);
    setHasChanges(true);
  };

  const handleDeleteRow = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    setHasChanges(true);
  };

  const [copyingWeek, setCopyingWeek] = useState(false);
  const handleCopyWeek = async () => {
    if (!user) return;
    setCopyingWeek(true);
    try {
      // Calculate previous week (handle year boundary)
      let prevWeek = weekNumber - 1;
      let prevYear = year;
      if (prevWeek < 1) { prevWeek = 52; prevYear -= 1; }

      const res = await fetch(`/api/timesheets?userId=${user.id}&weekNumber=${prevWeek}&year=${prevYear}`);
      const data = await res.json();
      if (!data.success || !data.data.length) {
        alert('No hay entradas en la semana anterior para copiar.');
        return;
      }

      const copies: TimeEntry[] = data.data.map((prev: TimeEntry) => ({
        id: `new_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        userId: user.id,
        projectId: prev.projectId,
        activity: prev.activity,
        billable: prev.billable,
        weekNumber,
        year,
        hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
        total: 0,
        status: 'draft' as const,
        project: prev.project,
      }));

      setEntries(prev => [...prev, ...copies]);
      setHasChanges(true);
    } catch (e) {
      console.error('Error copying week:', e);
    } finally {
      setCopyingWeek(false);
    }
  };

  const handleSave = async () => {
    // Validate before saving: a row with hours needs a project and an activity.
    const invalid = entries.filter(e => (e.total > 0 || e.id.startsWith('new_')) && (!e.projectId || !e.activity.trim()));
    if (invalid.length > 0) {
      alert('Cada entrada con horas necesita un proyecto y una actividad antes de guardar.');
      return;
    }

    setSaving(true);
    setAnimatingSave(true);
    try {
      const results = await Promise.all(entries.map(entry => {
        if (entry.id.startsWith('new_')) {
          return fetch('/api/timesheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: entry.userId,
              projectId: entry.projectId,
              activity: entry.activity,
              notes: entry.notes,
              billable: entry.billable,
              weekNumber: entry.weekNumber,
              year: entry.year,
              hours: entry.hours,
            }),
          });
        }
        return fetch('/api/timesheets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: entry.id,
            activity: entry.activity,
            notes: entry.notes,
            hours: entry.hours,
            status: entry.status,
          }),
        });
      }));

      const failed = results.filter(r => !r.ok).length;
      if (failed > 0) {
        alert(`No se pudieron guardar ${failed} de ${results.length} entradas. Revisa los datos e inténtalo de nuevo.`);
        return;
      }

      setHasChanges(false);
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Ocurrió un error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
      setTimeout(() => setAnimatingSave(false), 500);
    }
  };

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const weeks: { weekNumber: number; year: number }[] = [];
      for (let i = 1; i <= 6; i++) {
        let w = weekNumber - i;
        let y = year;
        while (w < 1) { w += 52; y -= 1; }
        weeks.push({ weekNumber: w, year: y });
      }
      const summaries = await Promise.all(weeks.map(async ({ weekNumber: w, year: y }) => {
        const res = await fetch(`/api/timesheets?userId=${user.id}&weekNumber=${w}&year=${y}`);
        const data = await res.json();
        const rows: TimeEntry[] = data.success ? data.data : [];
        return { weekNumber: w, year: y, total: rows.reduce((s, e) => s + e.total, 0), entries: rows.length };
      }));
      setHistory(summaries);
    } catch (e) {
      console.error('Error loading history:', e);
    } finally {
      setHistoryLoading(false);
    }
  }, [user, weekNumber, year]);

  const handleToggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && history.length === 0) loadHistory();
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Debes iniciar sesión para enviar el timesheet');
      return;
    }
    
    const totalHours = entries.reduce((sum, e) => sum + e.total, 0);
    if (totalHours === 0) {
      alert('Debes registrar al menos algunas horas antes de enviar');
      return;
    }
    
    setAnimatingSubmit(true);
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, weekNumber, year, totalHours }),
      });

      if (res.ok) {
        setTimeout(() => window.location.reload(), 800);
      } else {
        alert('Error al enviar timesheet');
        setAnimatingSubmit(false);
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error al enviar timesheet');
      setAnimatingSubmit(false);
    }
  };

  const totalHours = entries.reduce((sum, e) => sum + e.total, 0);
  const totalBillable = entries.filter(e => e.billable).reduce((s, e) => s + e.total, 0);
  const hasErrors = entries.some(e => Object.values(e.hours).some(h => h > 12));
  const maxDailyHours = Math.max(...entries.flatMap(e => Object.values(e.hours)), 0);

  const getProgressColor = () => {
    const targetHours = 40;
    const percentage = (totalHours / targetHours) * 100;
    if (percentage < 50) return 'from-red-400 to-red-600';
    if (percentage < 80) return 'from-yellow-400 to-orange-500';
    if (percentage <= 100) return 'from-emerald-400 to-teal-500';
    return 'from-purple-500 to-pink-600';
  };

  return (
    <PageLayout>
      <Header
        title="Mi Timesheet"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Tiempos' }]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-redwood-page rounded-[14px] p-1">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="p-2 hover:bg-redwood-hover-bg rounded-[10px] transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 text-sm font-medium min-w-[120px] text-center">
                Semana {weekNumber}
              </span>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                className="p-2 hover:bg-redwood-hover-bg rounded-[10px] transition-all duration-200"
                disabled={weekOffset >= 0}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button 
              variant="primary" 
              icon={<Send className={`h-4 w-4 ${animatingSubmit ? 'animate-pulse' : ''}`} />} 
              onClick={handleSubmit}
              disabled={animatingSubmit}
              className={animatingSubmit ? 'bg-redwood-primary' : ''}
            >
              {animatingSubmit ? 'Enviando...' : 'Enviar'}
            </Button>
            <Button 
              variant="subtle" 
              icon={<Save className={`h-4 w-4 ${animatingSave ? 'animate-bounce' : ''}`} />} 
              onClick={handleSave}
              loading={saving}
            >
              {hasChanges ? 'Guardar*' : 'Guardar'}
            </Button>
          </div>
        }
      />

      <PageContent className="p-0 overflow-hidden">
        <div className="relative min-h-screen bg-redwood-page">
          <div className="relative z-10 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="group">
                <div className="relative bg-redwood-surface backdrop-blur-xl border border-redwood-border rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-redwood-muted uppercase tracking-wider">Horas Totales</p>
                      <p className="text-3xl font-bold text-redwood-text mt-1">
                        {totalHours}h
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-redwood-surface rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-redwood-surface rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-redwood-primary rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.min((totalHours / 40) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="relative bg-redwood-surface backdrop-blur-xl border border-redwood-border rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-redwood-muted uppercase tracking-wider">Horas Facturables</p>
                      <p className="text-3xl font-bold text-redwood-text mt-1">
                        {totalBillable}h
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-redwood-surface rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-redwood-muted mt-2">
                    {totalHours > 0 ? Math.round((totalBillable / totalHours) * 100) : 0}% del total
                  </p>
                </div>
              </div>

              <div className="group">
                <div className="relative bg-redwood-surface backdrop-blur-xl border border-redwood-border rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-redwood-muted uppercase tracking-wider">Entradas</p>
                      <p className="text-3xl font-bold text-redwood-text mt-1">
                        {entries.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-redwood-surface rounded-xl flex items-center justify-center shadow-lg">
                      <Layers className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-redwood-muted mt-2">
                    {entries.filter(e => e.projectId).length} con proyecto
                  </p>
                </div>
              </div>

              <div className="group">
                <div className="relative bg-redwood-surface backdrop-blur-xl border border-redwood-border rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-redwood-muted uppercase tracking-wider">Fechas</p>
                      <p className="text-sm font-bold text-redwood-muted mt-1">
                        {weekDates.start} - {weekDates.end}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-redwood-surface rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-redwood-muted mt-2">{year}</p>
                </div>
              </div>
            </div>

            {hasErrors && (
              <div className="relative overflow-hidden">
                <div className="relative flex items-center gap-4 px-6 py-4 bg-redwood-surface backdrop-blur-xl border border-redwood-border rounded-xl shadow-lg">
                  <div className="w-10 h-10 bg-badge-subtle-danger-bg rounded-full flex items-center justify-center animate-pulse">
                    <AlertCircle className="h-5 w-5 text-redwood-danger" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-redwood-danger">Advertencia</p>
                    <p className="text-sm text-redwood-danger">Tienes entradas con más de 12 horas en un día. Considera revisar tu registro.</p>
                  </div>
                </div>
              </div>
            )}

              <div className="relative">
                <div className="relative bg-redwood-surface backdrop-blur-xl border border-redwood-border rounded-2xl shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-redwood-border">
                  <Sparkles className="h-5 w-5 text-redwood-primary animate-pulse" />
                  <span className="text-sm font-medium text-redwood-muted">Registro de Horas</span>
                  {hasChanges && (
                    <span className="px-2 py-0.5 text-xs bg-badge-subtle-warning-bg text-redwood-warning rounded-full animate-pulse">
                      Sin guardar
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-redwood-border border-t-redwood-primary rounded-full animate-spin" />
                      <p className="text-sm text-redwood-muted">Cargando timesheet...</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-redwood-surface/80">
                          <th className="w-12 px-4 py-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-redwood-border text-redwood-primary focus:ring-redwood-focus-ring"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRows(new Set(entries.map(e => e.id)));
                                } else {
                                  setSelectedRows(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-redwood-muted uppercase tracking-wider min-w-[200px]">
                            Proyecto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-redwood-muted uppercase tracking-wider min-w-[180px]">
                            Actividad
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-redwood-muted uppercase tracking-wider w-20">
                            Billable
                          </th>
                          {days.map((day, i) => (
                            <th key={day} className="px-2 py-3 text-center text-xs font-semibold text-redwood-muted uppercase tracking-wider w-16">
                              <div className="flex flex-col">
                                <span>{day}</span>
                                <span className="text-[10px] text-redwood-muted font-normal">
                                  {weekDates.days[i]}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right text-xs font-semibold text-redwood-muted uppercase tracking-wider w-20">
                            Total
                          </th>
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-redwood-border">
                        {entries.map((entry) => (
                          <Fragment key={entry.id}>
                          <tr
                            className={`group transition-all duration-300 hover:bg-redwood-hover-bg ${
                              selectedRows.has(entry.id)
                                ? 'bg-redwood-selected-bg border-l-4 border-l-redwood-primary'
                                : ''
                            } ${hoveredRow === entry.id ? 'bg-redwood-hover-bg' : ''}`}
                            onMouseEnter={() => setHoveredRow(entry.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedRows.has(entry.id)}
                                onChange={() => {
                                  const newSelected = new Set(selectedRows);
                                  if (newSelected.has(entry.id)) {
                                    newSelected.delete(entry.id);
                                  } else {
                                    newSelected.add(entry.id);
                                  }
                                  setSelectedRows(newSelected);
                                }}
                                className="h-4 w-4 rounded border-redwood-border text-redwood-primary focus:ring-redwood-focus-ring"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                className="w-full h-9 px-3 bg-redwood-surface/50 border border-redwood-border rounded-lg text-sm focus:border-redwood-focus-ring focus:outline-none focus:ring-2 focus:ring-redwood-focus-ring/20 transition-all"
                                value={entry.projectId}
                                onChange={(e) => {
                                  setEntries(prev => prev.map(en => 
                                    en.id === entry.id ? { ...en, projectId: e.target.value } : en
                                  ));
                                  setHasChanges(true);
                                }}
                              >
                                <option value="">Seleccionar proyecto...</option>
                                {projects.filter(p => p.status === 'active').map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="w-full h-9 px-3 bg-redwood-surface/50 border border-redwood-border rounded-lg text-sm focus:border-redwood-focus-ring focus:outline-none focus:ring-2 focus:ring-redwood-focus-ring/20 transition-all"
                                value={entry.activity}
                                onChange={(e) => {
                                  setEntries(prev => prev.map(en => 
                                    en.id === entry.id ? { ...en, activity: e.target.value } : en
                                  ));
                                  setHasChanges(true);
                                }}
                                placeholder="¿En qué trabajaste?"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setEntries(prev => prev.map(en => 
                                    en.id === entry.id ? { ...en, billable: !en.billable } : en
                                  ));
                                  setHasChanges(true);
                                }}
                                className={`w-10 h-6 rounded-full transition-all duration-300 ${
                                  entry.billable 
                                    ? 'bg-redwood-primary' 
                                    : 'bg-redwood-surface'
                                }`}
                              >
                                <div className={`w-5 h-5 bg-redwood-surface rounded-full shadow-md transform transition-transform duration-300 ${
                                  entry.billable ? 'translate-x-4' : 'translate-x-0.5'
                                }`} />
                              </button>
                            </td>
                            {daysKey.map((day) => {
                              const value = entry.hours[day];
                              const hasError = value > 12;
                              const isWeekend = day === 'sat' || day === 'sun';
                              return (
                                <td key={day} className="px-1 py-2">
                                  <input
                                    type="number"
                                    className={`w-full h-9 text-center text-sm font-medium border-0 bg-redwood-surface/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all ${
                                      hasError
                                        ? 'text-redwood-danger bg-badge-subtle-danger-bg ring-2 ring-redwood-danger/30'
                                        : isWeekend 
                                        ? 'text-redwood-muted bg-redwood-surface/50' 
                                        : 'text-redwood-muted'
                                    }`}
                                    value={value || ''}
                                    onChange={(e) => handleCellChange(entry.id, day, parseFloat(e.target.value) || 0)}
                                    min={0}
                                    max={24}
                                    step={0.5}
                                  />
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right">
                              <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                                entry.total > 0 
                                  ? 'bg-badge-subtle-info-bg text-redwood-primary'
                                  : 'text-redwood-muted'
                              }`}>
                                {entry.total}h
                              </span>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleExpand(entry.id)}
                                  title={entry.notes ? 'Ver/editar detalle' : 'Agregar detalle de lo que hiciste'}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    entry.notes?.trim()
                                      ? 'text-redwood-primary'
                                      : 'text-redwood-muted opacity-0 group-hover:opacity-100 hover:text-redwood-primary'
                                  } ${expandedRows.has(entry.id) ? 'bg-badge-subtle-info-bg opacity-100' : ''}`}
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRow(entry.id)}
                                  className="p-2 text-redwood-muted hover:text-redwood-danger hover:bg-badge-subtle-danger-bg rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedRows.has(entry.id) && (
                            <tr className="bg-redwood-page/60">
                              <td></td>
                              <td colSpan={11} className="px-4 pb-4 pt-1">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-redwood-muted mb-1.5">
                                  <FileText className="h-3.5 w-3.5" />
                                  ¿Qué hiciste? — detalle del trabajo
                                </label>
                                <textarea
                                  value={entry.notes || ''}
                                  onChange={(e) => handleNotesChange(entry.id, e.target.value)}
                                  rows={2}
                                  placeholder="Describe las tareas realizadas, avances, bloqueos… (visible para tu manager al aprobar)"
                                  className="w-full px-3 py-2 bg-redwood-surface border border-redwood-border rounded-lg text-sm text-redwood-text focus:border-redwood-focus-ring focus:outline-none focus:ring-2 focus:ring-redwood-focus-ring/20 transition-all resize-y"
                                />
                              </td>
                            </tr>
                          )}
                          </Fragment>
                        ))}
                        
                        <tr 
                          className="hover:bg-redwood-hover-bg cursor-pointer group transition-all duration-200"
                          onClick={handleAddRow}
                        >
                          <td colSpan={12} className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2 text-redwood-muted group-hover:text-redwood-primary transition-colors">
                              <Plus className="h-5 w-5" />
                              <span className="text-sm font-medium">Agregar nueva entrada</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-between px-6 py-4 border-t border-redwood-border bg-redwood-surface-soft">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-redwood-muted">Total semana:</span>
                      <span className="text-xl font-bold text-redwood-primary">
                        {totalHours}h
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-redwood-muted">Promedio/día:</span>
                      <span className="text-sm font-semibold text-redwood-muted">
                        {(totalHours / 7).toFixed(1)}h
                      </span>
                    </div>
                    {maxDailyHours > 8 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-badge-subtle-warning-bg text-redwood-warning rounded-full">
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-xs font-medium">Día más largo: {maxDailyHours}h</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status="draft">
                      {hasChanges ? 'Borrador (sin guardar)' : 'Borrador'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleCopyWeek}
                disabled={copyingWeek}
                className="flex items-center gap-2 px-4 py-2 bg-redwood-surface/60 backdrop-blur-lg border border-redwood-border/40 rounded-xl text-sm font-medium text-redwood-muted hover:bg-redwood-surface/80 hover:text-redwood-primary transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="h-4 w-4" />
                {copyingWeek ? 'Copiando...' : 'Duplicar semana'}
              </button>
              <button
                onClick={handleToggleHistory}
                className={`flex items-center gap-2 px-4 py-2 backdrop-blur-lg border rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg ${
                  showHistory
                    ? 'bg-badge-subtle-info-bg border-redwood-primary/40 text-redwood-primary'
                    : 'bg-redwood-surface/60 border-redwood-border/40 text-redwood-muted hover:bg-redwood-surface/80 hover:text-redwood-primary'
                }`}
              >
                <History className="h-4 w-4" />
                Historial
              </button>
            </div>

            {showHistory && (
              <div className="bg-redwood-surface border border-redwood-border rounded-2xl shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-redwood-border">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-redwood-primary" />
                    <span className="text-sm font-medium text-redwood-text">Historial de semanas anteriores</span>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="p-1.5 text-redwood-muted hover:text-redwood-text rounded-lg hover:bg-redwood-hover-bg transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-redwood-muted gap-3">
                    <div className="w-6 h-6 border-2 border-redwood-border border-t-redwood-primary rounded-full animate-spin" />
                    Cargando historial...
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-10 text-center text-sm text-redwood-muted">Sin registros en las semanas anteriores.</div>
                ) : (
                  <div className="divide-y divide-redwood-border">
                    {history.map(h => (
                      <button
                        key={`${h.year}-${h.weekNumber}`}
                        onClick={() => { setWeekOffset(h.weekNumber - getWeekNumber()); setShowHistory(false); }}
                        className="w-full flex items-center justify-between px-6 py-3 hover:bg-redwood-hover-bg transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-redwood-muted" />
                          <span className="text-sm font-medium text-redwood-text">Semana {h.weekNumber}</span>
                          <span className="text-xs text-redwood-muted">{h.year}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-redwood-muted">{h.entries} {h.entries === 1 ? 'entrada' : 'entradas'}</span>
                          <span className="text-sm font-bold text-redwood-primary">{h.total}h</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
