import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class RevisarSupervisorDto {
  @ApiPropertyOptional({
    example: 'Rendición de insumos revisada y conforme para desembolso.',
    description: 'Observación o criterio del supervisor sobre la rendición del refrigerio',
  })
  @IsOptional()
  @IsString()
  observacion?: string;

  @ApiPropertyOptional({ description: 'ID del supervisor o revisor (opcional)' })
  @IsOptional()
  @IsNumber()
  supervisor_id?: number;

  @ApiPropertyOptional({ description: 'Nombre del supervisor o revisor (opcional)' })
  @IsOptional()
  @IsString()
  supervisor_nombre?: string;

  @ApiPropertyOptional({ description: 'Observación del supervisor (opcional)' })
  @IsOptional()
  @IsString()
  observacion_supervisor?: string;

  @ApiPropertyOptional({ description: 'Motivo de rechazo (opcional)' })
  @IsOptional()
  @IsString()
  motivo_rechazo?: string;
}
