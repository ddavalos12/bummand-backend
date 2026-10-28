import { IsIn, IsObject, IsOptional } from 'class-validator';

export class ActualizarConfiguracionPasajesDto {
  @IsOptional()
  @IsIn(['ida_y_vuelta', 'solo_ida'], {
    message: 'La modalidad_pasajes debe ser "ida_y_vuelta" o "solo_ida"',
  })
  modalidad_pasajes?: 'ida_y_vuelta' | 'solo_ida';

  @IsOptional()
  @IsObject({
    message: 'configuracion_pasajes_actividades debe ser un objeto de configuración por actividad',
  })
  configuracion_pasajes_actividades?: {
    practicas?: 'ida_y_vuelta' | 'solo_ida';
    escuela_lideres?: 'ida_y_vuelta' | 'solo_ida';
    acciones_servicio?: 'ida_y_vuelta' | 'solo_ida';
  };
}
