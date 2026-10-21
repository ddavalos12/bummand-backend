import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SolicitarCodigoTutorDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador del becario que solicita la evaluación presencial de su supervisor',
  })
  @IsOptional()
  @IsNumber()
  becario_id?: number;
}

export class VerificarCodigoTutorDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador del becario a evaluar',
  })
  @IsOptional()
  @IsNumber()
  becario_id?: number;

  @ApiPropertyOptional({
    example: '482910',
    description: 'Código numérico de 6 dígitos enviado por notificación a la pantalla del supervisor',
  })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({
    example: 'angel.ali@bumand.bo',
    description: 'Correo institucional del supervisor (método de respaldo)',
  })
  @IsOptional()
  @IsString()
  correo?: string;

  @ApiPropertyOptional({
    example: 'Bumand2026!',
    description: 'Contraseña institucional del supervisor (método de respaldo)',
  })
  @IsOptional()
  @IsString()
  contrasena?: string;
}
