'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { fetchAnalytics, fetchQuestionStats } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

interface OverallStats {
  total_attempts: number;
  avg_score: number;
  avg_percentage: number;
  completion_rate: number;
}

interface QuestionStat {
  question_id: string;
  prompt: string;
  materia: string;
  difficulty: string;
  total_answers: number;
  correct_answers: number;
  pct_correct: number;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  facil: 'bg-green-100 text-green-700',
  medio: 'bg-amber-100 text-amber-700',
  dificil: 'bg-red-100 text-red-700',
};

export default function AnalyticsPage() {
  const token = useAuthStore((s) => s.token)!;
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [questions, setQuestions] = useState<QuestionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchAnalytics(token), fetchQuestionStats(token)])
      .then(([s, q]) => {
        setStats(s);
        setQuestions(Array.isArray(q) ? q : []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const mostFailed = [...questions].sort((a, b) => a.pct_correct - b.pct_correct).slice(0, 10);
  const mostPassed = [...questions].sort((a, b) => b.pct_correct - a.pct_correct).slice(0, 10);
  const chartData = [...questions].sort((a, b) => a.pct_correct - b.pct_correct).slice(0, 20);

  const statCards = [
    { label: 'Total intentos', value: String(stats?.total_attempts ?? 0) },
    { label: 'Promedio general', value: `${(stats?.avg_percentage ?? 0).toFixed(1)}%` },
    { label: 'Prom. puntaje', value: `${(stats?.avg_score ?? 0).toFixed(1)} pts` },
    { label: 'Tasa de completado', value: `${(stats?.completion_rate ?? 0).toFixed(1)}%` },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">% Aciertos por pregunta (Top 20 más difíciles)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="question_id" hide />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                formatter={(v: unknown) => [`${(v as number).toFixed(1)}%`, '% correcto']}
                labelFormatter={() => ''}
              />
              <Bar dataKey="pct_correct" radius={[3, 3, 0, 0]}>
                {chartData.map((q) => (
                  <Cell
                    key={q.question_id}
                    fill={q.pct_correct < 40 ? '#ef4444' : q.pct_correct < 70 ? '#f59e0b' : '#22c55e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Question tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Most failed */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b px-5 py-3">
            <h2 className="font-semibold text-gray-800">Preguntas más falladas</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Pregunta</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">% Acierto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mostFailed.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400">Sin datos</td></tr>
              )}
              {mostFailed.map((q) => (
                <tr key={q.question_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <p className="truncate max-w-[200px] text-gray-800 text-xs">{q.prompt}</p>
                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_BADGE[q.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${q.pct_correct}%` }} />
                      </div>
                      <span className="text-red-600 font-medium">{q.pct_correct.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Most passed */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b px-5 py-3">
            <h2 className="font-semibold text-gray-800">Preguntas más acertadas</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Pregunta</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">% Acierto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mostPassed.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400">Sin datos</td></tr>
              )}
              {mostPassed.map((q) => (
                <tr key={q.question_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <p className="truncate max-w-[200px] text-gray-800 text-xs">{q.prompt}</p>
                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_BADGE[q.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${q.pct_correct}%` }} />
                      </div>
                      <span className="text-green-600 font-medium">{q.pct_correct.toFixed(0)}%</span>
                    </div>
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
