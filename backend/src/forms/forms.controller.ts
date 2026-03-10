import { Controller, Get, Put, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { UpdateFormTemplateDto } from './dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';

@ApiTags('forms')
@Controller('api/exams')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Public()
  @Get(':examId/form-template')
  @ApiOperation({ summary: 'Obtener plantilla de formulario' })
  getTemplate(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.formsService.getTemplate(examId);
  }

  @Roles('admin')
  @Put(':examId/form-template')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualizar plantilla de formulario' })
  updateTemplate(
    @Param('examId', ParseUUIDPipe) examId: string,
    @Body() dto: UpdateFormTemplateDto,
  ) {
    return this.formsService.updateTemplate(examId, dto);
  }
}
