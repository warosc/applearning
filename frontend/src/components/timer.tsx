'use client';

import { useEffect, useState } from 'react';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TimerProps {
  startedAt: string;
  durationMinutes: number;
  onExpire?: () => void;
  expired?: boolean;
}

export function Timer({ startedAt, durationMinutes, onExpire, expired }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const start = new Date(startedAt).getTime();
    const end = start + durationMinutes * 60 * 1000;
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
  });

  useEffect(() => {
    if (expired) return;
    const start = new Date(startedAt).getTime();
    const end = start + durationMinutes * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((end - now) / 1000));
      setSecondsLeft(left);
      if (left <= 0) onExpire?.();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, durationMinutes, onExpire, expired]);

  const isLow = secondsLeft > 0 && secondsLeft <= 300;
  const isCritical = secondsLeft > 0 && secondsLeft <= 60;

  return (
    <div
      className={`rounded-lg px-4 py-2 font-mono text-xl font-semibold tabular-nums ${
        expired
          ? 'bg-red-100 text-red-800'
          : isCritical
          ? 'bg-red-200 text-red-900 animate-pulse'
          : isLow
          ? 'bg-amber-100 text-amber-800'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      {expired ? '00:00' : formatTime(secondsLeft)}
    </div>
  );
}
