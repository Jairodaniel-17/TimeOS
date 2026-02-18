'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Badge, Card } from '@/components/ui';
import { Send, Save, Copy, Upload, History } from 'lucide-react';
import type { Project, TimeEntry } from '@/types';

const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const daysKey = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export default function TimesheetPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const weekNumber = 8;
  const year = 2025;

  useEffect(() => {
    async function fetchData() {
      try {
        const [entriesRes, projectsRes] = await Promise.all([
          fetch(`/api/timesheets?weekNumber=${weekNumber}&year=${year}`),
          fetch('/api/projects'),
        ]);

        const entriesData = await entriesRes.json();
        const projectsData = await projectsRes.json();

        if (entriesData.success) {
          setEntries(entriesData.data);
        }
        if (projectsData.success) {
          setProjects(projectsData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [weekNumber, year]);

  const handleCellChange = useCallback((entryId: string, day: typeof daysKey[number], value: number) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry;
      const newHours = { ...entry.hours, [day]: value };
      const total = Object.values(newHours).reduce((a: number, b: number) => a + b, 0);
      return { ...entry, hours: newHours, total };
    }));
    setHasChanges(true);
  }, []);

  const handleAddRow = () => {
    const newEntry: TimeEntry = {
      id: `new_${Date.now()}`,
      userId: '1',
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

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const entry of entries) {
        if (entry.id.startsWith('new_')) {
          await fetch('/api/timesheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: entry.userId,
              projectId: entry.projectId,
              activity: entry.activity,
              billable: entry.billable,
              weekNumber: entry.weekNumber,
              year: entry.year,
              hours: entry.hours,
            }),
          });
        } else {
          await fetch('/api/timesheets', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: entry.id,
              activity: entry.activity,
              hours: entry.hours,
              status: entry.status,
            }),
          });
        }
      }
      setHasChanges(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const totalHours = entries.reduce((sum, e) => sum + e.total, 0);
    
    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '1',
        weekNumber,
        year,
        totalHours,
      }),
    });

    alert('Timesheet enviado para aprobación');
  };

  const totalHours = entries.reduce((sum, e) => sum + e.total, 0);
  const hasErrors = entries.some(e => Object.values(e.hours).some(h => h > 12));

  return (
    <PageLayout>
      <Header
        title={`Timesheet - Semana ${weekNumber}`}
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Tiempos' }]}
        actions={
          <>
            <Button variant="primary" icon={<Send className="h-4 w-4" />} onClick={handleSubmit}>
              Enviar para aprobación
            </Button>
            <Button 
              variant="secondary" 
              icon={<Save className="h-4 w-4" />} 
              onClick={handleSave}
              loading={saving}
            >
              {hasChanges ? 'Guardar*' : 'Guardar borrador'}
            </Button>
            <Button variant="ghost" icon={<Copy className="h-4 w-4" />}>Duplicar semana</Button>
            <Button variant="ghost" icon={<Upload className="h-4 w-4" />}>Importar</Button>
            <Button variant="ghost" size="icon" icon={<History className="h-4 w-4" />} />
          </>
        }
      />

      {hasErrors && (
        <div className="flex items-center gap-3 bg-[#FFF4E5] border-b border-[var(--color-warning)] px-4 py-2">
          <span className="text-sm font-medium text-[var(--color-warning)]">
            Tienes entradas con más de 12 horas en un día
          </span>
          <Button variant="ghost" size="compact">Resolver</Button>
        </div>
      )}

      <PageContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-[var(--color-text-secondary)]">
            Cargando...
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] bg-white px-4 py-2">
              <span className="text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-page)] px-2 py-1 rounded">
                fx
              </span>
              <input
                type="text"
                className="flex-1 text-sm bg-transparent border-0 focus:outline-none"
                placeholder="Selecciona una celda para ver/editar fórmula"
                readOnly
              />
            </div>

            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[var(--shadow-elevation-low)]">
                  <tr>
                    <th className="w-10 border-b border-[var(--color-border-subtle)] px-3 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--color-border-subtle)]"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(new Set(entries.map(e => e.id)));
                          } else {
                            setSelectedRows(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-left text-xs font-medium uppercase text-[var(--color-text-secondary)] min-w-[180px]">
                      Proyecto
                    </th>
                    <th className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-left text-xs font-medium uppercase text-[var(--color-text-secondary)] min-w-[150px]">
                      Actividad
                    </th>
                    <th className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-center text-xs font-medium uppercase text-[var(--color-text-secondary)] w-16">
                      Billable
                    </th>
                    {days.map((day) => (
                      <th key={day} className="border-b border-[var(--color-border-subtle)] px-2 py-2 text-center text-xs font-medium uppercase text-[var(--color-text-secondary)] w-14">
                        {day}
                      </th>
                    ))}
                    <th className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-right text-xs font-medium uppercase text-[var(--color-text-secondary)] w-14">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, rowIndex) => (
                    <tr
                      key={entry.id}
                      className={`transition-colors duration-[var(--duration-instant)] ${
                        selectedRows.has(entry.id) 
                          ? 'bg-[var(--color-selected-row)] border-l-2 border-[var(--color-primary)]' 
                          : 'hover:bg-[var(--color-hover-row)]'
                      }`}
                    >
                      <td className="w-10 border-b border-[var(--color-border-subtle)] px-3 py-2">
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
                          className="h-4 w-4 rounded border-[var(--color-border-subtle)]"
                        />
                      </td>
                      <td className="border-b border-[var(--color-border-subtle)] px-3 py-2">
                        <select
                          className="h-8 w-full border border-transparent bg-transparent text-sm focus:border-[var(--color-primary)] focus:outline-none rounded"
                          value={entry.projectId}
                          onChange={(e) => {
                            setEntries(prev => prev.map(en => 
                              en.id === entry.id ? { ...en, projectId: e.target.value } : en
                            ));
                            setHasChanges(true);
                          }}
                        >
                          <option value="">Seleccionar...</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-[var(--color-border-subtle)] px-3 py-2">
                        <input
                          type="text"
                          className="h-8 w-full border border-transparent bg-transparent text-sm focus:border-[var(--color-primary)] focus:outline-none rounded px-2"
                          value={entry.activity}
                          onChange={(e) => {
                            setEntries(prev => prev.map(en => 
                              en.id === entry.id ? { ...en, activity: e.target.value } : en
                            ));
                            setHasChanges(true);
                          }}
                          placeholder="Actividad..."
                        />
                      </td>
                      <td className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={entry.billable}
                          onChange={() => {
                            setEntries(prev => prev.map(en => 
                              en.id === entry.id ? { ...en, billable: !en.billable } : en
                            ));
                            setHasChanges(true);
                          }}
                          className="h-4 w-4 rounded border-[var(--color-border-subtle)]"
                        />
                      </td>
                      {daysKey.map((day) => {
                        const value = entry.hours[day];
                        const hasError = value > 12;
                        return (
                          <td key={day} className="border-b border-[var(--color-border-subtle)] px-1 py-2">
                            <input
                              type="number"
                              className={`w-full h-8 text-center text-sm border border-transparent bg-transparent focus:border-[var(--color-primary)] focus:outline-none rounded ${
                                hasError ? 'text-[var(--color-error)] font-medium' : ''
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
                      <td className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-right font-medium">
                        {entry.total}
                      </td>
                    </tr>
                  ))}
                  <tr 
                    className="hover:bg-[var(--color-bg-page)] cursor-pointer"
                    onClick={handleAddRow}
                  >
                    <td 
                      colSpan={13}
                      className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
                    >
                      + Agregar nueva fila
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] bg-white px-4 py-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[var(--color-text-secondary)]">
                  Total: <span className="font-semibold text-[var(--color-text-primary)]">{totalHours}h</span>
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  Billable: <span className="font-semibold text-[var(--color-text-primary)]">
                    {entries.filter(e => e.billable).reduce((s, e) => s + e.total, 0)}h
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge status="draft">Borrador</Badge>
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
