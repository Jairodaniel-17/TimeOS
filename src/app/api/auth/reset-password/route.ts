import { NextRequest, NextResponse } from 'next/server';
import { getPasswordReset, markPasswordResetUsed, updateUser } from '@/lib/luma-docs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido', success: false },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres', success: false },
        { status: 400 }
      );
    }

    const reset = await getPasswordReset(token);
    if (!reset || reset.used || reset.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'El enlace no es válido o ha expirado', success: false },
        { status: 400 }
      );
    }

    const updated = await updateUser(reset.userId, { password });
    if (!updated) {
      return NextResponse.json(
        { error: 'No se pudo actualizar la contraseña', success: false },
        { status: 400 }
      );
    }

    await markPasswordResetUsed(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset-password error:', error);
    return NextResponse.json(
      { error: 'No se pudo restablecer la contraseña', success: false },
      { status: 500 }
    );
  }
}
