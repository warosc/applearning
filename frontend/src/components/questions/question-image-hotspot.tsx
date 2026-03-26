'use client';

import { useRef, useState } from 'react';

/**
 * image_hotspot — "Identifica en la imagen"
 *
 * An image is shown with interactive golden dots (hotspots).
 * Clicking a dot opens a dropdown of options for that spot.
 *
 * Data (metadata_json.hotspots):
 *   [{ id: 0, x: 45.2, y: 62.3, options: ["Pulmón","Corazón"], correct: "Pulmón" }]
 *   x, y = percentage of image width/height (0–100)
 *
 * Answer: { "0": "Pulmón", "1": "Corazón" }
 */

interface Hotspot {
  id: number;
  x: number;   // % of image width
  y: number;   // % of image height
  options: string[];
  correct?: string; // hidden during exam
}

interface QuestionImageHotspotProps {
  question: {
    image_url?: string | null;
    metadata_json?: {
      hotspots?: Hotspot[];
    } | null;
  };
  answer: unknown;
  onAnswer: (value: unknown) => void;
}

export function QuestionImageHotspot({ question, answer, onAnswer }: QuestionImageHotspotProps) {
  const hotspots: Hotspot[] = question.metadata_json?.hotspots ?? [];
  const imageUrl = question.image_url ?? '';
  const current: Record<string, string> =
    answer && typeof answer === 'object' && !Array.isArray(answer)
      ? (answer as Record<string, string>)
      : {};

  const [activeSpot, setActiveSpot] = useState<number | null>(null);

  function handleSelect(spotId: number, value: string) {
    const updated = { ...current, [String(spotId)]: value };
    onAnswer(updated);
    setActiveSpot(null);
  }

  function toggleSpot(id: number) {
    setActiveSpot((prev) => (prev === id ? null : id));
  }

  if (!imageUrl) {
    return <p className="text-sm text-gray-400 italic">Esta pregunta no tiene imagen configurada.</p>;
  }

  const answered = Object.keys(current).length;
  const total = hotspots.length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
        Haz clic en cada punto dorado e identifica el elemento
      </p>

      {/* Image container — relative so dots are positioned over it */}
      <div
        className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 select-none"
        onClick={() => setActiveSpot(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Imagen de la pregunta"
          className="w-full object-contain max-h-[480px]"
          draggable={false}
        />

        {/* Hotspot dots */}
        {hotspots.map((spot) => {
          const sel = current[String(spot.id)];
          const isActive = activeSpot === spot.id;

          return (
            <div
              key={spot.id}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              {/* Dot button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleSpot(spot.id); }}
                className={`relative z-10 w-7 h-7 rounded-full border-2 transition-all shadow-lg flex items-center justify-center
                  ${sel
                    ? 'bg-green-400 border-green-600 text-green-900'
                    : 'bg-yellow-400 border-yellow-600 text-yellow-900'}
                  ${isActive ? 'ring-4 ring-white/60 scale-125' : 'hover:scale-110'}
                `}
                title={sel ? sel : `Espacio ${spot.id + 1}`}
              >
                {/* Pulse ring when unanswered */}
                {!sel && (
                  <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-60" />
                )}
                <span className="relative z-10 text-[10px] font-bold">
                  {sel ? '✓' : spot.id + 1}
                </span>
              </button>

              {/* Dropdown popup */}
              {isActive && (
                <div
                  className="absolute z-20 bg-white rounded-xl shadow-2xl border border-gray-200 min-w-[160px] overflow-hidden"
                  style={{
                    top: '110%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[10px] font-semibold text-gray-400 uppercase px-3 pt-2 pb-1">
                    Punto {spot.id + 1}
                  </p>
                  {spot.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelect(spot.id, opt)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors border-t border-gray-100 first:border-0
                        ${sel === opt
                          ? 'bg-blue-50 text-blue-800 font-semibold'
                          : 'hover:bg-gray-50 text-gray-700'}
                      `}
                    >
                      {sel === opt && <span className="mr-1">✓</span>}
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress summary */}
      {total > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {hotspots.map((spot) => {
            const sel = current[String(spot.id)];
            return (
              <span
                key={spot.id}
                className={`px-2 py-0.5 rounded-full border ${
                  sel
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                {spot.id + 1}: {sel || '—'}
              </span>
            );
          })}
          <span className="ml-auto text-gray-400">{answered}/{total} respondidos</span>
        </div>
      )}
    </div>
  );
}
