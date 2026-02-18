import { NextResponse } from 'next/server';
import { luma } from '@/lib/luma';

export async function GET() {
  try {
    const projects = await luma.query<{
      id: string;
      name: string;
      code: string;
      client: string | null;
      billable: number;
      status: string;
    }>('SELECT id, name, code, client, billable, status FROM projects WHERE status = ? ORDER BY name', ['active']);
    
    return NextResponse.json({ 
      data: projects.map(p => ({
        ...p,
        billable: p.billable === 1
      })), 
      success: true 
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, client, billable = true } = body;
    
    const id = `proj_${Date.now()}`;
    
    await luma.exec(
      'INSERT INTO projects (id, name, code, client, billable) VALUES (?, ?, ?, ?, ?)',
      [id, name, code, client || null, billable ? 1 : 0]
    );
    
    return NextResponse.json({ 
      data: { id, name, code, client, billable }, 
      success: true 
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', success: false },
      { status: 500 }
    );
  }
}
