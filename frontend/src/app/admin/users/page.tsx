'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { fetchAdminUsers, adminResetUserPassword, adminUpdateUserRole } from '@/lib/api';
import { Search, KeyRound, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string | null;
  role: 'admin' | 'editor' | 'estudiante';
  created_at: string;
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  editor: 'bg-purple-100 text-purple-700',
  estudiante: 'bg-blue-100 text-blue-700',
};

function ResetPasswordModal({ user, onClose, token }: { user: User; onClose: () => void; token: string }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (pw.length < 6) { setErr('Mínimo 6 caracteres'); return; }
    if (pw !== confirm) { setErr('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      await adminResetUserPassword(token, user.id, pw);
      setDone(true);
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Resetear contraseña</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500">Usuario: <strong>{user.username}</strong></p>
        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">
            Contraseña actualizada correctamente.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <input type="password" placeholder="Nueva contraseña" value={pw} onChange={e => setPw(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {err && <p className="text-xs text-red-600">{err}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={submit} disabled={saving}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const token = useAuthStore(s => s.token)!;
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers(token, page, PAGE_SIZE, search);
      setUsers(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token, page, search]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  async function handleRoleChange(userId: string, role: string) {
    try {
      await adminUpdateUserRole(token, userId, role);
      load();
    } catch { /* ignore */ }
  }

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <span className="text-sm text-gray-500">{total} usuarios total</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por usuario o nombre..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          Buscar
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Usuario</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Creado</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin resultados</td></tr>
            )}
            {!loading && users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                <td className="px-4 py-3 text-gray-600">{u.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    <option value="estudiante">estudiante</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setResetTarget(u)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Reset contraseña
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Página {page} de {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          token={token}
          onClose={() => { setResetTarget(null); }}
        />
      )}
    </div>
  );
}
