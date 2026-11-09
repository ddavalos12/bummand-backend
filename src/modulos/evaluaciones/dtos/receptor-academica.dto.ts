import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ReceptorAcademicaDto {
  @ApiProperty({ example: 1, description: 'Identificador del becario evaluado' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  becario_id: number;

  @ApiProperty({ example: 1, description: 'Identificador del periodo académico' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  periodo_id: number;

  @ApiProperty({ example: 82.5, description: 'Promedio general de calificaciones (0 - 100)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  promedio_academico: number;

  @ApiPropertyOptional({
    example: 'https://storage.bumand.bo/academicos/record_2026_1.pdf',
    description: 'Enlace o ruta del récord académico universitario',
  })
  @IsOptional()
  @IsString()
  archivo_record_academico?: string;

  @ApiPropertyOptional({
    example: 'https://storage.bumand.bo/academicos/historial_2026_1.pdf',
    description: 'Enlace o ruta del historial académico legalizado',
  })
  @IsOptional()
  @IsString()
  archivo_historial_academico?: string;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Puntaje opcional directo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  puntaje?: number;
}
