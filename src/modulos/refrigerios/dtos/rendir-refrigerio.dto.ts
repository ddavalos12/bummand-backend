import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DetalleIngredienteRefrigerio } from '../entidades/refrigerio.entidad';

export class RendirRefrigerioDto {
  @ApiPropertyOptional({
    example: 'Sándwich de huevo con refresco de linaza',
    description: 'Menú o descripción detallada de lo preparado por la dupla',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    example: 'general',
    description: 'Modalidad de preparación (opcional, en reserva de la dupla)',
  })
  @IsOptional()
  @IsString()
  modalidad_preparacion?: string;

  @ApiPropertyOptional({
    description: 'Lista de insumos/ingredientes adquiridos, costos y quién pagó cada uno (opcional, preparación en reserva)',
    example: [],
  })
  @IsOptional()
  @IsArray()
  detalle_ingredientes?: DetalleIngredienteRefrigerio[];

  @ApiProperty({
    example: 135.0,
    description: 'Costo total efectivamente gastado y a ser reembolsado al 100%',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  costo_total_bs: number;

  @ApiPropertyOptional({
    example: 23,
    description: 'Cantidad real de raciones distribuidas a los becarios',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cantidad_raciones?: number;
}
