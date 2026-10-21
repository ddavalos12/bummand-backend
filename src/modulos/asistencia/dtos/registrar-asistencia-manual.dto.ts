import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { TipoAsistencia } from '../entidades/registro-asistencia.entidad';

export class RegistrarAsistenciaManualDto {
  @ApiProperty({
    example: 1,
    description: 'Identificador del becario al que se le asienta la asistencia manual',
  })
  @IsNumber()
  @IsNotEmpty()
  becario_id: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Alias en camelCase del identificador del becario',
  })
  @IsOptional()
  @IsNumber()
  becarioId?: number;

  @ApiPropertyOptional({
    enum: TipoAsistencia,
    example: TipoAsistencia.PRACTICAS,
    description: 'Tipo de asistencia (practicas, escuela_lideres, acciones_servicio)',
    default: TipoAsistencia.PRACTICAS,
  })
  @IsOptional()
  @IsEnum(TipoAsistencia)
  tipo?: TipoAsistencia;

  @ApiProperty({
    example: '2026-10-18',
    description: 'Fecha en la que se realizó la actividad (formato YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener el formato YYYY-MM-DD' })
  fecha: string;

  @ApiProperty({
    example: '08:30',
    description: 'Hora de ingreso efectiva (formato HH:mm o HH:mm:ss)',
  })
  @IsString()
  @IsNotEmpty()
  hora_ingreso: string;

  @ApiPropertyOptional({
    example: '08:30',
    description: 'Alias en camelCase de la hora de ingreso',
  })
  @IsOptional()
  @IsString()
  horaIngreso?: string;

  @ApiPropertyOptional({
    example: '12:30',
    description: 'Hora de salida efectiva (formato HH:mm o HH:mm:ss)',
  })
  @IsOptional()
  @IsString()
  hora_salida?: string;

  @ApiPropertyOptional({
    example: '12:30',
    description: 'Alias en camelCase de la hora de salida',
  })
  @IsOptional()
  @IsString()
  horaSalida?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador de la agencia o sede institucional donde realizó la práctica',
  })
  @IsOptional()
  @IsNumber()
  lugar_practica_id?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Alias en camelCase del lugar de práctica',
  })
  @IsOptional()
  @IsNumber()
  lugarPracticaId?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Identificador del evento o taller eclesial / institucional',
  })
  @IsOptional()
  @IsNumber()
  evento_id?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Alias en camelCase del evento',
  })
  @IsOptional()
  @IsNumber()
  eventoId?: number;

  @ApiPropertyOptional({
    example: 'Sin megas en el celular / olvido de marcación',
    description: 'Motivo de contingencia o justificación del registro manual por administración',
  })
  @IsOptional()
  @IsString()
  motivo_contingencia?: string;

  @ApiPropertyOptional({
    example: 'Sin megas en el celular / olvido de marcación',
    description: 'Alias en camelCase del motivo de contingencia',
  })
  @IsOptional()
  @IsString()
  motivoContingencia?: string;
}
