import { NextRequest, NextResponse } from 'next/server';
import { getObjectiveById, updateObjective, deleteObjective } from '@/lib/luma-docs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await getObjectiveById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Objetivo no encontrado', success: false }, { status: 404 });
    }
    const { id: _id, createdAt: _c, ...updates } = body;
    const updated = await updateObjective(id, updates);
    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    console.error('Error updating objective:', error);
    return NextResponse.json({ error: 'Failed to update objective', success: false }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteObjective(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting objective:', error);
    return NextResponse.json({ error: 'Failed to delete objective', success: false }, { status: 500 });
  }
}
