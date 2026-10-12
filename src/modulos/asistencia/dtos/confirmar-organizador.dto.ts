import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class ConfirmarOrganizadorDto {
  @ApiPropertyOptional({
    example: [1, 2, 3],
    description: 'Lista de IDs de marcaciones de asistencia a confirmar en lote',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  asistencia_ids?: number[];

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de una marcación individual de asistencia a confirmar',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  asistencia_id?: number;
}
