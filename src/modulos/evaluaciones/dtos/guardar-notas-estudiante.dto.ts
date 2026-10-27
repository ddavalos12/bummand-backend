import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class CalificacionMateriaItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ example: 'Cálculo I', description: 'Nombre oficial de la asignatura' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'MAT-101', description: 'Sigla o código de la asignatura' })
  @IsOptional()
  @IsString()
  sigla?: string;

  @ApiProperty({ example: 85, description: 'Calificación obtenida (0 a 100)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  nota: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  editado_por_supervisor?: boolean;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  nota_original_estudiante?: number;
}

export class GuardarNotasEstudianteDto {
  @ApiProperty({ example: 1, description: 'ID del becario' })
  @IsNotEmpty()
  @IsNumber()
  becario_id: number;

  @ApiProperty({ example: 2, description: 'ID del periodo de evaluación (semestre)' })
  @IsNotEmpty()
  @IsNumber()
  periodo_id: number;

  @ApiProperty({ type: [CalificacionMateriaItemDto], description: 'Lista de asignaturas y sus calificaciones' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalificacionMateriaItemDto)
  materias: CalificacionMateriaItemDto[];

  @ApiProperty({ example: 'data:image/svg+xml;...', description: 'URL o base64 del Kárdex de calificaciones' })
  @IsNotEmpty()
  @IsString()
  archivo_kardex_url: string;

  @ApiProperty({ example: 'Kardex_Notas_2026_I.pdf', description: 'Nombre del archivo Kárdex' })
  @IsNotEmpty()
  @IsString()
  nombre_archivo_kardex: string;

  @ApiPropertyOptional({ example: '1.2 MB' })
  @IsOptional()
  @IsString()
  tamano_archivo_kardex?: string;

  @ApiProperty({ example: 'data:image/svg+xml;...', description: 'URL o base64 de la Programación Nueva' })
  @IsNotEmpty()
  @IsString()
  archivo_programacion_url: string;

  @ApiProperty({ example: 'Programacion_2026_II.pdf', description: 'Nombre de la programación nueva' })
  @IsNotEmpty()
  @IsString()
  nombre_archivo_programacion: string;

  @ApiPropertyOptional({ example: '850 KB' })
  @IsOptional()
  @IsString()
  tamano_archivo_programacion?: string;

  @ApiPropertyOptional({ example: 'data:image/svg+xml;...', description: 'URL del carnet de identidad renovado' })
  @IsOptional()
  @IsString()
  archivo_carnet_url?: string;

  @ApiPropertyOptional({ example: 'CI_Renovado_2026.pdf', description: 'Nombre del carnet renovado' })
  @IsOptional()
  @IsString()
  nombre_archivo_carnet?: string;

  @ApiPropertyOptional({ example: '1.5 MB' })
  @IsOptional()
  @IsString()
  tamano_archivo_carnet?: string;

  @ApiPropertyOptional({ example: 'Entrega regular de notas del semestre cursado' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
