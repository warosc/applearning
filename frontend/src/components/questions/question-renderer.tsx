'use client';

import { QuestionSelect } from './question-select';
import { QuestionNumeric } from './question-numeric';
import { QuestionAlgebraic } from './question-algebraic';
import { QuestionDragDrop } from './question-drag-drop';

interface Question {
  id: string;
  type: string;
  prompt: string;
  materia?: string | null;
  difficulty?: string;
  score?: number;
  options?: Array<{ id?: string; value: string; label: string; isCorrect?: boolean; is_correct?: boolean; orderIndex?: number }>;
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
      orderIndex: o.orderIndex,
    })),
  };

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

    default:
      return (
        <p className="text-gray-400 text-sm italic">
          Tipo de pregunta no soportado: {question.type}
        </p>
      );
  }
}
