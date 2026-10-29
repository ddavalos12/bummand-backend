import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { EstadoEntregaTarea } from '../entidades/entrega-tarea-lideres.entidad';

export class EntregarTareaLideresDto {
  @ApiProperty({ example: 2, description: 'ID del periodo de evaluación' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  periodo_id: number;

  @ApiProperty({ example: 1, description: 'Número de la tarea CETI (1 a 12)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  tarea_numero: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del becario (opcional si es becario autenticado)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  becario_id?: number;

  @ApiProperty({
    example: '/uploads/escuela-lideres/tarea-1.pdf',
    description: 'URL o ruta del archivo de evidencia subido',
  })
  @IsNotEmpty()
  @IsString()
  archivo_evidencia_url: string;

  @ApiProperty({ example: 'Informe_Mision_Integral.pdf', description: 'Nombre original del archivo de evidencia' })
  @IsNotEmpty()
  @IsString()
  nombre_archivo: string;

  @ApiPropertyOptional({ example: '1.2 MB', description: 'Tamaño legible del archivo' })
  @IsOptional()
  @IsString()
  tamano_archivo?: string;

  @ApiPropertyOptional({
    example: 'Entrego el informe práctico correspondiente a la sesión CETI del viernes.',
    description: 'Comentarios reflexivos del becario',
  })
  @IsOptional()
  @IsString()
  comentario_becario?: string;
}

export class RevisarEntregaLideresDto {
  @ApiProperty({
    example: EstadoEntregaTarea.REVISADO,
    enum: [EstadoEntregaTarea.REVISADO, EstadoEntregaTarea.OBSERVADO],
    description: 'Dictamen de revisión: revisado u observado',
  })
  @IsNotEmpty()
  @IsEnum(EstadoEntregaTarea)
  estado: EstadoEntregaTarea;

  @ApiProperty({
    example: 8.33,
    description: 'Calificación obtenida en la tarea (escala de la tarea hasta 8.33/8.37 o base 100)',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  puntaje_obtenido: number;

  @ApiPropertyOptional({
    example: 'Excelente fundamentación teológica y aplicabilidad práctica en la iglesia local.',
    description: 'Observaciones del facilitador / supervisor',
  })
  @IsOptional()
  @IsString()
  comentario_revisor?: string;
}
