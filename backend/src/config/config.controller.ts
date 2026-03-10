import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';

@ApiTags('config')
@Controller('api/config')
export class ConfigController {
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Configuración pública del sistema' })
  getPublicConfig() {
    return {
      appName: 'Simulador de Examen',
      version: '1.0.0',
      features: {
        calculator: true,
        dragDrop: true,
        markForReview: true,
        formSubmission: true,
      },
      questionTypes: ['single_choice', 'multiple_choice', 'numeric', 'algebraic', 'drag_drop'],
    };
  }
}
