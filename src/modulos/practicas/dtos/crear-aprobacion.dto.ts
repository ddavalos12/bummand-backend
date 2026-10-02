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
    example: 120,
    description: 'Total de horas cronológicas de práctica aprobadas y certificadas',
  })
  @IsNumber()
  @IsNotEmpty()
  horas_aprobadas: number;

  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    description: 'Firma digital manuscrita capturada en Canvas en formato Base64',
  })
  @IsString()
  @IsNotEmpty()
  firma_digital: string;

  @ApiPropertyOptional({
    example: 'Cumplimiento sobresaliente del plan de trabajo en Seguridad Física',
    description: 'Comentarios u observaciones finales del supervisor',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
