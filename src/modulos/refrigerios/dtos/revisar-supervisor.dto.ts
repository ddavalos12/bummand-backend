import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RevisarSupervisorDto {
  @ApiPropertyOptional({
    example: 'Rendición de insumos revisada y conforme para desembolso.',
    description: 'Observación o criterio del supervisor sobre la rendición del refrigerio',
  })
  @IsOptional()
  @IsString()
  observacion?: string;
}
