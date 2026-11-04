import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EstadoAprobacionAsistencia } from '../entidades/registro-asistencia.entidad';

export class RevisarSupervisorAsistenciaDto {
  @ApiPropertyOptional({
    enum: EstadoAprobacionAsistencia,
    example: EstadoAprobacionAsistencia.REVISADO_SUPERVISOR,
    description: 'Estado de revisión por parte del supervisor',
    default: EstadoAprobacionAsistencia.REVISADO_SUPERVISOR,
  })
  @IsOptional()
  @IsEnum(EstadoAprobacionAsistencia)
  estado?: EstadoAprobacionAsistencia;

  @ApiPropertyOptional({
    example: 'Marcación validada con reporte de bitácora física.',
    description: 'Observaciones o dictamen del supervisor',
  })
  @IsOptional()
  @IsString()
  observacion_supervisor?: string;

  @ApiPropertyOptional({ description: 'ID del supervisor revisor (opcional)' })
  @IsOptional()
  @IsNumber()
  supervisor_id?: number;

  @ApiPropertyOptional({ description: 'Nombre del supervisor revisor (opcional)' })
  @IsOptional()
  @IsString()
  supervisor_nombre?: string;

  @ApiPropertyOptional({ description: 'Observación general alternativa (opcional)' })
  @IsOptional()
  @IsString()
  observacion?: string;

  @ApiPropertyOptional({ description: 'Motivo de rechazo u observación (opcional)' })
  @IsOptional()
  @IsString()
  motivo_rechazo?: string;
}

export class AprobarAdminAsistenciaDto {
  @ApiPropertyOptional({
    enum: EstadoAprobacionAsistencia,
    example: EstadoAprobacionAsistencia.APROBADO_ADMINISTRACION,
    description: 'Estado de resolución final por parte de administración',
    default: EstadoAprobacionAsistencia.APROBADO_ADMINISTRACION,
  })
  @IsOptional()
  @IsEnum(EstadoAprobacionAsistencia)
  estado?: EstadoAprobacionAsistencia;

  @ApiPropertyOptional({
    example: 'Aprobación definitiva de marcación y cómputo de horas para beca.',
    description: 'Dictamen final de administración central',
  })
  @IsOptional()
  @IsString()
  observacion_admin?: string;

  @ApiPropertyOptional({ description: 'ID del administrador que aprueba (opcional)' })
  @IsOptional()
  @IsNumber()
  administrador_id?: number;

  @ApiPropertyOptional({ description: 'Nombre del administrador que aprueba (opcional)' })
  @IsOptional()
  @IsString()
  administrador_nombre?: string;

  @ApiPropertyOptional({ description: 'ID del supervisor (opcional)' })
  @IsOptional()
  @IsNumber()
  supervisor_id?: number;

  @ApiPropertyOptional({ description: 'Nombre del supervisor (opcional)' })
  @IsOptional()
  @IsString()
  supervisor_nombre?: string;

  @ApiPropertyOptional({ description: 'Observación general alternativa (opcional)' })
  @IsOptional()
  @IsString()
  observacion?: string;

  @ApiPropertyOptional({ description: 'Motivo de rechazo (opcional)' })
  @IsOptional()
  @IsString()
  motivo_rechazo?: string;
}
