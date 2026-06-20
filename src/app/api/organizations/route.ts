import { NextResponse } from 'next/server';
import { getOrganizations, getUsers } from '@/lib/luma-docs';

export async function GET() {
  try {
    const [orgs, users] = await Promise.all([getOrganizations(), getUsers()]);
    const data = orgs.map(org => {
      const members = users.filter(u => u.orgId === org.id);
      const owner = users.find(u => u.id === org.ownerId);
      return {
        ...org,
        ownerName: owner?.name || '—',
        memberCount: members.length,
        members: members.map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role, isActive: m.isActive })),
      };
    });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations', success: false }, { status: 500 });
  }
}
