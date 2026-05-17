'use client';

import { useState, useEffect } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import {
  Users, Plus, Mail, Phone, MapPin, Building2,
  FolderKanban, Clock, DollarSign, ChevronRight,
  TrendingUp, CheckCircle, AlertCircle, X, Save, Edit2, Trash2
} from 'lucide-react';

interface ProjectInfo {
  id: string;
  name: string;
  code: string;
  status: string;
  budget: number;
  budgetHours: number;
  progress: number;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  projects: ProjectInfo[];
  totalBudget: number;
  totalHours: number;
  activeProjects: number;
  completedProjects: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    projectName: '',
    projectCode: '',
  });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name) {
      alert('El nombre del cliente es requerido');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewClient({ name: '', email: '', phone: '', address: '', projectName: '', projectCode: '' });
        fetchClients();
      } else {
        alert(data.error || 'Error al crear cliente');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error al crear cliente');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setEditForm({ name: client.name, email: client.email || '', phone: client.phone || '', address: client.address || '' });
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setEditingClient(null);
        fetchClients();
      }
    } catch (error) {
      console.error('Error updating client:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;
    try {
      await fetch(`/api/clients/${deletingClient.id}`, { method: 'DELETE' });
      setDeletingClient(null);
      if (selectedClient?.id === deletingClient.id) setSelectedClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge severity="success">Activo</Badge>;
      case 'completed':
        return <Badge severity="info">Completado</Badge>;
      case 'archived':
        return <Badge severity="warning">Archivado</Badge>;
      default:
        return <Badge severity="info">{status}</Badge>;
    }
  };

  const totalClients = clients.length;
  const totalProjects = clients.reduce((sum, c) => sum + c.projects.length, 0);
  const totalBudget = clients.reduce((sum, c) => sum + c.totalBudget, 0);
  const activeProjects = clients.reduce((sum, c) => sum + c.activeProjects, 0);

  if (loading) {
    return (
      <PageLayout>
        <Header title="Clientes" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Clientes' }]} />
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Clientes"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Clientes' }]}
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Nuevo Cliente
          </Button>
        }
      />
      <PageContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[var(--bg-surface)] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Clientes</p>
                <p className="text-3xl font-bold">{totalClients}</p>
              </div>
              <Users className="h-10 w-10 text-blue-200" />
            </div>
          </Card>
          <Card className="bg-[var(--bg-surface)] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Proyectos Totales</p>
                <p className="text-3xl font-bold">{totalProjects}</p>
              </div>
              <FolderKanban className="h-10 w-10 text-purple-200" />
            </div>
          </Card>
          <Card className="bg-[var(--bg-surface)] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Proyectos Activos</p>
                <p className="text-3xl font-bold">{activeProjects}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-200" />
            </div>
          </Card>
          <Card className="bg-[var(--bg-surface)] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Presupuesto Total</p>
                <p className="text-3xl font-bold">${totalBudget.toLocaleString()}</p>
              </div>
              <DollarSign className="h-10 w-10 text-orange-200" />
            </div>
          </Card>
        </div>

        {clients.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-16 w-16 text-[var(--text-secondary)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No hay clientes registrados
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Los clientes aparecerán aquí cuando se les asigne un proyecto
              </p>
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
                Agregar Cliente
              </Button>
            </div>
          </Card>
        ) : selectedClient ? (
          /* Client Detail View */
          <div className="space-y-4">
            <Button 
              variant="subtle" 
              onClick={() => setSelectedClient(null)}
              className="mb-2"
            >
              ← Volver a todos los clientes
            </Button>
            
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      {selectedClient.name}
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                      {selectedClient.email && (
                        <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                          <Mail className="h-4 w-4" />
                          {selectedClient.email}
                        </span>
                      )}
                      {selectedClient.phone && (
                        <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                          <Phone className="h-4 w-4" />
                          {selectedClient.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="subtle" icon={<Mail className="h-4 w-4" />}>
                    Enviar Email
                  </Button>
                  <Button variant="primary" icon={<FolderKanban className="h-4 w-4" />}>
                    Nuevo Proyecto
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-[var(--bg-base)] rounded-xl">
                  <p className="text-xs text-[var(--text-secondary)] uppercase">Proyectos</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {selectedClient.projects.length}
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-base)] rounded-xl">
                  <p className="text-xs text-[var(--text-secondary)] uppercase">Activos</p>
                  <p className="text-2xl font-bold text-green-600">{selectedClient.activeProjects}</p>
                </div>
                <div className="p-4 bg-[var(--bg-base)] rounded-xl">
                  <p className="text-xs text-[var(--text-secondary)] uppercase">Presupuesto</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    ${selectedClient.totalBudget.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-base)] rounded-xl">
                  <p className="text-xs text-[var(--text-secondary)] uppercase">Horas</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {selectedClient.totalHours}h
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4">Proyectos del Cliente</h3>
              <div className="space-y-2">
                {selectedClient.projects.map(project => (
                  <div 
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-[var(--bg-base)] rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
                        <FolderKanban className="h-5 w-5 text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{project.name}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{project.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--text-secondary)]">Avance</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-[var(--border-default)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--color-primary)] rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      {getStatusBadge(project.status)}
                      <ChevronRight className="h-5 w-5 text-[var(--text-secondary)]" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          /* Clients List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(client => (
              <Card
                key={client.id}
                className="hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{client.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {client.projects.length} proyectos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={<Edit2 className="h-4 w-4" />}
                      onClick={(e) => { e.stopPropagation(); openEditModal(client); }}
                      title="Editar cliente"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={<Trash2 className="h-4 w-4 text-red-500" />}
                      onClick={(e) => { e.stopPropagation(); setDeletingClient(client); }}
                      title="Eliminar cliente"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Proyectos activos</span>
                    <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {client.activeProjects}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Presupuesto total</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      ${client.totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Horas estimadas</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {client.totalHours}h
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Último proyecto</span>
                    <span className="font-medium text-[var(--text-primary)] truncate max-w-[150px]">
                      {client.projects[0]?.name || 'Sin proyectos'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar Cliente</h3>
              <Button variant="subtle" size="icon" icon={<X className="h-5 w-5" />} onClick={() => setEditingClient(null)} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input
                  type="text"
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  value={editForm.address}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Dirección de la empresa"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="subtle" onClick={() => setEditingClient(null)}>Cancelar</Button>
              <Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={handleUpdateClient} loading={saving}>
                Guardar Cambios
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm">
            <h3 className="text-base font-semibold text-redwood-text mb-2">Eliminar cliente</h3>
            <p className="text-sm text-redwood-muted mb-6">
              ¿Eliminar a <strong>{deletingClient.name}</strong>? Esta acción no se puede deshacer.
              Los proyectos asociados no se eliminarán.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="subtle" onClick={() => setDeletingClient(null)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDeleteClient}>Eliminar</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Nuevo Cliente</h3>
              <Button variant="subtle" size="icon" onClick={() => setShowCreateModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  className="w-full border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2"
                  value={newClient.name}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Empresa o nombre del cliente"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={newClient.email}
                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={newClient.phone}
                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Dirección
                </label>
                <input
                  type="text"
                  className="w-full border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2"
                  value={newClient.address}
                  onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="Dirección de la empresa"
                />
              </div>
              <div className="pt-4 border-t border-[var(--border-default)]">
                <h4 className="text-sm font-medium mb-3">Crear primer proyecto (opcional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre del Proyecto</label>
                    <input
                      type="text"
                      className="w-full border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2"
                      value={newClient.projectName}
                      onChange={e => setNewClient({ ...newClient, projectName: e.target.value })}
                      placeholder="Proyecto inicial"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Código</label>
                    <input
                      type="text"
                      className="w-full border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2"
                      value={newClient.projectCode}
                      onChange={e => setNewClient({ ...newClient, projectCode: e.target.value })}
                      placeholder="PROJ-001"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="subtle" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
              <Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={handleCreateClient} loading={saving}>
                Crear Cliente
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
