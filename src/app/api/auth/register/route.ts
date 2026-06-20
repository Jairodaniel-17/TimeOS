import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByEmail,
  createUser,
  createOrganization,
  getOrganizationBySlug,
} from '@/lib/luma-docs';
import { sendEmail, welcomeEmail } from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orgName = typeof body.orgName === 'string' ? body.orgName.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!orgName || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios', success: false },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'El correo electrónico no es válido', success: false },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres', success: false },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Ese email ya está registrado', success: false },
        { status: 409 }
      );
    }

    // Build a unique slug for the organization.
    let slug = slugify(orgName) || 'org';
    if (await getOrganizationBySlug(slug)) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const orgId = `org_${Date.now()}`;
    const userId = `user_${Date.now()}`;

    await createOrganization({
      id: orgId,
      name: orgName,
      slug,
      plan: 'free',
      ownerId: userId,
    });

    const user = await createUser({
      id: userId,
      name,
      email,
      role: 'admin',
      password,
      isActive: true,
    });

    // Best-effort welcome email — never block registration on delivery.
    try {
      const tmpl = welcomeEmail(name, orgName);
      await sendEmail({ ...tmpl, to: email });
    } catch {
      // ignore email failure
    }

    return NextResponse.json({
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
      success: true,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'No se pudo crear la cuenta', success: false },
      { status: 500 }
    );
  }
}
