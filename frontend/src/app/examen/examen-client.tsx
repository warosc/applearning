'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSimulatorStore } from '@/store/simulator-store';
import {
  fetchExams,
  startAttempt,
  fetchAttempt,
  saveAnswer,
  submitAttempt,
  fetchResult,
  submitForm,
  fetchFormTemplate,
  markForReview,
  logSecurityEvent,
} from '@/lib/api';
import { QuestionPanel } from '@/components/question-panel';
import { QuestionRenderer } from '@/components/questions/question-renderer';
import { Calculator } from '@/components/calculator';
import { ExamForm } from '@/components/exam-form';
import { Timer } from '@/components/timer';
import { ResultsView } from '@/components/results-view';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send, Flag } from 'lucide-react';
import { useExamSecurity, SecurityEventType } from '@/hooks/use-exam-security';
import { SecurityWarning } from '@/components/security-warning';
import { FullscreenPrompt } from '@/components/exam/fullscreen-prompt';
import { ReviewModal } from '@/components/exam/review-modal';

interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
}

interface FormTemplate {
  schemaJson?: {
    fields?: FormField[];
  };
}

export function ExamenClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdFromUrl = searchParams.get('attempt');

  const {
    attemptId,
    startedAt,
    durationMinutes,
    calculatorEnabled,
    questions,
    currentQuestionIndex,
    answers,
    markedForReview,
    status,
    setAttempt,
    setCurrentQuestion,
    setAnswer,
    toggleMarkForReview,
    reset,
  } = useSimulatorStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [examTitle, setExamTitle] = useState('Simulador de Examen');
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleSecurityEvent = useCallback(
    (type: SecurityEventType, details?: Record<string, unknown>) => {
      if (!attemptId) return;
      logSecurityEvent(attemptId, type, details).catch(() => {});
    },
    [attemptId]
  );

  const { isFullscreen, requestFullscreen, showWarning, warningMessage } = useExamSecurity({
    enabled: status === 'in_progress',
    onEvent: handleSecurityEvent,
  });

  useEffect(() => {
    async function init() {
      try {
        if (attemptIdFromUrl) {
          const attempt = await fetchAttempt(attemptIdFromUrl);
          const answersMap = Object.fromEntries(
            (attempt.answers ?? []).map((a: { questionId: string; answerJson: unknown }) => [
              a.questionId,
              a.answerJson,
            ])
          );
          setExamTitle(attempt.exam?.title ?? 'Examen');
          if (attempt.status === 'submitted' || attempt.status === 'expired') {
            const res = await fetchResult(attemptIdFromUrl);
            setResult(res);
            setAttempt({
              attemptId: attempt.id,
              examId: attempt.examId,
              startedAt: attempt.startedAt,
              durationMinutes: attempt.exam.durationMinutes,
              totalScore: attempt.exam.totalScore,
              calculatorEnabled: attempt.exam.calculatorEnabled ?? true,
              questions: attempt.exam.questions,
              answers: answersMap,
              status: attempt.status,
            });
          } else {
            const markedIds = (attempt.answers ?? [])
              .filter((a: { isMarkedForReview: boolean }) => a.isMarkedForReview)
              .map((a: { questionId: string }) => a.questionId);
            setAttempt({
              attemptId: attempt.id,
              examId: attempt.examId,
              startedAt: attempt.startedAt,
              durationMinutes: attempt.exam.durationMinutes,
              totalScore: attempt.exam.totalScore,
              calculatorEnabled: attempt.exam.calculatorEnabled ?? true,
              questions: attempt.exam.questions,
              answers: answersMap,
              markedForReview: markedIds,
              status: attempt.status,
            });
            const template = await fetchFormTemplate(attempt.examId);
            setFormTemplate(template);
            setShowFullscreenPrompt(true);
          }
        } else {
          const exams = await fetchExams();
          const list = Array.isArray(exams) ? exams : [];
          const exam = list.find((e: { isPublished: boolean }) => e.isPublished) ?? list[0];
          if (!exam) {
            setError('No hay exámenes disponibles');
            return;
          }
          const started = await startAttempt(exam.id);
          router.replace(`/examen?attempt=${started.id}`);
          setExamTitle(started.exam?.title ?? exam.title ?? 'Examen');
          setAttempt({
            attemptId: started.id,
            examId: started.examId,
            startedAt: started.startedAt,
            durationMinutes: started.exam.durationMinutes,
            totalScore: started.exam.totalScore,
            calculatorEnabled: started.exam.calculatorEnabled ?? true,
            questions: started.exam.questions,
            answers: {},
            status: 'in_progress',
          });
          const template = await fetchFormTemplate(started.examId);
          setFormTemplate(template);
          setShowFullscreenPrompt(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptIdFromUrl]);

  const saveAnswerToApi = async (questionId: string, answerJson: unknown) => {
    if (!attemptId || status !== 'in_progress') return;
    try {
      await saveAnswer(attemptId, questionId, answerJson);
    } catch {
      // Silently fail, guardado local sigue activo
    }
  };

  const handleToggleMarkForReview = async (questionId: string) => {
    if (!attemptId || status !== 'in_progress') return;
    const isMarked = markedForReview.includes(questionId);
    toggleMarkForReview(questionId);
    try {
      await markForReview(attemptId, questionId, !isMarked);
    } catch {
      // Revert on failure
      toggleMarkForReview(questionId);
    }
  };

  const handleTimeExpire = async () => {
    if (!attemptId || status !== 'in_progress') return;
    try {
      await submitAttempt(attemptId);
      const res = await fetchResult(attemptId);
      setResult(res);
      setAttempt({ status: 'expired' });
    } catch {
      setError('Error al finalizar por tiempo');
    }
  };

  const doSubmit = async () => {
    if (!attemptId || status !== 'in_progress') return;
    setShowReviewModal(false);
    try {
      await submitAttempt(attemptId);
      const res = await fetchResult(attemptId);
      setResult(res);
      setAttempt({ status: 'submitted' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar');
    }
  };

  const handleSubmit = () => {
    if (!attemptId || status !== 'in_progress') return;
    setShowReviewModal(true);
  };

  const handleFormSubmit = async (payload: Record<string, unknown>) => {
    if (!attemptId) return;
    try {
      await submitForm(attemptId, payload);
    } catch {
      setError('Error al guardar formulario');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-600">Cargando examen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-600">{error}</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  if (result) {
    return (
      <ResultsView
        result={result}
        questions={questions}
        answers={answers}
        onRestart={() => { reset(); router.push('/'); }}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;
  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    if (a === undefined || a === null || a === '') return false;
    if (Array.isArray(a) && a.length === 0) return false;
    return true;
  }).length;
  const formFields = formTemplate?.schemaJson?.fields ?? [];

  return (
    <>
      <SecurityWarning message={warningMessage} visible={showWarning} />

      {showFullscreenPrompt && !isFullscreen && (
        <FullscreenPrompt
          examTitle={examTitle}
          onEnterFullscreen={() => {
            requestFullscreen();
            setShowFullscreenPrompt(false);
          }}
          onSkip={() => setShowFullscreenPrompt(false)}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          questions={questions}
          answers={answers}
          markedForReview={markedForReview}
          onClose={() => setShowReviewModal(false)}
          onSubmit={doSubmit}
        />
      )}

    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{examTitle}</h1>
            <p className="text-xs text-slate-500">
              {answeredCount} de {questions.length} respondidas
            </p>
          </div>
          <Timer
            startedAt={startedAt!}
            durationMinutes={durationMinutes}
            onExpire={handleTimeExpire}
            expired={status !== 'in_progress'}
          />
          <Button onClick={handleSubmit} size="sm" disabled={status !== 'in_progress'}>
            <Send className="mr-1 h-4 w-4" />
            Enviar examen
          </Button>
        </div>
        {/* Barra de progreso */}
        <div className="mx-auto mt-2 max-w-7xl">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <QuestionPanel />
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}
              disabled={isFirst}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="flex items-center gap-2">
              {currentQuestion && status === 'in_progress' && (
                <Button
                  variant={markedForReview.includes(currentQuestion.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleMarkForReview(currentQuestion.id)}
                  className={markedForReview.includes(currentQuestion.id) ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  <Flag className="mr-1 h-4 w-4" />
                  {markedForReview.includes(currentQuestion.id) ? 'Marcada' : 'Marcar'}
                </Button>
              )}
              <span className="text-sm text-slate-600">
                Pregunta {currentQuestionIndex + 1} de {questions.length}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}
              disabled={isLast}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {currentQuestion && (
            <QuestionRenderer
              question={currentQuestion}
              onAnswerSave={(qId, value) => {
                setAnswer(qId, value);
                saveAnswerToApi(qId, value);
              }}
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Formulario</h3>
            {formFields.length > 0 ? (
              <ExamForm fields={formFields} onSubmit={handleFormSubmit} />
            ) : (
              <p className="text-sm text-slate-500">Sin formulario configurado</p>
            )}
          </div>
          {calculatorEnabled && (
            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Calculadora</h3>
              <Calculator />
            </div>
          )}
        </aside>
      </div>
    </main>
    </>
  );
}
