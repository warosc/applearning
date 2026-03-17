'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSimulatorStore } from '@/store/simulator-store';
import {
  startAttempt,
  fetchAttempt,
  saveAnswer,
  submitAttempt,
  fetchResult,
  markForReview,
  logSecurityEvent,
  fetchExams,
  fetchFormTemplate,
} from '@/lib/api';
import { useExamSecurity, SecurityEventType } from '@/hooks/use-exam-security';
import { SecurityWarning } from '@/components/security-warning';
import { FullscreenPrompt } from '@/components/exam/fullscreen-prompt';
import { ReviewModal } from '@/components/exam/review-modal';
import { ResultsView } from '@/components/results-view';
import { QuestionRenderer } from '@/components/questions/question-renderer';
import { Calculator } from '@/components/calculator';
import { Timer } from '@/components/timer';
import {
  Menu, X, Calculator as CalcIcon, Flag,
  ChevronLeft, ChevronRight, Send, CheckSquare, HelpCircle,
} from 'lucide-react';

// ─── Question nav panel ───────────────────────────────────────────
function QuestionNavPanel({
  questions,
  currentIndex,
  answers,
  markedForReview,
  onSelect,
}: {
  questions: { id: string }[];
  currentIndex: number;
  answers: Record<string, unknown>;
  markedForReview: string[];
  onSelect: (i: number) => void;
}) {
  function isAnswered(qId: string) {
    const a = answers[qId];
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && a.length === 0);
  }

  const answered = questions.filter(q => isAnswered(q.id)).length;
  const marked = markedForReview.length;
  const pending = questions.length - answered;

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="px-3 py-3 border-b border-slate-200 space-y-1 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Respondidas</span>
          <span className="font-semibold text-green-600">{answered}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Pendientes</span>
          <span className="font-semibold text-gray-500">{pending}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Marcadas</span>
          <span className="font-semibold text-amber-600">{marked}</span>
        </div>
      </div>

      {/* Grid of question numbers */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((q, i) => {
            const isAns = isAnswered(q.id);
            const isMarked = markedForReview.includes(q.id);
            const isCurrent = i === currentIndex;

            let cls = 'relative flex items-center justify-center rounded text-xs font-semibold h-8 w-full cursor-pointer border transition-all select-none ';
            if (isCurrent) {
              cls += 'bg-blue-600 text-white border-blue-600 shadow-sm';
            } else if (isAns && isMarked) {
              cls += 'bg-amber-100 text-amber-800 border-amber-400';
            } else if (isAns) {
              cls += 'bg-green-100 text-green-800 border-green-400';
            } else if (isMarked) {
              cls += 'bg-amber-50 text-amber-700 border-amber-300';
            } else {
              cls += 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600';
            }

            return (
              <button key={q.id} className={cls} onClick={() => onSelect(i)} title={`Pregunta ${i + 1}`}>
                {i + 1}
                {isMarked && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-slate-200 space-y-1">
        {[
          { color: 'bg-blue-600', label: 'Actual' },
          { color: 'bg-green-100 border border-green-400', label: 'Respondida' },
          { color: 'bg-amber-50 border border-amber-300', label: 'Marcada' },
          { color: 'bg-white border border-gray-300', label: 'Pendiente' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export function ExamenClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    attemptId,
    startedAt,
    durationMinutes,
    calculatorEnabled,
    questions,
    answers,
    markedForReview,
    currentQuestionIndex,
    status,
    setAttempt,
    setCurrentQuestion,
    setAnswer,
    toggleMarkForReview,
    reset,
  } = useSimulatorStore();

  const [examTitle, setExamTitle] = useState('Simulador EXHCOBA');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSecurityEvent = useCallback(
    (type: SecurityEventType, details?: Record<string, unknown>) => {
      if (attemptId) logSecurityEvent(attemptId, type, details).catch(() => {});
    },
    [attemptId]
  );

  const { isFullscreen, requestFullscreen, showWarning, warningMessage } = useExamSecurity({
    enabled: status === 'in_progress',
    onEvent: handleSecurityEvent,
  });

  // Suppress unused variable warning
  void isFullscreen;

  const attemptIdFromUrl = searchParams.get('attempt');

  // Init
  useEffect(() => {
    async function init() {
      try {
        if (attemptIdFromUrl) {
          const attempt = await fetchAttempt(attemptIdFromUrl);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const a = attempt as any;
          const examData = a.exam;
          setExamTitle(examData?.title ?? 'Simulador EXHCOBA');

          // Support both snake_case (backend) and camelCase field names
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapAnswer = (ans: any) => ({
            questionId: ans.question_id ?? ans.questionId,
            answerJson: ans.answer_json ?? ans.answerJson,
            isMarkedForReview: ans.is_marked_for_review ?? ans.isMarkedForReview ?? false,
          });

          if (a.status === 'submitted' || a.status === 'expired') {
            const answersMap = Object.fromEntries(
              (a.answers ?? []).map((ans: ReturnType<typeof mapAnswer>) => [
                mapAnswer(ans as never).questionId, mapAnswer(ans as never).answerJson,
              ])
            );
            const res = await fetchResult(attemptIdFromUrl);
            setResult(res);
            setAttempt({
              attemptId: a.id,
              examId: a.exam_id ?? a.examId,
              startedAt: a.started_at ?? a.startedAt,
              durationMinutes: examData?.duration_minutes ?? examData?.durationMinutes ?? 60,
              totalScore: examData?.total_score ?? examData?.totalScore ?? 100,
              calculatorEnabled: examData?.calculator_enabled ?? examData?.calculatorEnabled ?? true,
              questions: examData?.questions ?? [],
              answers: answersMap,
              status: a.status,
            });
          } else {
            const answersMap = Object.fromEntries(
              (a.answers ?? []).map((ans: ReturnType<typeof mapAnswer>) => {
                const mapped = mapAnswer(ans as never);
                return [mapped.questionId, mapped.answerJson];
              })
            );
            const markedIds = (a.answers ?? [])
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter((ans: any) => ans.is_marked_for_review ?? ans.isMarkedForReview)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((ans: any) => ans.question_id ?? ans.questionId);
            setAttempt({
              attemptId: a.id,
              examId: a.exam_id ?? a.examId,
              startedAt: a.started_at ?? a.startedAt,
              durationMinutes: examData?.duration_minutes ?? examData?.durationMinutes ?? 60,
              totalScore: examData?.total_score ?? examData?.totalScore ?? 100,
              calculatorEnabled: examData?.calculator_enabled ?? examData?.calculatorEnabled ?? true,
              questions: examData?.questions ?? [],
              answers: answersMap,
              markedForReview: markedIds,
              status: a.status,
            });
            // Fetch form template if needed (non-critical)
            if (attempt.examId) {
              fetchFormTemplate(attempt.examId).catch(() => {});
            }
            setShowFullscreenPrompt(true);
          }
        } else {
          const exams = await fetchExams();
          const list = Array.isArray(exams) ? exams : [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const exam = list.find((e: any) => e.is_published ?? e.isPublished) ?? list[0];
          if (!exam) {
            setError('No hay simuladores disponibles.');
            return;
          }
          const started = await startAttempt(exam.id);
          // Backend returns { attempt: {...}, exam: {...} } — support both nested and flat shapes
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const startedAny = started as any;
          const att = startedAny.attempt ?? startedAny;
          const examData = startedAny.exam ?? exam;
          const attemptId = att.id;
          router.replace(`/examen?attempt=${attemptId}`);
          setExamTitle(examData?.title ?? exam.title ?? 'Simulador EXHCOBA');
          setAttempt({
            attemptId,
            examId: att.exam_id ?? att.examId ?? exam.id,
            startedAt: att.started_at ?? att.startedAt,
            durationMinutes: examData?.duration_minutes ?? examData?.durationMinutes ?? exam.duration_minutes ?? exam.durationMinutes ?? 60,
            totalScore: examData?.total_score ?? examData?.totalScore ?? exam.total_score ?? exam.totalScore ?? 100,
            calculatorEnabled: examData?.calculator_enabled ?? examData?.calculatorEnabled ?? exam.calculator_enabled ?? exam.calculatorEnabled ?? true,
            questions: examData?.questions ?? [],
            answers: {},
            markedForReview: [],
            status: 'in_progress',
          });
          setShowFullscreenPrompt(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar el examen.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptIdFromUrl]);

  async function doSubmit() {
    if (!attemptId || status !== 'in_progress') return;
    try {
      await submitAttempt(attemptId);
      const res = await fetchResult(attemptId);
      setResult(res);
      setAttempt({ status: 'submitted' });
      setShowReviewModal(false);
    } catch {
      setError('Error al enviar el examen.');
    }
  }

  function handleSubmit() {
    if (status !== 'in_progress') return;
    setShowReviewModal(true);
  }

  async function handleAnswer(questionId: string, value: unknown) {
    setAnswer(questionId, value);
    if (!attemptId || status !== 'in_progress') return;
    setSaving(true);
    try { await saveAnswer(attemptId, questionId, value); }
    catch { /* silent */ }
    finally { setTimeout(() => setSaving(false), 600); }
  }

  async function handleToggleMark() {
    const q = questions[currentQuestionIndex];
    if (!q || !attemptId || status !== 'in_progress') return;
    const nowMarked = !markedForReview.includes(q.id);
    toggleMarkForReview(q.id);
    try { await markForReview(attemptId, q.id, nowMarked); }
    catch {
      // Revert on failure
      toggleMarkForReview(q.id);
    }
  }

  function handleExpire() {
    if (!attemptId || status !== 'in_progress') return;
    submitAttempt(attemptId)
      .then(() => fetchResult(attemptId!).then(res => {
        setResult(res);
        setAttempt({ status: 'expired' });
      }))
      .catch(() => {});
  }

  // ── Computed ──
  const currentQ = questions[currentQuestionIndex];
  const isMarked = currentQ ? markedForReview.includes(currentQ.id) : false;

  function isAnsweredCheck(qId: string) {
    const a = answers[qId];
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && a.length === 0);
  }
  const answeredCount = questions.filter(q => isAnsweredCheck(q.id)).length;
  const totalQ = questions.length;

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        <p className="text-gray-500 text-sm">Cargando simulador...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow p-8 text-center max-w-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <span className="text-red-600 text-xl font-bold">!</span>
        </div>
        <p className="text-gray-800 font-semibold">No se pudo cargar el examen</p>
        <p className="text-red-600 text-sm">{error}</p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => { setError(''); setLoading(true); window.location.reload(); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Reintentar
          </button>
          <button onClick={() => router.push('/')} className="text-blue-600 hover:underline text-sm">
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );

  // ── Results ──
  if (result || status === 'submitted' || status === 'expired') {
    return (
      <ResultsView
        result={result}
        onRestart={() => { reset(); router.push('/'); }}
      />
    );
  }

  return (
    <>
      {/* Overlays */}
      <SecurityWarning visible={showWarning} message={warningMessage} />

      {showFullscreenPrompt && (
        <FullscreenPrompt
          examTitle={examTitle}
          onEnterFullscreen={() => { requestFullscreen(); setShowFullscreenPrompt(false); }}
          onSkip={() => setShowFullscreenPrompt(false)}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          questions={questions}
          answers={answers}
          markedForReview={markedForReview}
          onConfirm={doSubmit}
          onCancel={() => setShowReviewModal(false)}
        />
      )}

      {/* Mobile Nav Drawer */}
      {showMobileNav && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileNav(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b">
              <span className="font-semibold text-gray-800">Preguntas</span>
              <button onClick={() => setShowMobileNav(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <QuestionNavPanel
                questions={questions}
                currentIndex={currentQuestionIndex}
                answers={answers}
                markedForReview={markedForReview}
                onSelect={(i) => { setCurrentQuestion(i); setShowMobileNav(false); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

        {/* ── HEADER ── */}
        <header className="h-14 bg-slate-800 text-white flex items-center px-4 gap-4 flex-shrink-0 z-30 shadow-md">
          {/* Mobile menu */}
          <button
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded hover:bg-slate-700 transition-colors"
            onClick={() => setShowMobileNav(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">EXHCOBA</span>
              <span className="text-sm font-semibold text-white truncate">{examTitle}</span>
            </div>
            <span className="sm:hidden text-sm font-semibold text-white truncate">{examTitle}</span>
          </div>

          {/* Progress (desktop) */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 px-3 py-1.5 rounded-full">
            <CheckSquare className="h-3.5 w-3.5 text-green-400" />
            <span>{answeredCount}/{totalQ}</span>
          </div>

          {/* Saving indicator */}
          {saving && (
            <span className="hidden sm:block text-xs text-slate-400 animate-pulse">Guardando...</span>
          )}

          {/* Timer */}
          {startedAt && (
            <Timer
              startedAt={startedAt}
              durationMinutes={durationMinutes}
              onExpire={handleExpire}
              expired={status !== 'in_progress'}
            />
          )}

          {/* Help button */}
          <a
            href="/ayuda"
            target="_blank"
            rel="noopener noreferrer"
            title="Manual de ayuda"
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
          >
            <HelpCircle className="h-4 w-4" />
          </a>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={status !== 'in_progress'}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Finalizar</span>
          </button>
        </header>

        {/* ── BODY (3 columns) ── */}
        <div className="flex flex-1 min-h-0">

          {/* LEFT: Question navigator */}
          <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-white border-r border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Navegación</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <QuestionNavPanel
                questions={questions}
                currentIndex={currentQuestionIndex}
                answers={answers}
                markedForReview={markedForReview}
                onSelect={setCurrentQuestion}
              />
            </div>
          </aside>

          {/* CENTER: Question area */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 pb-8">
              {currentQ ? (
                <div className="space-y-6">
                  {/* Question header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                        {currentQuestionIndex + 1}
                      </span>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                          Pregunta {currentQuestionIndex + 1} de {totalQ}
                        </p>
                      </div>
                    </div>
                    {status === 'in_progress' && (
                      <button
                        onClick={handleToggleMark}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                          isMarked
                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-white text-gray-500 border-gray-300 hover:border-amber-300 hover:text-amber-600'
                        }`}
                      >
                        <Flag className={`h-3.5 w-3.5 ${isMarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                        {isMarked ? 'Marcada' : 'Marcar'}
                      </button>
                    )}
                  </div>

                  {/* Question card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                      <p className="text-base text-gray-900 leading-relaxed font-medium">
                        {currentQ.prompt}
                      </p>
                    </div>
                    <div className="px-6 py-5">
                      <QuestionRenderer
                        question={currentQ}
                        answer={answers[currentQ.id]}
                        onAnswer={(v) => handleAnswer(currentQ.id, v)}
                        onToggleMark={handleToggleMark}
                        isMarked={isMarked}
                      />
                    </div>
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>

                    {/* Mobile progress */}
                    <div className="lg:hidden text-xs text-gray-500">
                      {answeredCount}/{totalQ} resp.
                    </div>

                    <button
                      onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}
                      disabled={currentQuestionIndex === totalQ - 1}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  No hay preguntas disponibles
                </div>
              )}
            </div>
          </main>

          {/* RIGHT: Tools panel */}
          <aside className="hidden xl:flex flex-col w-60 flex-shrink-0 bg-white border-l border-slate-200">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Herramientas</p>
            </div>

            <div className="p-4 space-y-4">
              {/* Progress summary */}
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-600">Progreso del examen</p>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { label: 'Total', value: totalQ, color: 'text-gray-700' },
                    { label: 'Respondidas', value: answeredCount, color: 'text-green-600' },
                    { label: 'Pendientes', value: totalQ - answeredCount, color: 'text-gray-500' },
                    { label: 'Marcadas', value: markedForReview.length, color: 'text-amber-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-semibold ${color}`}>{value}</span>
                    </div>
                  ))}
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: totalQ > 0 ? `${(answeredCount / totalQ) * 100}%` : '0%' }}
                    />
                  </div>
                  <p className="text-center text-xs text-gray-400">
                    {totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0}% completado
                  </p>
                </div>
              </div>

              {/* Calculator */}
              {calculatorEnabled && (
                <div>
                  <button
                    onClick={() => setShowCalculator(!showCalculator)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                      showCalculator
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <CalcIcon className="h-4 w-4" />
                    {showCalculator ? 'Cerrar calculadora' : 'Abrir calculadora'}
                  </button>
                  {showCalculator && (
                    <div className="mt-3">
                      <Calculator />
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="rounded-lg border border-slate-200 p-3 text-xs text-gray-500 space-y-1.5">
                <p className="font-semibold text-gray-600">Instrucciones</p>
                <p>• Selecciona una respuesta por pregunta</p>
                <p>• Usa <strong>Marcar</strong> para revisar después</p>
                <p>• Las respuestas se guardan automáticamente</p>
                <p>• Revisa antes de finalizar</p>
                <a
                  href="/ayuda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-2 text-blue-600 hover:underline font-medium"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Ver manual completo
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
