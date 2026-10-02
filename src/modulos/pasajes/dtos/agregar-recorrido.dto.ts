import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Tramo } from '../entidades/recorrido.entidad';

export class AgregarRecorridoDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador del becario (inyectado desde el token JWT)',
  })
  @IsOptional()
  @IsNumber()
  becario_id?: number;

  @ApiProperty({
    example: '2026-09-15',
    description: 'Fecha en la que se realizó el traslado (formato YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty({
    enum: Tramo,
    example: Tramo.IDA,
    description: 'Sentido del tramo de transporte (ida o vuelta)',
  })
  @IsEnum(Tramo)
  tramo: Tramo;

  @ApiProperty({
    example: 'Ceja El Alto',
    description: 'Punto de origen del trayecto',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  origen: string;

  @ApiProperty({
    example: 'Agencia Central Diaconía',
    description: 'Punto de destino del trayecto',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  destino: string;

  @ApiProperty({
    example: 3.50,
    description: 'Tarifa del transporte público en Bolivianos (entre Bs 0.01 y 50.00)',
    minimum: 0.01,
    maximum: 50.00,
  })
  @IsNumber()
  @Min(0.01)
  @Max(50)
  tarifa: number;

  @ApiPropertyOptional({
    example: 'Apoyo en digitalización de expedientes de cartera en Agencia Central',
    description: 'Detalle o justificación de las actividades formativas realizadas',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  apoyo_realizado?: string;

  @ApiPropertyOptional({
    example: 'Apoyo en digitalización de expedientes',
    description: 'Alias en camelCase del apoyo realizado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  apoyoRealizado?: string;

  @ApiPropertyOptional({
    example: -16.505200,
    description: 'Latitud GPS del punto de origen capturada mediante botón PIN',
  })
  @IsOptional()
  @IsNumber()
  lat_origen?: number;

  @ApiPropertyOptional({
    example: -16.505200,
    description: 'Alias camelCase de latitud de origen',
  })
  @IsOptional()
  @IsNumber()
  latOrigen?: number;

  @ApiPropertyOptional({
    example: -68.163200,
    description: 'Longitud GPS del punto de origen',
  })
  @IsOptional()
  @IsNumber()
  lng_origen?: number;

  @ApiPropertyOptional({
    example: -68.163200,
    description: 'Alias camelCase de longitud de origen',
  })
  @IsOptional()
  @IsNumber()
  lngOrigen?: number;

  @ApiPropertyOptional({
    example: -16.501500,
    description: 'Latitud GPS del punto de destino',
  })
  @IsOptional()
  @IsNumber()
  lat_destino?: number;

  @ApiPropertyOptional({
    example: -16.501500,
    description: 'Alias camelCase de latitud de destino',
  })
  @IsOptional()
  @IsNumber()
  latDestino?: number;

  @ApiPropertyOptional({
    example: -68.158900,
    description: 'Longitud GPS del punto de destino',
  })
  @IsOptional()
  @IsNumber()
  lng_destino?: number;

  @ApiPropertyOptional({
    example: -68.158900,
    description: 'Alias camelCase de longitud de destino',
  })
  @IsOptional()
  @IsNumber()
  lngDestino?: number;
}
