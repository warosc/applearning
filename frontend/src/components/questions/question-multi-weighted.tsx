'use client';

interface Option {
  id?: string;
  value: string;
  label: string;
  weight?: number;
  orderIndex?: number;
}

interface QuestionMultiWeightedProps {
  question: {
    id: string;
    options?: Option[];
  };
  answer: unknown;
  onAnswer: (value: unknown) => void;
}

export function QuestionMultiWeighted({ question, answer, onAnswer }: QuestionMultiWeightedProps) {
  const options = question.options ?? [];
  const selected: string[] = Array.isArray(answer) ? (answer as string[]) : [];

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onAnswer(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
        Selecciona todas las respuestas correctas
      </p>
      <div className="grid gap-2">
        {options.map((opt, i) => {
          const letters = 'ABCDEFGHIJ';
          const letter = letters[i] ?? String(i + 1);
          const isSelected = selected.includes(opt.value);

          return (
            <button
              key={opt.id ?? opt.value}
              onClick={() => toggle(opt.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all ${
                isSelected
                  ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              {/* Checkbox */}
              <span
                className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-400'
                }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>

              {/* Letter badge */}
              <span
                className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                {letter}
              </span>

              <span className="flex-1">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-blue-600 font-medium">
          {selected.length} opción{selected.length !== 1 ? 'es' : ''} seleccionada{selected.length !== 1 ? 's' : ''}
        </p>
      )}

      <p className="text-[11px] text-gray-400 italic">
        Puntaje parcial: cada respuesta correcta seleccionada suma puntos.
      </p>
    </div>
  );
}
