import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TipoAsistencia } from '../entidades/registro-asistencia.entidad';

export class CoordenadasDto {
  @IsOptional()
  @IsNumber()
  becario_id?: number; // Inyectado por el guardia

  @IsNumber()
  latitud: number;

  @IsNumber()
  longitud: number;

  @IsOptional()
  @IsEnum(TipoAsistencia)
  tipo?: TipoAsistencia;

  @IsOptional()
  @IsNumber()
  precision?: number;

  @IsOptional()
  @IsBoolean()
  simulada?: boolean;
}

