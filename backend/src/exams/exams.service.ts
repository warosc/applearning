import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto } from './dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: { options: { orderBy: { orderIndex: 'asc' } } },
        },
        formTemplates: true,
      },
    });
    if (!exam) throw new NotFoundException('Examen no encontrado');
    return exam;
  }

  async create(dto: CreateExamDto) {
    return this.prisma.exam.create({
      data: {
        title: dto.title,
        description: dto.description,
        totalScore: dto.totalScore ?? 100,
        durationMinutes: dto.durationMinutes ?? 60,
        isPublished: dto.isPublished ?? false,
        calculatorEnabled: dto.calculatorEnabled ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateExamDto) {
    await this.findOne(id);
    return this.prisma.exam.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.exam.delete({ where: { id } });
  }
}
