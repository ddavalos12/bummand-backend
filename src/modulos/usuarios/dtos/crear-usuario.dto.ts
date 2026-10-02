import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Rol } from '../entidades/usuario.entidad';

export class CrearUsuarioDto {
  @ApiProperty({
    example: 'Edgar Alarcón',
    description: 'Nombre completo y apellidos del usuario',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    example: 'edgar.alarcon@diaconia.bo',
    description: 'Correo electrónico único institucional',
  })
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @ApiProperty({
    example: 'ClaveSegura123*',
    description: 'Contraseña del nuevo usuario (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  contrasena: string;

  @ApiProperty({
    enum: Rol,
    example: Rol.SUPERVISOR,
    description: 'Rol institucional asignado (administrador, supervisor, becario)',
  })
  @IsEnum(Rol)
  rol: Rol;
}
