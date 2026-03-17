'use client';

import { useState } from 'react';

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Opción única' },
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'fill_blank', label: 'Completar oración' },
  { value: 'multi_answer_weighted', label: 'Multi-respuesta ponderada' },
  { value: 'numeric', label: 'Numérico' },
  { value: 'algebraic', label: 'Algebraico' },
  { value: 'drag_drop', label: 'Ordenar (drag & drop)' },
];

// Backend uses snake_case — use it throughout
interface Option {
  id?: string;
  label: string;
  value: string;
  is_correct: boolean;
  weight: number;
  order_index: number;
}

interface QuestionData {
  id?: string;
  type: string;
  prompt: string;
  score: number;
  order_index: number;
  materia?: string;
  tema?: string;
  metadata_json?: Record<string, unknown> | null;
  options: Option[];
}

interface Props {
  examId: string;
  initialData?: object;
  onSave: (data: object) => void;
  onCancel: () => void;
}

function normalizeOption(o: Record<string, unknown>, i: number): Option {
  return {
    id: o.id as string | undefined,
    label: (o.label as string) ?? '',
    value: (o.value as string) ?? '',
    is_correct: (o.is_correct ?? o.isCorrect ?? false) as boolean,
    weight: (o.weight ?? 0) as number,
    order_index: (o.order_index ?? o.orderIndex ?? i) as number,
  };
}

export function QuestionEditor({ initialData, onSave, onCancel }: Props) {
  const init = initialData as Record<string, unknown> | undefined;

  const [type, setType] = useState((init?.type as string) ?? 'single_choice');
  const [prompt, setPrompt] = useState((init?.prompt as string) ?? '');
  const [score, setScore] = useState((init?.score as number) ?? 10);
  const [orderIndex, setOrderIndex] = useState(
    (init?.order_index ?? init?.orderIndex ?? 0) as number
  );
  const [materia, setMateria] = useState((init?.materia as string) ?? '');
  const [tema, setTema] = useState((init?.tema as string) ?? '');
  const [expectedAnswer, setExpectedAnswer] = useState(
    ((init?.metadata_json ?? init?.metadataJson) as Record<string, unknown> | null)?.expected as string ?? ''
  );
  const [options, setOptions] = useState<Option[]>(() => {
    const raw = (init?.options as Record<string, unknown>[] | undefined) ?? [];
    return raw.map(normalizeOption);
  });

  const hasOptions = ['single_choice', 'multiple_choice', 'drag_drop', 'fill_blank', 'multi_answer_weighted'].includes(type);
  const hasWeight = type === 'multi_answer_weighted';
  const hasExpected = ['numeric', 'algebraic'].includes(type);

  function addOption() {
    setOptions((prev) => [
      ...prev,
      { label: '', value: `opt${prev.length}`, is_correct: false, weight: 0, order_index: prev.length },
    ]);
  }

  function removeOption(idx: number) {
    setOptions((prev) =>
      prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, order_index: i }))
    );
  }

  function updateOption(idx: number, patch: Partial<Option>) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: QuestionData = {
      ...(init?.id ? { id: init.id as string } : {}),
      type,
      prompt,
      score,
      order_index: orderIndex,
      ...(materia ? { materia } : {}),
      ...(tema ? { tema } : {}),
      options: hasOptions ? options : [],
      metadata_json: hasExpected ? { expected: expectedAnswer } : null,
    };
    onSave(data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-blue-200 rounded-xl p-5 bg-blue-50 space-y-4"
    >
      <h3 className="font-semibold text-blue-700 text-sm">
        {init?.id ? 'Editar pregunta' : 'Nueva pregunta'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Enunciado</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Puntaje</label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
              <input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Materia / Tema */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Materia</label>
          <input
            type="text"
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
            placeholder="ej. Español"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tema</label>
          <input
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="ej. Sinónimos"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {hasExpected && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Respuesta esperada</label>
          <input
            type="text"
            value={expectedAnswer}
            onChange={(e) => setExpectedAnswer(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-xs"
          />
        </div>
      )}

      {hasOptions && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">
              Opciones
              {hasWeight && <span className="ml-1 text-gray-400">(peso suma 1.0)</span>}
            </label>
            <button type="button" onClick={addOption} className="text-xs text-blue-600 hover:text-blue-800">
              + Agregar opción
            </button>
          </div>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {/* Correct indicator — not shown for drag_drop */}
                {type !== 'drag_drop' && (
                  <input
                    type={type === 'single_choice' || type === 'fill_blank' ? 'radio' : 'checkbox'}
                    checked={opt.is_correct}
                    onChange={(e) => {
                      if (type === 'single_choice' || type === 'fill_blank') {
                        setOptions((prev) => prev.map((o, i) => ({ ...o, is_correct: i === idx })));
                      } else {
                        updateOption(idx, { is_correct: e.target.checked });
                      }
                    }}
                    name={type === 'single_choice' || type === 'fill_blank' ? 'correct' : undefined}
                    className="h-4 w-4 shrink-0"
                    title="Marcar como correcto"
                  />
                )}
                {type === 'drag_drop' && (
                  <span className="text-xs text-gray-400 w-4 text-center">{idx + 1}</span>
                )}

                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) =>
                    updateOption(idx, {
                      label: e.target.value,
                      value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    })
                  }
                  placeholder="Etiqueta"
                  required
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {/* Weight — only for multi_answer_weighted */}
                {hasWeight && (
                  <input
                    type="number"
                    value={opt.weight}
                    onChange={(e) => updateOption(idx, { weight: Number(e.target.value) })}
                    min={0}
                    max={1}
                    step={0.1}
                    placeholder="peso"
                    title="Peso (0.0–1.0)"
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}

                <button type="button" onClick={() => removeOption(idx)} className="text-red-400 hover:text-red-600 text-xs">
                  ✕
                </button>
              </div>
            ))}
          </div>
          {type === 'drag_drop' && (
            <p className="text-xs text-gray-400 mt-1">El orden de arriba a abajo es el orden correcto.</p>
          )}
          {type === 'fill_blank' && (
            <p className="text-xs text-gray-400 mt-1">Selecciona con el radio la opción correcta.</p>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-800 px-4 py-1.5 rounded-lg border border-gray-300 bg-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium"
        >
          {init?.id ? 'Guardar cambios' : 'Crear pregunta'}
        </button>
      </div>
    </form>
  );
}
