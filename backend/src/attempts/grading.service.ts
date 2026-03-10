import { Injectable } from '@nestjs/common';
import { Exam } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Tipo mínimo necesario para gradear — no requiere los campos de DB que no usamos
interface QuestionLike {
  type: string;
  score: number;
  metadataJson?: unknown;
  options: { value: string; isCorrect: boolean; orderIndex?: number }[];
}

// Tipo mínimo para respuestas en cálculo de total
interface AnswerLike {
  isCorrect?: boolean | null;
  scoreObtained?: number | null;
}

@Injectable()
export class GradingService {
  constructor(private readonly prisma: PrismaService) {}

  gradeAnswer(question: QuestionLike, answerJson: unknown): { isCorrect: boolean; scoreObtained: number } {
    const scorePerQuestion = question.score ?? 1;

    switch (question.type) {
      case 'single_choice': {
        const answer = this.normalizeString(String(answerJson ?? ''));
        const correct = question.options.find((o) => o.isCorrect);
        const isCorrect = correct ? answer === this.normalizeString(correct.value) : false;
        return { isCorrect, scoreObtained: isCorrect ? scorePerQuestion : 0 };
      }

      case 'multiple_choice': {
        const answerArr = Array.isArray(answerJson) ? answerJson : [answerJson];
        const selected = (answerArr as string[]).map((v) => this.normalizeString(String(v)));
        const correctValues = question.options.filter((o) => o.isCorrect).map((o) => this.normalizeString(o.value));
        const allCorrect =
          selected.length === correctValues.length &&
          correctValues.every((c) => selected.includes(c));
        return { isCorrect: allCorrect, scoreObtained: allCorrect ? scorePerQuestion : 0 };
      }

      case 'numeric': {
        const answer = this.normalizeNumeric(String(answerJson ?? ''));
        const expected = (question.metadataJson as { expected?: string } | null)?.expected;
        if (!expected) return { isCorrect: false, scoreObtained: 0 };
        const isCorrect = answer === this.normalizeNumeric(expected);
        return { isCorrect, scoreObtained: isCorrect ? scorePerQuestion : 0 };
      }

      case 'algebraic': {
        const answer = this.normalizeAlgebraic(String(answerJson ?? ''));
        const expected = (question.metadataJson as { expected?: string } | null)?.expected;
        if (!expected) return { isCorrect: false, scoreObtained: 0 };
        const isCorrect = answer === this.normalizeAlgebraic(expected);
        return { isCorrect, scoreObtained: isCorrect ? scorePerQuestion : 0 };
      }

      case 'drag_drop': {
        const answerArr = Array.isArray(answerJson) ? answerJson : [];
        const correctOrder = [...question.options]
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
          .map((o) => o.value);
        const submittedOrder = answerArr.map((v: unknown) => String(v));
        const isCorrect =
          submittedOrder.length === correctOrder.length &&
          submittedOrder.every((v, i) => this.normalizeString(v) === this.normalizeString(correctOrder[i]));
        return { isCorrect, scoreObtained: isCorrect ? scorePerQuestion : 0 };
      }

      default:
        return { isCorrect: false, scoreObtained: 0 };
    }
  }

  calculateTotal(
    exam: Exam,
    answers: AnswerLike[],
  ): { scoreObtained: number; percentage: number } {
    const totalPossible = exam.totalScore;
    const scoreObtained = answers.reduce((sum, a) => sum + (a.scoreObtained ?? 0), 0);
    const percentage = totalPossible > 0 ? (scoreObtained / totalPossible) * 100 : 0;
    return { scoreObtained, percentage };
  }

  getResultSummary(
    exam: Exam & { questions?: unknown[] },
    answers: AnswerLike[],
  ) {
    const totalPossible = exam.totalScore;
    const scoreObtained = answers.reduce((sum, a) => sum + (a.scoreObtained ?? 0), 0);
    const percentage = totalPossible > 0 ? (scoreObtained / totalPossible) * 100 : 0;
    const correct = answers.filter((a) => a.isCorrect === true).length;
    const incorrect = answers.filter((a) => a.isCorrect === false).length;
    const questionCount = exam.questions?.length ?? 0;
    const unanswered = Math.max(0, questionCount - answers.length);

    return {
      totalObtained: scoreObtained,
      totalPossible,
      percentage,
      correctCount: correct,
      incorrectCount: incorrect,
      unansweredCount: unanswered,
    };
  }

  private normalizeString(s: string): string {
    return s.trim().toLowerCase();
  }

  private normalizeNumeric(s: string): string {
    return s.replace(/\s/g, '').replace(',', '.');
  }

  private normalizeAlgebraic(s: string): string {
    return s.replace(/\s/g, '').toLowerCase();
  }
}
