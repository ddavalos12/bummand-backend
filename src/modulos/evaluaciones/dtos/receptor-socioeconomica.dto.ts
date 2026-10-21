import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ReceptorSocioeconomicaDto {
  @ApiProperty({ example: 1, description: 'Identificador del becario evaluado' })
  @IsNotEmpty()
  @IsNumber()
  becario_id: number;

  @ApiPropertyOptional({ example: 1, description: 'Identificador del periodo académico (opcional, por defecto el periodo activo)' })
  @IsOptional()
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
