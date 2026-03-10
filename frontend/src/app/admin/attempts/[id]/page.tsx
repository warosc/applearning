'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { fetchAdminAttemptDetail } from '@/lib/api';
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Flag } from 'lucide-react';

interface QuestionBreakdown {
  question_id: string;
  prompt: string;
  type: string;
  materia: string | null;
  difficulty: string;
  answer_json: unknown;
  is_correct: boolean | null;
  score_obtained: number | null;
  max_score: number;
  is_marked_for_review: boolean;
}

interface AttemptDetail {
  attempt_id: string;
  status: string;
  total_score: number;
  score_obtained: number;
  percentage: number;
  correct: number;
  incorrect: number;
  omitted: number;
  time_spent_seconds: number | null;
  questions: QuestionBreakdown[];
}

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
};

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Enviado',
  expired: 'Expirado',
  in_progress: 'En progreso',
};

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatAnswer(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export default function AttemptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token)!;
  const [data, setData] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    fetchAdminAttemptDetail(token, id)
      .then(setData)
      .catch(() => setError('No se pudo cargar el intento'))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-red-600 py-8">{error || 'No encontrado'}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Intento</p>
            <p className="text-sm font-mono text-gray-700">{data.attempt_id}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE[data.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[data.status] ?? data.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Puntaje</p>
            <p className="text-xl font-bold text-gray-900">
              {data.score_obtained.toFixed(1)}
              <span className="text-sm font-normal text-gray-400"> / {data.total_score}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Porcentaje</p>
            <p className="text-xl font-bold text-gray-900">{data.percentage.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tiempo</p>
            <p className="text-xl font-bold text-gray-900">{formatTime(data.time_spent_seconds)}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-green-600">Correctas</p>
              <p className="text-lg font-bold text-green-700">{data.correct}</p>
            </div>
            <div>
              <p className="text-xs text-red-600">Incorrectas</p>
              <p className="text-lg font-bold text-red-700">{data.incorrect}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Omitidas</p>
              <p className="text-lg font-bold text-gray-700">{data.omitted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold text-gray-800">Detalle por pregunta</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-8">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Pregunta</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Respuesta</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Resultado</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.questions.map((q, i) => (
                <tr key={q.question_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800 line-clamp-2 max-w-xs">{q.prompt}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {q.materia && <span className="text-[10px] text-gray-400">{q.materia}</span>}
                      {q.is_marked_for_review && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                          <Flag className="h-2.5 w-2.5" /> Marcada
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px]">
                    <span className="truncate block">{formatAnswer(q.answer_json)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {q.is_correct === true && <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />}
                    {q.is_correct === false && <XCircle className="h-5 w-5 text-red-500 mx-auto" />}
                    {q.is_correct === null && <MinusCircle className="h-5 w-5 text-gray-400 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {(q.score_obtained ?? 0).toFixed(2)}
                    <span className="text-gray-400">/{q.max_score.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
