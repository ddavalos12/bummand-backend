import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CrearSolicitudPasajeDto {
  @IsOptional()
  @IsNumber()
  becarioId?: number; // Inyectado por el guardia

  @IsString()
  @IsNotEmpty()
  periodo: string; // ej. "Septiembre 2026"
}
