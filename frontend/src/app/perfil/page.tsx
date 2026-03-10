'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { changeMyPassword } from '@/lib/api';
import { ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PerfilPage() {
  const router = useRouter();
  const token = useAuthStore(s => s.token);
  const user = useAuthStore(s => s.user);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token || !user) { router.replace('/login'); return null; }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres'); return; }
    if (next !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      await changeMyPassword(token!, current, next);
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" /> Inicio
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-900">Mi perfil</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {user.username} · <span className="capitalize">{user.role}</span>
            </p>
          </div>

          <div className="px-6 py-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-blue-600" />
              Cambiar contraseña
            </h2>

            {success && (
              <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Contraseña actualizada correctamente.
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
                <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <input type="password" value={next} onChange={e => setNext(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition-colors">
                {saving ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
