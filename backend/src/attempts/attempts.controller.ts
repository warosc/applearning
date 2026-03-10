import {
  Controller, Get, Post, Patch,
  Body, Param, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { SubmitAnswerDto, SubmitFormDto, MarkReviewDto } from './dto';
import { Public } from '../auth/public.decorator';

@ApiTags('attempts')
@Controller('api')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Public()
  @Post('exams/:examId/start')
  @ApiOperation({ summary: 'Iniciar intento de examen' })
  start(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.attemptsService.start(examId);
  }

  @Public()
  @Get('attempts/:id')
  @ApiOperation({ summary: 'Obtener intento' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attemptsService.findOne(id);
  }

  @Public()
  @Get('attempts/:id/resume')
  @ApiOperation({ summary: 'Reanudar intento (verifica expiración y restaura estado)' })
  resume(@Param('id', ParseUUIDPipe) id: string) {
    return this.attemptsService.resume(id);
  }

  @Public()
  @Patch('attempts/:id/answer')
  @ApiOperation({ summary: 'Guardar respuesta' })
  saveAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.attemptsService.saveAnswer(id, dto);
  }

  @Public()
  @Patch('attempts/:id/mark-review')
  @ApiOperation({ summary: 'Marcar / desmarcar pregunta para revisar' })
  markForReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkReviewDto,
  ) {
    return this.attemptsService.markForReview(id, dto.questionId, dto.marked);
  }

  @Public()
  @Post('attempts/:id/submit')
  @ApiOperation({ summary: 'Enviar examen' })
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.attemptsService.submit(id);
  }

  @Public()
  @Get('attempts/:id/result')
  @ApiOperation({ summary: 'Obtener resultados' })
  getResult(@Param('id', ParseUUIDPipe) id: string) {
    return this.attemptsService.getResult(id);
  }

  @Public()
  @Post('attempts/:id/form-submit')
  @ApiOperation({ summary: 'Enviar formulario del intento' })
  submitForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitFormDto,
  ) {
    return this.attemptsService.submitForm(id, dto);
  }
}
