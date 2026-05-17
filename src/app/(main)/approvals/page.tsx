'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Tabs, Card, Textarea } from '@/components/ui';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { PermissionGate } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface Approval {
  id: string;
  userId: string;
  weekNumber: number;
  year: number;
  totalHours: number;
  status: string;
  comments?: string;
  user: { name: string; email: string };
}

interface TimeEntry {
  id: string;
  activity: string;
  total: number;
  project: { name: string } | null;
  hours: Record<string, number>;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [selectedItem, setSelectedItem] = useState<Approval | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<'reject' | 'changes' | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const { user } = useAuth();
  const { isAdmin, isManager } = usePermissions();

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    setSelectedItem(null);
    setSelectedEntries([]);
    try {
      const userIdParam = (!isAdmin && !isManager && user) ? `&userId=${user.id}` : '';
      const res = await fetch(`/api/approvals?status=${activeTab}${userIdParam}`);
      const data = await res.json();
      if (data.success) {
        setApprovals(data.data);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user, isAdmin, isManager]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  useEffect(() => {
    if (approvals.length > 0 && !selectedItem) {
      setSelectedItem(approvals[0]);
    }
  }, [approvals, selectedItem]);

  // Fetch real timesheet entries when an approval is selected
  useEffect(() => {
    if (!selectedItem) { setSelectedEntries([]); return; }
    setLoadingEntries(true);
    fetch(`/api/timesheets?userId=${selectedItem.userId}&weekNumber=${selectedItem.weekNumber}&year=${selectedItem.year}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setSelectedEntries(d.data);
      })
      .catch(console.error)
      .finally(() => setLoadingEntries(false));
  }, [selectedItem]);

  const handleApprove = async (id: string) => {
    await fetch('/api/approvals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved', approverId: user?.id }),
    });
    fetchApprovals();
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectModal) return;
    const status = rejectModal === 'changes' ? 'changes_requested' : 'rejected';
    await fetch('/api/approvals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedItem.id,
        status,
        approverId: user?.id,
        comments: rejectComment || (rejectModal === 'changes' ? 'Se solicitan cambios' : 'Rechazado'),
      }),
    });
    setRejectModal(null);
    setRejectComment('');
    fetchApprovals();
  };

  return (
    <PageLayout>
      <Header
        title="Aprobaciones"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Aprobaciones' }]}
      />
      <PageContent className="p-0">
        <div className="flex h-full">
          {/* Filter sidebar */}
          <div className="w-56 border-r border-redwood-border bg-redwood-surface p-4">
            <h3 className="text-xs font-semibold uppercase text-redwood-muted mb-3">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-sm transition-colors ${
                    activeTab === filter.id
                      ? 'bg-[var(--color-primary-light)] text-redwood-primary'
                      : 'text-redwood-muted hover:bg-redwood-page'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Approval list */}
          <div className="w-80 border-r border-redwood-border bg-redwood-page flex flex-col">
            <div className="border-b border-redwood-border bg-redwood-surface px-4 py-3">
              <Tabs
                tabs={[{ id: activeTab, label: approvals.length === 0 ? 'Sin resultados' : `${approvals.length} resultado${approvals.length !== 1 ? 's' : ''}`, count: approvals.length }]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-redwood-muted text-sm">
                  Cargando...
                </div>
              ) : approvals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <CheckCircle className="h-12 w-12 text-[var(--color-success)] mb-3" />
                  <p className="text-sm font-medium text-redwood-text">
                    No hay aprobaciones {activeTab === 'pending' ? 'pendientes' : activeTab === 'approved' ? 'aprobadas' : 'rechazadas'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-redwood-border">
                  {approvals.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-redwood-surface border-l-2 border-redwood-primary'
                          : 'hover:bg-redwood-surface/50'
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-sm font-medium text-redwood-primary flex-shrink-0">
                        {item.user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-redwood-text truncate block">
                          {item.user.name}
                        </span>
                        <p className="text-xs text-redwood-muted mt-0.5">
                          Semana {item.weekNumber} · {item.totalHours}h
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail pane */}
          <div className="flex-1 bg-redwood-surface flex flex-col">
            {selectedItem ? (
              <>
                <div className="border-b border-redwood-border px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-base font-medium text-redwood-primary">
                      {selectedItem.user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-redwood-text">
                        {selectedItem.user.name}
                      </h2>
                      <p className="text-sm text-redwood-muted">
                        Semana {selectedItem.weekNumber} del {selectedItem.year} · {selectedItem.totalHours}h
                      </p>
                    </div>
                  </div>
                  {selectedItem.comments && activeTab !== 'pending' && (
                    <div className="mt-3 p-3 rounded-lg bg-redwood-page border border-redwood-border text-sm text-redwood-muted">
                      <span className="font-medium text-redwood-text">Comentario: </span>
                      {selectedItem.comments}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-6">
                  <h3 className="text-sm font-semibold text-redwood-text mb-3">
                    Resumen de horas
                  </h3>
                  <Card padding="none">
                    <table className="w-full">
                      <thead className="bg-redwood-page">
                        <tr>
                          <th className="text-left text-xs font-medium text-redwood-muted px-4 py-2">Proyecto</th>
                          <th className="text-left text-xs font-medium text-redwood-muted px-4 py-2">Actividad</th>
                          <th className="text-right text-xs font-medium text-redwood-muted px-4 py-2">Horas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-redwood-border">
                        {loadingEntries ? (
                          <tr>
                            <td colSpan={3} className="text-center text-sm text-redwood-muted px-4 py-4">
                              Cargando entradas...
                            </td>
                          </tr>
                        ) : selectedEntries.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center text-sm text-redwood-muted px-4 py-4">
                              No se encontraron entradas para esta semana
                            </td>
                          </tr>
                        ) : (
                          selectedEntries.map(entry => (
                            <tr key={entry.id}>
                              <td className="text-sm px-4 py-2">{entry.project?.name || '—'}</td>
                              <td className="text-sm px-4 py-2 text-redwood-muted">{entry.activity}</td>
                              <td className="text-right text-sm font-medium px-4 py-2">{entry.total}h</td>
                            </tr>
                          ))
                        )}
                        <tr className="font-semibold bg-redwood-page">
                          <td className="px-4 py-2" colSpan={2}>Total</td>
                          <td className="text-right px-4 py-2">{selectedItem.totalHours}h</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card>
                </div>

                <PermissionGate permission="approvals:manage">
                  <div className="flex items-center justify-end gap-2 border-t border-redwood-border px-6 py-4">
                    {activeTab === 'pending' && (
                      <>
                        <Button
                          variant="subtle"
                          icon={<MessageCircle className="h-4 w-4" />}
                          onClick={() => setRejectModal('changes')}
                        >
                          Solicitar cambios
                        </Button>
                        <Button
                          variant="danger"
                          icon={<XCircle className="h-4 w-4" />}
                          onClick={() => setRejectModal('reject')}
                        >
                          Rechazar
                        </Button>
                        <Button
                          variant="primary"
                          icon={<CheckCircle className="h-4 w-4" />}
                          onClick={() => handleApprove(selectedItem.id)}
                        >
                          Aprobar
                        </Button>
                      </>
                    )}
                  </div>
                </PermissionGate>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-redwood-muted">
                  Selecciona un item para ver el detalle
                </p>
              </div>
            )}
          </div>
        </div>
      </PageContent>

      {/* Reject / request-changes modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-redwood-surface rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-base font-semibold text-redwood-text mb-1">
              {rejectModal === 'changes' ? 'Solicitar cambios' : 'Rechazar timesheet'}
            </h3>
            <p className="text-sm text-redwood-muted mb-4">
              {rejectModal === 'changes'
                ? 'Indica qué cambios debe hacer el empleado antes de reenviar.'
                : 'Opcional: añade un motivo para que el empleado sepa qué corregir.'}
            </p>
            <Textarea
              rows={3}
              placeholder={rejectModal === 'changes'
                ? 'Ej: Falta registrar horas del proyecto Alpha del miércoles.'
                : 'Motivo del rechazo (opcional)...'}
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="subtle" onClick={() => { setRejectModal(null); setRejectComment(''); }}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleReject}>
                {rejectModal === 'changes' ? 'Solicitar cambios' : 'Rechazar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
