import { NextResponse } from 'next/server';
import { luma } from '@/lib/luma';

export async function GET() {
  try {
    const users = await luma.query<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>('SELECT id, name, email, role FROM users ORDER BY name');
    
    return NextResponse.json({ data: users, success: true });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role = 'member' } = body;
    
    const id = `user_${Date.now()}`;
    
    await luma.exec(
      'INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)',
      [id, name, email, role]
    );
    
    return NextResponse.json({ 
      data: { id, name, email, role }, 
      success: true 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', success: false },
      { status: 500 }
    );
  }
}
