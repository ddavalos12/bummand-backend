import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ReceptorMentorQrDto {
  @ApiProperty({ example: 1, description: 'Identificador del becario evaluado' })
  @IsNotEmpty()
  @IsNumber()
  becario_id: number;

  @ApiPropertyOptional({ example: 1, description: 'Identificador del periodo académico (opcional, por defecto el activo)' })
  @IsOptional()
  @IsNumber()
  periodo_id?: number;

  @ApiPropertyOptional({ example: 'II-2025', description: 'Nombre o código del periodo académico' })
  @IsOptional()
  @IsString()
  periodo?: string;

  @ApiPropertyOptional({
    example: 'Mildrette Rojas Soliz',
    description: 'Nombre del mentor evaluador(a)',
  })
  @IsOptional()
  @IsString()
  nombre_mentor?: string;

  @ApiPropertyOptional({
    example: 'Angel Javier Ali Paz',
    description: 'Nombre del supervisor o mentor que emite la evaluación (compatibilidad)',
  })
  @IsOptional()
  @IsString()
  supervisor_nombre?: string;

  @ApiPropertyOptional({
    example: 'Jefatura de Planificación, Control y Presupuesto',
    description: 'Unidad o agencia de prácticas del becario',
  })
  @IsOptional()
  @IsString()
  unidad_agencia?: string;

  @ApiPropertyOptional({
    example: 'Semestre II - 2025',
    description: 'Semestre y gestión evaluada',
  })
  @IsOptional()
  @IsString()
  semestre_gestion?: string;

  @ApiPropertyOptional({
    example: '2025-12-30',
    description: 'Fecha de emisión de la evaluación',
  })
  @IsOptional()
  @IsString()
  fecha?: string;

  @ApiPropertyOptional({
    example: [10, 10, 10, 10, 10, 10, 10, 9, 10, 10, 10, 10, 10, 9, 9, 9, 10, 10],
    description: 'Calificaciones de las 18 preguntas en escala del 1 al 10 (arreglo o mapa)',
  })
  @IsOptional()
  calificaciones_1_18?: number[] | Record<string, number>;

  @ApiPropertyOptional({
    example: 'Excelente apoyo muy agradecida durante todo el semestre.',
    description: 'Pregunta 19: ¿Cómo describiría el apoyo que ha recibido del becario durante este semestre?',
  })
  @IsOptional()
  @IsString()
  pregunta_19_apoyo?: string;

  @ApiPropertyOptional({
    example: 3.33,
    description: 'Puntaje asignado a la pregunta 19 (máximo 3.33 puntos)',
  })
  @IsOptional()
  @IsNumber()
  puntaje_19?: number;

  @ApiPropertyOptional({
    example: 'En todas cumplió con lo encomendado con alto rigor.',
    description: 'Pregunta 20: ¿Hubo alguna tarea o proyecto en particular en el que el becario haya destacado positivamente?',
  })
  @IsOptional()
  @IsString()
  pregunta_20_destacado?: string;

  @ApiPropertyOptional({
    example: 3.33,
    description: 'Puntaje asignado a la pregunta 20 (máximo 3.33 puntos)',
  })
  @IsOptional()
  @IsNumber()
  puntaje_20?: number;

  @ApiPropertyOptional({
    example: 'Que exista la opción de apoyo en periodos de vacaciones.',
    description: 'Pregunta 21: ¿Qué sugerencias tiene respecto al programa BUMAND?',
  })
  @IsOptional()
  @IsString()
  pregunta_21_sugerencias?: string;

  @ApiPropertyOptional({
    example: 3.34,
    description: 'Puntaje asignado a la pregunta 21 (máximo 3.34 puntos)',
  })
  @IsOptional()
  @IsNumber()
  puntaje_21?: number;

  @ApiPropertyOptional({
    example: {
      puntualidad: 5,
      proactividad: 5,
      compromiso_institucional: 4,
      etica_trabajo: 5,
    },
    description: 'Respuestas estructuradas del cuestionario de mentor (para compatibilidad hacia atrás)',
  })
  @IsOptional()
  respuestas?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'perfil_supervisor',
    description: 'Modalidad de llenado: perfil_supervisor o celular_estudiante',
    enum: ['perfil_supervisor', 'celular_estudiante'],
  })
  @IsOptional()
  @IsString()
  modalidad_llenado?: 'perfil_supervisor' | 'celular_estudiante';

  @ApiPropertyOptional({
    example: '849201',
    description: 'Código de verificación de identidad de 6 dígitos emitido al supervisor',
  })
  @IsOptional()
  @IsString()
  codigo_verificacion?: string;

  @ApiPropertyOptional({
    example: 'Excelente desempeño y disposición al servicio durante el periodo.',
    description: 'Observaciones cualitativas generales del mentor',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
