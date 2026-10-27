import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CalificacionMateriaItemDto } from './guardar-notas-estudiante.dto';

export enum AccionPreEvaluacion {
  APROBAR = 'aprobar',
  OBSERVAR = 'observar',
}

export class PreEvaluarSupervisorDto {
  @ApiProperty({ example: 1, description: 'ID de la evaluación' })
  @IsNotEmpty()
  @IsNumber()
  evaluacion_id: number;

  @ApiProperty({ type: [CalificacionMateriaItemDto], description: 'Lista de asignaturas revisadas y/o editadas' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalificacionMateriaItemDto)
  materias: CalificacionMateriaItemDto[];

  @ApiProperty({ enum: AccionPreEvaluacion, example: AccionPreEvaluacion.APROBAR })
  @IsNotEmpty()
  @IsEnum(AccionPreEvaluacion)
  accion: AccionPreEvaluacion;

  @ApiPropertyOptional({ example: 'Se verificó Kárdex oficial. Notas corregidas de acuerdo al documento sellado.' })
  @IsOptional()
  @IsString()
  observaciones_supervisor?: string;
}
