import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PuntoGpsPruebaDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  secuencia: number;

  @ApiProperty({ example: -16.505, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud: number;

  @ApiProperty({ example: -68.163, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud: number;

  @ApiPropertyOptional({ example: 8.5, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precision_m?: number;

  @ApiPropertyOptional({ example: 3650.2 })
  @IsOptional()
  @IsNumber()
  altitud_m?: number;

  @ApiPropertyOptional({ example: 1.45 })
  @IsOptional()
  @IsNumber()
  velocidad_ms?: number;

  @ApiPropertyOptional({ example: 180.0 })
  @IsOptional()
  @IsNumber()
  rumbo_grados?: number;

  @ApiProperty({ example: '2026-11-25T14:00:00.000-04:00' })
  @IsISO8601()
  hora_dispositivo_iso: string;

  @ApiPropertyOptional({ example: '2026-11-25T14:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  hora_gps_iso?: string;

  @ApiProperty({ example: 120500, minimum: 0 })
  @IsInt()
  @Min(0)
  reloj_monotonico_ms: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  desfase_reloj_gps_seg?: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  es_ubicacion_simulada: boolean;

  @ApiPropertyOptional({ example: 'automatico', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  modo_captura?: string;

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  hash_punto?: string;
}

export class CrearRecorridoGpsPruebaDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  uuid_sesion: string;

  @ApiPropertyOptional({ example: 'Prueba ruta Ceja - Prado', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  etiqueta_prueba?: string;

  @ApiPropertyOptional({ example: 'Android 14 / Pixel 7', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  dispositivo_info?: string;

  @ApiPropertyOptional({ example: '2026-11-25T14:00:00.000-04:00' })
  @IsOptional()
  @IsISO8601()
  hora_inicio_dispositivo?: string;

  @ApiPropertyOptional({ example: '2026-11-25T14:15:00.000-04:00' })
  @IsOptional()
  @IsISO8601()
  hora_fin_dispositivo?: string;

  @ApiPropertyOptional({ example: '2026-11-25T18:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  hora_inicio_gps?: string;

  @ApiPropertyOptional({ example: '2026-11-25T18:15:00.000Z' })
  @IsOptional()
  @IsISO8601()
  hora_fin_gps?: string;

  @ApiPropertyOptional({ example: -240 })
  @IsOptional()
  @IsInt()
  zona_horaria_offset_min?: number;

  @ApiProperty({ example: 900, minimum: 0 })
  @IsInt()
  @Min(0)
  duracion_monotonica_seg: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  intervalo_minutos?: number;

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  hash_integridad_cliente?: string;

  @ApiProperty({ type: [PuntoGpsPruebaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PuntoGpsPruebaDto)
  puntos: PuntoGpsPruebaDto[];
}
