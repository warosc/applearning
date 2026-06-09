'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchExams } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Clock, BookOpen, Star, ChevronRight, AlertCircle, Settings, HelpCircle, Dumbbell, ArrowRight, Timer, ListChecks, Calculator } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description?: string;
  // backend returns snake_case; support both
  total_score?: number;
  totalScore?: number;
  duration_minutes?: number;
  durationMinutes?: number;
  is_published?: boolean;
  isPublished?: boolean;
}

export function HomeClient() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams()
      .then((data) => setExams(Array.isArray(data) ? data.filter((e: Exam) => e.is_published ?? e.isPublished) : []))
      .catch(() => setError('No se pudo conectar con el servidor'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex-shrink-0">
            <Logo />
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/practica"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-brand-50 hover:text-brand-700"
            >
              <Dumbbell className="h-4 w-4" />
              <span className="hidden sm:inline">Práctica</span>
            </Link>
            <Link
              href="/ayuda"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-brand-50 hover:text-brand-700"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Ayuda</span>
            </Link>

            {token && user ? (
              <>
                <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
                <Link href="/historial" className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 sm:block">
                  Historial
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-700 transition-all hover:bg-brand-50"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <Link href="/perfil" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-slate-100" title="Mi perfil">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                    {(user.name ?? 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-sm font-medium text-slate-700 sm:block">{user.name}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">Iniciar sesión</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.35), transparent 35%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 text-success-300" />
            Plataforma oficial de simulación EXHCOBA
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Prepárate con exámenes
            <span className="block text-success-300">como los reales</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Temporizador, múltiples tipos de pregunta, calculadora integrada y resultados
            detallados por materia. Practica hasta dominarlo.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#examenes">
              <Button size="lg" className="bg-white text-brand-800 hover:bg-slate-100">
                Ver exámenes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link href="/ayuda">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                <HelpCircle className="h-4 w-4" />
                ¿Cómo funciona?
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/75">
            <span className="flex items-center gap-2"><Timer className="h-4 w-4 text-success-300" /> Con temporizador</span>
            <span className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-success-300" /> Resultados por materia</span>
            <span className="flex items-center gap-2"><Calculator className="h-4 w-4 text-success-300" /> Calculadora integrada</span>
          </div>
        </div>
      </section>

      {/* ── EXÁMENES ── */}
      <div id="examenes" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-12">
        <h2 className="mb-5 font-display text-xl font-bold text-slate-900">Exámenes disponibles</h2>

        {loading && (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-4 h-4 w-32" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-4 text-danger-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error de conexión</p>
              <p className="text-sm">{error}. Asegúrate de que el backend está corriendo.</p>
            </div>
          </div>
        )}

        {!loading && !error && exams.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="No hay exámenes disponibles"
            description="Aún no se han publicado simuladores. Vuelve más tarde."
          />
        )}

        <ul className="space-y-4">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="card-surface hover-lift group p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-slate-900 transition-colors group-hover:text-brand-700">
                    {exam.title}
                  </h3>
                  {exam.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{exam.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-brand-600" />
                      {exam.duration_minutes ?? exam.durationMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                      <Star className="h-3.5 w-3.5 text-success-600" />
                      {exam.total_score ?? exam.totalScore} pts
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => router.push(`/examen?exam=${exam.id}`)}
                  className="flex-shrink-0"
                >
                  Iniciar
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
