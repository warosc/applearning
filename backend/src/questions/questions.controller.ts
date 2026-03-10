import { Controller, Get, Post, Put, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';

@ApiTags('questions')
@Controller('api')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Public()
  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Listar preguntas de un examen' })
  findByExam(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.questionsService.findByExam(examId);
  }

  @Roles('admin')
  @Post('questions')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Crear pregunta' })
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Roles('admin')
  @Put('questions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualizar pregunta' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Roles('admin')
  @Delete('questions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Eliminar pregunta' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.remove(id);
  }
}
