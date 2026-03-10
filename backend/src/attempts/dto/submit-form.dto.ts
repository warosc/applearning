import { ApiProperty } from '@nestjs/swagger';

export class SubmitFormDto {
  @ApiProperty({ description: 'Payload del formulario según schema' })
  payload: Record<string, unknown>;
}
