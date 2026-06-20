import { NextRequest, NextResponse } from 'next/server';
import { createInitiative, updateInitiative, deleteInitiative } from '@/lib/luma-docs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.objectiveId || !body.title) {
      return NextResponse.json({ error: 'objectiveId y title son obligatorios', success: false }, { status: 400 });
    }
    const initiative = await createInitiative({
      id: `init_${Date.now()}`,
      objectiveId: body.objectiveId,
      keyResultId: body.keyResultId || undefined,
      title: body.title,
      description: body.description,
      status: body.status || 'todo',
      projectId: body.projectId || undefined,
      taskId: body.taskId || undefined,
      ownerId: body.ownerId,
    });
    return NextResponse.json({ data: initiative, success: true });
  } catch (error) {
    console.error('Error creating initiative:', error);
    return NextResponse.json({ error: 'Failed to create initiative', success: false }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: 'id es obligatorio', success: false }, { status: 400 });
    }
    const updated = await updateInitiative(id, rest);
    if (!updated) {
      return NextResponse.json({ error: 'Iniciativa no encontrada', success: false }, { status: 404 });
    }
    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    console.error('Error updating initiative:', error);
    return NextResponse.json({ error: 'Failed to update initiative', success: false }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id es obligatorio', success: false }, { status: 400 });
    }
    await deleteInitiative(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting initiative:', error);
    return NextResponse.json({ error: 'Failed to delete initiative', success: false }, { status: 500 });
  }
}
