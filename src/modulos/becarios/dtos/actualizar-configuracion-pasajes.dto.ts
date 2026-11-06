import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class ActualizarConfiguracionPasajesDto {
  @ApiPropertyOptional({
    enum: ['ida_y_vuelta', 'solo_ida'],
    example: 'ida_y_vuelta',
    description: 'Modalidad general de registro de pasajes (ida_y_vuelta | solo_ida)',
  })
  @IsOptional()
  @IsIn(['ida_y_vuelta', 'solo_ida'], {
    message: 'La modalidad_pasajes debe ser "ida_y_vuelta" o "solo_ida"',
  })
  modalidad_pasajes?: 'ida_y_vuelta' | 'solo_ida';

  @ApiPropertyOptional({
    description: 'Configuración granular de modalidad de pasajes por tipo de actividad',
    example: {
      practicas: 'ida_y_vuelta',
      escuela_lideres: 'solo_ida',
      acciones_servicio: 'ida_y_vuelta',
    },
  })
  @IsOptional()
  @IsObject({
    message: 'configuracion_pasajes_actividades debe ser un objeto de configuración por actividad',
  })
  configuracion_pasajes_actividades?: {
    practicas?: 'ida_y_vuelta' | 'solo_ida';
    escuela_lideres?: 'ida_y_vuelta' | 'solo_ida';
    acciones_servicio?: 'ida_y_vuelta' | 'solo_ida';
  };

  @ApiPropertyOptional({
    example: '7093658',
    description: 'Carnet de identidad del becario (respaldo de identificación)',
  })
  @IsOptional()
  @IsString()
  ci?: string;

  @ApiPropertyOptional({
    example: 'Noemi Callisaya Alvarez',
    description: 'Nombre completo del becario (respaldo de identificación)',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({
    example: 12,
    description: 'Identificador de usuario del becario (respaldo de identificación)',
  })
  @IsOptional()
  @IsNumber()
  usuario_id?: number;
}
