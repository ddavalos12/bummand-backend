import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearIglesiaDto {
  @ApiProperty({
    example: 'Iglesia Central El Alto',
    description: 'Nombre de la congregación o iglesia cristiana',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({
    example: 'Av. 6 de Marzo N° 120, El Alto',
    description: 'Dirección física de la iglesia',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({
    example: -16.500054,
    description: 'Latitud geográfica WGS84',
  })
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @ApiPropertyOptional({
    example: -68.173455,
    description: 'Longitud geográfica WGS84',
  })
  @IsNumber()
  @IsOptional()
  longitud?: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'Radio métrico de tolerancia para marcación de acciones de servicio',
    default: 60,
  })
  @IsNumber()
  @IsOptional()
  radio_tolerancia_m?: number;

  @ApiPropertyOptional({
    example: 'Pastor Juan Mamani',
    description: 'Nombre del pastor principal',
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  pastor_nombre?: string;

  @ApiPropertyOptional({
    example: '71234567',
    description: 'Teléfono de contacto pastoral',
  })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  pastor_telefono?: string;

  @ApiPropertyOptional({
    example: 'pastor.juan@diaconia.bo',
    description: 'Correo electrónico institucional o de contacto pastoral',
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  pastor_correo?: string;
}
