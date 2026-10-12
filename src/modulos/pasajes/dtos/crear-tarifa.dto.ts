import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean, Min } from 'class-validator';

export class CrearTarifaDto {
  @ApiProperty({
    example: 'Minibús Tramo Directo',
    description: 'Nombre o medio de transporte',
  })
  @IsString()
  @IsNotEmpty()
  medio_transporte: string;

  @ApiProperty({
    example: 'Ruta troncal La Paz / El Alto',
    description: 'Descripción de cobertura del servicio',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({
    example: 2.60,
    description: 'Costo oficial fijado en Bolivianos (Bs)',
  })
  @IsNumber()
  @Min(0)
  costo_bs: number;

  @ApiPropertyOptional({
    example: 'urbano',
    description: 'Tipo de tramo: urbano o interciudad',
    default: 'urbano',
  })
  @IsOptional()
  @IsString()
  tramo_tipo?: string;

  @ApiProperty({
    example: '2026-10-01',
    description: 'Fecha de inicio de vigencia de la tarifa (formato YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  vigente_desde: string;

  @ApiPropertyOptional({
    example: null,
    description: 'Fecha de término de vigencia de la tarifa (nulo si sigue vigente)',
  })
  @IsOptional()
  @IsString()
  vigente_hasta?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica si la tarifa está activa para selección',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
