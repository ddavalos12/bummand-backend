import { IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';

export class CrearEvaluacionDto {
  @IsNumber()
  @IsNotEmpty()
  becario_id: number;

  @IsNumber()
  @IsNotEmpty()
  periodo_id: number;

  @IsNumber()
  @IsNotEmpty()
  modulo_id: number;

  @IsNumber()
  @IsNotEmpty()
  evaluador_id: number;

  @IsOptional()
  @IsNumber()
  puntaje?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  archivo_pdf?: string;

  @IsOptional()
  @IsString()
  fecha_evaluacion?: string;
}
