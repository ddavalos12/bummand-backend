import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoAprobacionPracticas } from '../entidades/aprobacion-practicas.entidad';

export class RevisarSupervisorPracticasDto {
  @ApiPropertyOptional({
    enum: EstadoAprobacionPracticas,
    example: EstadoAprobacionPracticas.REVISADO_SUPERVISOR,
    description: 'Estado de revisión por parte del supervisor',
    default: EstadoAprobacionPracticas.REVISADO_SUPERVISOR,
  })
  @IsOptional()
  @IsEnum(EstadoAprobacionPracticas)
  estado?: EstadoAprobacionPracticas;

  @ApiPropertyOptional({
    example: 'Horas revisadas conforme al cuaderno de asistencia y actividades.',
    description: 'Observaciones emitidas por el supervisor de sede',
  })
  @IsOptional()
  @IsString()
  observacion_supervisor?: string;
}

export class AprobarAdminPracticasDto {
  @ApiPropertyOptional({
    enum: EstadoAprobacionPracticas,
    example: EstadoAprobacionPracticas.APROBADO_ADMINISTRACION,
    description: 'Estado final dictaminado por administración central',
    default: EstadoAprobacionPracticas.APROBADO_ADMINISTRACION,
  })
  @IsOptional()
  @IsEnum(EstadoAprobacionPracticas)
  estado?: EstadoAprobacionPracticas;

  @ApiPropertyOptional({
    example: 'Certificación consolidada en expediente académico.',
    description: 'Dictamen motivado u observaciones de administración central',
  })
  @IsOptional()
  @IsString()
  observacion_admin?: string;
}
