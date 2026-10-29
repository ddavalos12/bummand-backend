import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoCita, ModalidadCita } from '../entidades/cita-seguimiento.entidad';

export class ActualizarCitaSeguimientoDto {
  @ApiPropertyOptional({
    enum: EstadoCita,
    example: EstadoCita.REALIZADA,
    description: 'Estado de la cita (programada, realizada, reprogramada, cancelada)',
  })
  @IsOptional()
  @IsEnum(EstadoCita)
  estado?: EstadoCita;

  @ApiPropertyOptional({
    example: 'Se acordó mejorar la puntualidad en los devocionales y preparar la exposición del salmo 23.',
    description: 'Acuerdos, resoluciones o compromisos alcanzados en la cita',
  })
  @IsOptional()
  @IsString()
  acuerdos_retroalimentacion?: string;

  @ApiPropertyOptional({
    example: '2026-11-06',
    description: 'Nueva fecha de la cita si es reprogramada (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fecha_cita?: string;

  @ApiPropertyOptional({
    example: '11:00',
    description: 'Nueva hora de la cita si es reprogramada (HH:mm)',
  })
  @IsOptional()
  @IsString()
  hora_cita?: string;

  @ApiPropertyOptional({
    enum: ModalidadCita,
    example: ModalidadCita.VIRTUAL,
    description: 'Modalidad de la reunión',
  })
  @IsOptional()
  @IsEnum(ModalidadCita)
  modalidad?: ModalidadCita;

  @ApiPropertyOptional({
    example: 'https://meet.google.com/nuevo-enlace',
    description: 'Nuevo lugar o enlace de la cita',
  })
  @IsOptional()
  @IsString()
  lugar_o_enlace?: string;

  @ApiPropertyOptional({
    example: 'Actualización del motivo o foco de la conversación',
    description: 'Motivo y enfoque temático de la reunión',
  })
  @IsOptional()
  @IsString()
  motivo_retroalimentacion?: string;

  @ApiPropertyOptional({
    example: 'Salmos 119:105',
    description: 'Cita bíblica de apoyo o meditación',
  })
  @IsOptional()
  @IsString()
  cita_biblica?: string;
}
