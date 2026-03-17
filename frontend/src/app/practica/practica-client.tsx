'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Zap, Flame, BookOpen, CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { practiceStart, practiceAnswer } from '@/lib/api';
import { QuestionRenderer } from '@/components/questions/question-renderer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionOption {
  id: string;
  value: string;
  label: string;
  weight?: number;
  order_index?: number;
}

interface Question {
  id: string;
  type: string;
  prompt: string;
  materia?: string | null;
  tema?: string | null;
  difficulty?: string;
  score?: number;
  metadata_json?: Record<string, unknown> | null;
  options: QuestionOption[];
  [key: string]: unknown;
}

interface NivelByMateria {
  materia: string;
  nivel: number;
  aciertos: number;
  errores: number;
}

interface Progress {
  xp: number;
  streak_days: number;
  nivel_by_materia: NivelByMateria[];
}

type Phase = 'setup' | 'loading' | 'question' | 'feedback' | 'end';

const MAX_LIVES = 5;

// ─── Utils ────────────────────────────────────────────────────────────────────

function nivelColor(n: number) {
  if (n >= 70) return 'text-green-600 bg-green-100';
  if (n >= 40) return 'text-amber-600 bg-amber-100';
  return 'text-red-600 bg-red-100';
}

function nivelBarColor(n: number) {
  if (n >= 70) return 'bg-green-500';
  if (n >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

function difficultyLabel(d?: string) {
  if (d === 'facil') return { text: 'Fácil', cls: 'bg-green-100 text-green-700' };
  if (d === 'dificil') return { text: 'Difícil', cls: 'bg-red-100 text-red-700' };
  return { text: 'Medio', cls: 'bg-amber-100 text-amber-700' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Hearts({ lives }: { lives: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <Heart
          key={i}
          className={`h-5 w-5 transition-all duration-300 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

function XpBadge({ xp, earned }: { xp: number; earned?: number }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
      <Zap className="h-4 w-4 fill-amber-400" />
      <span>{xp}</span>
      {!!earned && (
        <span className="text-xs text-amber-500 animate-bounce">+{earned}</span>
      )}
    </div>
  );
}

function StreakBadge({ days }: { days: number }) {
  if (!days) return null;
  return (
    <div className="flex items-center gap-1 text-sm font-semibold text-orange-500">
      <Flame className="h-4 w-4 fill-orange-400" />
      <span>{days}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PracticaClient() {
  const router = useRouter();
  const { token, user } = useAuthStore();

  // Session state
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [availableMaterias, setAvailableMaterias] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);

  // Question state
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<unknown>(null);
  const [shownIds, setShownIds] = useState<string[]>([]);

  // Feedback state
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctDisplay, setCorrectDisplay] = useState('');
  const [xpEarned, setXpEarned] = useState(0);
  const [skillNivel, setSkillNivel] = useState<number | null>(null);

  // Session stats
  const [lives, setLives] = useState(MAX_LIVES);
  const [sessionXp, setSessionXp] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [error, setError] = useState('');
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Auth guard ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (token === null) {
      router.replace('/login');
    }
  }, [token, router]);

  // ─── Load setup data (materias + progress) ────────────────────────────────

  useEffect(() => {
    if (!token) return;
    // Pre-fetch available materias via start (materia=null shows them all)
    practiceStart(token)
      .then((data) => {
        setAvailableMaterias(data.materias ?? []);
        setProgress(data.progress ?? null);
      })
      .catch(() => setError('No hay preguntas en el banco. Importa preguntas primero.'));
  }, [token]);

  // ─── Start session ────────────────────────────────────────────────────────

  async function handleStart(materia: string | null) {
    if (!token) return;
    setSelectedMateria(materia);
    setPhase('loading');
    setError('');
    try {
      const data = await practiceStart(token, materia ?? undefined);
      const q = data.question as Question;
      setQuestion(q);
      setShownIds([q.id]);
      setProgress(data.progress ?? null);
      setLives(MAX_LIVES);
      setSessionXp(0);
      setAnswered(0);
      setCorrectCount(0);
      setAnswer(null);
      setPhase('question');
    } catch (e) {
      setError((e as Error).message);
      setPhase('setup');
    }
  }

  // ─── Submit answer ────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!token || !question || answer === null || answer === '') return;
    if (phase !== 'question') return;

    setPhase('loading');
    try {
      const res = await practiceAnswer(token, question.id, answer, shownIds, selectedMateria ?? undefined);

      setIsCorrect(res.is_correct);
      setCorrectDisplay(res.correct_display ?? '');
      setXpEarned(res.xp_earned ?? 0);
      setSkillNivel(res.skill?.nivel ?? null);

      const correct = !!res.is_correct;
      setAnswered((n) => n + 1);
      if (correct) setCorrectCount((n) => n + 1);
      setSessionXp((x) => x + (res.xp_earned ?? 0));

      const newLives = correct ? lives : lives - 1;
      setLives(newLives);

      // Update progress
      if (res.skill) {
        setProgress((p) => {
          if (!p) return p;
          const existing = p.nivel_by_materia.find((m) => m.materia === res.skill.materia);
          if (existing) {
            return {
              ...p,
              xp: res.total_xp ?? p.xp,
              streak_days: res.streak_days ?? p.streak_days,
              nivel_by_materia: p.nivel_by_materia.map((m) =>
                m.materia === res.skill.materia
                  ? { ...m, nivel: res.skill.nivel, aciertos: res.skill.aciertos, errores: res.skill.errores }
                  : m
              ),
            };
          }
          return {
            ...p,
            xp: res.total_xp ?? p.xp,
            streak_days: res.streak_days ?? p.streak_days,
            nivel_by_materia: [
              ...p.nivel_by_materia,
              { materia: res.skill.materia, nivel: res.skill.nivel, aciertos: res.skill.aciertos, errores: res.skill.errores },
            ],
          };
        });
      }

      // Prepare next question
      if (res.next_question) {
        const nq = res.next_question as Question;
        setShownIds((prev) => [...prev, nq.id]);
        // Store for after feedback
        (res as Record<string, unknown>)._next_q = nq;
      }

      if (newLives <= 0) {
        setPhase('feedback');
        // Will auto-advance to 'end'
        autoAdvanceRef.current = setTimeout(() => {
          setPhase('end');
        }, 2000);
      } else if (!res.next_question) {
        // No more questions
        setPhase('feedback');
        autoAdvanceRef.current = setTimeout(() => setPhase('end'), 2000);
      } else {
        setPhase('feedback');
        // Store next question for transition
        const nq = res.next_question as Question;
        autoAdvanceRef.current = setTimeout(() => {
          setQuestion(nq);
          setAnswer(null);
          setIsCorrect(null);
          setCorrectDisplay('');
          setXpEarned(0);
          setPhase('question');
        }, 1800);
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase('question');
    }
  }

  function handleNextManual() {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (lives <= 0 || phase === 'end') {
      setPhase('end');
      return;
    }
    setQuestion((prev) => prev); // stays the same until next question is loaded
    setAnswer(null);
    setIsCorrect(null);
    setCorrectDisplay('');
    setXpEarned(0);
    setPhase('question');
  }

  function handleRestart() {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setPhase('setup');
    setShownIds([]);
    setQuestion(null);
    setAnswer(null);
    setIsCorrect(null);
    setCorrectDisplay('');
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current); }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!token) return null;

  // ── Session end ──────────────────────────────────────────────────────────
  if (phase === 'end') {
    const accuracy = answered > 0 ? Math.round((correctCount / answered) * 100) : 0;
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex flex-col items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 max-w-sm w-full p-8 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">¡Sesión completada!</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 border px-3 py-3">
              <p className="text-2xl font-bold text-gray-900">{sessionXp}</p>
              <p className="text-xs text-gray-500">XP ganados</p>
            </div>
            <div className="rounded-xl bg-slate-50 border px-3 py-3">
              <p className="text-2xl font-bold text-gray-900">{accuracy}%</p>
              <p className="text-xs text-gray-500">precisión</p>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-3">
              <p className="text-2xl font-bold text-green-600">{correctCount}</p>
              <p className="text-xs text-green-700">correctas</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-3">
              <p className="text-2xl font-bold text-red-600">{answered - correctCount}</p>
              <p className="text-xs text-red-700">incorrectas</p>
            </div>
          </div>
          {progress && progress.streak_days > 0 && (
            <div className="flex items-center justify-center gap-2 text-orange-500 font-semibold">
              <Flame className="h-5 w-5 fill-orange-400" />
              {progress.streak_days} día{progress.streak_days !== 1 ? 's' : ''} consecutivo{progress.streak_days !== 1 ? 's' : ''}
            </div>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Otra sesión
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Setup screen ─────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 px-4 py-10">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modo Práctica</h1>
              <p className="text-sm text-gray-500">Aprende de tus debilidades, una pregunta a la vez</p>
            </div>
          </div>

          {/* Progress card */}
          {progress && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Tu progreso</span>
                <div className="flex items-center gap-3">
                  <StreakBadge days={progress.streak_days} />
                  <XpBadge xp={progress.xp} />
                </div>
              </div>
              {progress.nivel_by_materia.length > 0 ? (
                <div className="space-y-2">
                  {progress.nivel_by_materia.map((m) => (
                    <div key={m.materia}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{m.materia}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${nivelColor(m.nivel)}`}>
                          {m.nivel.toFixed(0)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${nivelBarColor(m.nivel)}`}
                          style={{ width: `${m.nivel}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Aún no has practicado ninguna materia.</p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Materia selector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">¿Qué quieres practicar?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStart(null)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Todas las materias
              </button>
              {availableMaterias.map((m) => {
                const skill = progress?.nivel_by_materia.find((s) => s.materia === m);
                return (
                  <button
                    key={m}
                    onClick={() => handleStart(m)}
                    className="flex flex-col items-start px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-gray-800">{m}</span>
                    {skill && (
                      <span className={`text-xs font-semibold mt-0.5 px-1.5 py-0.5 rounded ${nivelColor(skill.nivel)}`}>
                        Nivel {skill.nivel.toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ── Question + feedback ───────────────────────────────────────────────────
  if (!question) return null;

  const diff = difficultyLabel(question.difficulty);
  const progressPct = answered > 0 ? Math.min(100, (correctCount / Math.max(answered, 1)) * 100) : 0;
  const showFeedback = phase === 'feedback';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex flex-col">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link href="/practica" onClick={handleRestart} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {/* Progress bar */}
          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <Hearts lives={lives} />
          <XpBadge xp={(progress?.xp ?? 0) + sessionXp} earned={showFeedback && xpEarned > 0 ? xpEarned : undefined} />
          {(progress?.streak_days ?? 0) > 0 && <StreakBadge days={progress!.streak_days} />}
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {question.materia && (
            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">{question.materia}</span>
          )}
          {question.tema && (
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">{question.tema}</span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${diff.cls}`}>{diff.text}</span>
          <span className="ml-auto text-gray-400">{answered} respondidas</span>
        </div>

        {/* Question prompt */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-base font-medium text-gray-900 leading-relaxed mb-4">{question.prompt}</p>

          {/* Renderer — pointer-events disabled during feedback */}
          <div className={showFeedback ? 'pointer-events-none opacity-80' : ''}>
            <QuestionRenderer
              question={question}
              answer={answer}
              onAnswer={setAnswer}
            />
          </div>
        </div>

        {/* Feedback overlay */}
        {showFeedback && (
          <div
            className={`rounded-2xl border px-5 py-4 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300 ${
              isCorrect
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </p>
              {!isCorrect && correctDisplay && (
                <p className="text-sm text-red-700 mt-0.5">
                  Respuesta correcta: <span className="font-semibold">{correctDisplay}</span>
                </p>
              )}
              {isCorrect && xpEarned > 0 && (
                <p className="text-sm text-green-700 mt-0.5 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  +{xpEarned} XP
                  {skillNivel !== null && (
                    <span className="ml-2">· Nivel {skillNivel.toFixed(0)}</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={handleNextManual}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                isCorrect
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Confirm button — only shown while in 'question' phase */}
        {!showFeedback && (
          <button
            onClick={handleConfirm}
            disabled={answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0)}
            className="w-full py-3.5 rounded-2xl text-base font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors shadow-sm"
          >
            Confirmar respuesta
          </button>
        )}

        {/* Error inline */}
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
