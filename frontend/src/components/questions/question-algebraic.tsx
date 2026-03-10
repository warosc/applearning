'use client';

interface QuestionAlgebraicProps {
  question: { type: string; options?: { value: string }[] };
  answer: unknown;
  onAnswer: (value: unknown) => void;
}

export function QuestionAlgebraic({ answer, onAnswer }: QuestionAlgebraicProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm text-gray-600 font-medium">Escribe tu expresión algebraica:</label>
      <input
        type="text"
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswer(e.target.value === '' ? null : e.target.value)}
        placeholder="Ej: x² + 2x + 1 ó x^2+2x+1"
        className="w-full px-4 py-3 text-base font-mono border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
        spellCheck={false}
        autoComplete="off"
      />
      <p className="text-xs text-gray-400">Usa ^ para potencias. Ej: x^2 para x²</p>
    </div>
  );
}
