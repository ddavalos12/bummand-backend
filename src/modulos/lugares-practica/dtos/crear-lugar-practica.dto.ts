import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearLugarPracticaDto {
  @ApiProperty({
    example: 'Sede Central Diaconía IFD',
    description: 'Nombre de la sede, agencia o sucursal institucional',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({
    example: 'Av. 6 de Marzo, Ceja El Alto',
    description: 'Dirección física de la sede',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiProperty({
    example: -16.505000,
    description: 'Latitud geográfica WGS84 del centroide de la sede',
  })
  @IsNumber()
  latitud: number;

  @ApiProperty({
    example: -68.163000,
    description: 'Longitud geográfica WGS84 del centroide de la sede',
  })
  @IsNumber()
  longitud: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Radio métrico de tolerancia geodésica para marcación de asistencia',
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  radio_tolerancia_m?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Alias en camelCase del radio de tolerancia',
  })
  @IsOptional()
  @IsNumber()
  radioToleranciaM?: number;
}
