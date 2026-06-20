import { NextRequest, NextResponse } from 'next/server';
import { createKeyResult, updateKeyResult, deleteKeyResult } from '@/lib/luma-docs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.objectiveId || !body.title) {
      return NextResponse.json({ error: 'objectiveId y title son obligatorios', success: false }, { status: 400 });
    }
    const kr = await createKeyResult({
      id: `kr_${Date.now()}`,
      objectiveId: body.objectiveId,
      title: body.title,
      type: body.type || 'metric',
      unit: body.unit,
      startValue: Number(body.startValue) || 0,
      targetValue: Number(body.targetValue) || (body.type === 'binary' ? 1 : 100),
      currentValue: Number(body.currentValue) || 0,
      weight: Number(body.weight) || 1,
      confidence: body.confidence || 'on_track',
      ownerId: body.ownerId,
      projectId: body.projectId || undefined,
    });
    return NextResponse.json({ data: kr, success: true });
  } catch (error) {
    console.error('Error creating key result:', error);
    return NextResponse.json({ error: 'Failed to create key result', success: false }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: 'id es obligatorio', success: false }, { status: 400 });
    }
    // A value update is also a check-in; stamp the time.
    if (rest.currentValue !== undefined || rest.confidence !== undefined || rest.lastCheckinNote !== undefined) {
      rest.lastCheckinAt = Date.now();
    }
    const updated = await updateKeyResult(id, rest);
    if (!updated) {
      return NextResponse.json({ error: 'KR no encontrado', success: false }, { status: 404 });
    }
    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    console.error('Error updating key result:', error);
    return NextResponse.json({ error: 'Failed to update key result', success: false }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id es obligatorio', success: false }, { status: 400 });
    }
    await deleteKeyResult(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting key result:', error);
    return NextResponse.json({ error: 'Failed to delete key result', success: false }, { status: 500 });
  }
}
