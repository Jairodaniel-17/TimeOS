import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createPasswordReset } from '@/lib/luma-docs';
import { sendEmail, passwordResetEmail } from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    // Always respond success — never leak whether an email exists.
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ success: true });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomUUID();
    await createPasswordReset(token, user.id, email);

    const origin = new URL(request.url).origin;
    const link = `${origin}/reset-password?token=${token}`;

    const tmpl = passwordResetEmail(user.name, link);
    const result = await sendEmail({ ...tmpl, to: email });

    // In dev (no real provider) surface the link so the UI can show it.
    if (result.provider === 'log') {
      return NextResponse.json({ success: true, data: { devLink: link } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot-password error:', error);
    // Still avoid leaking state — respond success.
    return NextResponse.json({ success: true });
  }
}
