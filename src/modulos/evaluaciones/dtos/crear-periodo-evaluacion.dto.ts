import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CrearPeriodoEvaluacionDto {
  @ApiProperty({ example: 'Semestre 2026-I', description: 'Nombre oficial del período semestral' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ example: '2026-01-15', description: 'Fecha de inicio del período' })
  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @ApiProperty({ example: '2026-06-30', description: 'Fecha de fin del período' })
  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Peso porcentual del módulo académico' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  peso_academica?: number;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Peso porcentual del módulo liderazgo pastoral' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  peso_liderazgo?: number;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Peso porcentual del módulo prácticas' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  peso_practicas?: number;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Peso porcentual del módulo mentor / escuela de líderes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  peso_mentor?: number;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Peso porcentual del módulo socioeconómico' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  peso_socioeconomica?: number;
}
