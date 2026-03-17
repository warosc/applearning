'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchExams } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Star, ChevronRight, AlertCircle, Settings, HelpCircle } from 'lucide-react';

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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">

      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">EXHCOBA</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Ayuda — siempre visible, estilo botón */}
            <Link
              href="/ayuda"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
            >
              <HelpCircle className="h-4 w-4" />
              Ayuda
            </Link>

            {token && user ? (
              <>
                <span className="hidden sm:block text-sm text-gray-500">{user.name}</span>
                <Link href="/historial" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Historial
                </Link>
                <Link href="/perfil" className="text-sm text-gray-500 hover:text-gray-700">Perfil</Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Settings className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => logout()}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="bg-white border-b px-4 py-14 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm text-blue-700 font-medium">
            <Star className="h-3.5 w-3.5" />
            Plataforma de simulación de exámenes
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
            Simulador EXHCOBA
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Practica con exámenes reales: temporizador, múltiples tipos de preguntas,
            calculadora integrada y resultados detallados.
          </p>
          <div className="mt-6">
            <Link
              href="/ayuda"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium"
            >
              <HelpCircle className="h-4 w-4" />
              ¿Cómo funciona el simulador?
            </Link>
          </div>
        </div>
      </div>

      {/* ── EXÁMENES ── */}
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="mb-5 text-lg font-semibold text-slate-700">Exámenes disponibles</h2>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error de conexión</p>
              <p className="text-sm">{error}. Asegúrate de que el backend está corriendo.</p>
            </div>
          </div>
        )}

        {!loading && !error && exams.length === 0 && (
          <div className="rounded-xl border bg-white px-6 py-12 text-center text-slate-500">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">No hay exámenes disponibles</p>
            <p className="mt-1 text-sm">Ejecuta el seed para crear el examen demo.</p>
          </div>
        )}

        <ul className="space-y-4">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="group rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                    {exam.title}
                  </h3>
                  {exam.description && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{exam.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.duration_minutes ?? exam.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" />
                      {exam.total_score ?? exam.totalScore} pts
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/examen')}
                  className="flex-shrink-0 gap-1"
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
