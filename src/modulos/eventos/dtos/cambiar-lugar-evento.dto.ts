import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CambiarLugarEventoDto {
  @ApiProperty({
    example: -16.500054,
    description: 'Nueva latitud geográfica del recinto o punto de encuentro',
  })
  @IsNumber({}, { message: 'La latitud debe ser un valor numérico' })
  @Min(-90)
  @Max(90)
  latitud: number;

  @ApiProperty({
    example: -68.173455,
    description: 'Nueva longitud geográfica del recinto o punto de encuentro',
  })
  @IsNumber({}, { message: 'La longitud debe ser un valor numérico' })
  @Min(-180)
  @Max(180)
  longitud: number;

  @ApiProperty({
    example: 'Plaza del Minero esq. Av. Panorámica, El Alto',
    description: 'Nueva dirección de referencia o punto de encuentro',
  })
  @IsString({ message: 'La dirección de referencia debe ser texto' })
  @IsNotEmpty({ message: 'La dirección de referencia no puede estar vacía' })
  direccion_referencia: string;

  @ApiPropertyOptional({
    example: 120,
    description: 'Radio perimetral de tolerancia geodésica en metros',
    default: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El radio de tolerancia debe ser numérico' })
  @Min(10)
  radio_tolerancia_m?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Identificador opcional de la iglesia si el evento fue reubicado a un templo',
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ID de la iglesia debe ser numérico' })
  iglesia_id?: number;

  @ApiPropertyOptional({
    example: 'Traslado por condiciones climáticas al salón comunal contiguo',
    description: 'Motivo justificado del cambio dinámico de recinto',
  })
  @IsOptional()
  @IsString({ message: 'El motivo del cambio debe ser texto' })
  motivo_cambio?: string;
}
