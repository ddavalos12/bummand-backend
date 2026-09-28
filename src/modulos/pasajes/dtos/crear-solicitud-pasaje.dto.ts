import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CrearSolicitudPasajeDto {
  @IsNumber()
  @IsNotEmpty()
  becarioId: number;

  @IsString()
  @IsNotEmpty()
  periodo: string; // ej. "Septiembre 2026"
}
