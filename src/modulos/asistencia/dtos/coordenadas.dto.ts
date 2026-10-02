import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TipoAsistencia } from '../entidades/registro-asistencia.entidad';

export class CoordenadasDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador del becario (generalmente inyectado desde el token JWT)',
  })
  @IsOptional()
  @IsNumber()
  becario_id?: number;

  @ApiProperty({
    example: -16.505012,
    description: 'Latitud capturada por el sensor GPS del dispositivo',
  })
  @IsNumber()
  latitud: number;

  @ApiProperty({
    example: -68.163045,
    description: 'Longitud capturada por el sensor GPS del dispositivo',
  })
  @IsNumber()
  longitud: number;

  @ApiPropertyOptional({
    enum: TipoAsistencia,
    example: TipoAsistencia.PRACTICAS,
    description: 'Tipo de asistencia institucional (practicas, escuela_lideres, acciones_servicio)',
    default: TipoAsistencia.PRACTICAS,
  })
  @IsOptional()
  @IsEnum(TipoAsistencia)
  tipo?: TipoAsistencia;

  @ApiPropertyOptional({
    example: 8.5,
    description: 'Precisión horizontal del GPS en metros reportada por el dispositivo',
  })
  @IsOptional()
  @IsNumber()
  precision?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Indicador de detección de ubicación simulada (Mock Location)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  simulada?: boolean;
}
