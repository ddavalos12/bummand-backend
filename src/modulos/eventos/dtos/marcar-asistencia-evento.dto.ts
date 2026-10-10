import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarcarAsistenciaEventoDto {
  @ApiProperty({ example: -16.500054, description: 'Latitud actual reportada por el dispositivo del becario' })
  @IsNumber({}, { message: 'La latitud debe ser un valor numérico' })
  @Min(-90)
  @Max(90)
  latitud: number;

  @ApiProperty({ example: -68.173455, description: 'Longitud actual reportada por el dispositivo del becario' })
  @IsNumber({}, { message: 'La longitud debe ser un valor numérico' })
  @Min(-180)
  @Max(180)
  longitud: number;

  @ApiProperty({ example: 'Marcación puntual en la entrada del auditorio', description: 'Observación opcional del becario', required: false })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;

  @ApiProperty({ example: 1, description: 'Identificador del becario (opcional, asignado automáticamente por token)', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El identificador del becario debe ser numérico' })
  becario_id?: number;
}
