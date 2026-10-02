import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CrearNotificacionDto {
  @IsNumber()
  @IsNotEmpty()
  usuario_id: number;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;
}
