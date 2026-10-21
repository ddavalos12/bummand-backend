import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RectificarAsistenciaDto {
  @ApiPropertyOptional({
    description: 'Nueva hora de ingreso corregida (HH:mm) para rectificación administrativa',
    example: '08:00',
  })
  @IsOptional()
  @IsString()
  hora_ingreso_nueva?: string;

  @ApiProperty({
    description: 'Motivo fundado de la justificación o rectificación de la marcación',
    example: 'Bloqueo vehicular verificado en Ceja de El Alto. Se rectifica hora a 08:00.',
  })
  @IsNotEmpty({ message: 'El motivo de la justificación es obligatorio' })
  @IsString()
  motivo_justificacion: string;

  @ApiPropertyOptional({
    description: 'Si es true, resetea los minutos de retraso a 0 y anula cualquier multa asociada',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  anular_multa?: boolean;

  @ApiPropertyOptional({
    description: 'Si es true, crea automáticamente un expediente resuelto en la bandeja de Permisos y Justificaciones',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  crear_justificacion?: boolean;
}
