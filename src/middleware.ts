import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/init',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (PUBLIC_API_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('timeos_session')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', success: false },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Session expired. Please log in again.', success: false },
      { status: 401 }
    );
  }

  // Protect destructive admin-only routes
  if (pathname.startsWith('/api/reset') && payload.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: admin access required', success: false },
      { status: 403 }
    );
  }

  // /api/check-users can reset passwords to known defaults — admin only.
  if (pathname.startsWith('/api/check-users') && payload.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: admin access required', success: false },
      { status: 403 }
    );
  }

  // Forward user identity in request headers for API handlers.
  // Importante: usamos `set` (no `append`) para SOBRESCRIBIR cualquier header
  // que el cliente haya intentado falsificar (x-user-id / x-org-id). La fuente
  // de verdad es el JWT verificado, no la request entrante.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-role', payload.role);
  // x-org-id: scope multi-tenant que consume el data layer (org-context.ts).
  if (payload.orgId) {
    requestHeaders.set('x-org-id', payload.orgId);
  } else {
    // Sesión sin organización: garantizamos que NO se filtre un x-org-id
    // entrante falsificado.
    requestHeaders.delete('x-org-id');
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: '/api/:path*',
};
