'use client';

interface QuestionNumericProps {
  question: { type: string; options?: { value: string }[] };
  answer: unknown;
  onAnswer: (value: unknown) => void;
}

export function QuestionNumeric({ answer, onAnswer }: QuestionNumericProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm text-gray-600 font-medium">Escribe tu respuesta numérica:</label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          step="any"
          value={typeof answer === 'string' || typeof answer === 'number' ? String(answer) : ''}
          onChange={(e) => onAnswer(e.target.value === '' ? null : e.target.value)}
          placeholder="Ingresa el valor..."
          className="w-48 px-4 py-3 text-lg font-mono border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
        />
        {(answer !== null && answer !== undefined && answer !== '') && (
          <button
            onClick={() => onAnswer(null)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Borrar
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">Puedes usar decimales. Ej: 3.14</p>
    </div>
  );
}
