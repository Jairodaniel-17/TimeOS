import { NextRequest, NextResponse } from 'next/server';
import { getClientById, updateClient } from '@/lib/luma-docs';
import { luma } from '@/lib/luma';
import { clientSchema } from '@/lib/validation';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false },
        { status: 400 }
      );
    }

    const client = await updateClient(id, parsed.data);
    if (!client) {
      return NextResponse.json({ error: 'Client not found', success: false }, { status: 404 });
    }

    return NextResponse.json({ data: client, success: true });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client', success: false }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await getClientById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Client not found', success: false }, { status: 404 });
    }
    await luma.deleteDoc('clients', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client', success: false }, { status: 500 });
  }
}
