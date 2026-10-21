import { ApiProperty } from '@nestjs/swagger';

export class EstadoOrdenConfirmacionDto {
  @ApiProperty({ example: true, description: 'Indica si existe una orden de verificación actualmente activa' })
  confirmacion_activa: boolean;

  @ApiProperty({ example: '2026-10-20T12:00:00.000Z', nullable: true, description: 'Fecha ISO de la última solicitud' })
  fecha_ultima_solicitud: string | null;

  @ApiProperty({ example: false, description: 'Indica si el cooldown de 7 días ya expiró y se puede emitir otra orden' })
  puede_solicitar: boolean;

  @ApiProperty({ example: 6, description: 'Días enteros restantes para desbloquear el botón' })
  dias_restantes: number;

  @ApiProperty({ example: 518400, description: 'Segundos exactos restantes de enfriamiento' })
  segundos_restantes: number;
}
