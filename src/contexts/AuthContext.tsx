'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  avatar?: string;
  orgId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void | Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Load user from localStorage safely (only runs once on mount)
const loadUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedUser = localStorage.getItem('timeos_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch {
    localStorage.removeItem('timeos_user');
  }
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setUser(loadUserFromStorage());
    setIsLoading(false);

    // Keep the client session in sync with the server JWT cookie.
    // If any API call returns 401 (e.g. the 8h cookie expired while the
    // localStorage session persisted), clear the session and send the user
    // back to login instead of showing a misleading "failed to load" error.
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      try {
        const input = args[0];
        const url = typeof input === 'string'
          ? input
          : input instanceof Request ? input.url : String(input);
        if (
          response.status === 401 &&
          url.includes('/api/') &&
          !url.includes('/api/auth/login')
        ) {
          localStorage.removeItem('timeos_user');
          setUser(null);
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?expired=1';
          }
        }
      } catch {
        // never let the interceptor break a request
      }
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const userData: User = {
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
          avatar: data.data.avatar,
          orgId: data.data.orgId,
        };
        
        setUser(userData);
        localStorage.setItem('timeos_user', JSON.stringify(userData));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('timeos_user');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}