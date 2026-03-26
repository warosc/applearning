'use client';

import { QuestionSelect } from './question-select';
import { QuestionNumeric } from './question-numeric';
import { QuestionAlgebraic } from './question-algebraic';
import { QuestionDragDrop } from './question-drag-drop';
import { QuestionFillBlank } from './question-fill-blank';
import { QuestionMultiWeighted } from './question-multi-weighted';
import { QuestionInlineChoice } from './question-inline-choice';
import { QuestionImageHotspot } from './question-image-hotspot';

interface Question {
  id: string;
  type: string;
  prompt: string;
  image_url?: string | null;
  materia?: string | null;
  difficulty?: string;
  score?: number;
  metadata_json?: Record<string, unknown> | null;
  options?: Array<{
    id?: string;
    value: string;
    label: string;
    isCorrect?: boolean;
    is_correct?: boolean;
    weight?: number;
    orderIndex?: number;
    order_index?: number;
    image_url?: string | null;
  }>;
  [key: string]: unknown;
}

interface QuestionRendererProps {
  question: Question;
  answer: unknown;
  onAnswer: (value: unknown) => void;
  onToggleMark?: () => void;
  isMarked?: boolean;
}

export function QuestionRenderer({ question, answer, onAnswer }: QuestionRendererProps) {
  // Normalize options to ensure consistent shape for sub-components
  const normalizedQuestion = {
    ...question,
    options: (question.options ?? []).map((o) => ({
      id: o.id ?? o.value,
      value: o.value,
      label: o.label,
      isCorrect: o.isCorrect ?? o.is_correct,
      weight: o.weight ?? 0,
      orderIndex: o.orderIndex ?? o.order_index ?? 0,
      image_url: o.image_url ?? null,
    })),
  };

  const questionImage = question.image_url ?? (question as Record<string, unknown>).imageUrl as string | null | undefined;

  return (
    <div className="space-y-4">
      {/* Question image */}
      {questionImage && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={questionImage}
            alt="Imagen de la pregunta"
            className="w-full max-h-80 object-contain bg-gray-50"
          />
        </div>
      )}

      {/* Type-specific renderer */}
      {(() => {
        switch (question.type) {
          case 'single_choice':
          case 'multiple_choice':
            return (
              <QuestionSelect
                question={normalizedQuestion}
                answer={answer}
                onAnswer={onAnswer}
              />
            );

          case 'numeric':
            return (
              <QuestionNumeric
                question={normalizedQuestion}
                answer={answer}
                onAnswer={onAnswer}
              />
            );

          case 'algebraic':
            return (
              <QuestionAlgebraic
                question={normalizedQuestion}
                answer={answer}
                onAnswer={onAnswer}
              />
            );

          case 'drag_drop':
            return (
              <QuestionDragDrop
                options={normalizedQuestion.options}
                value={Array.isArray(answer) ? (answer as string[]) : []}
                onChange={(v) => onAnswer(v)}
              />
            );

          case 'fill_blank':
            return (
              <QuestionFillBlank
                question={normalizedQuestion}
                answer={answer}
                onAnswer={onAnswer}
              />
            );

          case 'multi_answer_weighted':
            return (
              <QuestionMultiWeighted
                question={normalizedQuestion}
                answer={answer}
                onAnswer={onAnswer}
              />
            );

          case 'inline_choice':
            return (
              <QuestionInlineChoice
                question={normalizedQuestion}
                answer={answer}
                onAnswer={onAnswer}
              />
            );

          case 'image_hotspot':
            return (
              <QuestionImageHotspot
                question={normalizedQuestion}
                answer={answer}
                onAnswer={onAnswer}
              />
            );

          default:
            return (
              <p className="text-gray-400 text-sm italic">
                Tipo de pregunta no soportado: {question.type}
              </p>
            );
        }
      })()}
    </div>
  );
}
