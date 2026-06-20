import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/luma-docs';
import { signToken } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const rl = rateLimit(`login:${clientIp(request)}`, 10, 5 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.', success: false },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

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

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
    });

    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      data: userWithoutPassword,
      success: true,
    });

    response.cookies.set('timeos_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', success: false },
      { status: 500 }
    );
  }
}
