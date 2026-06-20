import { NextRequest, NextResponse } from 'next/server';
import { getObjectivesWithDetails, createObjective } from '@/lib/luma-docs';

export async function GET() {
  try {
    const objectives = await getObjectivesWithDetails();
    return NextResponse.json({ data: objectives, success: true });
  } catch (error) {
    console.error('Error fetching OKRs:', error);
    return NextResponse.json({ error: 'Failed to fetch OKRs', success: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.ownerId || !body.level || !body.period) {
      return NextResponse.json({ error: 'title, ownerId, level y period son obligatorios', success: false }, { status: 400 });
    }
    const objective = await createObjective({
      id: `obj_${Date.now()}`,
      title: body.title,
      description: body.description,
      level: body.level,
      ownerId: body.ownerId,
      parentId: body.parentId || undefined,
      period: body.period,
      periodType: body.periodType || 'quarterly',
      type: body.type || 'aspirational',
      strategicTheme: body.strategicTheme || 'none',
      status: body.status || 'on_track',
    });
    return NextResponse.json({ data: objective, success: true });
  } catch (error) {
    console.error('Error creating objective:', error);
    return NextResponse.json({ error: 'Failed to create objective', success: false }, { status: 500 });
  }
}
