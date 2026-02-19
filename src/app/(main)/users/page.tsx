'use client';

import { useState, useEffect } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import { Plus, Users as UsersIcon, Mail, Shield, Edit2, Trash2 } from 'lucide-react';
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
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'member', password: '' });

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
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
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Usuario</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Rol</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Estado</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-secondary)]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-[var(--color-hover-row)]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-sm font-medium text-[var(--color-primary)]">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">{user.email}</td>
                    <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4">
                      <Badge severity={user.isActive ? 'success' : 'error'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <PermissionGate permission="users:update">
                        <Button variant="ghost" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Crear Nuevo Usuario</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contraseña</label>
                  <input
                    type="password"
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rol</label>
                  <select
                    className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2"
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
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                <Button variant="primary" onClick={handleCreateUser}>Crear</Button>
              </div>
            </Card>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
