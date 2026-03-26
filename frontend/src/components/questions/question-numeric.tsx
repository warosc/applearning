'use client';

interface NumericMeta {
  tolerance?: number;
  comparison?: 'range' | 'greater_than' | 'less_than';
  unit?: string;
  units?: string[];
}

interface QuestionNumericProps {
  question: {
    type: string;
    options?: { value: string }[];
    metadata_json?: NumericMeta | null;
  };
  answer: unknown;
  onAnswer: (value: unknown) => void;
}

const COMPARISON_LABELS: Record<string, string> = {
  range: '± tolerancia',
  greater_than: 'mayor que el valor correcto',
  less_than: 'menor que el valor correcto',
};

export function QuestionNumeric({ question, answer, onAnswer }: QuestionNumericProps) {
  const meta = question.metadata_json ?? {};
  const comparison = meta.comparison ?? 'range';
  const tolerance = meta.tolerance ?? 0.001;
  const unit = meta.unit ?? '';
  const units = meta.units ?? [];

  // If teacher set multiple units, student picks one; otherwise use default unit
  const answerObj = (answer && typeof answer === 'object' && !Array.isArray(answer))
    ? (answer as { value?: string; unit?: string })
    : null;

  const numericValue = answerObj?.value ?? (typeof answer === 'string' || typeof answer === 'number' ? String(answer) : '');
  const selectedUnit = answerObj?.unit ?? unit;

  function emitAnswer(val: string, u: string) {
    if (units.length > 0) {
      onAnswer(val === '' ? null : { value: val, unit: u });
    } else {
      onAnswer(val === '' ? null : val);
    }
  }

  const displayUnit = units.length > 0 ? selectedUnit : unit;

  return (
    <div className="space-y-3">
      <label className="block text-sm text-gray-600 font-medium">Escribe tu respuesta numérica:</label>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="number"
          step="any"
          value={numericValue}
          onChange={(e) => emitAnswer(e.target.value, selectedUnit)}
          placeholder="Ingresa el valor..."
          className="w-48 px-4 py-3 text-lg font-mono border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
        />

        {/* Unit selector if multiple units defined, or static unit label */}
        {units.length > 1 ? (
          <select
            value={selectedUnit}
            onChange={(e) => emitAnswer(numericValue, e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white transition-all"
          >
            {units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        ) : displayUnit ? (
          <span className="text-base font-semibold text-gray-600 bg-gray-100 px-3 py-2 rounded-xl border border-gray-200">
            {displayUnit}
          </span>
        ) : null}

        {(numericValue !== '' && numericValue !== null && numericValue !== undefined) && (
          <button
            onClick={() => onAnswer(null)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Borrar
          </button>
        )}
      </div>

      {/* Hint about comparison mode */}
      <p className="text-xs text-gray-400">
        {comparison === 'greater_than' && 'Tu respuesta debe ser mayor que el valor correcto.'}
        {comparison === 'less_than' && 'Tu respuesta debe ser menor que el valor correcto.'}
        {comparison === 'range' && `Puedes usar decimales. Tolerancia: ±${tolerance}`}
        {!comparison && 'Puedes usar decimales.'}
      </p>
    </div>
  );
}
