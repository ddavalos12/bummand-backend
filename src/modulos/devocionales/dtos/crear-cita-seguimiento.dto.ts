import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ModalidadCita } from '../entidades/cita-seguimiento.entidad';

export class CrearCitaSeguimientoDto {
  @ApiProperty({
    example: 5,
    description: 'Identificador del becario citado para seguimiento',
  })
  @IsNumber()
  @IsNotEmpty()
  becario_id: number;

  @ApiProperty({
    example: '2026-11-05',
    description: 'Fecha programada para la cita (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_cita: string;

  @ApiProperty({
    example: '10:00',
    description: 'Hora programada para la cita (HH:mm)',
  })
  @IsString()
  @IsNotEmpty()
  hora_cita: string;

  @ApiPropertyOptional({
    enum: ModalidadCita,
    example: ModalidadCita.PRESENCIAL,
    description: 'Modalidad de la reunión (presencial o virtual)',
  })
  @IsOptional()
  @IsEnum(ModalidadCita)
  modalidad?: ModalidadCita;

  @ApiProperty({
    example: 'Oficina Pastoral 2 / https://meet.google.com/xyz',
    description: 'Ubicación física o enlace para la reunión',
  })
  @IsString()
  @IsNotEmpty()
  lugar_o_enlace: string;

  @ApiProperty({
    example: 'Retroalimentación de desempeño devocional y seguimiento ministerial',
    description: 'Motivo y enfoque temático de la reunión',
  })
  @IsString()
  @IsNotEmpty()
  motivo_retroalimentacion: string;

  @ApiPropertyOptional({
    example: 'Josué 1:9',
    description: 'Cita bíblica de orientación o apoyo',
  })
  @IsOptional()
  @IsString()
  cita_biblica?: string;
}
