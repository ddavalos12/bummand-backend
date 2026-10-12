import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class OrdenConfirmacionDatosDto {
  @ApiProperty({
    example: true,
    description: 'Bandera para activar o desactivar la orden de confirmación periódica de datos',
  })
  @IsNotEmpty()
  @IsBoolean()
  confirmacion_datos_requerida: boolean;
}
