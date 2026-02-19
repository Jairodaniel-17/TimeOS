'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type Permission = 
  // Projects
  | 'projects:read' | 'projects:create' | 'projects:update' | 'projects:delete'
  // Tasks
  | 'tasks:read' | 'tasks:create' | 'tasks:update' | 'tasks:delete'
  // Timesheets
  | 'timesheets:read' | 'timesheets:create' | 'timesheets:update' | 'timesheets:delete' | 'timesheets:approve'
  // Resources
  | 'resources:read' | 'resources:create' | 'resources:update' | 'resources:delete'
  // Reports
  | 'reports:read' | 'reports:costs'
  // Approvals
  | 'approvals:read' | 'approvals:manage'
  // Settings
  | 'settings:read' | 'settings:update'
  // Users
  | 'users:read' | 'users:create' | 'users:update' | 'users:delete';

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    'projects:read', 'projects:create', 'projects:update', 'projects:delete',
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
    'timesheets:read', 'timesheets:create', 'timesheets:update', 'timesheets:delete', 'timesheets:approve',
    'resources:read', 'resources:create', 'resources:update', 'resources:delete',
    'reports:read', 'reports:costs',
    'approvals:read', 'approvals:manage',
    'settings:read', 'settings:update',
    'users:read', 'users:create', 'users:update', 'users:delete',
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
  ],
  member: [
    'projects:read',
    'tasks:read',
    'timesheets:read', 'timesheets:create', 'timesheets:update', 'timesheets:delete',
    'resources:read',
    'reports:read',
    'settings:read',
  ],
};

export function usePermissions() {
  const { user } = useAuth();
  
  const role = user?.role || 'member';
  const permissions = rolePermissions[role] || rolePermissions.member;
  
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };
  
  const hasAnyPermission = (...perms: Permission[]): boolean => {
    return perms.some(p => permissions.includes(p));
  };
  
  const hasAllPermissions = (...perms: Permission[]): boolean => {
    return perms.every(p => permissions.includes(p));
  };
  
  return {
    role,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isMember: role === 'member',
  };
}

// Helper component for conditional rendering
interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = usePermissions();
  if (hasPermission(permission)) {
    return children as React.ReactElement;
  }
  return fallback as React.ReactElement | null;
}

// Helper for any permission
interface AnyPermissionGateProps {
  permissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AnyPermissionGate({ permissions, children, fallback = null }: AnyPermissionGateProps) {
  const { hasAnyPermission } = usePermissions();
  if (hasAnyPermission(...permissions)) {
    return children as React.ReactElement;
  }
  return fallback as React.ReactElement | null;
}
