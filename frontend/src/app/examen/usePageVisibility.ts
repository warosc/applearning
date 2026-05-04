import { useState, useEffect } from 'react';

/**
 * Hook para detectar si la página está visible o no (cambio de pestaña/minimizado).
 * @returns `true` si la página está oculta, `false` si está visible.
 */
export function usePageVisibility(): boolean {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isHidden;
}