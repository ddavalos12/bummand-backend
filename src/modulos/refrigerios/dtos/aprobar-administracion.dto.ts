import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AprobarAdministracionDto {
  @ApiProperty({
    example: 4,
    description: 'Identificador del único becario de la dupla que recibe el desembolso total del 100%',
  })
  @IsNotEmpty()
  @IsNumber()
  becario_receptor_devolucion_id: number;

  @ApiPropertyOptional({
    example: 'Nilda Amalia Churata Paye',
    description: 'Nombre del becario de la dupla que recibe físicamente el 100% de la devolución',
  })
  @IsOptional()
  @IsString()
  becario_receptor_devolucion_nombre?: string;

  @ApiPropertyOptional({
    example: 'Desembolso en efectivo del 100% realizado a conformidad.',
    description: 'Observación administrativa o nota del desembolso',
  })
  @IsOptional()
  @IsString()
  observacion?: string;
}
