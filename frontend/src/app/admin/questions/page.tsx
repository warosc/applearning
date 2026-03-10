'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { adminCreateQuestion, adminUpdateQuestion, adminDeleteQuestion, adminDuplicateQuestion } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Pencil, Copy, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const MATERIAS = ['Matemáticas', 'Español', 'Ciencias', 'Historia', 'Inglés', 'Geografía'];
const DIFFICULTIES = ['facil', 'medio', 'dificil'];
const TIPOS = ['single_choice', 'multiple_choice', 'numeric', 'algebraic'];

const DIFFICULTY_BADGE: Record<string, string> = {
  facil: 'bg-green-100 text-green-700',
  medio: 'bg-amber-100 text-amber-700',
  dificil: 'bg-red-100 text-red-700',
};

const optionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'La opción no puede estar vacía'),
  value: z.string().min(1),
  isCorrect: z.boolean(),
  orderIndex: z.number(),
});

const questionSchema = z.object({
  id: z.string().optional(),
  materia: z.string().optional(),
  tema: z.string().optional(),
  subtema: z.string().optional(),
  difficulty: z.string().min(1, 'Selecciona dificultad'),
  type: z.string().min(1, 'Selecciona tipo'),
  prompt: z.string().min(1, 'El enunciado es requerido'),
  score: z.number({ invalid_type_error: 'Ingresa puntaje' }).min(0),
  correctValue: z.string().optional(),
  options: z.array(optionSchema).optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface Question {
  id: string;
  type: string;
  prompt: string;
  materia?: string;
  tema?: string;
  subtema?: string;
  difficulty: string;
  score: number;
  exam_id?: string | null;
  options?: { id?: string; label: string; value: string; isCorrect: boolean; orderIndex: number }[];
  metadataJson?: Record<string, unknown> | null;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
    </div>
  );
}

function QuestionDialog({
  open,
  onClose,
  initial,
  onSaved,
  token,
}: {
  open: boolean;
  onClose: () => void;
  initial: Question | null;
  onSaved: (q: Question) => void;
  token: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      difficulty: 'medio',
      type: 'single_choice',
      score: 1,
      options: [
        { label: '', value: 'A', isCorrect: false, orderIndex: 0 },
        { label: '', value: 'B', isCorrect: false, orderIndex: 1 },
        { label: '', value: 'C', isCorrect: false, orderIndex: 2 },
        { label: '', value: 'D', isCorrect: false, orderIndex: 3 },
      ],
    },
  });

  const { fields: optionFields } = useFieldArray({ control, name: 'options' });

  const questionType = watch('type');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        id: initial.id,
        materia: initial.materia ?? '',
        tema: initial.tema ?? '',
        subtema: initial.subtema ?? '',
        difficulty: initial.difficulty,
        type: initial.type,
        prompt: initial.prompt,
        score: initial.score,
        correctValue: (initial.metadataJson?.correctValue as string) ?? '',
        options:
          initial.options && initial.options.length > 0
            ? initial.options
            : [
                { label: '', value: 'A', isCorrect: false, orderIndex: 0 },
                { label: '', value: 'B', isCorrect: false, orderIndex: 1 },
                { label: '', value: 'C', isCorrect: false, orderIndex: 2 },
                { label: '', value: 'D', isCorrect: false, orderIndex: 3 },
              ],
      });
    } else {
      reset({
        difficulty: 'medio',
        type: 'single_choice',
        score: 1,
        options: [
          { label: '', value: 'A', isCorrect: false, orderIndex: 0 },
          { label: '', value: 'B', isCorrect: false, orderIndex: 1 },
          { label: '', value: 'C', isCorrect: false, orderIndex: 2 },
          { label: '', value: 'D', isCorrect: false, orderIndex: 3 },
        ],
      });
    }
  }, [open, initial, reset]);

  async function onSubmit(data: QuestionFormData) {
    const payload: Record<string, unknown> = {
      materia: data.materia,
      tema: data.tema,
      subtema: data.subtema,
      difficulty: data.difficulty,
      type: data.type,
      prompt: data.prompt,
      score: data.score,
    };

    if (data.type === 'single_choice' || data.type === 'multiple_choice') {
      payload.options = (data.options ?? []).map((o, i) => ({ ...o, orderIndex: i }));
    }
    if (data.type === 'numeric' || data.type === 'algebraic') {
      payload.metadataJson = { correctValue: data.correctValue };
    }

    let saved: Question;
    if (data.id) {
      saved = await adminUpdateQuestion(token, data.id, payload);
    } else {
      saved = await adminCreateQuestion(token, payload);
    }
    onSaved(saved);
    onClose();
  }

  if (!open) return null;

  const isChoice = questionType === 'single_choice' || questionType === 'multiple_choice';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {initial ? 'Editar pregunta' : 'Nueva pregunta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Row: materia, dificultad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
              <select
                {...register('materia')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin materia</option>
                {MATERIAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad *</label>
              <select
                {...register('difficulty')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.difficulty && (
                <p className="text-red-500 text-xs mt-1">{errors.difficulty.message}</p>
              )}
            </div>
          </div>

          {/* Row: tema, subtema */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
              <input
                {...register('tema')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtema</label>
              <input
                {...register('subtema')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row: tipo, puntaje */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                {...register('type')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puntaje *</label>
              <input
                {...register('score', { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.score && <p className="text-red-500 text-xs mt-1">{errors.score.message}</p>}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enunciado *</label>
            <textarea
              {...register('prompt')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.prompt && (
              <p className="text-red-500 text-xs mt-1">{errors.prompt.message}</p>
            )}
          </div>

          {/* Options for choice types */}
          {isChoice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opciones (marca la correcta)
              </label>
              <div className="space-y-2">
                {optionFields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 w-5">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      {...register(`options.${i}.label`)}
                      placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        {...register(`options.${i}.isCorrect`)}
                        onChange={(e) => {
                          if (questionType === 'single_choice' && e.target.checked) {
                            // uncheck all others
                            optionFields.forEach((_, j) => {
                              if (j !== i) setValue(`options.${j}.isCorrect`, false);
                            });
                          }
                          setValue(`options.${i}.isCorrect`, e.target.checked);
                        }}
                        className="accent-blue-600"
                      />
                      Correcta
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct value for numeric/algebraic */}
          {(questionType === 'numeric' || questionType === 'algebraic') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor correcto</label>
              <input
                {...register('correctValue')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar pregunta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function QuestionBankPage() {
  const token = useAuthStore((s) => s.token)!;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [materiaFilter, setMateriaFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [bankOnly, setBankOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (materiaFilter) params.set('materia', materiaFilter);
    if (difficultyFilter) params.set('difficulty', difficultyFilter);
    if (bankOnly) params.set('bank', 'true');
    params.set('limit', '200');
    try {
      const res = await fetch(`${API_URL}/api/questions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : (data.items ?? []));
    } catch {
      setError('Error al cargar preguntas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaFilter, difficultyFilter, bankOnly]);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    try {
      await adminDeleteQuestion(token, id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch {
      alert('Error al eliminar pregunta');
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminDuplicateQuestion(token, id);
      await load();
    } catch {
      alert('Error al duplicar pregunta');
    }
  }

  function handleSaved(saved: Question) {
    setQuestions((prev) => {
      const exists = prev.find((q) => q.id === saved.id);
      if (exists) return prev.map((q) => (q.id === saved.id ? saved : q));
      return [...prev, saved];
    });
  }

  // Apply type filter client-side
  const filteredByType = useMemo(() => {
    if (!typeFilter) return questions;
    return questions.filter((q) => q.type === typeFilter);
  }, [questions, typeFilter]);

  const columns = useMemo<ColumnDef<Question>[]>(
    () => [
      {
        accessorKey: 'prompt',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium text-gray-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Pregunta
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3 opacity-30" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const text = getValue<string>();
          return (
            <span className="text-gray-800">
              {text.length > 100 ? text.slice(0, 100) + '…' : text}
            </span>
          );
        },
      },
      {
        accessorKey: 'materia',
        header: 'Materia',
        cell: ({ getValue }) => {
          const v = getValue<string | undefined>();
          return v ? (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
              {v}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          );
        },
      },
      {
        accessorKey: 'tema',
        header: 'Tema',
        cell: ({ getValue }) => (
          <span className="text-gray-600 text-xs">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'difficulty',
        header: 'Dificultad',
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                DIFFICULTY_BADGE[v] ?? 'bg-gray-100 text-gray-600',
              )}
            >
              {v}
            </span>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ getValue }) => (
          <span className="text-gray-600 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'score',
        header: 'Puntaje',
        cell: ({ getValue }) => (
          <span className="text-gray-600">{getValue<number>()}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => { setEditingQuestion(row.original); setDialogOpen(true); }}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              onClick={() => handleDuplicate(row.original.id)}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicar
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const table = useReactTable({
    data: filteredByType,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: { sorting, columnFilters, globalFilter },
  });

  return (
    <div className="space-y-6">
      <QuestionDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingQuestion(null); }}
        initial={editingQuestion}
        onSaved={handleSaved}
        token={token}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banco de preguntas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filteredByType.length} preguntas</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/questions/import"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Importar
          </Link>
          <button
            onClick={() => { setEditingQuestion(null); setDialogOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Nueva pregunta
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por enunciado..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={materiaFilter}
          onChange={(e) => setMateriaFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las materias</option>
          {MATERIAS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toda dificultad</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={bankOnly}
            onChange={(e) => setBankOnly(e.target.checked)}
            className="accent-blue-600"
          />
          Solo banco
        </label>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <Spinner />
      ) : filteredByType.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 shadow-sm text-center">
          <p className="text-gray-500 mb-4">No hay preguntas con estos filtros.</p>
          <button
            onClick={() => { setEditingQuestion(null); setDialogOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Crear primera pregunta
          </button>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b bg-gray-50">
                  {hg.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left font-medium text-gray-700">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                    Sin resultados para tu búsqueda.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
