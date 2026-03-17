'use client';

import { CheckCircle2, XCircle, MinusCircle, Trophy, Clock, RotateCcw, TrendingUp } from 'lucide-react';

interface ResultItem {
  question_id?: string;
  questionId?: string;
  prompt?: string;
  is_correct?: boolean | null;
  isCorrect?: boolean | null;
  score_obtained?: number | null;
  scoreObtained?: number | null;
  max_score?: number;
  scorePossible?: number;
  answer_json?: unknown;
  answerJson?: unknown;
}

interface MateriaItem {
  materia: string;
  score_obtained: number;
  total_score: number;
  percentage: number;
  correct: number;
  incorrect: number;
  omitted: number;
}

interface ResultData {
  // snake_case fields (new API shape)
  correct?: number;
  incorrect?: number;
  omitted?: number;
  score_obtained?: number;
  total_score?: number;
  percentage?: number;
  time_spent_seconds?: number | null;
  by_materia?: MateriaItem[];
  questions?: ResultItem[];
  // camelCase fields (old API shape)
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  totalObtained?: number;
  totalPossible?: number;
  perQuestion?: ResultItem[];
}

function fmt(s: number | null | undefined): string {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${String(sec).padStart(2, '0')}s`;
}

function formatAnswer(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.length === 0 ? '—' : v.join(', ');
  return String(v);
}

interface ResultsViewProps {
  result: unknown;
  onRestart: () => void;
  // Legacy props — accepted but not required
  questions?: unknown[];
  answers?: Record<string, unknown>;
}

export function ResultsView({ result, onRestart }: ResultsViewProps) {
  const data = result as ResultData | null;
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-gray-400">No hay resultados disponibles.</p>
    </div>
  );

  // Normalize both API shapes
  const correct = data.correct ?? data.correctCount ?? 0;
  const incorrect = data.incorrect ?? data.incorrectCount ?? 0;
  const omitted = data.omitted ?? data.unansweredCount ?? 0;
  const scoreObtained = data.score_obtained ?? data.totalObtained ?? 0;
  const totalScore = data.total_score ?? data.totalPossible ?? 100;
  const pct = data.percentage ?? 0;
  const timeSpent = data.time_spent_seconds ?? null;
  const byMateria: MateriaItem[] = data.by_materia ?? [];
  const questionItems: ResultItem[] = data.questions ?? data.perQuestion ?? [];

  const passed = pct >= 60;

  // Score ring SVG
  const radius = 48;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (pct / 100);
  const ringColor = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Hero card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className={`px-6 py-5 ${passed ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-slate-600 to-slate-700'} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Resultado del simulador</p>
                <h1 className="text-2xl font-bold mt-0.5">
                  {passed ? '¡Excelente resultado!' : 'Simulador completado'}
                </h1>
              </div>
              <Trophy className={`h-12 w-12 ${passed ? 'text-yellow-300' : 'text-slate-400'}`} />
            </div>
          </div>

          <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-8">
            {/* Score ring */}
            <div className="flex-shrink-0 relative">
              <svg width={120} height={120} className="-rotate-90">
                <circle cx={60} cy={60} r={radius} stroke="#e5e7eb" strokeWidth={10} fill="none" />
                <circle
                  cx={60} cy={60} r={radius}
                  stroke={ringColor} strokeWidth={10} fill="none"
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{pct.toFixed(0)}%</span>
                <span className="text-xs text-gray-400">aciertos</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 flex-1 w-full">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{scoreObtained.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-0.5">de {totalScore} pts</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-lg font-bold text-gray-900">{fmt(timeSpent)}</p>
                <p className="text-xs text-gray-500">tiempo usado</p>
              </div>
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-green-600">{correct}</p>
                <p className="text-xs text-green-700">correctas</p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-red-600">{incorrect}</p>
                <p className="text-xs text-red-700">incorrectas</p>
              </div>
              {omitted > 0 && (
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-center col-span-2">
                  <p className="text-xl font-bold text-gray-500">{omitted}</p>
                  <p className="text-xs text-gray-500">omitidas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress insight */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
          <TrendingUp className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            {pct >= 70
              ? 'Tu desempeño es muy bueno. Sigue practicando para consolidar tus conocimientos.'
              : pct >= 50
              ? 'Buen intento. Repasa los temas donde cometiste errores y vuelve a intentarlo.'
              : 'Te recomendamos estudiar más los temas del EXHCOBA antes de tu siguiente intento.'}
          </p>
        </div>

        {/* Per-materia breakdown */}
        {byMateria.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-gray-800">Resultado por materia</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {byMateria.map((m) => {
                const barColor = m.percentage >= 70 ? 'bg-green-500' : m.percentage >= 50 ? 'bg-amber-400' : 'bg-red-400';
                return (
                  <div key={m.materia} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">{m.materia}</span>
                      <span className="text-sm font-bold text-gray-700">
                        {m.score_obtained.toFixed(1)}<span className="text-xs text-gray-400 font-normal">/{m.total_score.toFixed(1)} pts</span>
                        <span className="ml-2 text-xs text-gray-500">{m.percentage.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${barColor} transition-all duration-700`}
                        style={{ width: `${Math.min(100, m.percentage)}%` }}
                      />
                    </div>
                    <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="text-green-600">{m.correct} correctas</span>
                      <span className="text-red-500">{m.incorrect} incorrectas</span>
                      {m.omitted > 0 && <span>{m.omitted} omitidas</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question breakdown */}
        {questionItems.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-gray-800">Detalle por pregunta</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {questionItems.map((q, i) => {
                const isCorrect = q.is_correct ?? q.isCorrect ?? null;
                const score = q.score_obtained ?? q.scoreObtained ?? 0;
                const maxScore = q.max_score ?? q.scorePossible ?? 0;
                const answerVal = q.answer_json ?? q.answerJson;
                const prompt = q.prompt ?? '';

                return (
                  <div key={q.question_id ?? q.questionId ?? i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      {isCorrect === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {isCorrect === false && <XCircle className="h-5 w-5 text-red-500" />}
                      {isCorrect === null && <MinusCircle className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Pregunta {i + 1}</p>
                      {prompt && (
                        <p className="text-sm text-gray-800 line-clamp-2">{prompt}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Tu respuesta: <span className="text-gray-600 font-medium">{formatAnswer(answerVal)}</span>
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                        {(score ?? 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">/{maxScore.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Restart */}
        <div className="flex justify-center gap-3 pb-4">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir / PDF
          </button>
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
