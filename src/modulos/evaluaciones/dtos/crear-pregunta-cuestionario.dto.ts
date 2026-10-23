import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CrearPreguntaCuestionarioDto {
  @ApiProperty({ description: 'Número de orden correlativo de la pregunta', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  numero_orden: number;

  @ApiPropertyOptional({ description: 'Sección o dimensión temática', example: 'Dimensión Académica' })
  @IsOptional()
  @IsString()
  seccion?: string;

  @ApiPropertyOptional({ description: 'Título corto de la pregunta', example: 'Rendimiento en exámenes' })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiProperty({ description: 'Enunciado completo de la pregunta', example: '¿Con qué frecuencia logras concentrarte en tus periodos de estudio?' })
  @IsNotEmpty()
  @IsString()
  enunciado: string;

  @ApiPropertyOptional({ description: 'Tipo de reactivo: likert, seleccion_unica, escala_numerica, texto_abierto', default: 'likert' })
  @IsOptional()
  @IsString()
  tipo_pregunta?: string;

  @ApiPropertyOptional({ description: 'Opciones de respuesta estructuradas (inciso, texto, puntaje, semáforo)' })
  @IsOptional()
  @IsArray()
  opciones?: Array<{
    inciso: string;
    texto: string;
    puntaje: number;
    semaforo?: string;
  }>;

  @ApiPropertyOptional({ description: 'Peso o valor en puntos de la pregunta', default: 1.0 })
  @IsOptional()
  @IsNumber()
  peso_puntos?: number;

  @ApiPropertyOptional({ description: 'Indica si responder esta pregunta es obligatorio', default: true })
  @IsOptional()
  @IsBoolean()
  obligatoria?: boolean;

  @ApiPropertyOptional({ description: 'Indica si la pregunta está activa en el formulario', default: true })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
