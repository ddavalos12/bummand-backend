import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegistroBecarioDto {
  @ApiProperty({
    example: '13696496',
    description: 'Cédula de identidad (C.I.) del becario registrada previamente por la administración',
  })
  @IsString()
  @IsNotEmpty()
  ci: string;

  @ApiProperty({
    example: 'adaibelen017@gmail.com',
    description: 'Correo electrónico institucional o personal para la cuenta del becario',
  })
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @ApiProperty({
    example: 'Bumand2026!',
    description: 'Contraseña para la cuenta del becario (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  contrasena: string;

  @ApiPropertyOptional({
    example: 'Adai Belen Huayta Cardozo',
    description: 'Nombre completo (opcional, si se omite se utilizará el registrado en la nómina administrativa)',
  })
  @IsOptional()
  @IsString()
  nombre?: string;
}
