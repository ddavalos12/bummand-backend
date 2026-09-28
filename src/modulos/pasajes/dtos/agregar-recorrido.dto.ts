import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Tramo } from '../entidades/recorrido.entidad';

export class AgregarRecorridoDto {
  @IsNumber()
  becarioId: number; // TODO: remover cuando se integre JWT y @UsuarioActual()

  @IsString()
  @IsNotEmpty()
  fecha: string;

  @IsEnum(Tramo)
  tramo: Tramo;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  origen: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  destino: string;

  @IsNumber()
  @Min(0.01)
  @Max(50)
  tarifa: number;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  apoyoRealizado: string;

  @IsOptional()
  @IsNumber()
  latOrigen?: number;

  @IsOptional()
  @IsNumber()
  lngOrigen?: number;

  @IsOptional()
  @IsNumber()
  latDestino?: number;

  @IsOptional()
  @IsNumber()
  lngDestino?: number;
}
