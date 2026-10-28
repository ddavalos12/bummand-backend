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

  @ApiPropertyOptional({
    example: 8.0,
    description: 'Costo unitario en Bolivianos (Bs) por cada ración (opcional si se envía costo total)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costo_unitario_bs?: number;

  @ApiPropertyOptional({
    example: 240.0,
    description: 'Costo total calculado en Bs (opcional si se envía costo unitario)',
  })
  @IsOptional()
  @IsNumber()
  costo_total_bs?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Identificador del becario encargado del refrigerio (opcional)',
  })
  @IsOptional()
  @IsNumber()
  becario_id?: number;

  @ApiPropertyOptional({
    example: 'Nilda Amalia Churata Paye',
    description: 'Nombre del becario encargado del refrigerio (opcional)',
  })
  @IsOptional()
  @IsString()
  becario_nombre?: string;

  @ApiProperty({
    example: 2,
    description: 'Identificador del usuario responsable de la compra o entrega',
  })
  @IsNotEmpty()
  @IsNumber()
  responsable_id: number;

  @ApiPropertyOptional({
    description: 'Listado de registros de recepción y conformidad de entrega en sistema',
    example: [{ becario_id: 1, nombre: 'Nilda Churata', conforme: true }],
  })
  @IsOptional()
  firmas_conformidad?: Record<string, unknown>[];
}
