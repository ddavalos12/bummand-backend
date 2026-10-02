import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Tramo } from '../entidades/recorrido.entidad';

export class AgregarRecorridoDto {
  @IsOptional()
  @IsNumber()
  becario_id?: number; // Inyectado por el guardia

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

  @IsOptional()
  @IsString()
  @MaxLength(255)
  apoyo_realizado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  apoyoRealizado?: string;

  @IsOptional()
  @IsNumber()
  lat_origen?: number;

  @IsOptional()
  @IsNumber()
  latOrigen?: number;

  @IsOptional()
  @IsNumber()
  lng_origen?: number;

  @IsOptional()
  @IsNumber()
  lngOrigen?: number;

  @IsOptional()
  @IsNumber()
  lat_destino?: number;

  @IsOptional()
  @IsNumber()
  latDestino?: number;

  @IsOptional()
  @IsNumber()
  lng_destino?: number;

  @IsOptional()
  @IsNumber()
  lngDestino?: number;
}

