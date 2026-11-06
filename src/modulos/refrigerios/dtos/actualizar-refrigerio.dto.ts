import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CrearRefrigerioDto } from './crear-refrigerio.dto';

export class ActualizarRefrigerioDto extends PartialType(CrearRefrigerioDto) {
  @ApiPropertyOptional({ example: 'Coordinación General BUMAND', description: 'Supervisor o responsable de la entrega' })
  @IsOptional()
  @IsString()
  responsable_entrega?: string;

  @ApiPropertyOptional({ example: 'Detalle de los alimentos entregados a los becarios...', description: 'Observaciones o menú detallado' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
