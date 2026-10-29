import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
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
}
