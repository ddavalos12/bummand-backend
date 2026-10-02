import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CrearSolicitudPasajeDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador del becario solicitante (inyectado desde el token JWT)',
  })
  @IsOptional()
  @IsNumber()
  becario_id?: number;

  @ApiProperty({
    example: 'Septiembre 2026',
    description: 'Periodo mensual de liquidación de viáticos (ej. "Septiembre 2026")',
  })
  @IsString()
  @IsNotEmpty()
  periodo: string;
}
