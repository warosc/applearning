'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchExams } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Star, ChevronRight, AlertCircle, Settings } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description?: string;
  totalScore: number;
  durationMinutes: number;
  isPublished: boolean;
}

export function HomeClient() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams()
      .then((data) => setExams(Array.isArray(data) ? data.filter((e: Exam) => e.isPublished) : []))
      .catch(() => setError('No se pudo conectar con el servidor'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-end items-center gap-3 text-sm">
        {token && user ? (
          <>
            <span className="text-gray-600">{user.name}</span>
            <Link href="/historial" className="text-blue-600 hover:text-blue-800">
              Mi historial
            </Link>
            <Link href="/perfil" className="text-sm text-gray-500 hover:text-gray-700">Mi perfil</Link>
            {user.role === 'admin' && (
              <Link href="/admin" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            )}
            <button onClick={() => logout()} className="text-red-500 hover:text-red-700">Salir</button>
          </>
        ) : (
          <Link href="/login" className="text-blue-600 hover:text-blue-800">Iniciar sesión</Link>
        )}
      </div>

      {/* Hero */}
      <div className="border-b bg-white px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm text-blue-700">
            <Star className="h-3.5 w-3.5" />
            Plataforma de simulación de exámenes
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
            Simulador de Examen
          </h1>
          <p className="text-lg text-slate-600">
            Practica con exámenes reales: temporizador, múltiples tipos de preguntas,
            calculadora integrada y resultados detallados.
          </p>
        </div>
      </div>

      {/* Exámenes disponibles */}
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold text-slate-800">Exámenes disponibles</h2>

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
                      {exam.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" />
                      {exam.totalScore} pts
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
