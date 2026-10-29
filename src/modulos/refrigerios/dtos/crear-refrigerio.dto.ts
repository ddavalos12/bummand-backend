import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DetalleIngredienteRefrigerio } from '../entidades/refrigerio.entidad';

export class CrearRefrigerioDto {
  @ApiProperty({
    example: '2026-10-12',
    description: 'Fecha en que se proporcionó el refrigerio (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador del evento institucional vinculado (opcional)',
  })
  @IsOptional()
  @IsNumber()
  evento_id?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Identificador de la sede o lugar de práctica vinculado (opcional)',
  })
  @IsOptional()
  @IsNumber()
  lugar_practica_id?: number;

  @ApiProperty({
    example: 'Refrigerio para Escuela de Líderes (Empanadas y refresco de mocochinchi)',
    description: 'Descripción detallada de los alimentos adquiridos',
  })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({
    example: 23,
    description: 'Cantidad de raciones distribuidas a los becarios',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  cantidad_raciones: number;

  @ApiPropertyOptional({
    example: 6.0,
    description: 'Costo unitario en Bolivianos (Bs) por cada ración (opcional si se envía costo total)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costo_unitario_bs?: number;

  @ApiPropertyOptional({
    example: 138.0,
    description: 'Costo total calculado en Bs (opcional si se envía costo unitario)',
  })
  @IsOptional()
  @IsNumber()
  costo_total_bs?: number;

  // Dupla encargada
  @ApiPropertyOptional({ example: 4, description: 'ID del primer becario de la dupla' })
  @IsOptional()
  @IsNumber()
  becario_encargado_1_id?: number;

  @ApiPropertyOptional({ example: 'Nilda Amalia Churata Paye', description: 'Nombre del primer becario encargado' })
  @IsOptional()
  @IsString()
  becario_encargado_1_nombre?: string;

  @ApiPropertyOptional({ example: 5, description: 'ID del segundo becario de la dupla' })
  @IsOptional()
  @IsNumber()
  becario_encargado_2_id?: number;

  @ApiPropertyOptional({ example: 'Joel Mamani Quispe', description: 'Nombre del segundo becario encargado' })
  @IsOptional()
  @IsString()
  becario_encargado_2_nombre?: string;

  @ApiPropertyOptional({
    example: 4,
    description: 'Identificador del becario encargado principal (compatibilidad)',
  })
  @IsOptional()
  @IsNumber()
  becario_id?: number;

  @ApiPropertyOptional({
    example: 'Nilda Amalia Churata Paye',
    description: 'Nombre del becario encargado del refrigerio (compatibilidad)',
  })
  @IsOptional()
  @IsString()
  becario_nombre?: string;

  @ApiPropertyOptional({
    example: 'cocina_diaconia',
    description: 'Modalidad de preparación: cocina_diaconia | traido_de_casa | compra_directa',
  })
  @IsOptional()
  @IsString()
  modalidad_preparacion?: string;

  @ApiPropertyOptional({
    description: 'Desglose de ingredientes e insumos adquiridos',
    example: [{ insumo: 'Pan surtido', cantidad: '25 unid', costo_bs: 20.0, pagado_por_becario_id: 4, pagado_por_nombre: 'Nilda Churata' }],
  })
  @IsOptional()
  @IsArray()
  detalle_ingredientes?: DetalleIngredienteRefrigerio[];

  @ApiPropertyOptional({ example: 138.0, description: 'Presupuesto referencial en Bs' })
  @IsOptional()
  @IsNumber()
  presupuesto_referencial_bs?: number;

  @ApiPropertyOptional({ example: 100.0, description: 'Porcentaje de devolución' })
  @IsOptional()
  @IsNumber()
  porcentaje_devolucion?: number;

  @ApiPropertyOptional({ example: 138.0, description: 'Monto de devolución en Bs' })
  @IsOptional()
  @IsNumber()
  monto_devolucion_bs?: number;

  @ApiPropertyOptional({ example: 4, description: 'ID del único becario receptor del reembolso 100%' })
  @IsOptional()
  @IsNumber()
  becario_receptor_devolucion_id?: number;

  @ApiPropertyOptional({ example: 'Nilda Amalia Churata Paye', description: 'Nombre del receptor de la devolución' })
  @IsOptional()
  @IsString()
  becario_receptor_devolucion_nombre?: string;

  @ApiPropertyOptional({ example: 'sorteado_programado', description: 'Estado de la reposición' })
  @IsOptional()
  @IsString()
  estado_reposicion?: string;

  @ApiProperty({
    example: 2,
    description: 'Identificador del usuario responsable de la compra o entrega',
  })
  @IsNotEmpty()
  @IsNumber()
  responsable_id: number;

  @ApiPropertyOptional({
    description: 'Listado de registros de recepción y conformidad de entrega en sistema',
    example: [{ becario_id: 1, nombre: 'Nilda Churata', conforme: true }],
  })
  @IsOptional()
  firmas_conformidad?: Record<string, unknown>[];
}
