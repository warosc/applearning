'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchMyAttempts } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface Attempt {
  id: string;
  exam_title: string;
  status: 'submitted' | 'expired' | 'in_progress';
  score_obtained: number | null;
  percentage: number | null;
  time_used_seconds: number | null;
  started_at: string;
}

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function StatusBadge({ status }: { status: Attempt['status'] }) {
  const styles: Record<Attempt['status'], string> = {
    submitted: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
  };
  const labels: Record<Attempt['status'], string> = {
    submitted: 'Enviado',
    expired: 'Expirado',
    in_progress: 'En progreso',
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function HistorialPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    fetchMyAttempts(token)
      .then((data: Attempt[]) => setAttempts(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, user, router]);

  if (!token || !user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi historial</h1>
            <p className="text-sm text-gray-500 mt-1">Todos tus intentos de examen</p>
          </div>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            Volver al inicio
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && attempts.length === 0 && (
          <div className="rounded-xl border bg-white px-6 py-16 text-center text-gray-500">
            <p className="font-medium text-gray-700 mb-2">No has realizado ningún intento aún.</p>
            <Link
              href="/"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Ir al inicio
            </Link>
          </div>
        )}

        {/* Table */}
        {!loading && !error && attempts.length > 0 && (
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Examen</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Puntaje</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Tiempo usado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{attempt.exam_title}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={attempt.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {attempt.score_obtained != null
                        ? `${attempt.score_obtained} / ${attempt.percentage != null ? `${attempt.percentage}%` : ''}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatTime(attempt.time_used_seconds)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(attempt.started_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {(attempt.status === 'submitted' || attempt.status === 'expired') ? (
                        <Link
                          href={`/examen?attempt=${attempt.id}`}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          Ver resultado
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
