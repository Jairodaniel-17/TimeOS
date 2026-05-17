'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Tabs, Card, Badge } from '@/components/ui';
import { Pause, RefreshCw, XCircle, Clock, CheckCircle, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Job {
  id: string;
  type: 'export' | 'sync' | 'report' | 'close' | 'import';
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'cancelled';
  initiatedBy: string;
  progress: number;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  duration?: string;
  error?: string;
}

const jobTypeLabels: Record<string, string> = {
  export: 'Exportación',
  sync: 'Sincronización',
  close: 'Cierre',
  report: 'Reporte',
  import: 'Importación',
};

const statusConfig: Record<string, { color: string; label: string }> = {
  running: { color: 'var(--color-primary)', label: 'En ejecución' },
  completed: { color: 'var(--color-success)', label: 'Completado' },
  failed: { color: 'var(--color-error)', label: 'Fallido' },
  scheduled: { color: 'var(--text-secondary)', label: 'Programado' },
  cancelled: { color: 'var(--text-secondary)', label: 'Cancelado' },
};

export default function ProcessesPage() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('running');
  const [showModal, setShowModal] = useState(false);
  const [newJobType, setNewJobType] = useState<Job['type']>('export');
  const [creating, setCreating] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs');
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleCancel = async (id: string) => {
    try {
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      });
      await fetchJobs();
    } catch (err) {
      console.error('Error cancelling job:', err);
    }
  };

  const handleCreateJob = async () => {
    setCreating(true);
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newJobType,
          initiatedBy: user?.name ?? 'System',
        }),
      });
      setShowModal(false);
      setNewJobType('export');
      await fetchJobs();
    } catch (err) {
      console.error('Error creating job:', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredJobs = jobs.filter((job) => job.status === activeTab);

  const formatDateTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString('es-ES');

  return (
    <PageLayout>
      <Header
        title="Procesos"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Procesos' }]}
        actions={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowModal(true)}
          >
            Nuevo proceso
          </Button>
        }
      />
      <PageContent className="p-0">
        <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-2">
          <Tabs
            tabs={[
              { id: 'running', label: 'En ejecución', count: jobs.filter(j => j.status === 'running').length },
              { id: 'completed', label: 'Completados' },
              { id: 'failed', label: 'Fallidos' },
              { id: 'scheduled', label: 'Programados' },
              { id: 'cancelled', label: 'Cancelados' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--color-primary)] mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">Cargando procesos…</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Clock className="h-12 w-12 text-[var(--text-secondary)] mb-3" />
              <p className="text-sm font-medium">
                No hay procesos{' '}
                {activeTab === 'running'
                  ? 'en ejecución'
                  : activeTab === 'completed'
                  ? 'completados'
                  : activeTab === 'failed'
                  ? 'fallidos'
                  : activeTab === 'scheduled'
                  ? 'programados'
                  : 'cancelados'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const config = statusConfig[job.status] ?? statusConfig.scheduled;
                return (
                  <Card key={job.id} padding="none">
                    <div className="flex items-center gap-4 p-4">
                      <div
                        className="h-10 w-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        {job.status === 'running' ? (
                          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: config.color }} />
                        ) : job.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5" style={{ color: config.color }} />
                        ) : (
                          <XCircle className="h-5 w-5" style={{ color: config.color }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">
                            {jobTypeLabels[job.type] ?? job.type}
                          </span>
                          <Badge
                            status={
                              job.status === 'completed'
                                ? 'approved'
                                : job.status === 'failed'
                                ? 'rejected'
                                : 'pending'
                            }
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-secondary)] flex-wrap">
                          <span>Iniciado por: {job.initiatedBy}</span>
                          <span>{formatDateTime(job.startedAt)}</span>
                          {job.duration && <span>Duración: {job.duration}</span>}
                          {job.durationMs && !job.duration && (
                            <span>Duración: {Math.round(job.durationMs / 1000)}s</span>
                          )}
                        </div>
                        {job.status === 'failed' && job.error && (
                          <div className="mt-1.5 text-xs text-[var(--color-error)] bg-[var(--color-error)]/10 rounded-md px-2 py-1 w-fit max-w-full truncate">
                            {job.error}
                          </div>
                        )}
                      </div>

                      {job.status === 'running' && (
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-32">
                            <div className="h-1.5 bg-[var(--border-default)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium">{job.progress}%</span>
                          <Button
                            variant="subtle"
                            size="icon"
                            icon={<Pause className="h-4 w-4" />}
                            onClick={() => handleCancel(job.id)}
                            title="Cancelar proceso"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageContent>

      {/* New process modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nuevo proceso</h3>
              <Button
                variant="subtle"
                size="icon"
                icon={<X className="h-4 w-4" />}
                onClick={() => setShowModal(false)}
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">
                  Tipo de proceso
                </label>
                <select
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={newJobType}
                  onChange={e => setNewJobType(e.target.value as Job['type'])}
                >
                  <option value="export">Exportación</option>
                  <option value="sync">Sincronización</option>
                  <option value="report">Reporte</option>
                  <option value="close">Cierre</option>
                  <option value="import">Importación</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">
                  Iniciado por
                </label>
                <div className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-hover-bg text-sm text-redwood-muted flex items-center">
                  {user?.name ?? 'System'}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="subtle" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" loading={creating} onClick={handleCreateJob}>
                Iniciar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
