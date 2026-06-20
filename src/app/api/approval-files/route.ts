import { NextResponse } from 'next/server';
import {
  getApprovalFiles,
  createApprovalFile,
  deleteApprovalFile,
  APPROVAL_FILES_BUCKET,
} from '@/lib/luma-docs';
import { luma } from '@/lib/luma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phaseApprovalId = searchParams.get('phaseApprovalId');
    
    if (!phaseApprovalId) {
      return NextResponse.json({ error: 'phaseApprovalId is required', success: false }, { status: 400 });
    }
    
    const files = await getApprovalFiles(phaseApprovalId);
    
    return NextResponse.json({ data: files, success: true });
  } catch (error) {
    console.error('Error fetching approval files:', error);
    return NextResponse.json({ error: 'Failed to fetch approval files', success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phaseApprovalId, name, type, size, data, uploadedBy } = body;

    const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    // Los bytes (base64 del cliente) van al blob store, NO dentro del documento.
    let blobKey: string | undefined;
    if (typeof data === 'string' && data.length > 0) {
      const bytes = Buffer.from(data, 'base64');
      await luma.putBlob(APPROVAL_FILES_BUCKET, id, bytes);
      blobKey = id;
    }

    const file = await createApprovalFile({
      id,
      phaseApprovalId,
      name,
      type,
      size,
      blobKey,
      uploadedBy,
    });

    return NextResponse.json({ data: file, success: true });
  } catch (error) {
    console.error('Error creating approval file:', error);
    return NextResponse.json({ error: 'Failed to create approval file', success: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'id is required', success: false }, { status: 400 });
    }
    
    await deleteApprovalFile(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting approval file:', error);
    return NextResponse.json({ error: 'Failed to delete approval file', success: false }, { status: 500 });
  }
}
