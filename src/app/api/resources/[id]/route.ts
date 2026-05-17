import { NextRequest, NextResponse } from 'next/server';
import { getResourceById, updateResource } from '@/lib/luma-docs';
import { luma } from '@/lib/luma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const resource = await updateResource(id, body);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found', success: false }, { status: 404 });
    }

    return NextResponse.json({ data: resource, success: true });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: 'Failed to update resource', success: false }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await getResourceById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Resource not found', success: false }, { status: 404 });
    }
    await luma.deleteDoc('resources', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource', success: false }, { status: 500 });
  }
}
