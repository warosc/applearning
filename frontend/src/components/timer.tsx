'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  expiresAt: string; // Usaremos expiresAt directamente del backend
  onExpire: () => void;
  expired?: boolean;
}

function getRemaining(expiresAt: string): number {
  if (!expiresAt) return 0;
  const expiryTime = new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return 0;

  // Usamos Date.now() pero el punto de referencia es el expiresAt del servidor.
  // Esto mitiga la manipulación del reloj local.
  const rem = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
  return isNaN(rem) ? 0 : rem;
}

function fmt(s: number): string {
  if (isNaN(s) || s < 0) return '00:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function Timer({ expiresAt, onExpire, expired }: TimerProps) {
  const [remaining, setRemaining] = useState(() => getRemaining(expiresAt));
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    if (expired || hasExpired) return;
    const id = setInterval(() => {
      const r = getRemaining(expiresAt);
      setRemaining(r);
      if (r === 0 && !hasExpired) {
        setHasExpired(true);
        onExpire();
        clearInterval(id);
      }
    }, 1000); // Actualiza cada segundo
    return () => clearInterval(id); // Limpia el intervalo al desmontar
  }, [expiresAt, onExpire, expired, hasExpired]);

  const isWarning = remaining <= 5 * 60 && remaining > 60;
  const isCritical = remaining <= 60 && remaining > 0;

  let containerCls = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold transition-all flex-shrink-0 ';
  if (expired) {
    containerCls += 'bg-red-500 text-white';
  } else if (isCritical) {
    containerCls += 'bg-red-500 text-white animate-pulse';
  } else if (isWarning) {
    containerCls += 'bg-amber-500 text-white';
  } else {
    containerCls += 'bg-slate-700 text-white';
  }

  return (
    <div className={containerCls}>
      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="tabular-nums">{expired ? '00:00' : fmt(remaining)}</span>
    </div>
  );
}
