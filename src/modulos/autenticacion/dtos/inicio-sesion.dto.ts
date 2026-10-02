import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InicioSesionDto {
  @ApiProperty({
    example: 'nilda.churata@diaconia.bo',
    description: 'Correo electrónico institucional del usuario registrado',
  })
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @ApiProperty({
    example: 'ClaveSegura123*',
    description: 'Contraseña institucional del usuario',
  })
  @IsString()
  @IsNotEmpty()
  contrasena: string;
}
