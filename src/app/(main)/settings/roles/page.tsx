'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import { 
  Shield, Save, RotateCcw, Check, X, 
  LayoutDashboard, FolderKanban, ListTodo, Clock, 
  Users, BarChart3, FileSpreadsheet, Settings,
  ArrowRightLeft, DollarSign, Calendar, CheckCircle
} from 'lucide-react';

type Permission = 
  | 'projects:read' | 'projects:create' | 'projects:update' | 'projects:delete'
  | 'tasks:read' | 'tasks:create' | 'tasks:update' | 'tasks:delete'
  | 'timesheets:read' | 'timesheets:create' | 'timesheets:update' | 'timesheets:delete' | 'timesheets:approve'
  | 'resources:read' | 'resources:create' | 'resources:update' | 'resources:delete'
  | 'reports:read' | 'reports:costs'
  | 'approvals:read' | 'approvals:manage'
  | 'settings:read' | 'settings:update'
  | 'users:read' | 'users:create' | 'users:update' | 'users:delete'
  | 'planning:read' | 'planning:create' | 'planning:update' | 'planning:delete'
  | 'costs:read' | 'costs:manage'
  | 'spreadsheet:read' | 'spreadsheet:write';

interface ModulePermissions {
  module: string;
  icon: React.ReactNode;
  permissions: { id: Permission; label: string }[];
}

const modules: ModulePermissions[] = [
  {
    module: 'Proyectos',
    icon: <FolderKanban className="h-5 w-5" />,
    permissions: [
      { id: 'projects:read', label: 'Ver proyectos' },
      { id: 'projects:create', label: 'Crear proyectos' },
      { id: 'projects:update', label: 'Editar proyectos' },
      { id: 'projects:delete', label: 'Eliminar proyectos' },
    ],
  },
  {
    module: 'Tareas',
    icon: <ListTodo className="h-5 w-5" />,
    permissions: [
      { id: 'tasks:read', label: 'Ver tareas' },
      { id: 'tasks:create', label: 'Crear tareas' },
      { id: 'tasks:update', label: 'Editar tareas' },
      { id: 'tasks:delete', label: 'Eliminar tareas' },
    ],
  },
  {
    module: 'Tiempos',
    icon: <Clock className="h-5 w-5" />,
    permissions: [
      { id: 'timesheets:read', label: 'Ver timesheet' },
      { id: 'timesheets:create', label: 'Crear entradas' },
      { id: 'timesheets:update', label: 'Editar entradas' },
      { id: 'timesheets:delete', label: 'Eliminar entradas' },
      { id: 'timesheets:approve', label: 'Aprobar timesheets' },
    ],
  },
  {
    module: 'Recursos',
    icon: <Users className="h-5 w-5" />,
    permissions: [
      { id: 'resources:read', label: 'Ver recursos' },
      { id: 'resources:create', label: 'Crear recursos' },
      { id: 'resources:update', label: 'Editar recursos' },
      { id: 'resources:delete', label: 'Eliminar recursos' },
    ],
  },
  {
    module: 'Planificación',
    icon: <Calendar className="h-5 w-5" />,
    permissions: [
      { id: 'planning:read', label: 'Ver Gantt' },
      { id: 'planning:create', label: 'Crear tareas' },
      { id: 'planning:update', label: 'Editar tareas' },
      { id: 'planning:delete', label: 'Eliminar tareas' },
    ],
  },
  {
    module: 'Reportes',
    icon: <BarChart3 className="h-5 w-5" />,
    permissions: [
      { id: 'reports:read', label: 'Ver reportes' },
      { id: 'reports:costs', label: 'Ver costos' },
    ],
  },
  {
    module: 'Costos',
    icon: <DollarSign className="h-5 w-5" />,
    permissions: [
      { id: 'costs:read', label: 'Ver costos' },
      { id: 'costs:manage', label: 'Gestionar costos' },
    ],
  },
  {
    module: 'Aprobaciones',
    icon: <CheckCircle className="h-5 w-5" />,
    permissions: [
      { id: 'approvals:read', label: 'Ver aprobaciones' },
      { id: 'approvals:manage', label: 'Gestionar aprobaciones' },
    ],
  },
  {
    module: 'Hoja de Cálculo',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    permissions: [
      { id: 'spreadsheet:read', label: 'Ver spreadsheet' },
      { id: 'spreadsheet:write', label: 'Editar spreadsheet' },
    ],
  },
  {
    module: 'Usuarios',
    icon: <Users className="h-5 w-5" />,
    permissions: [
      { id: 'users:read', label: 'Ver usuarios' },
      { id: 'users:create', label: 'Crear usuarios' },
      { id: 'users:update', label: 'Editar usuarios' },
      { id: 'users:delete', label: 'Eliminar usuarios' },
    ],
  },
  {
    module: 'Configuración',
    icon: <Settings className="h-5 w-5" />,
    permissions: [
      { id: 'settings:read', label: 'Ver configuración' },
      { id: 'settings:update', label: 'Editar configuración' },
    ],
  },
];

const defaultPermissions: Record<string, Permission[]> = {
  admin: [
    'projects:read', 'projects:create', 'projects:update', 'projects:delete',
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
    'timesheets:read', 'timesheets:create', 'timesheets:update', 'timesheets:delete', 'timesheets:approve',
    'resources:read', 'resources:create', 'resources:update', 'resources:delete',
    'reports:read', 'reports:costs',
    'approvals:read', 'approvals:manage',
    'settings:read', 'settings:update',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'planning:read', 'planning:create', 'planning:update', 'planning:delete',
    'costs:read', 'costs:manage',
    'spreadsheet:read', 'spreadsheet:write',
  ],
  manager: [
    'projects:read', 'projects:create', 'projects:update',
    'tasks:read', 'tasks:create', 'tasks:update',
    'timesheets:read', 'timesheets:create', 'timesheets:update', 'timesheets:delete', 'timesheets:approve',
    'resources:read', 'resources:update',
    'reports:read', 'reports:costs',
    'approvals:read', 'approvals:manage',
    'settings:read',
    'users:read', 'users:update',
    'planning:read', 'planning:create', 'planning:update',
    'costs:read',
    'spreadsheet:read',
  ],
  member: [
    'projects:read',
    'tasks:read',
    'timesheets:read', 'timesheets:create', 'timesheets:update', 'timesheets:delete',
    'resources:read',
    'reports:read',
    'settings:read',
    'planning:read',
    'spreadsheet:read',
  ],
};

const roleInfo = {
  admin: { label: 'Administrador', description: 'Acceso completo al sistema', color: 'bg-red-500' },
  manager: { label: 'Gerente', description: 'Gestión de proyectos y aprobaciones', color: 'bg-yellow-500' },
  member: { label: 'Miembro', description: 'Registro de tiempos y tareas asignadas', color: 'bg-blue-500' },
};

export default function RolesPage() {
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>(defaultPermissions);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.success && data.data) {
        setPermissions(data.data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permission: Permission) => {
    setPermissions(prev => {
      const current = prev[selectedRole] || [];
      const updated = current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission];
      return { ...prev, [selectedRole]: updated };
    });
    setHasChanges(true);
    setSaved(false);
  };

  const handleSelectAll = () => {
    const allPerms = modules.flatMap(m => m.permissions.map(p => p.id));
    setPermissions(prev => ({
      ...prev,
      [selectedRole]: allPerms,
    }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleDeselectAll = () => {
    setPermissions(prev => ({
      ...prev,
      [selectedRole]: [],
    }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleReset = () => {
    setPermissions(prev => ({
      ...prev,
      [selectedRole]: defaultPermissions[selectedRole] || [],
    }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          permissions: permissions[selectedRole],
        }),
      });
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setHasChanges(false);
    setSaved(false);
  };

  const currentPermissions = permissions[selectedRole] || [];
  const totalPermissions = modules.reduce((sum, m) => sum + m.permissions.length, 0);
  const enabledCount = currentPermissions.length;

  if (loading) {
    return (
      <PageLayout>
        <Header title="Roles y Permisos" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Configuración' }, { label: 'Roles y Permisos' }]} />
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
        title="Roles y Permisos"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Configuración' }, { label: 'Roles y Permisos' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="subtle" 
              icon={<RotateCcw className="h-4 w-4" />} 
              onClick={handleReset}
            >
              Restablecer
            </Button>
            <Button 
              variant="primary" 
              icon={<Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />}
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saved ? 'Guardado!' : saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        }
      />
      <PageContent className="p-0">
        <div className="flex h-[calc(100vh-140px)]">
          {/* Role Selector Sidebar */}
          <div className="w-72 border-r border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              Roles del Sistema
            </h3>
            <div className="space-y-2">
              {Object.entries(roleInfo).map(([role, info]) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                    selectedRole === role
                      ? 'bg-[var(--color-primary)] text-white shadow-lg'
                      : 'bg-[var(--bg-base)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${info.color}`}>
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className={`font-medium ${selectedRole === role ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                        {info.label}
                      </p>
                      <p className={`text-xs ${selectedRole === role ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                        {info.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[var(--bg-base)] rounded-xl">
              <p className="text-xs text-[var(--text-secondary)] mb-2">Permisos activos</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-[var(--color-primary)]">{enabledCount}</span>
                <span className="text-sm text-[var(--text-secondary)] mb-1">/ {totalPermissions}</span>
              </div>
              <div className="mt-2 h-2 bg-[var(--border-default)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                  style={{ width: `${(enabledCount / totalPermissions) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="flex-1 overflow-auto p-6 bg-[var(--bg-base)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Permisos de {roleInfo[selectedRole as keyof typeof roleInfo].label}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Selecciona los módulos y permisos que tendrá este rol
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="subtle" size="compact" onClick={handleSelectAll}>
                  Seleccionar todo
                </Button>
                <Button variant="subtle" size="compact" onClick={handleDeselectAll}>
                  Deseleccionar todo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {modules.map((module) => (
                <Card key={module.module} className="overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-base)] border-b border-[var(--border-default)]">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
                      {module.icon}
                    </div>
                    <span className="font-medium text-[var(--text-primary)]">{module.module}</span>
                    <span className="ml-auto text-xs text-[var(--text-secondary)]">
                      {module.permissions.filter(p => currentPermissions.includes(p.id)).length}/{module.permissions.length}
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--border-default)]">
                    {module.permissions.map((permission) => {
                      const isEnabled = currentPermissions.includes(permission.id);
                      return (
                        <label
                          key={permission.id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                            isEnabled ? 'bg-[var(--color-primary-light)]/30' : 'hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => handlePermissionToggle(permission.id)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                isEnabled
                                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                                  : 'border-[var(--border-default)]'
                              }`}
                            >
                              {isEnabled && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                          </div>
                          <span className={`text-sm ${isEnabled ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>
                            {permission.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
