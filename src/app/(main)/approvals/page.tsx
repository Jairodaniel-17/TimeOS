'use client';

import { useState, useEffect } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Tabs, Card, Badge } from '@/components/ui';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';

interface Approval {
  id: string;
  userId: string;
  weekNumber: number;
  year: number;
  totalHours: number;
  status: string;
  user: { name: string; email: string };
  entries?: Array<{
    id: string;
    activity: string;
    total: number;
    project: { name: string };
    hours: Record<string, number>;
  }>;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [selectedItem, setSelectedItem] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApprovals() {
      try {
        const res = await fetch(`/api/approvals?status=${activeTab}`);
        const data = await res.json();
        if (data.success) {
          setApprovals(data.data);
          if (data.data.length > 0 && !selectedItem) {
            setSelectedItem(data.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching approvals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchApprovals();
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    await fetch('/api/approvals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: 'approved',
        approverId: '1',
      }),
    });
    
    setApprovals(prev => prev.filter(a => a.id !== id));
    const nextItem = approvals.find(a => a.id !== id);
    setSelectedItem(nextItem || null);
  };

  const handleReject = async (id: string) => {
    await fetch('/api/approvals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: 'rejected',
        approverId: '1',
        comments: 'Rechazado',
      }),
    });
    
    setApprovals(prev => prev.filter(a => a.id !== id));
    const nextItem = approvals.find(a => a.id !== id);
    setSelectedItem(nextItem || null);
  };

  return (
    <PageLayout>
      <Header
        title="Aprobaciones"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Aprobaciones' }]}
      />
      <PageContent className="p-0">
        <div className="flex h-full">
          <div className="w-56 border-r border-[var(--color-border-subtle)] bg-white p-4">
            <h3 className="text-xs font-semibold uppercase text-[var(--color-text-secondary)] mb-3">
              Filtros
            </h3>
            <div className="space-y-1">
              {[
                { id: 'pending', label: 'Pendientes' },
                { id: 'approved', label: 'Aprobados' },
                { id: 'rejected', label: 'Rechazados' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveTab(filter.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors ${
                    activeTab === filter.id
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-page)]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-80 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] flex flex-col">
            <div className="border-b border-[var(--color-border-subtle)] bg-white px-4 py-3">
              <Tabs
                tabs={[
                  { id: 'pending', label: 'Pendientes', count: approvals.length },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-[var(--color-text-secondary)] text-sm">
                  Cargando...
                </div>
              ) : approvals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <CheckCircle className="h-12 w-12 text-[var(--color-success)] mb-3" />
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    No hay aprobaciones pendientes
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {approvals.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-white border-l-2 border-[var(--color-primary)]'
                          : 'hover:bg-white/50'
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-sm font-medium text-[var(--color-primary)] flex-shrink-0">
                        {item.user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                            {item.user.name}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          Semana {item.weekNumber} · {item.totalHours}h
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white flex flex-col">
            {selectedItem ? (
              <>
                <div className="border-b border-[var(--color-border-subtle)] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-base font-medium text-[var(--color-primary)]">
                      {selectedItem.user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                        {selectedItem.user.name}
                      </h2>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Semana {selectedItem.weekNumber} del {selectedItem.year} · {selectedItem.totalHours}h
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                    Resumen de horas
                  </h3>
                  <Card padding="none">
                    <table className="w-full">
                      <thead className="bg-[var(--color-bg-page)]">
                        <tr>
                          <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-2">
                            Proyecto
                          </th>
                          <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-2">
                            Actividad
                          </th>
                          <th className="text-right text-xs font-medium text-[var(--color-text-secondary)] px-4 py-2">
                            Horas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-subtle)]">
                        <tr>
                          <td className="text-sm px-4 py-2">Portal Clientes</td>
                          <td className="text-sm px-4 py-2 text-[var(--color-text-secondary)]">Desarrollo</td>
                          <td className="text-right text-sm font-medium px-4 py-2">22</td>
                        </tr>
                        <tr>
                          <td className="text-sm px-4 py-2">App Móvil</td>
                          <td className="text-sm px-4 py-2 text-[var(--color-text-secondary)]">Diseño</td>
                          <td className="text-right text-sm font-medium px-4 py-2">18</td>
                        </tr>
                        <tr className="font-semibold bg-[var(--color-bg-page)]">
                          <td className="px-4 py-2" colSpan={2}>Total</td>
                          <td className="text-right px-4 py-2">{selectedItem.totalHours}h</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border-subtle)] px-6 py-4">
                  <Button variant="secondary" icon={<MessageCircle className="h-4 w-4" />}>
                    Solicitar cambios
                  </Button>
                  <Button variant="destructive" icon={<XCircle className="h-4 w-4" />} onClick={() => handleReject(selectedItem.id)}>
                    Rechazar
                  </Button>
                  <Button variant="primary" icon={<CheckCircle className="h-4 w-4" />} onClick={() => handleApprove(selectedItem.id)}>
                    Aprobar
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Selecciona un item para ver el detalle
                </p>
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
