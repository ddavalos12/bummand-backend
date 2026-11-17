import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearNotificacionDto {
  @ApiProperty({
    example: 1,
    description: 'Identificador del usuario receptor de la notificación',
  })
  @IsNumber()
  @IsNotEmpty()
  usuario_id: number;

  @ApiPropertyOptional({
    example: 'Permiso Aprobado',
    description: 'Título breve de la notificación',
  })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiProperty({
    example: 'recordatorio_salida',
    description: 'Tipo o clasificación de la notificación (recordatorio_salida, pasaje_observado, evaluacion_pendiente, justificacion, general)',
  })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({
    example: 'Recuerda registrar tu salida de práctica antes de las 18:00.',
    description: 'Mensaje descriptivo del cuerpo de la notificación',
  })
  @IsString()
  @IsNotEmpty()
  mensaje: string;
}
