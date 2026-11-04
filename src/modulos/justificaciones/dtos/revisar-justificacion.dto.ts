import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EstadoJustificacion } from '../entidades/justificacion.entidad';

export class RevisarSupervisorJustificacionDto {
  @ApiPropertyOptional({
    enum: EstadoJustificacion,
    example: EstadoJustificacion.REVISADO_SUPERVISOR,
    description: 'Dictamen de revisión por supervisor (revisado_supervisor, observada, rechazada)',
    default: EstadoJustificacion.REVISADO_SUPERVISOR,
  })
  @IsOptional()
  @IsEnum(EstadoJustificacion)
  estado?: EstadoJustificacion;

  @ApiPropertyOptional({
    example: 'Comprobante y justificativo contrastados conforme.',
    description: 'Observaciones emitidas por el supervisor',
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

  @ApiPropertyOptional({ description: 'Motivo de rechazo (opcional)' })
  @IsOptional()
  @IsString()
  motivo_rechazo?: string;
}

export class AprobarAdminJustificacionDto {
  @ApiPropertyOptional({
    enum: EstadoJustificacion,
    example: EstadoJustificacion.APROBADO_ADMINISTRACION,
    description: 'Resolución final de administración (aprobado_administracion, rechazada)',
    default: EstadoJustificacion.APROBADO_ADMINISTRACION,
  })
  @IsOptional()
  @IsEnum(EstadoJustificacion)
  estado?: EstadoJustificacion;

  @ApiPropertyOptional({
    example: 'Permiso y dispensa aprobados formalmente por Bienestar Institucional.',
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
