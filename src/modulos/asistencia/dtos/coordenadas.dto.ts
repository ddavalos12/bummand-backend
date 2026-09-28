import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TipoAsistencia } from '../entidades/registro-asistencia.entidad';

export class CoordenadasDto {
  @IsNumber()
  becarioId: number; // TODO: remover cuando se integre JWT y @UsuarioActual()

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
