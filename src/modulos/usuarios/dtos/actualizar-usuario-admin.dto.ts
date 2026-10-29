import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Rol, EstadoUsuario } from '../entidades/usuario.entidad';

export class ActualizarUsuarioAdminDto {
  @ApiPropertyOptional({
    example: 'Adai Belen Huayta',
    description: 'Nombre completo del usuario',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({
    example: 'adai.huayta@diaconia.bo',
    description: 'Correo electrónico institucional principal',
  })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({
    example: 'adai.personal@gmail.com',
    description: 'Correo alternativo para inicio de sesión (null para eliminar)',
  })
  @IsOptional()
  correo_alternativo?: string | null;

  @ApiPropertyOptional({
    enum: Rol,
    example: Rol.SUPERVISOR,
    description: 'Rol institucional asignado al usuario',
  })
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @ApiPropertyOptional({
    enum: EstadoUsuario,
    example: EstadoUsuario.ACTIVO,
    description: 'Estado de la cuenta institucional (activo o inactivo)',
  })
  @IsOptional()
  @IsEnum(EstadoUsuario)
  estado?: EstadoUsuario;

  @ApiPropertyOptional({
    example: 'ClaveSegura2026*',
    description: 'Nueva contraseña asignada administrativamente (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  nueva_contrasena?: string;
}
