import { NextRequest, NextResponse } from 'next/server';
import { getSprints, createSprint, updateSprint, deleteSprint } from '@/lib/luma-docs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const status = searchParams.get('status') || undefined;
    const sprints = await getSprints({ projectId, status });
    return NextResponse.json({ data: sprints, success: true });
  } catch (error) {
    console.error('Error fetching sprints:', error);
    return NextResponse.json({ error: 'Failed to fetch sprints', success: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.projectId || !body.name) {
      return NextResponse.json({ error: 'projectId y name son obligatorios', success: false }, { status: 400 });
    }
    const sprint = await createSprint({
      id: `sprint_${Date.now()}`,
      projectId: body.projectId,
      name: body.name,
      goal: body.goal,
      status: body.status || 'planned',
      startDate: body.startDate,
      endDate: body.endDate,
    });
    return NextResponse.json({ data: sprint, success: true });
  } catch (error) {
    console.error('Error creating sprint:', error);
    return NextResponse.json({ error: 'Failed to create sprint', success: false }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'id es obligatorio', success: false }, { status: 400 });
    }
    const updated = await updateSprint(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Sprint no encontrado', success: false }, { status: 404 });
    }
    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    console.error('Error updating sprint:', error);
    return NextResponse.json({ error: 'Failed to update sprint', success: false }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id es obligatorio', success: false }, { status: 400 });
    }
    await deleteSprint(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sprint:', error);
    return NextResponse.json({ error: 'Failed to delete sprint', success: false }, { status: 500 });
  }
}
