import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoEvento, EstadoEvento } from '../entidades/evento.entidad';

export class CrearEventoDto {
  @ApiProperty({ example: 'Encuentro de Liderazgo y Acción Diaconal', description: 'Título institucional del evento' })
  @IsString()
  @IsNotEmpty({ message: 'El título del evento es obligatorio' })
  titulo: string;

  @ApiProperty({ example: 'Jornada intensiva de formación y servicio diaconal', description: 'Descripción detallada de la convocatoria' })
  @IsString()
  @IsNotEmpty({ message: 'La descripción del evento es obligatoria' })
  descripcion: string;

  @ApiProperty({ enum: TipoEvento, example: TipoEvento.ESCUELA_LIDERES_ESPECIAL, description: 'Tipo de evento institucional' })
  @IsEnum(TipoEvento, { message: 'Tipo de evento inválido' })
  tipo_evento: TipoEvento;

  @ApiProperty({ example: '2026-10-25', description: 'Fecha fijada para el evento en formato YYYY-MM-DD' })
  @IsDateString({}, { message: 'La fecha debe tener un formato válido (YYYY-MM-DD)' })
  fecha: string;

  @ApiProperty({ example: '08:30', description: 'Hora de inicio del evento (HH:MM)' })
  @IsString()
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  hora_inicio: string;

  @ApiProperty({ example: '13:30', description: 'Hora de conclusión del evento (HH:MM)' })
  @IsString()
  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  hora_fin: string;

  @ApiProperty({ example: -16.500054, description: 'Latitud del lugar del evento' })
  @IsNumber({}, { message: 'La latitud debe ser un valor numérico' })
  @Min(-90)
  @Max(90)
  latitud: number;

  @ApiProperty({ example: -68.173455, description: 'Longitud del lugar del evento' })
  @IsNumber({}, { message: 'La longitud debe ser un valor numérico' })
  @Min(-180)
  @Max(180)
  longitud: number;

  @ApiProperty({ example: 100, description: 'Radio de tolerancia geodésica en metros (por defecto 100m)', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El radio de tolerancia debe ser numérico' })
  @Min(10)
  radio_tolerancia_m?: number;

  @ApiProperty({ example: 'Av. Juan Pablo II esq. Calle Sbtte. Jorge Eulert 125, El Alto', description: 'Dirección o punto de referencia' })
  @IsString()
  @IsNotEmpty({ message: 'La dirección de referencia es obligatoria' })
  direccion_referencia: string;

  @ApiProperty({ enum: EstadoEvento, example: EstadoEvento.PROGRAMADO, description: 'Estado inicial del evento', required: false })
  @IsOptional()
  @IsEnum(EstadoEvento, { message: 'Estado de evento inválido' })
  estado?: EstadoEvento;
}
