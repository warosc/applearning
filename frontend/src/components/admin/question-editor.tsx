'use client';

import { useRef, useState } from 'react';

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Opción única' },
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'fill_blank', label: 'Completar oración (libre)' },
  { value: 'inline_choice', label: 'Completar oración (selección inline)' },
  { value: 'multi_answer_weighted', label: 'Multi-respuesta ponderada' },
  { value: 'numeric', label: 'Numérico' },
  { value: 'algebraic', label: 'Algebraico' },
  { value: 'drag_drop', label: 'Ordenar (drag & drop)' },
];

const NUMERIC_COMPARISONS = [
  { value: 'range', label: 'Rango (± tolerancia)' },
  { value: 'greater_than', label: 'Mayor que' },
  { value: 'less_than', label: 'Menor que' },
];

// Backend uses snake_case — use it throughout
interface Option {
  id?: string;
  label: string;
  value: string;
  is_correct: boolean;
  weight: number;
  order_index: number;
  image_url?: string;
}

interface InlineBlank {
  id: number;
  options: string[];
  correct: string;
}

interface QuestionData {
  id?: string;
  type: string;
  prompt: string;
  image_url?: string;
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
    image_url: (o.image_url ?? '') as string,
  };
}

// ─── Image upload helper ────────────────────────────────────────────────────

function useImageUpload(onUploaded: (url: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload/image', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Error al subir' }));
        alert(err.detail ?? 'Error al subir imagen');
        return;
      }
      const { url } = await res.json();
      onUploaded(url);
    } finally {
      setUploading(false);
    }
  }

  function open() { inputRef.current?.click(); }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        e.target.value = '';
      }}
    />
  );

  return { open, uploading, input };
}

// ─── ImageField ─────────────────────────────────────────────────────────────

function ImageField({ value, onChange, label = 'Imagen' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const { open, uploading, input } = useImageUpload(onChange);

  return (
    <div className="space-y-1">
      {input}
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... o sube un archivo"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button
          type="button"
          onClick={open}
          disabled={uploading}
          className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 py-1.5 whitespace-nowrap disabled:opacity-50"
        >
          {uploading ? 'Subiendo…' : '📁 Subir'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-red-400 hover:text-red-600 text-xs">✕</button>
        )}
      </div>
      {value && (
        <img src={value} alt="preview" className="mt-1 h-24 rounded-lg border object-contain bg-gray-50" />
      )}
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

export function QuestionEditor({ initialData, onSave, onCancel }: Props) {
  const init = initialData as Record<string, unknown> | undefined;
  const initMeta = (init?.metadata_json ?? init?.metadataJson) as Record<string, unknown> | null | undefined;

  const [type, setType] = useState((init?.type as string) ?? 'single_choice');
  const [prompt, setPrompt] = useState((init?.prompt as string) ?? '');
  const [imageUrl, setImageUrl] = useState((init?.image_url as string) ?? '');
  const [score, setScore] = useState((init?.score as number) ?? 10);
  const [orderIndex, setOrderIndex] = useState((init?.order_index ?? init?.orderIndex ?? 0) as number);
  const [materia, setMateria] = useState((init?.materia as string) ?? '');
  const [tema, setTema] = useState((init?.tema as string) ?? '');

  // ── Numeric/algebraic ──
  const [expectedAnswer, setExpectedAnswer] = useState(initMeta?.expected as string ?? '');
  const [numericComparison, setNumericComparison] = useState((initMeta?.comparison as string) ?? 'range');
  const [numericTolerance, setNumericTolerance] = useState((initMeta?.tolerance as number) ?? 0.001);
  const [numericUnit, setNumericUnit] = useState((initMeta?.unit as string) ?? '');
  const [numericUnits, setNumericUnits] = useState<string[]>((initMeta?.units as string[]) ?? []);
  const [unitsInput, setUnitsInput] = useState(((initMeta?.units as string[]) ?? []).join(', '));

  // ── Options (for choice/fill/weighted/drag types) ──
  const [options, setOptions] = useState<Option[]>(() => {
    const raw = (init?.options as Record<string, unknown>[] | undefined) ?? [];
    return raw.map(normalizeOption);
  });

  // ── Inline blanks ──
  const [inlineBlanks, setInlineBlanks] = useState<InlineBlank[]>(() => {
    return (initMeta?.inline_blanks as InlineBlank[]) ?? [];
  });

  const hasOptions = ['single_choice', 'multiple_choice', 'drag_drop', 'fill_blank', 'multi_answer_weighted'].includes(type);
  const hasWeight = type === 'multi_answer_weighted';
  const hasExpected = ['numeric', 'algebraic'].includes(type);
  const isInlineChoice = type === 'inline_choice';
  const isNumeric = type === 'numeric';

  // ── Options helpers ──
  function addOption() {
    setOptions((prev) => [
      ...prev,
      { label: '', value: `opt${prev.length}`, is_correct: false, weight: 0, order_index: prev.length, image_url: '' },
    ]);
  }
  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, order_index: i })));
  }
  function updateOption(idx: number, patch: Partial<Option>) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }

  // ── Inline blank helpers ──
  function addBlank() {
    const nextId = inlineBlanks.length;
    setInlineBlanks((prev) => [...prev, { id: nextId, options: [''], correct: '' }]);
    // Insert placeholder into prompt
    setPrompt((p) => p + `{${nextId}}`);
  }
  function removeBlank(idx: number) {
    setInlineBlanks((prev) => prev.filter((_, i) => i !== idx).map((b, i) => ({ ...b, id: i })));
  }
  function updateBlank(idx: number, patch: Partial<InlineBlank>) {
    setInlineBlanks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  }
  function addBlankOption(blankIdx: number) {
    setInlineBlanks((prev) =>
      prev.map((b, i) => i === blankIdx ? { ...b, options: [...b.options, ''] } : b)
    );
  }
  function updateBlankOption(blankIdx: number, optIdx: number, val: string) {
    setInlineBlanks((prev) =>
      prev.map((b, i) =>
        i === blankIdx
          ? { ...b, options: b.options.map((o, j) => (j === optIdx ? val : o)) }
          : b
      )
    );
  }
  function removeBlankOption(blankIdx: number, optIdx: number) {
    setInlineBlanks((prev) =>
      prev.map((b, i) =>
        i === blankIdx ? { ...b, options: b.options.filter((_, j) => j !== optIdx) } : b
      )
    );
  }

  // ── Submit ──
  function buildMetadata(): Record<string, unknown> | null {
    if (isNumeric) {
      const units = unitsInput.split(',').map((s) => s.trim()).filter(Boolean);
      return {
        expected: expectedAnswer,
        comparison: numericComparison,
        tolerance: numericTolerance,
        ...(numericUnit ? { unit: numericUnit } : {}),
        ...(units.length ? { units } : {}),
      };
    }
    if (type === 'algebraic') {
      return { expected: expectedAnswer };
    }
    if (isInlineChoice) {
      return { inline_blanks: inlineBlanks };
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: QuestionData = {
      ...(init?.id ? { id: init.id as string } : {}),
      type,
      prompt,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      score,
      order_index: orderIndex,
      ...(materia ? { materia } : {}),
      ...(tema ? { tema } : {}),
      options: hasOptions ? options : [],
      metadata_json: buildMetadata(),
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

      {/* ── Row 1: prompt + type/score/order ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Enunciado
            {isInlineChoice && (
              <span className="ml-2 text-blue-500 font-normal">
                — usa <code className="bg-blue-100 px-1 rounded">{'{0}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{1}'}</code>… como espacios en blanco
              </span>
            )}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {isInlineChoice && (
            <button
              type="button"
              onClick={addBlank}
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-2 py-1 bg-white"
            >
              + Agregar espacio en blanco {`{${inlineBlanks.length}}`}
            </button>
          )}
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

      {/* ── Materia / Tema ── */}
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
            placeholder="ej. Acentuación"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* ── Question image ── */}
      <ImageField value={imageUrl} onChange={setImageUrl} label="Imagen de la pregunta (opcional)" />

      {/* ── Numeric metadata ── */}
      {isNumeric && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Configuración numérica</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Respuesta correcta</label>
              <input
                type="text"
                value={expectedAnswer}
                onChange={(e) => setExpectedAnswer(e.target.value)}
                required
                placeholder="ej. 9.8"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de comparación</label>
              <select
                value={numericComparison}
                onChange={(e) => setNumericComparison(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {NUMERIC_COMPARISONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            {numericComparison === 'range' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tolerancia (±)</label>
                <input
                  type="number"
                  step="any"
                  value={numericTolerance}
                  onChange={(e) => setNumericTolerance(Number(e.target.value))}
                  min={0}
                  placeholder="0.001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unidad por defecto</label>
              <input
                type="text"
                value={numericUnit}
                onChange={(e) => setNumericUnit(e.target.value)}
                placeholder="ej. m/s², km, °C"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Unidades disponibles para el alumno
                <span className="ml-1 font-normal text-gray-400">(separadas por coma — dejar vacío para no mostrar selector)</span>
              </label>
              <input
                type="text"
                value={unitsInput}
                onChange={(e) => {
                  setUnitsInput(e.target.value);
                  setNumericUnits(e.target.value.split(',').map((s) => s.trim()).filter(Boolean));
                }}
                placeholder="ej. km, millas, m"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Algebraic expected answer ── */}
      {type === 'algebraic' && (
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

      {/* ── Choice options ── */}
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
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div key={idx} className="space-y-1.5 bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2">
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
                    placeholder="Etiqueta de la opción"
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

                {/* Option image */}
                <div className="pl-6">
                  <ImageField
                    value={opt.image_url ?? ''}
                    onChange={(url) => updateOption(idx, { image_url: url })}
                    label="Imagen de opción (opcional)"
                  />
                </div>
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

      {/* ── Inline choice blanks ── */}
      {isInlineChoice && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Espacios en blanco</p>
            <button
              type="button"
              onClick={addBlank}
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-2 py-1 bg-white"
            >
              + Agregar espacio {`{${inlineBlanks.length}}`}
            </button>
          </div>

          {inlineBlanks.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              Agrega espacios en blanco y escribe <code>{'{0}'}</code>, <code>{'{1}'}</code>… en el enunciado donde quieres que aparezcan los selectores.
            </p>
          )}

          {inlineBlanks.map((blank, bIdx) => (
            <div key={bIdx} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Espacio <code className="bg-gray-100 px-1 rounded">{`{${blank.id}}`}</code>
                </span>
                <button type="button" onClick={() => removeBlank(bIdx)} className="text-red-400 hover:text-red-600 text-xs">
                  Eliminar espacio
                </button>
              </div>

              {/* Options for this blank */}
              <div className="space-y-2">
                {blank.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`blank_correct_${bIdx}`}
                      checked={blank.correct === opt}
                      onChange={() => updateBlank(bIdx, { correct: opt })}
                      title="Marcar como correcta"
                      className="h-4 w-4 shrink-0"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        // if this was the correct option, update correct too
                        const wasCorrect = blank.correct === opt;
                        updateBlankOption(bIdx, oIdx, newVal);
                        if (wasCorrect) updateBlank(bIdx, { correct: newVal });
                      }}
                      placeholder={`Opción ${oIdx + 1} (ej. mamá)`}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => removeBlankOption(bIdx, oIdx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addBlankOption(bIdx)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Agregar opción
              </button>

              <p className="text-xs text-gray-400">
                Selecciona el radio de la opción correcta. Estas opciones aparecerán en el menú desplegable del alumno.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
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
