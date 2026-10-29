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

  @ApiProperty({
    example: 'cocina_diaconia',
    description: 'Modalidad de preparación: cocina_diaconia | traido_de_casa | compra_directa',
  })
  @IsNotEmpty()
  @IsString()
  modalidad_preparacion: string;

  @ApiProperty({
    description: 'Lista de insumos/ingredientes adquiridos, costos y quién pagó cada uno',
    example: [
      { insumo: 'Pan surtido', cantidad: '25 unidades', costo_bs: 20.0, pagado_por_becario_id: 4, pagado_por_nombre: 'Nilda Churata' },
      { insumo: 'Maple de huevos', cantidad: '30 unidades', costo_bs: 35.0, pagado_por_becario_id: 5, pagado_por_nombre: 'Joel Mamani' },
      { insumo: 'Queso criollo', cantidad: '1 bloque', costo_bs: 25.0, pagado_por_becario_id: 4, pagado_por_nombre: 'Nilda Churata' },
      { insumo: 'Refresco e insumos', cantidad: 'Para 23 personas', costo_bs: 55.0, pagado_por_becario_id: 5, pagado_por_nombre: 'Joel Mamani' },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  detalle_ingredientes: DetalleIngredienteRefrigerio[];

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
