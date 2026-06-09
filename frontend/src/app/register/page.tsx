'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { register as registerApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Field } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, GraduationCap, TrendingUp, History } from 'lucide-react';

const schema = z
  .object({
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_]{3,30}$/, 'Solo letras, números y guiones bajos (3-30 caracteres)'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
    name: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const data = await registerApi({
        username: values.username,
        password: values.password,
        name: values.name || undefined,
      });
      setAuth(data.access_token, data.user);
      router.push('/');
    } catch (err) {
      setServerError((err as Error).message);
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
            Empieza a prepararte<br />hoy mismo.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            Crea tu cuenta gratis y accede a simuladores con seguimiento de tu progreso.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-3"><GraduationCap className="h-5 w-5 text-success-300" /> Simuladores con condiciones reales</li>
            <li className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-success-300" /> Mide tu avance por materia</li>
            <li className="flex items-center gap-3"><History className="h-5 w-5 text-success-300" /> Historial de todos tus intentos</li>
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

          <h1 className="font-display text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">Toma unos segundos. Es gratis.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Field
              label="Usuario"
              placeholder="mi_usuario"
              error={errors.username?.message}
              {...register('username')}
            />
            <Field
              label="Nombre completo (opcional)"
              placeholder="Juan Pérez"
              error={errors.name?.message}
              {...register('name')}
            />
            <Field
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Field
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {serverError && (
              <div className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
