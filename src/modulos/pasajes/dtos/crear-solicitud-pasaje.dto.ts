import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CrearSolicitudPasajeDto {
  @IsOptional()
  @IsNumber()
  becario_id?: number; // Inyectado por el guardia

  @IsString()
  @IsNotEmpty()
  periodo: string; // ej. "Septiembre 2026"
}

