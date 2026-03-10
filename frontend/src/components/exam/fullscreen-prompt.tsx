'use client';
interface Props { examTitle: string; onEnterFullscreen: () => void; onSkip: () => void; }
export function FullscreenPrompt({ examTitle, onEnterFullscreen, onSkip }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-900/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center space-y-6">
        <div className="text-5xl">🖥️</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Modo examen</h2>
          <p className="text-gray-600 mt-2">{examTitle}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 text-left space-y-1">
          <p className="font-semibold">Durante el examen:</p>
          <p>• No podrás copiar ni pegar texto</p>
          <p>• Los cambios de pestaña serán registrados</p>
          <p>• Se monitorea la actividad de pantalla</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onEnterFullscreen} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg">
            Entrar en pantalla completa y comenzar
          </button>
          <button onClick={onSkip} className="text-sm text-gray-500 hover:text-gray-700 py-2">
            Continuar sin pantalla completa
          </button>
        </div>
      </div>
    </div>
  );
}
