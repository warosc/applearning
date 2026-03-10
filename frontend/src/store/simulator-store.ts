import { create } from 'zustand';

export type QuestionStatus = 'active' | 'answered' | 'pending' | 'marked';

export interface AttemptState {
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
}

interface SimulatorStore extends AttemptState {
  setAttempt: (data: Partial<AttemptState>) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (questionId: string, value: unknown) => void;
  toggleMarkForReview: (questionId: string) => void;
  reset: () => void;
}

const initialState: AttemptState = {
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
};

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  ...initialState,

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

  setAnswer: (questionId, value) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: value },
    })),

  toggleMarkForReview: (questionId) =>
    set((state) => {
      const has = state.markedForReview.includes(questionId);
      const next = has
        ? state.markedForReview.filter((id) => id !== questionId)
        : [...state.markedForReview, questionId];
      return { markedForReview: next };
    }),

  reset: () => set(initialState),
}));
