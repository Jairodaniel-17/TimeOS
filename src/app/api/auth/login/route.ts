import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/luma-docs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', success: false },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials', success: false },
        { status: 401 }
      );
    }

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      data: userWithoutPassword,
      success: true,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', success: false },
      { status: 500 }
    );
  }
}