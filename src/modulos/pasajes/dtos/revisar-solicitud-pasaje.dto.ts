import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoSolicitud } from '../entidades/solicitud-pasaje.entidad';

export class RevisarSupervisorPasajeDto {
  @ApiPropertyOptional({
    enum: EstadoSolicitud,
    example: EstadoSolicitud.REVISADO_SUPERVISOR,
    description: 'Dictamen de revisión por supervisor (revisado_supervisor, observado, rechazado)',
    default: EstadoSolicitud.REVISADO_SUPERVISOR,
  })
  @IsOptional()
  @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @ApiPropertyOptional({
    example: 'Rutas y tarifas de transporte verificadas con las bitácoras semanales.',
    description: 'Observaciones emitidas por el supervisor',
  })
  @IsOptional()
  @IsString()
  observacion_supervisor?: string;
}

export class AprobarAdminPasajeDto {
  @ApiPropertyOptional({
    enum: EstadoSolicitud,
    example: EstadoSolicitud.APROBADO_ADMINISTRACION,
    description: 'Resolución de administración (aprobado_administracion, rechazado, aprobado)',
    default: EstadoSolicitud.APROBADO_ADMINISTRACION,
  })
  @IsOptional()
  @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @ApiPropertyOptional({
    example: 'Planilla consolidada y autorizada para desembolso financiero.',
    description: 'Observaciones emitidas por administración central',
  })
  @IsOptional()
  @IsString()
  observacion_admin?: string;
}
