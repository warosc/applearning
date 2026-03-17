'use client';

interface Option {
  id?: string;
  value: string;
  label: string;
  orderIndex?: number;
}

interface QuestionFillBlankProps {
  question: {
    id: string;
    prompt: string;
    options?: Option[];
    metadata_json?: { free_text?: boolean } | null;
  };
  answer: unknown;
  onAnswer: (value: unknown) => void;
}

export function QuestionFillBlank({ question, answer, onAnswer }: QuestionFillBlankProps) {
  const options = question.options ?? [];
  const isFreeText = !options.length || question.metadata_json?.free_text === true;

  if (isFreeText) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Escribe tu respuesta</p>
        <input
          type="text"
          value={typeof answer === 'string' ? answer : ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Escribe aquí..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>
    );
  }

  const currentValue = typeof answer === 'string' ? answer : '';

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Selecciona la opción correcta</p>
      <div className="grid gap-2">
        {options.map((opt, i) => {
          const letters = 'ABCDEFGHIJ';
          const letter = letters[i] ?? String(i + 1);
          const isSelected = currentValue === opt.value;

          return (
            <button
              key={opt.id ?? opt.value}
              onClick={() => onAnswer(isSelected ? '' : opt.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all ${
                isSelected
                  ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <span
                className={`flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${
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
    </div>
  );
}
