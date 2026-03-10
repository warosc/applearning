'use client';

import { CheckCircle2, XCircle, MinusCircle, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  type: string;
  prompt: string;
  score: number;
}

interface PerQuestionResult {
  questionId: string;
  isCorrect: boolean | null;
  scoreObtained: number;
  scorePossible: number;
  answered: boolean;
}

interface ResultSummary {
  totalObtained?: number;
  totalPossible?: number;
  percentage?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  perQuestion?: PerQuestionResult[];
}

interface ResultsViewProps {
  result: Record<string, unknown>;
  questions: Question[];
  answers: Record<string, unknown>;
  onRestart: () => void;
}

function formatAnswer(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.length === 0 ? '—' : value.join(', ');
  return String(value);
}

function ScoreRing({ percentage }: { percentage: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 70 ? '#16a34a' : percentage >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold" style={{ color }}>
          {percentage.toFixed(0)}%
        </p>
      </div>
    </div>
  );
}

export function ResultsView({ result, questions, answers, onRestart }: ResultsViewProps) {
  const r = result as ResultSummary;
  const totalObtained = r.totalObtained ?? 0;
  const totalPossible = r.totalPossible ?? 100;
  const percentage = r.percentage ?? 0;
  const correctCount = r.correctCount ?? 0;
  const incorrectCount = r.incorrectCount ?? 0;
  const unansweredCount = r.unansweredCount ?? 0;
  const perQuestion = r.perQuestion ?? [];

  const passed = percentage >= 60;

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Tarjeta principal */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
          <div className="mb-2 flex justify-center">
            <Trophy className={cn('h-10 w-10', passed ? 'text-amber-400' : 'text-slate-400')} />
          </div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">
            {passed ? '¡Examen completado!' : 'Examen finalizado'}
          </h1>
          <p className="mb-6 text-slate-500">
            {passed ? 'Superaste el umbral de aprobación.' : 'No alcanzaste el umbral mínimo. ¡Sigue practicando!'}
          </p>

          <div className="flex justify-center mb-6">
            <ScoreRing percentage={percentage} />
          </div>

          <p className="text-3xl font-bold text-slate-800">
            {totalObtained.toFixed(1)} <span className="text-lg font-normal text-slate-500">/ {totalPossible} pts</span>
          </p>

          <div className="mt-6 grid grid-cols-3 divide-x rounded-xl border bg-slate-50 text-center">
            <div className="p-4">
              <p className="text-2xl font-bold text-green-600">{correctCount}</p>
              <p className="text-xs text-slate-500 mt-1">Correctas</p>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold text-red-500">{incorrectCount}</p>
              <p className="text-xs text-slate-500 mt-1">Incorrectas</p>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold text-slate-400">{unansweredCount}</p>
              <p className="text-xs text-slate-500 mt-1">Sin responder</p>
            </div>
          </div>
        </div>

        {/* Desglose por pregunta */}
        {questions.length > 0 && (
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="font-semibold text-slate-800">Desglose de respuestas</h2>
            </div>
            <ul className="divide-y">
              {questions.map((q, i) => {
                const answer = answers[q.id];
                const perQ = perQuestion.find((p) => p.questionId === q.id);
                const isCorrect = perQ?.isCorrect ?? null;
                const scoreObtained = perQ?.scoreObtained ?? 0;

                return (
                  <li key={q.id} className="flex items-start gap-3 px-6 py-4">
                    <div className="flex-shrink-0 pt-0.5">
                      {isCorrect === null ? (
                        <MinusCircle className="h-5 w-5 text-slate-300" />
                      ) : isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        <span className="mr-2 text-slate-400">{i + 1}.</span>
                        {q.prompt}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Tu respuesta:{' '}
                        <span className="font-mono text-slate-700">{formatAnswer(answer)}</span>
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={cn('text-sm font-semibold', isCorrect ? 'text-green-600' : isCorrect === false ? 'text-red-500' : 'text-slate-400')}>
                        {scoreObtained.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-400">/{q.score} pts</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex justify-center">
          <Button onClick={onRestart} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </main>
  );
}
