import { NextResponse } from 'next/server';
import { luma } from '@/lib/luma';
import { currentOrgId } from '@/lib/org-context';

// Centinela que no matchea ninguna org real → listas fail-closed sin sesión.
const NO_ORG = ' __no_org__';

interface DocumentDoc {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64
  folder: string;
  uploadedBy: string;
  orgId?: string;
  uploadedAt: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    const orgId = (await currentOrgId()) ?? NO_ORG;
    const docs = await luma.findDocs<DocumentDoc>('documents', { orgId }, 500);
    let documents = docs.map(d => d.doc);

    if (folder && folder !== 'all') {
      documents = documents.filter(d => d.folder === folder);
    }

    return NextResponse.json({
      data: documents.map(d => ({ ...d, content: undefined, sizeFormatted: formatSize(d.size) })),
      success: true,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents', success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, content, folder, uploadedBy } = body;

    if (!name || !content) {
      return NextResponse.json({ error: 'name and content are required', success: false }, { status: 400 });
    }

    const base64Content = content.includes(',') ? content.split(',')[1] : content;
    const sizeBytes = Math.ceil(base64Content.length * 0.75);

    if (sizeBytes > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 5 MB limit', success: false }, { status: 400 });
    }

    const doc: DocumentDoc = {
      id: `doc_${Date.now()}`,
      name,
      type: type || name.split('.').pop() || 'bin',
      size: sizeBytes,
      content: base64Content,
      folder: folder || 'all',
      uploadedBy: uploadedBy || 'Unknown',
      orgId: (await currentOrgId()) ?? undefined,
      uploadedAt: Date.now(),
    };

    await luma.putDoc('documents', doc.id, doc);

    return NextResponse.json({
      data: { ...doc, content: undefined, sizeFormatted: formatSize(doc.size) },
      success: true,
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document', success: false }, { status: 500 });
  }
}

export async function GET_ONE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required', success: false }, { status: 400 });

    const result = await luma.getDoc<DocumentDoc>('documents', id);
    const orgId = await currentOrgId();
    if (!result || (orgId && result.doc.orgId !== orgId)) {
      return NextResponse.json({ error: 'Document not found', success: false }, { status: 404 });
    }

    return NextResponse.json({ data: result.doc, success: true });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Failed to fetch document', success: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required', success: false }, { status: 400 });

    // Ownership: solo se borra un documento de la org del request.
    const existing = await luma.getDoc<DocumentDoc>('documents', id);
    const orgId = await currentOrgId();
    if (!existing || (orgId && existing.doc.orgId !== orgId)) {
      return NextResponse.json({ error: 'Document not found', success: false }, { status: 404 });
    }

    await luma.deleteDoc('documents', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document', success: false }, { status: 500 });
  }
}
