'use client';

import { AlertTriangle, CheckCircle2, Clock, Flag, Send, X } from 'lucide-react';

interface Question { id: string; prompt?: string }

interface ReviewModalProps {
  questions: Question[];
  answers: Record<string, unknown>;
  markedForReview: string[];
  onConfirm?: () => void;
  onCancel?: () => void;
  // Legacy prop names — kept for compatibility
  onClose?: () => void;
  onSubmit?: () => void;
}

export function ReviewModal({
  questions,
  answers,
  markedForReview,
  onConfirm,
  onCancel,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const handleCancel = onCancel ?? onClose ?? (() => {});
  const handleConfirm = onConfirm ?? onSubmit ?? (() => {});

  const total = questions.length;
  const answered = questions.filter(q => {
    const a = answers[q.id];
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && a.length === 0);
  }).length;
  const unanswered = total - answered;
  const marked = markedForReview.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-gray-900">Confirmar envío</h2>
          <button onClick={handleCancel} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center rounded-xl bg-green-50 border border-green-200 py-3 px-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{answered}</p>
              <p className="text-xs text-green-600">Respondidas</p>
            </div>
            <div className="text-center rounded-xl bg-gray-50 border border-gray-200 py-3 px-2">
              <Clock className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-600">{unanswered}</p>
              <p className="text-xs text-gray-500">Sin responder</p>
            </div>
            <div className="text-center rounded-xl bg-amber-50 border border-amber-200 py-3 px-2">
              <Flag className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-700">{marked}</p>
              <p className="text-xs text-amber-600">Marcadas</p>
            </div>
          </div>

          {unanswered > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Tienes <strong>{unanswered} pregunta{unanswered !== 1 ? 's' : ''}</strong> sin responder. Las preguntas sin respuesta cuentan como incorrectas.
              </p>
            </div>
          )}

          {unanswered === 0 && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-800">Has respondido todas las preguntas.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Volver al examen
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
          >
            <Send className="h-4 w-4" />
            Enviar examen
          </button>
        </div>
      </div>
    </div>
  );
}
