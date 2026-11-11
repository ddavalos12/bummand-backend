import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ReceptorSocioeconomicaDto {
  @ApiProperty({ example: 1, description: 'Identificador del becario evaluado' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  becario_id: number;

  @ApiPropertyOptional({ example: 1, description: 'Identificador del periodo académico (opcional, por defecto el periodo activo)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  periodo_id?: number;

  @ApiPropertyOptional({ example: 'II-2025', description: 'Nombre o código del periodo académico' })
  @IsOptional()
  @IsString()
  periodo?: string;

  @ApiProperty({
    example: {
      '1': 'A',
      '2': 'B',
      '19': 'A',
      '26': 'D',
    },
    description: 'Respuestas de las 26 preguntas del cuestionario de bienestar o de los 4 bloques socioeconómicos anteriores',
  })
  @IsNotEmpty()
  respuestas: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'Situación socioeconómica estable con solvencia familiar adecuada.',
    description: 'Observaciones complementarias',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class RevisarSocioeconomicaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  becario_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  periodo_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  puntaje_sobre_20?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  puntaje?: number;

  @IsOptional()
  @IsString()
  semaforo?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsBoolean()
  convalidado?: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  respuestas?: Record<string, unknown>;
}
