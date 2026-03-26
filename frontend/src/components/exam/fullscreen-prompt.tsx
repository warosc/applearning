'use client';

import { Maximize2, Shield, Info } from 'lucide-react';

interface FullscreenPromptProps {
  examTitle: string;
  onEnterFullscreen: () => void;
  onSkip: () => void;
}

export function FullscreenPrompt({ examTitle, onEnterFullscreen, onSkip }: FullscreenPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white text-center">
          <Shield className="h-10 w-10 mx-auto mb-2 text-blue-200" />
          <h2 className="text-lg font-bold">{examTitle}</h2>
          <p className="text-sm text-blue-200 mt-1">Simulador Escobita</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
              <Info className="h-4 w-4 flex-shrink-0" />
              Condiciones del simulador
            </div>
            <ul className="text-xs text-amber-700 space-y-1 ml-6 list-disc">
              <li>Se recomienda pantalla completa para evitar distracciones</li>
              <li>No se permite copiar ni pegar texto</li>
              <li>Los cambios de pestaña quedan registrados</li>
              <li>Las respuestas se guardan automáticamente</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onEnterFullscreen}
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Maximize2 className="h-4 w-4" />
              Entrar en pantalla completa
            </button>
            <button
              onClick={onSkip}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Continuar sin pantalla completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
