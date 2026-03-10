'use client';

import { AlertTriangle } from 'lucide-react';

interface SecurityWarningProps {
  visible: boolean;
  message: string;
}

export function SecurityWarning({ visible, message }: SecurityWarningProps) {
  if (!visible) return null;
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3 bg-amber-500 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
