'use client';

import { useState, useEffect } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import { Plus, Mail, Shield, Edit2, X, Save, UserCheck, UserX, KeyRound } from 'lucide-react';
import { PermissionGate } from '@/hooks/usePermissions';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  isActive: boolean;
  avatar?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetingUser, setResetingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'member', password: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'member', isActive: true });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewUser({ name: '', email: '', role: 'member', password: '' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, ...editForm }),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!resetingUser || !newPassword) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetingUser.id, password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setShowResetModal(false);
        setResetingUser(null);
        setNewPassword('');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge severity="error">Admin</Badge>;
      case 'manager':
        return <Badge severity="warning">Manager</Badge>;
      default:
        return <Badge severity="info">Member</Badge>;
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <Header title="Usuarios" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Usuarios' }]} />
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-redwood-primary"></div>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Gestión de Usuarios"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Usuarios' }]}
        actions={
          <PermissionGate permission="users:create">
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
              Nuevo Usuario
            </Button>
          </PermissionGate>
        }
      />
      <PageContent>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-redwood-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-redwood-muted">Usuario</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-redwood-muted">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-redwood-muted">Rol</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-redwood-muted">Estado</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-redwood-muted">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-redwood-border">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-redwood-hover-bg">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-sm font-medium text-redwood-primary">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-redwood-text">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-redwood-muted">{user.email}</td>
                    <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4">
                      <Badge severity={user.isActive ? 'success' : 'error'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <PermissionGate permission="users:update">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="subtle" size="icon" icon={<KeyRound className="h-4 w-4" />} onClick={() => { setResetingUser(user); setShowResetModal(true); }} title="Reset contraseña" />
                          <Button variant="subtle" size="icon" icon={<Edit2 className="h-4 w-4" />} onClick={() => openEditModal(user)} />
                        </div>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Crear Nuevo Usuario</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Nombre</label>
                  <input
                    type="text"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Rol</label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="subtle" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                <Button variant="primary" onClick={handleCreateUser}>Crear</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Editar Usuario</h3>
                <Button variant="subtle" size="icon" icon={<X className="h-5 w-5" />} onClick={() => setShowEditModal(false)} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Nombre</label>
                  <input
                    type="text"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={editForm.email}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Rol
                  </label>
                  <select
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                  >
                    <option value="member">Member - Acceso básico</option>
                    <option value="manager">Manager - Gestión de proyectos</option>
                    <option value="admin">Admin - Acceso completo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Estado</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, isActive: true })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] border transition-all ${
                        editForm.isActive
                          ? 'border-redwood-green bg-badge-subtle-success-bg text-redwood-green'
                          : 'border-redwood-border text-redwood-muted'
                      }`}
                    >
                      <UserCheck className="h-4 w-4" />
                      Activo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, isActive: false })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] border transition-all ${
                        !editForm.isActive
                          ? 'border-redwood-danger bg-badge-subtle-danger-bg text-redwood-danger'
                          : 'border-redwood-border text-redwood-muted'
                      }`}
                    >
                      <UserX className="h-4 w-4" />
                      Inactivo
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="subtle" onClick={() => setShowEditModal(false)}>Cancelar</Button>
                <Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={handleUpdateUser}>
                  Guardar Cambios
                </Button>
              </div>
            </Card>
          </div>
        )}
        {/* Reset Password Modal */}
        {showResetModal && resetingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Reset de Contraseña</h3>
                  <p className="text-xs text-redwood-muted mt-0.5">{resetingUser.name}</p>
                </div>
                <Button variant="subtle" size="icon" icon={<X className="h-5 w-5" />} onClick={() => { setShowResetModal(false); setNewPassword(''); }} />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-redwood-text mb-1.5">Nueva contraseña</label>
                <input
                  type="password"
                  className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="subtle" onClick={() => { setShowResetModal(false); setNewPassword(''); }}>Cancelar</Button>
                <Button variant="primary" icon={<KeyRound className="h-4 w-4" />} onClick={handleResetPassword} disabled={newPassword.length < 6}>
                  Resetear
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
