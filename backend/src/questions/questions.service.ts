import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByExam(examId: string) {
    return this.prisma.question.findMany({
      where: { examId },
      orderBy: { orderIndex: 'asc' },
      include: { options: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  async create(dto: CreateQuestionDto) {
    const metadataJson = dto.metadataJson as Prisma.InputJsonValue | undefined;
    return this.prisma.question.create({
      data: {
        examId: dto.examId,
        sectionId: dto.sectionId,
        orderIndex: dto.orderIndex ?? 0,
        type: dto.type,
        prompt: dto.prompt,
        score: dto.score ?? 1,
        ...(metadataJson !== undefined && { metadataJson }),
        options: dto.options
          ? {
              create: dto.options.map((o, i) => ({
                label: o.label,
                value: o.value,
                isCorrect: o.isCorrect ?? false,
                orderIndex: o.orderIndex ?? i,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);
    const metadataJson = dto.metadataJson as Prisma.InputJsonValue | undefined;
    return this.prisma.question.update({
      where: { id },
      data: {
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
        ...(dto.type && { type: dto.type }),
        ...(dto.prompt && { prompt: dto.prompt }),
        ...(dto.score !== undefined && { score: dto.score }),
        ...(metadataJson !== undefined && { metadataJson }),
        ...(dto.sectionId !== undefined && { sectionId: dto.sectionId }),
      },
      include: { options: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.question.delete({ where: { id } });
  }

  private async findOne(id: string) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Pregunta no encontrada');
    return q;
  }
}
