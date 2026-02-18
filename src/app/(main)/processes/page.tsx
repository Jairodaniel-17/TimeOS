'use client';

import { useState, useEffect } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Tabs, Card, Badge } from '@/components/ui';
import { Pause, RefreshCw, XCircle, Clock, CheckCircle, Copy } from 'lucide-react';

const jobs = [
  { id: '1', type: 'export', initiatedBy: 'Ana García', progress: 78, status: 'running', startedAt: Date.now() - 120000 },
  { id: '2', type: 'sync', initiatedBy: 'System', progress: 100, status: 'completed', startedAt: Date.now() - 3600000, duration: '2m 15s' },
  { id: '3', type: 'report', initiatedBy: 'Carlos López', progress: 100, status: 'completed', startedAt: Date.now() - 1800000, duration: '45s' },
  { id: '4', type: 'close', initiatedBy: 'Ana García', progress: 0, status: 'failed', startedAt: Date.now() - 10800000 },
];

const jobTypeLabels: Record<string, string> = {
  export: 'Exportación',
  sync: 'Sincronización',
  close: 'Cierre',
  report: 'Reporte',
};

const statusConfig: Record<string, { color: string; label: string }> = {
  running: { color: 'var(--color-primary)', label: 'En ejecución' },
  completed: { color: 'var(--color-success)', label: 'Completado' },
  failed: { color: 'var(--color-error)', label: 'Fallido' },
  scheduled: { color: 'var(--color-text-secondary)', label: 'Programado' },
};

export default function ProcessesPage() {
  const [activeTab, setActiveTab] = useState('running');

  const filteredJobs = jobs.filter((job) => job.status === activeTab);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageLayout>
      <Header
        title="Procesos"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Procesos' }]}
      />
      <PageContent className="p-0">
        <div className="border-b border-[var(--color-border-subtle)] bg-white px-6 py-2">
          <Tabs
            tabs={[
              { id: 'running', label: 'En ejecución', count: jobs.filter(j => j.status === 'running').length },
              { id: 'completed', label: 'Completados' },
              { id: 'failed', label: 'Fallidos' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className="p-6">
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Clock className="h-12 w-12 text-[var(--color-text-secondary)] mb-3" />
              <p className="text-sm font-medium">No hay procesos {activeTab === 'running' ? 'en ejecución' : activeTab}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const config = statusConfig[job.status];
                return (
                  <Card key={job.id} padding="none">
                    <div className="flex items-center gap-4 p-4">
                      <div
                        className="h-10 w-10 rounded-[var(--radius-md)] flex items-center justify-center"
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{jobTypeLabels[job.type]}</span>
                          <Badge
                            status={job.status === 'completed' ? 'approved' : job.status === 'failed' ? 'rejected' : 'pending'}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-[var(--color-text-secondary)]">
                          <span>Iniciado por: {job.initiatedBy}</span>
                          <span>{formatTime(job.startedAt)}</span>
                          {'duration' in job && <span>Duración: {job.duration}</span>}
                        </div>
                      </div>
                      {job.status === 'running' && (
                        <div className="flex items-center gap-3">
                          <div className="w-32">
                            <div className="h-1.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium">{job.progress}%</span>
                          <Button variant="ghost" size="icon" icon={<Pause className="h-4 w-4" />} />
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
    </PageLayout>
  );
}
