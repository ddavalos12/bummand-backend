import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoJustificacion } from '../entidades/justificacion.entidad';

export class ResolverJustificacionDto {
  @ApiProperty({
    enum: [EstadoJustificacion.APROBADA, EstadoJustificacion.RECHAZADA],
    example: EstadoJustificacion.APROBADA,
    description: 'Resolución administrativa: aprobada o rechazada',
  })
  @IsEnum([EstadoJustificacion.APROBADA, EstadoJustificacion.RECHAZADA], {
    message: 'El estado de resolución debe ser "aprobada" o "rechazada"',
  })
  estado: EstadoJustificacion.APROBADA | EstadoJustificacion.RECHAZADA;

  @ApiProperty({
    example: 'Justificante médico verificado y validado por el área de bienestar.',
    description: 'Dictamen motivado y observaciones obligatorias del supervisor',
  })
  @IsString({ message: 'La observación del supervisor debe ser texto' })
  @IsNotEmpty({ message: 'La fundamentación u observación del supervisor es obligatoria' })
  observacion_supervisor: string;
}
