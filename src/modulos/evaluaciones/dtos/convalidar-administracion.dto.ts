import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum AccionConvalidacion {
  CONVALIDAR = 'convalidar',
  OBSERVAR = 'observar',
}

export class ConvalidarAdministracionDto {
  @ApiProperty({ example: 1, description: 'ID de la evaluación' })
  @IsNotEmpty()
  @IsNumber()
  evaluacion_id: number;

  @ApiProperty({ enum: AccionConvalidacion, example: AccionConvalidacion.CONVALIDAR })
  @IsNotEmpty()
  @IsEnum(AccionConvalidacion)
  accion: AccionConvalidacion;

  @ApiPropertyOptional({ example: 'Convalidación oficial de calificaciones y Kárdex institucional' })
  @IsOptional()
  @IsString()
  observaciones_administracion?: string;
}
