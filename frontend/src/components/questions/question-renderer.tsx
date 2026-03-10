'use client';

import { useCallback } from 'react';
import { QuestionSelect } from './question-select';
import { QuestionNumeric } from './question-numeric';
import { QuestionAlgebraic } from './question-algebraic';
import { QuestionDragDrop } from './question-drag-drop';
import { useSimulatorStore } from '@/store/simulator-store';
import { Button } from '@/components/ui/button';
import { Flag } from 'lucide-react';

interface Question {
  id: string;
  type: string;
  prompt: string;
  options?: Array<{ id: string; label: string; value: string; isCorrect?: boolean; orderIndex?: number }>;
  score: number;
}

interface QuestionRendererProps {
  question: Question;
  onAnswerSave?: (questionId: string, value: unknown) => void;
}

export function QuestionRenderer({ question, onAnswerSave }: QuestionRendererProps) {
  const { answers, setAnswer, markedForReview, toggleMarkForReview } = useSimulatorStore();
  const value = answers[question.id];

  const handleChange = useCallback(
    (v: unknown) => {
      setAnswer(question.id, v);
      onAnswerSave?.(question.id, v);
    },
    [question.id, setAnswer, onAnswerSave]
  );

  const marked = markedForReview.includes(question.id);

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="text-lg font-medium text-slate-800">{question.prompt}</p>
        <Button
          variant={marked ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleMarkForReview(question.id)}
        >
          <Flag className="mr-1 h-4 w-4" />
          {marked ? 'Marcada' : 'Marcar'}
        </Button>
      </div>

      <div className="mt-4">
        {question.type === 'single_choice' && (
          <QuestionSelect
            options={(question.options ?? []).map((o) => ({
              id: (o as { id?: string }).id ?? o.value,
              label: o.label,
              value: o.value,
            }))}
            value={(value as string) ?? null}
            onChange={(v) => handleChange(v)}
          />
        )}
        {question.type === 'multiple_choice' && (
          <QuestionSelect
            options={(question.options ?? []).map((o) => ({
              id: (o as { id?: string }).id ?? o.value,
              label: o.label,
              value: o.value,
            }))}
            value={(value as string[]) ?? []}
            onChange={(v) => handleChange(v)}
            multiple
          />
        )}
        {question.type === 'numeric' && (
          <QuestionNumeric
            value={(value as string) ?? ''}
            onChange={(v) => handleChange(v)}
          />
        )}
        {question.type === 'algebraic' && (
          <QuestionAlgebraic
            value={(value as string) ?? ''}
            onChange={(v) => handleChange(v)}
          />
        )}
        {question.type === 'drag_drop' && (
          <QuestionDragDrop
            options={(question.options ?? []).map((o) => ({
              id: (o as { id?: string }).id ?? o.value,
              label: o.label,
              value: o.value,
              orderIndex: o.orderIndex,
            }))}
            value={(value as string[]) ?? []}
            onChange={(v) => handleChange(v)}
          />
        )}
      </div>
    </div>
  );
}
