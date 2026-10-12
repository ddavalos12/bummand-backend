import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CrearRefrigerioDto {
  @ApiProperty({
    example: '2026-10-12',
    description: 'Fecha en que se proporcionó el refrigerio (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador del evento institucional vinculado (opcional)',
  })
  @IsOptional()
  @IsNumber()
  evento_id?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Identificador de la sede o lugar de práctica vinculado (opcional)',
  })
  @IsOptional()
  @IsNumber()
  lugar_practica_id?: number;

  @ApiProperty({
    example: 'Refrigerio para Escuela de Líderes (Empanadas y refresco de mocochinchi)',
    description: 'Descripción detallada de los alimentos adquiridos',
  })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({
    example: 30,
    description: 'Cantidad de raciones distribuidas a los becarios',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  cantidad_raciones: number;

  @ApiProperty({
    example: 8.0,
    description: 'Costo unitario en Bolivianos (Bs) por cada ración',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  costo_unitario_bs: number;

  @ApiPropertyOptional({
    example: 240.0,
    description: 'Costo total calculado en Bs (si se omite se calcula automáticamente)',
  })
  @IsOptional()
  @IsNumber()
  costo_total_bs?: number;

  @ApiProperty({
    example: 2,
    description: 'Identificador del usuario responsable de la compra o entrega',
  })
  @IsNotEmpty()
  @IsNumber()
  responsable_id: number;

  @ApiPropertyOptional({
    description: 'Listado de firmas o nombres de conformidad de entrega',
    example: [{ becario_id: 1, nombre: 'Nilda Churata', firmado: true }],
  })
  @IsOptional()
  firmas_conformidad?: Record<string, unknown>[];
}
