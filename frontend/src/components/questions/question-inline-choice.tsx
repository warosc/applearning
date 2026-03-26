'use client';

/**
 * inline_choice — "Completar la oración"
 *
 * The prompt contains {0}, {1}, … placeholders that become inline dropdowns.
 * Blank options are stored in metadata_json.inline_blanks:
 *   [{ id: 0, options: ["mamá", "mama"], correct: "mamá" }, …]
 *
 * Answer shape: { "0": "mamá", "1": "parque" }
 */

interface InlineBlank {
  id: number;
  options: string[];
  correct?: string; // hidden from students at render time
}

interface QuestionInlineChoiceProps {
  question: {
    prompt: string;
    metadata_json?: {
      inline_blanks?: InlineBlank[];
    } | null;
  };
  answer: unknown;
  onAnswer: (value: unknown) => void;
}

export function QuestionInlineChoice({ question, answer, onAnswer }: QuestionInlineChoiceProps) {
  const blanks: InlineBlank[] = question.metadata_json?.inline_blanks ?? [];
  const current: Record<string, string> = (answer && typeof answer === 'object' && !Array.isArray(answer))
    ? (answer as Record<string, string>)
    : {};

  // Split prompt text by {N} placeholders, preserving newlines
  const segments = parseSegments(question.prompt);

  function handleSelect(blankId: number, value: string) {
    const updated = { ...current, [String(blankId)]: value };
    onAnswer(updated);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
        Selecciona la opción correcta para cada espacio
      </p>

      {/* Render paragraph(s) with inline dropdowns */}
      <div className="text-base leading-relaxed text-gray-800 bg-white border border-gray-200 rounded-xl px-5 py-4 whitespace-pre-wrap">
        {segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i}>{seg.text}</span>;
          }

          // It's a blank
          const blankId = seg.blankId!;
          const blankDef = blanks.find((b) => b.id === blankId);
          const opts = blankDef?.options ?? [];
          const selected = current[String(blankId)] ?? '';

          return (
            <span key={i} className="inline-block mx-1 align-baseline">
              <select
                value={selected}
                onChange={(e) => handleSelect(blankId, e.target.value)}
                className={`border-b-2 bg-transparent focus:outline-none px-1 py-0.5 text-base transition-colors cursor-pointer ${
                  selected
                    ? 'border-blue-500 text-blue-800 font-semibold'
                    : 'border-gray-400 text-gray-400'
                }`}
              >
                <option value="" disabled>▼ elegir</option>
                {opts.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </span>
          );
        })}
      </div>

      {/* Progress chips */}
      {blanks.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {blanks.map((b) => {
            const sel = current[String(b.id)];
            return (
              <span
                key={b.id}
                className={`px-2 py-0.5 rounded-full border ${
                  sel
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                Espacio {b.id + 1}: {sel || '—'}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Parser ──────────────────────────────────────────────────────────────────

type Segment =
  | { type: 'text'; text: string }
  | { type: 'blank'; blankId: number };

function parseSegments(prompt: string): Segment[] {
  const result: Segment[] = [];
  // Match {0}, {1}, {12}, …
  const regex = /\{(\d+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(prompt)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', text: prompt.slice(lastIndex, match.index) });
    }
    result.push({ type: 'blank', blankId: parseInt(match[1], 10) });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < prompt.length) {
    result.push({ type: 'text', text: prompt.slice(lastIndex) });
  }

  return result;
}
