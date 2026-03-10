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
import { fetchAdminAttempts } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Attempt {
  id: string;
  exam_title?: string;
  exam?: { title: string };
  username?: string;
  user?: { username: string };
  status: string;
  score?: number;
  max_score?: number;
  percentage?: number;
  time_used_seconds?: number;
  started_at?: string;
  created_at?: string;
}

const STATUS_BADGE: Record<string, string> = {
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-600',
};

const STATUS_LABEL: Record<string, string> = {
  in_progress: 'En progreso',
  submitted: 'Completado',
  expired: 'Expirado',
};

function formatTime(seconds?: number) {
  if (!seconds && seconds !== 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
    </div>
  );
}

export default function AttemptsPage() {
  const token = useAuthStore((s) => s.token)!;
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchAdminAttempts(token)
      .then((data) => setAttempts(Array.isArray(data) ? data : (data.items ?? [])))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredByDate = useMemo(() => {
    return attempts.filter((a) => {
      const dateStr = a.started_at ?? a.created_at;
      if (!dateStr) return true;
      const date = new Date(dateStr);
      if (fromDate && date < new Date(fromDate)) return false;
      if (toDate && date > new Date(toDate + 'T23:59:59')) return false;
      return true;
    });
  }, [attempts, fromDate, toDate]);

  const columns = useMemo<ColumnDef<Attempt>[]>(
    () => [
      {
        id: 'exam',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium text-gray-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Examen
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3 opacity-30" />
            )}
          </button>
        ),
        accessorFn: (row) => row.exam_title ?? row.exam?.title ?? '—',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-800">{getValue<string>()}</span>
        ),
      },
      {
        id: 'student',
        header: 'Estudiante',
        accessorFn: (row) => row.username ?? row.user?.username ?? 'Anónimo',
        cell: ({ getValue }) => <span className="text-gray-600">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                STATUS_BADGE[v] ?? 'bg-gray-100 text-gray-600',
              )}
            >
              {STATUS_LABEL[v] ?? v}
            </span>
          );
        },
      },
      {
        id: 'score',
        header: 'Puntaje',
        accessorFn: (row) => row.score,
        cell: ({ row }) => {
          const a = row.original;
          const pct = a.percentage;
          const score = a.score;
          const max = a.max_score;
          return (
            <span className="text-gray-700">
              {score != null && max != null ? `${score}/${max}` : score != null ? score : '—'}
              {pct != null && (
                <span className="ml-1 text-xs text-gray-500">({pct.toFixed(1)}%)</span>
              )}
            </span>
          );
        },
      },
      {
        id: 'time',
        header: 'Tiempo usado',
        accessorFn: (row) => row.time_used_seconds,
        cell: ({ getValue }) => (
          <span className="text-gray-600">{formatTime(getValue<number | undefined>())}</span>
        ),
      },
      {
        id: 'date',
        header: 'Fecha inicio',
        accessorFn: (row) => row.started_at ?? row.created_at,
        cell: ({ getValue }) => (
          <span className="text-gray-500 text-xs">{formatDate(getValue<string | undefined>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            href={`/admin/attempts/${row.original.id}`}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver detalle
          </Link>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredByDate,
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
      <h1 className="text-2xl font-bold text-gray-900">Intentos</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por examen o estudiante..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Desde:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Hasta:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Limpiar fechas
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <Spinner />
      ) : filteredByDate.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 shadow-sm text-center">
          <p className="text-gray-500">No hay intentos registrados.</p>
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
