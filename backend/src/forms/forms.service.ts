import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFormTemplateDto } from './dto';

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTemplate(examId: string) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { examId },
    });
    if (!template) {
      return {
        examId,
        title: 'Datos del estudiante',
        schemaJson: {
          fields: [
            { id: 'nombre', label: 'Nombre', type: 'text', required: true },
            { id: 'grado', label: 'Grado', type: 'text', required: false },
            { id: 'seccion', label: 'Sección', type: 'text', required: false },
          ],
        },
      };
    }
    return template;
  }

  async updateTemplate(examId: string, dto: UpdateFormTemplateDto) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Examen no encontrado');

    const schemaJson = (dto.schemaJson ?? {}) as Prisma.InputJsonValue;

    return this.prisma.formTemplate.upsert({
      where: { examId },
      create: {
        examId,
        title: dto.title ?? 'Datos del estudiante',
        schemaJson,
      },
      update: {
        ...(dto.title && { title: dto.title }),
        ...(dto.schemaJson !== undefined && { schemaJson }),
      },
    });
  }
}
