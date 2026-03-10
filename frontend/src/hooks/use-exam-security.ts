'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

export type SecurityEventType =
  | 'tab_switch' | 'focus_lost' | 'fullscreen_exit'
  | 'copy_attempt' | 'paste_attempt' | 'right_click';

export interface SecurityViolation {
  type: SecurityEventType;
  count: number;
  lastAt: Date;
}

interface UseExamSecurityOptions {
  enabled: boolean;
  onEvent: (type: SecurityEventType, details?: Record<string, unknown>) => void;
  warningThreshold?: number; // violations before showing warning (default: 3)
}

export function useExamSecurity({ enabled, onEvent, warningThreshold = 3 }: UseExamSecurityOptions) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState<Record<SecurityEventType, number>>({
    tab_switch: 0, focus_lost: 0, fullscreen_exit: 0,
    copy_attempt: 0, paste_attempt: 0, right_click: 0
  });
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const totalViolations = useRef(0);

  const recordViolation = useCallback((type: SecurityEventType, details?: Record<string, unknown>) => {
    if (!enabled) return;
    totalViolations.current += 1;
    setViolations(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    onEvent(type, details);

    const messages: Record<SecurityEventType, string> = {
      tab_switch: 'Cambio de pestaña detectado. Esta acción ha sido registrada.',
      focus_lost: 'Salida de ventana detectada. Esta acción ha sido registrada.',
      fullscreen_exit: 'Saliste de pantalla completa. Por favor regresa al modo pantalla completa.',
      copy_attempt: 'El copiado de texto está deshabilitado durante el examen.',
      paste_attempt: 'El pegado está deshabilitado durante el examen.',
      right_click: 'El clic derecho está deshabilitado durante el examen.',
    };
    setWarningMessage(messages[type]);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000);
  }, [enabled, onEvent]);

  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch { /* user denied */ }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') recordViolation('tab_switch');
    };
    const handleBlur = () => recordViolation('focus_lost');
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) recordViolation('fullscreen_exit');
    };
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        recordViolation('copy_attempt');
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        recordViolation('paste_attempt');
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('right_click');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled, recordViolation]);

  return { isFullscreen, violations, requestFullscreen, showWarning, warningMessage };
}
