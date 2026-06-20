import { NextRequest, NextResponse } from 'next/server';
import { getApprovalFileById, APPROVAL_FILES_BUCKET } from '@/lib/luma-docs';
import { luma } from '@/lib/luma';

// Descarga del adjunto: lee los bytes del blob store (o del base64 legacy) y los
// sirve con su content-type. Así el front no recibe base64 en los listados.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = await getApprovalFileById(id);
    if (!file) {
      return NextResponse.json({ error: 'Archivo no encontrado', success: false }, { status: 404 });
    }

    let ab: ArrayBuffer | null = null;
    if (file.blobKey) {
      ab = await luma.getBlob(APPROVAL_FILES_BUCKET, file.blobKey);
    } else if (file.data) {
      const buf = Buffer.from(file.data, 'base64');
      ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    if (!ab) {
      return NextResponse.json({ error: 'Contenido no disponible', success: false }, { status: 404 });
    }

    return new NextResponse(ab, {
      status: 200,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': String(ab.byteLength),
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error downloading approval file:', error);
    return NextResponse.json({ error: 'Failed to download file', success: false }, { status: 500 });
  }
}
