import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoPeriodo } from '../entidades/periodo-evaluacion.entidad';

export class CambiarEstadoPeriodoDto {
  @ApiProperty({
    enum: EstadoPeriodo,
    example: EstadoPeriodo.ABIERTO,
    description: 'Nuevo estado del período (abierto / cerrado)',
  })
  @IsNotEmpty()
  @IsEnum(EstadoPeriodo)
  estado: EstadoPeriodo;
}
