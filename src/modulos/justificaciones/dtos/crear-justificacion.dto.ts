import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoIncidencia } from '../entidades/justificacion.entidad';

export class CrearJustificacionDto {
  @ApiProperty({
    enum: TipoIncidencia,
    example: TipoIncidencia.ASISTENCIA_PRACTICAS,
    description: 'Tipo de actividad a la que corresponde la inasistencia o incidencia',
  })
  @IsEnum(TipoIncidencia, { message: 'Tipo de incidencia inválido' })
  tipo_incidencia: TipoIncidencia;

  @ApiProperty({ example: 12, description: 'ID del registro de asistencia o evento relacionado', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El ID de referencia debe ser un número entero' })
  referencia_id?: number;

  @ApiProperty({ example: '2026-10-15', description: 'Fecha de la incidencia (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'La fecha de incidencia debe tener formato YYYY-MM-DD' })
  fecha_incidencia: string;

  @ApiProperty({ example: 'Cita médica odontológica de urgencia', description: 'Causa o motivo de la justificación' })
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  motivo: string;

  @ApiProperty({ example: 'Explicación detallada de la ausencia o retraso con respaldos correspondientes.', description: 'Descripción detallada' })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion: string;

  @ApiProperty({ example: 1, description: 'ID del becario (opcional, asignado automáticamente para rol BECARIO)', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El ID del becario debe ser numérico' })
  becario_id?: number;

  @ApiProperty({ example: 'https://storage.bumand.bo/pruebas/cert_medico.pdf', description: 'URL del archivo probatorio', required: false })
  @IsOptional()
  @IsString()
  archivo_prueba_url?: string;

  @ApiProperty({ example: 'cert_medico.pdf', description: 'Nombre original del archivo de prueba', required: false })
  @IsOptional()
  @IsString()
  nombre_archivo_prueba?: string;
}
