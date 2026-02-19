'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/');
      } else {
        setError('Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-page)]">
      <div className="w-full max-w-md p-8 bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-elevation-medium)]">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] mb-4">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">TimeOS</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Gestión de Proyectos y Recursos</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[var(--radius-sm)] text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--color-primary)]"
              placeholder="usuario@timeos.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] font-medium hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          <p>Usuarios de prueba:</p>
          <div className="mt-2 space-y-1 text-xs">
            <p>Admin: ana.garcia@timeos.com / admin123</p>
            <p>Usuario: carlos.lopez@timeos.com / carlos123</p>
          </div>
        </div>
      </div>
    </div>
  );
}