import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsObject } from 'class-validator';

export class GuardarFormularioF03Dto {
  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la evaluación asociada (opcional si se envía en la URL)',
  })
  @IsOptional()
  @IsNumber()
  evaluacion_id?: number;

  @ApiProperty({
    example: 'Pr. Juan Carlos Quispe',
    description: 'Nombre completo del pastor que evalúa',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  pastor_nombre: string;

  @ApiPropertyOptional({
    example: 'pastor.quispe@iglesia.bo',
    description: 'Correo electrónico de contacto del pastor',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  pastor_correo?: string;

  @ApiPropertyOptional({
    example: '71234567',
    description: 'Número de celular o WhatsApp del pastor',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  pastor_celular?: string;

  @ApiProperty({
    example: 'Iglesia Cristiana Central',
    description: 'Nombre de la congregación local donde asiste el becario',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  iglesia_nombre: string;

  @ApiPropertyOptional({
    example: 'Av. Las Américas N° 450, El Alto',
    description: 'Dirección física de la iglesia local',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  iglesia_direccion?: string;

  @ApiPropertyOptional({
    description: 'Respuestas detalladas a las preguntas del Formulario F-03 pastoral',
    example: {
      lider_nombre: 'Hermano Pedro Choque',
      lider_cargo: 'Diácono Principal',
      frecuencia_asistencia: 'Es miembro en plena comunión',
      demuestra_compromiso: 'Sí',
      ocupa_cargo: 'Sí',
      cargo_2025: 'Líder de Jóvenes',
      cumplimiento_cargos: 'Muy bien',
      conviccion_llamado: 'Firme vocación pastoral y de servicio a la comunidad',
      ejemplo_congregacion: 'Puntualidad, integridad y devoción',
      compromiso_capacitaciones: 'Asistencia 100% en talleres bíblicos',
      testimonio_cristiano: 'Intachable y respetado',
      relacion_miembros: 'Empático y colaborativo',
      desarrollo_nuevos_lideres: 'Discipulando a 3 universitarios',
      fortalezas: 'Liderazgo, empatía, organización',
      debilidades: 'A veces sobrecarga sus horarios',
      opinion_general: 'Altamente recomendado para continuar en el programa BUMAND',
      declara_nombre: 'Pr. Juan Carlos Quispe',
      declara_ci: '4567891 LP',
      declara_conforme: true,
    },
  })
  @IsOptional()
  @IsObject()
  campos_formulario?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 95.0,
    description: 'Puntaje asignado al becario en escala 0-100 (actualiza la evaluación)',
  })
  @IsOptional()
  @IsNumber()
  puntaje?: number;

  @ApiPropertyOptional({
    example: 'Excelente desempeño pastoral y comunitario',
    description: 'Observaciones o retroalimentación general',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
