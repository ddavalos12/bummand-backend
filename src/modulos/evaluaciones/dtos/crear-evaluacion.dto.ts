import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';

export class CrearEvaluacionDto {
  @ApiProperty({
    example: 1,
    description: 'Identificador del becario evaluado',
  })
  @IsNumber()
  @IsNotEmpty()
  becario_id: number;

  @ApiProperty({
    example: 1,
    description: 'Identificador del periodo de evaluación institucional (ej. 2026-I)',
  })
  @IsNumber()
  @IsNotEmpty()
  periodo_id: number;

  @ApiProperty({
    example: 1,
    description: 'Identificador del módulo de evaluación (1=Liderazgo Pastoral F-03, 2=Académica, 3=Mentor, 4=Escuela Líderes, 5=Socioeconómica)',
  })
  @IsNumber()
  @IsNotEmpty()
  modulo_id: number;

  @ApiProperty({
    example: 1,
    description: 'Identificador del evaluador registrado',
  })
  @IsNumber()
  @IsNotEmpty()
  evaluador_id: number;

  @ApiPropertyOptional({
    example: 88.5,
    description: 'Puntaje cuantitativo obtenido (escala 0 a 100 puntos)',
  })
  @IsOptional()
  @IsNumber()
  puntaje?: number;

  @ApiPropertyOptional({
    example: 'Excelente desempeño y compromiso en el servicio comunitario',
    description: 'Observaciones cualitativas y retroalimentación del evaluador',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    example: 'evaluacion_1_modulo_1.pdf',
    description: 'Nombre o ruta del archivo de respaldo en PDF',
  })
  @IsOptional()
  @IsString()
  archivo_pdf?: string;

  @ApiPropertyOptional({
    example: '2026-06-20',
    description: 'Fecha en la que se efectuó la evaluación',
  })
  @IsOptional()
  @IsString()
  fecha_evaluacion?: string;
}
