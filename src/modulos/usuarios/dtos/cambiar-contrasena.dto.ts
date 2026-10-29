import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CambiarContrasenaDto {
  @ApiPropertyOptional({
    example: 'ClaveAnterior123*',
    description: 'Contraseña actual del usuario para validación de seguridad',
  })
  @IsOptional()
  @IsString()
  contrasena_actual?: string;

  @ApiProperty({
    example: 'NuevaClaveSegura2026*',
    description: 'Nueva contraseña elegida para la cuenta institucional (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  nueva_contrasena: string;
}
