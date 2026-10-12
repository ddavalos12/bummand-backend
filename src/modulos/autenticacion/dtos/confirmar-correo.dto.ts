import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmarCorreoDto {
  @ApiProperty({
    example: 'a1b2c3d4-token-verificacion',
    description: 'Token criptográfico o código único de verificación enviado al correo',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiPropertyOptional({
    example: 'nilda.churata@diaconia.bo',
    description: 'Correo electrónico del usuario registrado (opcional)',
  })
  @IsOptional()
  @IsEmail()
  correo?: string;
}
