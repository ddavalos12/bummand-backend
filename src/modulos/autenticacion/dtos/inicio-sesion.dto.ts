import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InicioSesionDto {
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  contrasena: string;
}
