'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function Header({ title, subtitle, breadcrumbs, actions }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.style.setProperty('--ripple-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--ripple-y', `${e.clientY}px`);

    const apply = () => {
      setIsDark(!isDark);
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    };

    const vt = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;
    if (vt) {
      vt.call(document, apply);
    } else {
      apply();
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    /* Redwood topbar pattern */
    <header className="flex justify-between items-start gap-5 px-7 pt-6 pb-5 flex-shrink-0">
      {/* Left — eyebrow + title */}
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-redwood-muted text-[11px]">/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-[13px] font-semibold uppercase tracking-[.08em] text-redwood-muted hover:text-redwood-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[13px] font-semibold uppercase tracking-[.08em] text-redwood-muted">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-[28px] leading-[1.12] tracking-[-0.035em] font-bold text-redwood-text">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-redwood-muted text-[15px] max-w-[680px] leading-[1.55]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right — actions + controls */}
      <div className="flex items-center gap-2.5 flex-wrap justify-end pt-1">
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
        {user && <NotificationBell userId={user.id} />}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          <span className="theme-toggle-track">
            <Sun  className="theme-toggle-icon theme-toggle-icon-sun"  />
            <Moon className="theme-toggle-icon theme-toggle-icon-moon" />
            <span className="theme-toggle-thumb" />
          </span>
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(s => !s)}
            className={clsx(
              'flex items-center justify-center h-9 w-9 rounded-full',
              'bg-oracle-sidebar text-white text-xs font-bold',
              'hover:opacity-90 transition-opacity shadow-rw'
            )}
          >
            {initials}
          </button>

          {showUserMenu && (
            <div
              className={clsx(
                'absolute right-0 mt-2 w-52 rounded-[14px] border border-redwood-border',
                'bg-redwood-surface shadow-rw-dropdown py-1 z-50',
                'animate-[slideUp_120ms_ease-out]'
              )}
            >
              {user && (
                <div className="px-4 py-3 border-b border-redwood-border mb-1">
                  <div className="text-sm font-semibold text-redwood-text truncate">{user.name}</div>
                  <div className="text-xs text-redwood-muted truncate mt-0.5">{user.email}</div>
                </div>
              )}
              {[
                { href: '/notifications', label: 'Notificaciones' },
                { href: '/settings', label: 'Configuración' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center px-4 py-2 text-sm text-redwood-text hover:bg-redwood-hover-bg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="h-px bg-redwood-border my-1" />
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className="flex w-full items-center px-4 py-2 text-sm text-redwood-danger hover:bg-badge-subtle-danger-bg transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Layout helpers ── */
export function PageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col h-screen overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function PageContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex-1 overflow-y-auto px-7 pb-8', className)}>
      {children}
    </div>
  );
}
