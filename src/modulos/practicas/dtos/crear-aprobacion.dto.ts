import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearAprobacionDto {
  @IsNumber()
  @IsNotEmpty()
  becario_id: number;

  @IsOptional()
  @IsNumber()
  supervisor_id?: number;

  @IsString()
  @IsNotEmpty()
  periodo: string;

  @IsNumber()
  @IsNotEmpty()
  horas_aprobadas: number;

  @IsString()
  @IsNotEmpty()
  firma_digital: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
