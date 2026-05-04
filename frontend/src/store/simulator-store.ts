import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveAnswer as apiSaveAnswer } from '@/lib/api';

export type QuestionStatus = 'active' | 'answered' | 'pending' | 'marked';

export interface AttemptState {
  // Calculator state
  calculatorDisplay: string;
  calculatorPrev: string | null;
  calculatorOp: '+' | '-' | '×' | '÷' | 'xʸ' | null;
  calculatorFresh: boolean;
  calculatorAngleMode: 'deg' | 'rad';

  attemptId: string | null;
  examId: string | null;
  startedAt: string | null;
  durationMinutes: number;
  totalScore: number;
  calculatorEnabled: boolean;
  questions: Array<{
    id: string;
    type: string;
    prompt: string;
    options?: Array< { id: string; label: string; value: string; isCorrect?: boolean; orderIndex?: number }>;
    score: number;
    metadataJson?: Record<string, unknown>;
  }>;
  answers: Record<string, unknown>;
  markedForReview: string[];
  currentQuestionIndex: number;
  status: 'in_progress' | 'submitted' | 'expired';
  expiresAt: string | null; // New: Server-provided expiry time
  pendingAnswers: { questionId: string; answerJson: any; timestamp: number }[]; // New: Queue for offline answers
  isOnline: boolean; // New: Track online status
  isSaving: boolean; // New: Track if an answer is currently being saved
  lastSaveError: string | null; // New: Store last save error
}

interface SimulatorStore extends AttemptState {
  // Calculator actions
  setCalculatorDisplay: (display: string) => void;
  setCalculatorPrev: (prev: string | null) => void;
  setCalculatorOp: (op: '+' | '-' | '×' | '÷' | 'xʸ' | null) => void;
  setCalculatorFresh: (fresh: boolean) => void;
  setCalculatorAngleMode: (mode: 'deg' | 'rad') => void;

  setAttempt: (data: Partial<AttemptState>) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (questionId: string, value: unknown) => void;
  toggleMarkForReview: (questionId: string) => void;
  reset: () => void;
  setOnlineStatus: (isOnline: boolean) => void;
  addPendingAnswer: (questionId: string, answerJson: any) => void;
  syncPendingAnswers: () => Promise<void>;
}

const initialState: AttemptState = {
  // Calculator initial state
  calculatorDisplay: '0',
  calculatorPrev: null,
  calculatorOp: null,
  calculatorFresh: false,
  calculatorAngleMode: 'deg',

  attemptId: null,
  examId: null,
  startedAt: null,
  durationMinutes: 60,
  totalScore: 100,
  calculatorEnabled: true,
  questions: [],
  answers: {},
  markedForReview: [],
  currentQuestionIndex: 0,
  status: 'in_progress',
  expiresAt: null,
  pendingAnswers: [],
  isOnline: true,
  isSaving: false,
  lastSaveError: null,
};

export const useSimulatorStore = create<SimulatorStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Calculator actions
      setCalculatorDisplay: (display) => set({ calculatorDisplay: display }),
      setCalculatorPrev: (prev) => set({ calculatorPrev: prev }),
      setCalculatorOp: (op) => set({ calculatorOp: op }),
      setCalculatorFresh: (fresh) => set({ calculatorFresh: fresh }),
      setCalculatorAngleMode: (mode) => set({ calculatorAngleMode: mode }),

      setAttempt: (data) =>
        set((state) => ({
          ...state,
          ...data,
          markedForReview: data.markedForReview ?? state.markedForReview,
        })),

      setCurrentQuestion: (index) =>
        set({
          currentQuestionIndex: Math.max(0, Math.min(index, get().questions.length - 1)),
        }),

      setAnswer: (questionId, value) => {
        const { attemptId, isOnline, addPendingAnswer } = get();
        if (!attemptId) return;

        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: value,
          },
        }));

        // Attempt to save immediately if online, otherwise add to pending
        if (isOnline) {
          set({ isSaving: true, lastSaveError: null });
          apiSaveAnswer(attemptId, questionId, value)
            .then(() => set({ isSaving: false }))
            .catch((error) => {
              console.error('Error saving answer:', error);
              set({ isSaving: false, lastSaveError: 'Error al guardar. Reintentando...' });
              addPendingAnswer(questionId, value); // Add to queue on failure
            });
        } else {
          addPendingAnswer(questionId, value);
        }
      },

      toggleMarkForReview: (questionId) =>
        set((state) => {
          const has = state.markedForReview.includes(questionId);
          const next = has
            ? state.markedForReview.filter((id) => id !== questionId)
            : [...state.markedForReview, questionId];
          return { markedForReview: next };
        }),

      reset: () => set(initialState),

      setOnlineStatus: (isOnline) => set({ isOnline }),

      addPendingAnswer: (questionId, answerJson) =>
        set((state) => ({
          pendingAnswers: [...state.pendingAnswers, { questionId, answerJson, timestamp: Date.now() }],
        })),

      syncPendingAnswers: async () => {
        const { attemptId, pendingAnswers, isOnline } = get();
        if (!attemptId || !isOnline || pendingAnswers.length === 0) return;

        set({ isSaving: true, lastSaveError: null });
        const successfulSyncs: number[] = [];

        for (let i = 0; i < pendingAnswers.length; i++) {
          const { questionId, answerJson } = pendingAnswers[i];
          try {
            await apiSaveAnswer(attemptId, questionId, answerJson);
            successfulSyncs.push(i);
          } catch (error) {
            console.error('Failed to sync pending answer:', questionId, error);
            set({ lastSaveError: 'Error al sincronizar respuestas pendientes.' });
            // Stop syncing if one fails, to avoid overwhelming the server or retrying bad data
            break;
          }
        }

        set((state) => ({
          pendingAnswers: state.pendingAnswers.filter((_, i) => !successfulSyncs.includes(i)),
          isSaving: false,
          lastSaveError: state.pendingAnswers.length === successfulSyncs.length ? null : state.lastSaveError,
        }));
      },
    }),
    {
      name: 'simulator-storage', // name of the item in localStorage
      partialize: (state) => ({
        attemptId: state.attemptId,
        examId: state.examId,
        questions: state.questions,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        markedForReview: state.markedForReview,
        status: state.status,
        startedAt: state.startedAt,
        durationMinutes: state.durationMinutes,
        expiresAt: state.expiresAt,
        pendingAnswers: state.pendingAnswers, // Persist pending answers
        calculatorDisplay: state.calculatorDisplay,
        calculatorPrev: state.calculatorPrev,
        calculatorOp: state.calculatorOp,
        calculatorFresh: state.calculatorFresh,
        calculatorAngleMode: state.calculatorAngleMode,
      }),
    },
  ),
);
