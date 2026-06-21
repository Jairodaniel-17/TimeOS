import { NextResponse } from 'next/server';
import { luma } from '@/lib/luma';
import { currentUserId } from '@/lib/org-context';

interface SpreadsheetDoc {
  id: string;
  userId: string;
  sheets: unknown[];
  updatedAt: number;
}

export async function GET() {
  try {
    // El userId SIEMPRE sale de la sesión, nunca del query del cliente: así un
    // usuario no puede leer la hoja de cálculo de otro pasando su id (IDOR).
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });

    const result = await luma.getDoc<SpreadsheetDoc>('spreadsheets', `ss_${userId}`);
    return NextResponse.json({ data: result?.doc ?? null, success: true });
  } catch (error) {
    console.error('Error fetching spreadsheet:', error);
    return NextResponse.json({ error: 'Failed to fetch spreadsheet', success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });

    const body = await request.json();
    const { sheets } = body;
    if (!sheets) return NextResponse.json({ error: 'sheets is required', success: false }, { status: 400 });

    const doc: SpreadsheetDoc = {
      id: `ss_${userId}`,
      userId,
      sheets,
      updatedAt: Date.now(),
    };

    await luma.putDoc('spreadsheets', doc.id, doc);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving spreadsheet:', error);
    return NextResponse.json({ error: 'Failed to save spreadsheet', success: false }, { status: 500 });
  }
}
