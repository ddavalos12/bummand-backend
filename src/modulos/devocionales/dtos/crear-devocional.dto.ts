import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearDevocionalDto {
  @ApiPropertyOptional({ example: 1, description: 'ID del becario (opcional si se deduce del token)' })
  @IsOptional()
  @IsNumber()
  becario_id?: number;

  @ApiProperty({ example: '2026-10-08', description: 'Fecha del devocional en formato YYYY-MM-DD' })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 'Filipenses 4:13', description: 'Pasaje bíblico leído y meditado' })
  @IsNotEmpty()
  @IsString()
  cita_biblica: string;

  @ApiProperty({ example: 'Cristo nuestra fortaleza en la prueba', description: 'Título o tema de la reflexión' })
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @ApiProperty({ example: 'Medité sobre cómo el apóstol Pablo enfrentaba la escasez y la abundancia...', description: 'Reflexión espiritual detallada' })
  @IsNotEmpty()
  @IsString()
  reflexion: string;

  @ApiProperty({ example: 'Pido oración por mis exámenes de la universidad y sabiduría en el trabajo.', description: 'Petición o motivo de oración' })
  @IsNotEmpty()
  @IsString()
  oracion_peticion: string;
}
