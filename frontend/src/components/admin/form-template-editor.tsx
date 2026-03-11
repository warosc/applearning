'use client';

import { useState } from 'react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
}

interface Props {
  initialFields: FormField[];
  onSave: (fields: FormField[]) => Promise<void>;
  saving: boolean;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto corto' },
  { value: 'number', label: 'Número' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'select', label: 'Lista desplegable' },
  { value: 'checkbox', label: 'Casillas de verificación' },
];

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function newField(): FormField {
  return { id: generateId(), label: '', type: 'text', required: false };
}

export function FormTemplateEditor({ initialFields, onSave, saving }: Props) {
  const [fields, setFields] = useState<FormField[]>(initialFields);

  function addField() {
    setFields((prev) => [...prev, newField()]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function moveField(idx: number, dir: -1 | 1) {
    const next = [...fields];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setFields(next);
  }

  function addOption(fieldId: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, options: [...(f.options ?? []), ''] } : f
      )
    );
  }

  function updateOption(fieldId: string, optIdx: number, value: string) {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        const opts = [...(f.options ?? [])];
        opts[optIdx] = value;
        return { ...f, options: opts };
      })
    );
  }

  function removeOption(fieldId: string, optIdx: number) {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        const opts = [...(f.options ?? [])];
        opts.splice(optIdx, 1);
        return { ...f, options: opts };
      })
    );
  }

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <p className="text-sm text-gray-500 italic">No hay campos en el formulario.</p>
      )}

      {fields.map((field, idx) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 w-5 text-center">{idx + 1}</span>
            <div className="flex-1 grid grid-cols-2 gap-3">
              {/* Label */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Etiqueta</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  placeholder="Ej: Nombre completo"
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <select
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value as FormField['type'], options: undefined })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Required toggle */}
            <label className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                className="rounded"
              />
              Requerido
            </label>
            {/* Move / Delete */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => moveField(idx, -1)}
                disabled={idx === 0}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                title="Subir"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveField(idx, 1)}
                disabled={idx === fields.length - 1}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                title="Bajar"
              >
                ▼
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeField(field.id)}
              className="text-red-400 hover:text-red-600 text-xs shrink-0"
              title="Eliminar campo"
            >
              ✕
            </button>
          </div>

          {/* Options for select/checkbox */}
          {(field.type === 'select' || field.type === 'checkbox') && (
            <div className="pl-7 space-y-2">
              <p className="text-xs font-medium text-gray-500">Opciones:</p>
              {(field.options ?? []).map((opt, optIdx) => (
                <div key={optIdx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                    placeholder={`Opción ${optIdx + 1}`}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(field.id, optIdx)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(field.id)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Agregar opción
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={addField}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Agregar campo
        </button>
        <button
          type="button"
          onClick={() => onSave(fields)}
          disabled={saving}
          className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {saving ? 'Guardando...' : 'Guardar formulario'}
        </button>
      </div>
    </div>
  );
}
