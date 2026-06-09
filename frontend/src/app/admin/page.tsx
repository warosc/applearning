'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { fetchAdminDashboard } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BookOpen, Database, ClipboardList, Users, Percent } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/spinner';

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

const DIFFICULTY_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  facil: 'success',
  medio: 'warning',
  dificil: 'danger',
};

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

  if (loading) return <LoadingState label="Cargando dashboard…" />;
  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-danger-600">{error}</p>
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
      <PageHeader title="Dashboard" description="Resumen general de la plataforma" />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Simuladores" value={`${data.published_exams ?? 0}/${data.total_exams ?? 0}`} hint="publicados / total" icon={BookOpen} accent="brand" />
        <StatCard label="Preguntas (banco)" value={data.bank_questions ?? 0} icon={Database} accent="info" />
        <StatCard label="Intentos" value={data.total_attempts ?? 0} icon={ClipboardList} accent="success" />
        <StatCard label="Activos hoy" value={data.active_today ?? 0} icon={Users} accent="warning" />
        <StatCard label="Promedio general" value={`${(data.avg_percentage ?? 0).toFixed(1)}%`} icon={Percent} accent="brand" />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Intentos por día (últimos 14 días)</CardTitle></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Sin datos aún.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#1e3a8a" strokeWidth={2.5} dot={false} name="Intentos" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribución de puntajes</CardTitle></CardHeader>
          <CardContent>
            {(data.score_distribution ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Sin datos aún.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.score_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(30,58,138,0.06)' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#1e3a8a" radius={[6, 6, 0, 0]} name="Intentos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 10 most failed questions */}
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Top 10 preguntas más falladas</CardTitle></CardHeader>
        {(data.top_failed_questions ?? []).length === 0 ? (
          <p className="px-6 pb-8 text-center text-sm text-slate-400">Sin datos aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 text-left font-semibold">Pregunta</th>
                  <th className="px-4 py-3 text-left font-semibold">Materia</th>
                  <th className="px-4 py-3 text-left font-semibold">Dificultad</th>
                  <th className="px-6 py-3 text-left font-semibold">% Correcto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.top_failed_questions.map((q) => (
                  <tr key={q.question_id} className="transition-colors hover:bg-slate-50/70">
                    <td className="max-w-xs px-6 py-3">
                      <p className="truncate font-medium text-slate-800">
                        {q.prompt.length > 80 ? q.prompt.slice(0, 80) + '…' : q.prompt}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{q.materia || '—'}</td>
                    <td className="px-4 py-3">
                      {q.difficulty ? (
                        <Badge variant={DIFFICULTY_VARIANT[q.difficulty] ?? 'neutral'} className="capitalize">{q.difficulty}</Badge>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 max-w-[120px] flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-danger-400 transition-all duration-500" style={{ width: `${q.pct_correct ?? 0}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs font-medium text-slate-600">
                          {(q.pct_correct ?? 0).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
