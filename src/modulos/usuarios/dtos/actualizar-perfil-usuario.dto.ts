import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ActualizarPerfilUsuarioDto {
  @ApiPropertyOptional({
    example: 'Adai Belen Huayta',
    description: 'Nombre completo del usuario',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({
    example: 'adai.huayta@diaconia.bo',
    description: 'Correo electrónico principal del usuario',
  })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({
    example: 'adai.personal@gmail.com',
    description: 'Correo electrónico secundario o alternativo para inicio de sesión',
  })
  @IsOptional()
  correo_alternativo?: string | null;

  @ApiPropertyOptional({
    example: '71234567',
    description: 'Número de teléfono o celular de contacto',
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    example: 'Zona Villa Adela, Calle 4 #102',
    description: 'Dirección o domicilio registrado',
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({
    example: 'Ingeniería de Sistemas',
    description: 'Carrera universitaria que cursa el becario',
  })
  @IsOptional()
  @IsString()
  carrera?: string;

  @ApiPropertyOptional({
    example: '6to Semestre',
    description: 'Semestre o nivel académico actual',
  })
  @IsOptional()
  @IsString()
  semestre?: string;
}
