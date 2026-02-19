import { NextResponse } from 'next/server';
import { getUsers, getUserById, createUser } from '@/lib/luma-docs';

export async function GET() {
  try {
    const users = await getUsers();
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
    const { name, email, role = 'member', password, isActive = true } = body;
    
    const id = `user_${Date.now()}`;
    const user = await createUser({ id, name, email, role, password, isActive });
    
    return NextResponse.json({ data: user, success: true });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', success: false },
      { status: 500 }
    );
  }
}