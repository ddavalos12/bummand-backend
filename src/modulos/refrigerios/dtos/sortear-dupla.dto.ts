import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SortearDuplaDto {
  @ApiProperty({
    example: '2026-10-30',
    description: 'Fecha del viernes en formato YYYY-MM-DD para el suministro del refrigerio',
  })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID del evento institucional vinculado (opcional)',
  })
  @IsOptional()
  @IsNumber()
  evento_id?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID de la sede o lugar de práctica vinculado (opcional)',
  })
  @IsOptional()
  @IsNumber()
  lugar_practica_id?: number;

  @ApiPropertyOptional({
    example: 'Refrigerio Escuela de Líderes (Viernes)',
    description: 'Descripción conceptual del refrigerio',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    example: 23,
    description: 'Cantidad de raciones estimadas (por defecto 23)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cantidad_raciones?: number;

  @ApiPropertyOptional({
    example: 138.0,
    description: 'Presupuesto referencial en bolivianos (por defecto 138.00 Bs = 23 * Bs 6)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  presupuesto_referencial_bs?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'ID opcional del primer becario encargado asignado manualmente',
  })
  @IsOptional()
  @IsNumber()
  becario_encargado_1_id?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'ID opcional del segundo becario encargado asignado manualmente',
  })
  @IsOptional()
  @IsNumber()
  becario_encargado_2_id?: number;
}
