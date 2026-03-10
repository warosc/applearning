'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { fetchExams, adminDeleteExam, adminUpdateExam, adminDuplicateExam } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Copy, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string;
  totalScore: number;
  durationMinutes: number;
  isPublished: boolean;
  sections?: unknown[];
  createdAt: string;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
    </div>
  );
}

export default function AdminExamsPage() {
  const token = useAuthStore((s) => s.token)!;
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  async function load() {
    try {
      const data = await fetchExams();
      setExams(Array.isArray(data) ? data : []);
    } catch {
      setError('Error al cargar simuladores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(exam: Exam) {
    // Optimistic update
    setExams((prev) =>
      prev.map((e) => (e.id === exam.id ? { ...e, isPublished: !e.isPublished } : e)),
    );
    try {
      await adminUpdateExam(token, exam.id, { isPublished: !exam.isPublished });
    } catch {
      // Revert on error
      setExams((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, isPublished: exam.isPublished } : e)),
      );
      alert('Error al cambiar estado');
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    try {
      await adminDeleteExam(token, id);
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert('Error al eliminar simulador');
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminDuplicateExam(token, id);
      await load();
    } catch {
      alert('Error al duplicar simulador');
    }
  }

  const columns = useMemo<ColumnDef<Exam>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium text-gray-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Título
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3 opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-800">{row.original.title}</p>
            {row.original.description && (
              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{row.original.description}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'durationMinutes',
        header: 'Duración',
        cell: ({ getValue }) => <span className="text-gray-600">{getValue<number>()} min</span>,
      },
      {
        accessorKey: 'totalScore',
        header: 'Puntaje',
        cell: ({ getValue }) => <span className="text-gray-600">{getValue<number>()} pts</span>,
      },
      {
        id: 'sections',
        header: 'Secciones',
        cell: ({ row }) => (
          <span className="text-gray-600">{(row.original.sections ?? []).length}</span>
        ),
      },
      {
        accessorKey: 'isPublished',
        header: 'Estado',
        cell: ({ row }) => (
          <button
            onClick={() => togglePublish(row.original)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              row.original.isPublished
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {row.original.isPublished ? 'Publicado' : 'Borrador'}
          </button>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-3 justify-end">
            <Link
              href={`/admin/exams/${row.original.id}`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Link>
            <button
              onClick={() => handleDuplicate(row.original.id)}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicar
            </button>
            <button
              onClick={() => handleDelete(row.original.id, row.original.title)}
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
    data: exams,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: { sorting, globalFilter },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Simuladores</h1>
        <Link
          href="/admin/exams/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo simulador
        </Link>
      </div>

      {/* Search */}
      <div>
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por título..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <Spinner />
      ) : exams.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 shadow-sm text-center">
          <p className="text-gray-500 mb-4">No hay simuladores aún.</p>
          <Link
            href="/admin/exams/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Crear primer simulador
          </Link>
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
