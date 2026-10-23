import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CrearCuestionarioDto {
  @ApiProperty({ description: 'Código único mnemónico del cuestionario', example: 'BIENESTAR_2026' })
  @IsNotEmpty()
  @IsString()
  codigo: string;

  @ApiProperty({ description: 'Título oficial del cuestionario o evaluación', example: 'Cuestionario de Bienestar Universitario' })
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @ApiPropertyOptional({ description: 'Descripción o instrucciones del cuestionario' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Rol o tipo de evaluador asignado', example: 'becario' })
  @IsOptional()
  @IsString()
  tipo_evaluador?: string;

  @ApiPropertyOptional({ description: 'Identificador del módulo o pilar reglamentario (1 al 5)', example: 5 })
  @IsOptional()
  @IsNumber()
  modulo_id?: number;

  @ApiPropertyOptional({ description: 'Indica si el cuestionario está disponible para responder', default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
