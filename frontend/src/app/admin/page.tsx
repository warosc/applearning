'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { fetchAdminDashboard } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface DashboardData {
  total_exams: number;
  published_exams: number;
  total_questions: number;
  bank_questions: number;
  total_attempts: number;
  active_today: number;
  avg_percentage: number;
  attempts_by_day: { date: string; count: number }[];
  score_distribution: { range: string; count: number }[];
  top_failed_questions: {
    question_id: string;
    prompt: string;
    materia: string;
    difficulty: string;
    pct_correct: number;
  }[];
}

const DIFFICULTY_BADGE: Record<string, string> = {
  facil: 'bg-green-100 text-green-700',
  medio: 'bg-amber-100 text-amber-700',
  dificil: 'bg-red-100 text-red-700',
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">
        {value}
        {sub && <span className="text-lg text-gray-500 ml-1">{sub}</span>}
      </p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const token = useAuthStore((s) => s.token)!;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminDashboard(token)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  if (!data) return null;

  // Format date labels as short MM/DD
  const chartData = (data.attempts_by_day ?? []).map((d) => ({
    ...d,
    label: d.date ? d.date.slice(5) : d.date,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Simuladores"
          value={`${data.published_exams ?? 0}/${data.total_exams ?? 0}`}
          sub="pub/total"
        />
        <StatCard label="Preguntas (banco)" value={data.bank_questions ?? 0} />
        <StatCard label="Intentos realizados" value={data.total_attempts ?? 0} />
        <StatCard label="Activos hoy" value={data.active_today ?? 0} />
        <StatCard
          label="Promedio general"
          value={`${(data.avg_percentage ?? 0).toFixed(1)}`}
          sub="%"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Line chart: intentos por día */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Intentos por día (últimos 14 días)
          </h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin datos aún.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="Intentos"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart: distribución de resultados */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Distribución de puntajes
          </h2>
          {(data.score_distribution ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin datos aún.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.score_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Intentos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top 10 most failed questions */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">
            Top 10 preguntas más falladas
          </h2>
        </div>
        {(data.top_failed_questions ?? []).length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Sin datos aún.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-700">Pregunta</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Materia</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Dificultad</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">% Correcto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.top_failed_questions.map((q) => (
                <tr key={q.question_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-gray-800">
                      {q.prompt.length > 80 ? q.prompt.slice(0, 80) + '…' : q.prompt}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{q.materia || '—'}</td>
                  <td className="px-4 py-3">
                    {q.difficulty ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_BADGE[q.difficulty] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {q.difficulty}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-[100px]">
                        <div
                          className="h-full rounded-full bg-red-400"
                          style={{ width: `${q.pct_correct ?? 0}%` }}
                        />
                      </div>
                      <span className="text-gray-600 text-xs w-10 text-right">
                        {(q.pct_correct ?? 0).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
