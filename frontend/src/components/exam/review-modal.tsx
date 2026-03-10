'use client';
interface Question { id: string; prompt: string; }
interface Props {
  questions: Question[];
  answers: Record<string, unknown>;
  markedForReview: string[];
  onClose: () => void;
  onSubmit: () => void;
}
export function ReviewModal({ questions, answers, markedForReview, onClose, onSubmit }: Props) {
  const answered = questions.filter(q => {
    const a = answers[q.id];
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && a.length === 0);
  });
  const marked = questions.filter(q => markedForReview.includes(q.id));
  const unanswered = questions.filter(q => !answered.some(a => a.id === q.id));

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5">
        <h2 className="text-lg font-bold text-gray-900">Revisión final del examen</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Respondidas', count: answered.length, color: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Sin responder', count: unanswered.length, color: 'bg-red-50 border-red-200 text-red-700' },
            { label: 'Marcadas', count: marked.length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          ].map(item => (
            <div key={item.label} className={`border rounded-lg p-3 text-center ${item.color}`}>
              <div className="text-2xl font-bold">{item.count}</div>
              <div className="text-xs mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
        {unanswered.length > 0 && (
          <p className="text-sm text-red-600">
            Tienes {unanswered.length} pregunta{unanswered.length !== 1 ? 's' : ''} sin responder.
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Volver al examen
          </button>
          <button onClick={onSubmit} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
            Enviar examen definitivamente
          </button>
        </div>
      </div>
    </div>
  );
}
