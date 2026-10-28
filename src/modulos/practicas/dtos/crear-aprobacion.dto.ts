import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearAprobacionDto {
  @ApiProperty({
    example: 1,
    description: 'Identificador del becario cuyas prácticas son convalidadas',
  })
  @IsNumber()
  @IsNotEmpty()
  becario_id: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Identificador del supervisor que aprueba (inyectado desde el token JWT)',
  })
  @IsOptional()
  @IsNumber()
  supervisor_id?: number;

  @ApiProperty({
    example: 'Agosto 2026',
    description: 'Periodo o mes de prácticas correspondientes',
  })
  @IsString()
  @IsNotEmpty()
  periodo: string;

  @ApiProperty({
    example: 36,
    description: 'Total de horas cronológicas de práctica aprobadas y certificadas (meta mensual 36h)',
  })
  @IsNumber()
  @IsNotEmpty()
  horas_aprobadas: number;

  @ApiPropertyOptional({
    example: 'CONVALIDADO-EN-SISTEMA',
    description: 'Sello o código opcional de trazabilidad en sistema (compatibilidad histórica)',
  })
  @IsOptional()
  @IsString()
  firma_digital?: string;

  @ApiPropertyOptional({
    example: 'Cumplimiento sobresaliente del plan de trabajo en Seguridad Física',
    description: 'Comentarios u observaciones finales del supervisor',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
