import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAnswerDto, SubmitFormDto } from './dto';
import { GradingService } from './grading.service';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly grading: GradingService,
  ) {}

  async start(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { orderIndex: 'asc' }, include: { options: true } } },
    });
    if (!exam) throw new NotFoundException('Examen no encontrado');
    if (!exam.isPublished) throw new BadRequestException('Examen no publicado');

    return this.prisma.examAttempt.create({
      data: { examId, status: 'in_progress' },
      include: {
        exam: { include: { questions: { orderBy: { orderIndex: 'asc' }, include: { options: true } } } },
      },
    });
  }

  async findOne(id: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id },
      include: {
        exam: { include: { questions: { orderBy: { orderIndex: 'asc' }, include: { options: true } } } },
        answers: true,
        formSubmission: true,
      },
    });
    if (!attempt) throw new NotFoundException('Intento no encontrado');

    // Auto-expirar si el tiempo ya pasó y sigue in_progress
    if (attempt.status === 'in_progress') {
      const startedAt = new Date(attempt.startedAt).getTime();
      const durationMs = attempt.exam.durationMinutes * 60 * 1000;
      if (Date.now() > startedAt + durationMs) {
        const answers = await this.prisma.answer.findMany({ where: { attemptId: id } });
        const { scoreObtained, percentage } = this.grading.calculateTotal(attempt.exam, answers);
        const timeSpent = Math.floor((Date.now() - startedAt) / 1000);
        return this.prisma.examAttempt.update({
          where: { id },
          data: { status: 'expired', submittedAt: new Date(), timeSpentSeconds: timeSpent, scoreObtained, percentage },
          include: {
            exam: { include: { questions: { orderBy: { orderIndex: 'asc' }, include: { options: true } } } },
            answers: true,
            formSubmission: true,
          },
        });
      }
    }

    return attempt;
  }

  async saveAnswer(attemptId: string, dto: SubmitAnswerDto) {
    const attempt = await this.findOne(attemptId);
    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('El examen ya fue enviado');
    }

    const question = attempt.exam.questions.find((q) => q.id === dto.questionId);
    if (!question) throw new NotFoundException('Pregunta no encontrada');

    const { isCorrect, scoreObtained } = this.grading.gradeAnswer(question, dto.answerJson);
    const answerJson = dto.answerJson as Prisma.InputJsonValue;

    const existing = await this.prisma.answer.findFirst({
      where: { attemptId, questionId: dto.questionId },
    });

    if (existing) {
      return this.prisma.answer.update({
        where: { id: existing.id },
        data: { answerJson, isCorrect, scoreObtained },
      });
    }

    return this.prisma.answer.create({
      data: { attemptId, questionId: dto.questionId, answerJson, isCorrect, scoreObtained },
    });
  }

  async submit(attemptId: string) {
    const attempt = await this.findOne(attemptId);
    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('El examen ya fue enviado');
    }

    const answers = await this.prisma.answer.findMany({ where: { attemptId } });
    const { scoreObtained, percentage } = this.grading.calculateTotal(attempt.exam, answers);
    const timeSpent = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { status: 'submitted', submittedAt: new Date(), timeSpentSeconds: timeSpent, scoreObtained, percentage },
    });
  }

  async getResult(attemptId: string) {
    const attempt = await this.findOne(attemptId);
    const answers = await this.prisma.answer.findMany({
      where: { attemptId },
      include: { question: true },
    });

    const examWithQuestions = attempt.exam as typeof attempt.exam & { questions: typeof attempt.exam.questions };
    const summary = this.grading.getResultSummary(examWithQuestions, answers);

    const perQuestion = attempt.exam.questions.map((q) => {
      const ans = answers.find((a) => a.questionId === q.id);
      return {
        questionId: q.id,
        isCorrect: ans?.isCorrect ?? null,
        scoreObtained: ans?.scoreObtained ?? 0,
        scorePossible: q.score,
        answered: ans !== undefined,
      };
    });

    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        scoreObtained: attempt.scoreObtained,
        percentage: attempt.percentage,
        timeSpentSeconds: attempt.timeSpentSeconds,
      },
      ...summary,
      perQuestion,
    };
  }

  async markForReview(attemptId: string, questionId: string, marked: boolean) {
    await this.findOne(attemptId);
    const existing = await this.prisma.answer.findFirst({
      where: { attemptId, questionId },
    });
    if (existing) {
      return this.prisma.answer.update({
        where: { id: existing.id },
        data: { isMarkedForReview: marked },
      });
    }
    return this.prisma.answer.create({
      data: {
        attemptId,
        questionId,
        answerJson: Prisma.JsonNull,
        isMarkedForReview: marked,
      },
    });
  }

  async resume(attemptId: string) {
    return this.findOne(attemptId);
  }

  async submitForm(attemptId: string, dto: SubmitFormDto) {
    const attempt = await this.findOne(attemptId);
    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('El examen ya fue enviado');
    }

    const payloadJson = dto.payload as Prisma.InputJsonValue;

    const existing = await this.prisma.formSubmission.findUnique({ where: { attemptId } });

    if (existing) {
      return this.prisma.formSubmission.update({
        where: { id: existing.id },
        data: { payloadJson },
      });
    }

    return this.prisma.formSubmission.create({
      data: { attemptId, payloadJson },
    });
  }
}
