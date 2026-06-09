'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Logo } from '@/components/ui/logo';
import { Field } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Timer, ListChecks, Calculator, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      setAuth(data.access_token, data.user);
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Brand panel (desktop) ── */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 85% 10%, rgba(16,185,129,0.4), transparent 35%)' }} />
        <Link href="/" className="relative">
          <Logo wordmarkClassName="text-white" markClassName="ring-2 ring-white/20 rounded-2xl" />
        </Link>
        <div className="relative">
          <h2 className="font-display text-3xl font-extrabold leading-tight">
            Tu preparación,<br />de nivel profesional.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            Inicia sesión para retomar tus simuladores, revisar tu historial y seguir mejorando tu desempeño.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-3"><Timer className="h-5 w-5 text-success-300" /> Exámenes cronometrados como los reales</li>
            <li className="flex items-center gap-3"><ListChecks className="h-5 w-5 text-success-300" /> Resultados detallados por materia</li>
            <li className="flex items-center gap-3"><Calculator className="h-5 w-5 text-success-300" /> Calculadora y herramientas integradas</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© Escobita · Simulador EXHCOBA</p>
      </div>

      {/* ── Form ── */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/"><Logo /></Link>
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-500">Bienvenido de vuelta. Ingresa tus datos.</p>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-700">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Demo: <code className="rounded bg-white/70 px-1 font-semibold">admin / admin123</code></span>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field
              label="Usuario"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
            <Field
              label="Contraseña"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 space-y-1 text-center text-sm text-slate-500">
            <p>
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="font-semibold text-brand-700 hover:underline">Regístrate</Link>
            </p>
            <p>
              <Link href="/" className="text-slate-400 hover:text-slate-600 hover:underline">Volver al inicio</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
