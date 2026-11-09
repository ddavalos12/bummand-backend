import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class ConfirmarRecojoDto {
  @ApiPropertyOptional({ example: 4, description: 'ID del becario que recoge la ración' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  becario_id?: number;

  @ApiPropertyOptional({ example: 'Nilda Amalia Churata Paye', description: 'Nombre del becario' })
  @IsOptional()
  @IsString()
  nombre_becario?: string;

  @ApiPropertyOptional({ example: '2026-10-12T10:30:00.000Z', description: 'Fecha y hora de recojo' })
  @IsOptional()
  @IsString()
  fecha_hora?: string;

  @ApiPropertyOptional({ example: '10:30', description: 'Hora de recojo' })
  @IsOptional()
  @IsString()
  hora_recojo?: string;

  @ApiPropertyOptional({ example: true, description: 'Indicador de recojo confirmado' })
  @IsOptional()
  @IsBoolean()
  recogido?: boolean;

  @ApiPropertyOptional({ example: 'Ración recibida en buen estado', description: 'Comentario u observación' })
  @IsOptional()
  @IsString()
  comentario?: string;
}
