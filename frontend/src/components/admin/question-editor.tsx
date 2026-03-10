'use client';

import { useState } from 'react';

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Opción única' },
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'numeric', label: 'Numérico' },
  { value: 'algebraic', label: 'Algebraico' },
  { value: 'drag_drop', label: 'Ordenar (drag & drop)' },
];

interface Option {
  id?: string;
  label: string;
  value: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface QuestionData {
  id?: string;
  type: string;
  prompt: string;
  score: number;
  orderIndex: number;
  metadataJson?: Record<string, unknown> | null;
  options: Option[];
}

interface Props {
  examId: string;
  initialData?: QuestionData;
  onSave: (data: QuestionData) => void;
  onCancel: () => void;
}

export function QuestionEditor({ initialData, onSave, onCancel }: Props) {
  const [type, setType] = useState(initialData?.type ?? 'single_choice');
  const [prompt, setPrompt] = useState(initialData?.prompt ?? '');
  const [score, setScore] = useState(initialData?.score ?? 10);
  const [orderIndex, setOrderIndex] = useState(initialData?.orderIndex ?? 0);
  const [expectedAnswer, setExpectedAnswer] = useState(
    (initialData?.metadataJson?.expected as string) ?? '',
  );
  const [options, setOptions] = useState<Option[]>(
    initialData?.options ?? [],
  );

  const hasOptions = ['single_choice', 'multiple_choice', 'drag_drop'].includes(type);
  const hasExpected = ['numeric', 'algebraic'].includes(type);

  function addOption() {
    setOptions((prev) => [
      ...prev,
      { label: '', value: `opt${prev.length}`, isCorrect: false, orderIndex: prev.length },
    ]);
  }

  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, orderIndex: i })));
  }

  function updateOption(idx: number, patch: Partial<Option>) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: QuestionData = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      type,
      prompt,
      score,
      orderIndex,
      options: hasOptions ? options : [],
      metadataJson: hasExpected ? { expected: expectedAnswer } : null,
    };
    onSave(data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-blue-200 rounded-xl p-5 bg-blue-50 space-y-4"
    >
      <h3 className="font-semibold text-blue-700 text-sm">
        {initialData?.id ? 'Editar pregunta' : 'Nueva pregunta'}
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
            <label className="text-xs font-medium text-gray-600">Opciones</label>
            <button
              type="button"
              onClick={addOption}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + Agregar opción
            </button>
          </div>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {type !== 'drag_drop' && (
                  <input
                    type={type === 'single_choice' ? 'radio' : 'checkbox'}
                    checked={opt.isCorrect}
                    onChange={(e) => {
                      if (type === 'single_choice') {
                        setOptions((prev) =>
                          prev.map((o, i) => ({ ...o, isCorrect: i === idx })),
                        );
                      } else {
                        updateOption(idx, { isCorrect: e.target.checked });
                      }
                    }}
                    name={type === 'single_choice' ? 'correct' : undefined}
                    className="h-4 w-4 shrink-0"
                    title="Marcar como correcto"
                  />
                )}
                {type === 'drag_drop' && (
                  <span className="text-xs text-gray-400 w-4 text-center">{idx}</span>
                )}
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => updateOption(idx, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="Etiqueta"
                  required
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {type === 'drag_drop' && (
            <p className="text-xs text-gray-400 mt-1">El orden de arriba a abajo es el orden correcto.</p>
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
          {initialData?.id ? 'Guardar cambios' : 'Crear pregunta'}
        </button>
      </div>
    </form>
  );
}
