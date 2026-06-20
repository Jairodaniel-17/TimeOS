'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Always render public routes immediately (no loading spinner)
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Show loading state only for protected routes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-redwood-muted">
          <div className="w-5 h-5 border-2 border-redwood-border border-t-redwood-primary rounded-full animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  // Require authentication
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}