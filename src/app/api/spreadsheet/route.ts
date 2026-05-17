import { NextResponse } from 'next/server';
import { luma } from '@/lib/luma';

interface SpreadsheetDoc {
  id: string;
  userId: string;
  sheets: unknown[];
  updatedAt: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required', success: false }, { status: 400 });

    const result = await luma.getDoc<SpreadsheetDoc>('spreadsheets', `ss_${userId}`);
    return NextResponse.json({ data: result?.doc ?? null, success: true });
  } catch (error) {
    console.error('Error fetching spreadsheet:', error);
    return NextResponse.json({ error: 'Failed to fetch spreadsheet', success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, sheets } = body;
    if (!userId || !sheets) return NextResponse.json({ error: 'userId and sheets are required', success: false }, { status: 400 });

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
