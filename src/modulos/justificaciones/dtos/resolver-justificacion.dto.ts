import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoJustificacion } from '../entidades/justificacion.entidad';

export class ResolverJustificacionDto {
  @ApiProperty({
    enum: EstadoJustificacion,
    example: EstadoJustificacion.APROBADA,
    description: 'Resolución: aprobada, rechazada, revisado_supervisor, aprobado_administracion, observada',
  })
  @IsEnum(EstadoJustificacion, {
    message: 'El estado de resolución es inválido',
  })
  estado: EstadoJustificacion;

  @ApiPropertyOptional({
    example: 'Justificante médico verificado y validado por el área de bienestar.',
    description: 'Dictamen motivado y observaciones del supervisor',
  })
  @IsOptional()
  @IsString({ message: 'La observación del supervisor debe ser texto' })
  observacion_supervisor?: string;

  @ApiPropertyOptional({
    example: 'Aprobado formalmente por administración con exención de penalidad.',
    description: 'Dictamen motivado y observaciones de administración',
  })
  @IsOptional()
  @IsString({ message: 'La observación de administración debe ser texto' })
  observacion_admin?: string;
}
