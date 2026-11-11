import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { EstadoEntregaTarea } from '../entidades/entrega-tarea-lideres.entidad';

export class EntregarTareaLideresDto {
  @ApiPropertyOptional({ example: 2, description: 'ID del periodo de evaluación' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  periodo_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Número de la tarea CETI' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  tarea_numero?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  numero?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del becario (opcional si es becario autenticado)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  becario_id?: number;

  @ApiPropertyOptional({
    example: '/uploads/escuela-lideres/tarea-1.pdf',
    description: 'URL o ruta del archivo de evidencia subido',
  })
  @IsOptional()
  @IsString()
  archivo_evidencia_url?: string;

  @ApiPropertyOptional({ example: 'Informe_Mision_Integral.pdf', description: 'Nombre original del archivo de evidencia' })
  @IsOptional()
  @IsString()
  nombre_archivo?: string;

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

  @IsOptional()
  @IsString()
  respuesta_texto?: string;

  @IsOptional()
  @IsString()
  enlace_externo?: string;

  @IsOptional()
  @IsString()
  archivo_adjunto?: string;
}

export class RevisarEntregaLideresDto {
  @ApiPropertyOptional({
    example: EstadoEntregaTarea.REVISADO,
    enum: [EstadoEntregaTarea.REVISADO, EstadoEntregaTarea.OBSERVADO],
    description: 'Dictamen de revisión: revisado u observado',
  })
  @IsOptional()
  @IsEnum(EstadoEntregaTarea)
  estado?: EstadoEntregaTarea;

  @ApiPropertyOptional({
    example: 8.33,
    description: 'Calificación obtenida en la tarea (escala de la tarea hasta 8.33/8.37 o base 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  puntaje_obtenido?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  calificacion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  puntaje?: number;

  @ApiPropertyOptional({
    example: 'Excelente fundamentación teológica y aplicabilidad práctica en la iglesia local.',
    description: 'Observaciones del facilitador / supervisor',
  })
  @IsOptional()
  @IsString()
  comentario_revisor?: string;

  @IsOptional()
  @IsString()
  retroalimentacion_supervisor?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  becario_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  periodo_id?: number;
}

export class GuardarTareaCatalogoLideresDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  numero?: number;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  modulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  instrucciones?: string;

  @IsOptional()
  @IsString()
  fecha_limite?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ponderacion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  puntaje_maximo?: number;

  @IsOptional()
  @IsBoolean()
  publicada_apk?: boolean;

  @IsOptional()
  @IsBoolean()
  enviar_apk?: boolean;
}
