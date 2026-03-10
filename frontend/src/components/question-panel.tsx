'use client';

import { cn } from '@/lib/utils';
import { useSimulatorStore } from '@/store/simulator-store';

function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function QuestionPanel() {
  const { questions, currentQuestionIndex, answers, markedForReview, setCurrentQuestion } =
    useSimulatorStore();

  if (questions.length === 0) return null;

  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const markedCount = markedForReview.length;

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Preguntas</h3>
        <span className="text-xs text-slate-500">
          {answeredCount}/{questions.length} respondidas
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const isActive = i === currentQuestionIndex;
          const answered = isAnswered(answers[q.id]);
          const marked = markedForReview.includes(q.id);

          return (
            <button
              key={q.id}
              type="button"
              title={`Pregunta ${i + 1}${answered ? ' — Respondida' : ' — Pendiente'}${marked ? ' — Marcada para revisar' : ''}`}
              onClick={() => setCurrentQuestion(i)}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-all',
                isActive && 'ring-2 ring-blue-500 ring-offset-2',
                answered && !isActive && 'bg-green-100 text-green-800 hover:bg-green-200',
                !answered && !isActive && 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                isActive && answered && 'bg-green-100 text-green-800',
                isActive && !answered && 'bg-blue-50 text-blue-800',
              )}
            >
              {i + 1}
              {marked && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-100 ring-1 ring-green-300" />
          Respondida
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-slate-100 ring-1 ring-slate-300" />
          Pendiente
        </span>
        <span className="flex items-center gap-1">
          <span className="relative inline-block h-3 w-3 rounded bg-slate-100 ring-1 ring-slate-300">
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
          </span>
          Marcada
        </span>
        {markedCount > 0 && (
          <span className="ml-auto text-amber-600 font-medium">
            {markedCount} por revisar
          </span>
        )}
      </div>
    </div>
  );
}
