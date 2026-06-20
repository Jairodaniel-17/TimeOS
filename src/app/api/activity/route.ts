import { NextResponse } from 'next/server';
import { getActivity, getUsers } from '@/lib/luma-docs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required', success: false },
        { status: 400 }
      );
    }

    const [activity, users] = await Promise.all([
      getActivity({ entityType, entityId }),
      getUsers(),
    ]);
    const userMap = new Map(users.map(u => [u.id, u]));

    const enriched = activity.map(a => ({
      ...a,
      user: { name: userMap.get(a.userId)?.name || '' },
    }));

    return NextResponse.json({ data: enriched, success: true });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity', success: false },
      { status: 500 }
    );
  }
}
