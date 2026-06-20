'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Clock, CheckCircle, BarChart3 } from 'lucide-react';

export default function SignupPage() {
  const [orgName, setOrgName]       = useState('');
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPass] = useState(false);
  const [error, setError]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, name, email, password }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        router.push('/login?registered=1');
      } else {
        setError(json.error || 'No se pudo crear la cuenta.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Clock,        text: 'Registro de horas por proyecto y tarea' },
    { icon: CheckCircle,  text: 'Flujo de aprobaciones integrado' },
    { icon: BarChart3,    text: 'Reportes y costos en tiempo real' },
  ];

  return (
    <div className="min-h-screen flex bg-redwood-page font-sans">

      {/* ── Left — Oracle-brand panel ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-oracle-sidebar px-10 xl:px-14 py-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full border border-white/[.06]" />
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full border border-white/[.06]" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full border border-white/[.06]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-oracle-red font-extrabold text-white text-lg tracking-tighter">
              T
            </div>
            <div>
              <div className="text-white font-bold text-lg">TimeOS</div>
              <div className="text-white/60 text-[11px] mt-0.5">by Orvanta ERP</div>
            </div>
          </div>

          <h2 className="text-[32px] xl:text-[36px] font-bold text-white leading-[1.15] tracking-[-0.025em] mb-4">
            Crea tu espacio
            <br />
            <span className="text-white/60">en minutos</span>
          </h2>
          <p className="text-white/60 text-[15px] leading-[1.6] mb-10">
            Empieza gratis. Configura tu organización y empieza a gestionar tiempos hoy.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white/[.10] border border-white/[.12] flex-shrink-0">
                  <f.icon className="h-4 w-4 text-white/70" />
                </div>
                <span className="text-white/70 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © 2026 TimeOS · Orvanta ERP
        </p>
      </div>

      {/* ── Right — Signup form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-oracle-sidebar font-extrabold text-white text-[15px]">
              T
            </div>
            <span className="text-xl font-bold text-redwood-text">TimeOS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-redwood-text tracking-[-0.025em] mb-2">
              Crear cuenta
            </h1>
            <p className="text-redwood-muted text-[15px] leading-[1.55]">
              Configura tu organización para empezar.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-alert-border bg-alert-bg px-4 py-3 text-sm text-alert-text">
              <span className="mt-px">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <label className="text-[13px] font-bold text-redwood-text">
                Nombre de la organización
              </label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                placeholder="Mi Empresa"
                required
                autoComplete="organization"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-[13px] font-bold text-redwood-text">
                Tu nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                placeholder="Ana García"
                required
                autoComplete="name"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-[13px] font-bold text-redwood-text">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                placeholder="usuario@empresa.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-[13px] font-bold text-redwood-text">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 pr-10 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-redwood-muted hover:text-redwood-text transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[40px] flex items-center justify-center gap-2 rounded-[10px] bg-redwood-primary text-white text-sm font-semibold hover:bg-redwood-primary-hover active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creando...
                </span>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-redwood-muted">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold text-redwood-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
