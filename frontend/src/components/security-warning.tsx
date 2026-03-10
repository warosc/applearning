'use client';
interface Props { message: string; visible: boolean; }
export function SecurityWarning({ message, visible }: Props) {
  if (!visible) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top">
      ⚠️ {message}
    </div>
  );
}
