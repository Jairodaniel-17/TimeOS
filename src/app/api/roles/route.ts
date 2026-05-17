import { NextResponse } from 'next/server';
import { luma } from '@/lib/luma';

const ROLE_PERMISSIONS_KEY = 'role_permissions';

export async function GET() {
  try {
    const doc = await luma.getDoc<Record<string, string[]>>(ROLE_PERMISSIONS_KEY, ROLE_PERMISSIONS_KEY);
    const defaultPermissions = {
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

    const permissions = doc?.doc || defaultPermissions;
    
    return NextResponse.json({ data: permissions, success: true });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role permissions', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { role, permissions } = body;
    
    if (!role || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Role and permissions array required', success: false },
        { status: 400 }
      );
    }

    const doc = await luma.getDoc<Record<string, string[]>>(ROLE_PERMISSIONS_KEY, ROLE_PERMISSIONS_KEY);
    const currentPermissions = doc?.doc || {};
    
    currentPermissions[role] = permissions;
    
    await luma.putDoc(ROLE_PERMISSIONS_KEY, ROLE_PERMISSIONS_KEY, currentPermissions);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions', success: false },
      { status: 500 }
    );
  }
}
