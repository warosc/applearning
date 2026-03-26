'use client';

interface Option {
  id?: string;
  value: string;
  label: string;
  is_correct?: boolean;
  isCorrect?: boolean;
  image_url?: string | null;
}

interface QuestionSelectProps {
  question: {
    type: string;
    options?: Option[];
  };
  answer: unknown;
  onAnswer: (value: unknown) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function QuestionSelect({ question, answer, onAnswer }: QuestionSelectProps) {
  const options = question.options ?? [];
  const isMultiple = question.type === 'multiple_choice';

  const selectedValues: string[] = isMultiple
    ? Array.isArray(answer) ? (answer as string[]) : []
    : typeof answer === 'string' ? [answer] : [];

  function handleClick(value: string) {
    if (isMultiple) {
      const current = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onAnswer(current);
    } else {
      onAnswer(selectedValues[0] === value ? null : value);
    }
  }

  return (
    <div className="space-y-2.5">
      {isMultiple && (
        <p className="text-xs text-gray-500 mb-3">Selecciona todas las respuestas correctas</p>
      )}
      {options.map((opt, idx) => {
        const letter = LETTERS[idx] ?? String(idx + 1);
        const selected = selectedValues.includes(opt.value);

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleClick(opt.value)}
            className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 transition-all group ${
              selected
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            {/* Letter badge */}
            <span className={`flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
              selected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'
            }`}>
              {letter}
            </span>

            {/* Label + optional image */}
            <span className="flex-1 space-y-2">
              {opt.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.image_url}
                  alt={opt.label}
                  className="max-h-40 rounded-lg object-contain border border-gray-100"
                />
              )}
              <span className={`block text-sm leading-relaxed pt-0.5 ${
                selected ? 'text-blue-900 font-medium' : 'text-gray-700'
              }`}>
                {opt.label}
              </span>
            </span>

            {/* Check indicator */}
            {selected && (
              <span className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
