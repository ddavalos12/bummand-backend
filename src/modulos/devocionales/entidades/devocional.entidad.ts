import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Becario } from '../../becarios/entidades/becario.entidad';

@Entity('devocionales')
export class Devocional {
  @ApiProperty({ example: 1, description: 'Identificador único del devocional' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'Identificador del becario autor del devocional' })
  @Column({ name: 'becario_id' })
  becario_id: number;

  @ApiProperty({ example: '2026-10-08', description: 'Fecha del devocional o lectura bíblica' })
  @Column({ type: 'date' })
  fecha: Date;

  @ApiProperty({ example: 'Filipenses 4:13', description: 'Cita bíblica meditada' })
  @Column({ name: 'cita_biblica', type: 'varchar', length: 150 })
  cita_biblica: string;

  @ApiProperty({ example: 'Todo lo puedo en Cristo que me fortalece', description: 'Título o tema de la meditación' })
  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @ApiProperty({ example: 'Reflexión sobre el valor de la perseverancia cristiana...', description: 'Reflexión espiritual del becario' })
  @Column({ type: 'text' })
  reflexion: string;

  @ApiProperty({ example: 'Oración por los estudios universitarios y el ministerio...', description: 'Petición o motivo de oración' })
  @Column({ name: 'oracion_peticion', type: 'text' })
  oracion_peticion: string;

  @ApiPropertyOptional({ example: 'Excelente meditación hermano. Que el Señor bendiga tus prácticas.', description: 'Retroalimentación u observación del pastor o mentor' })
  @Column({ name: 'comentario_pastoral', type: 'text', nullable: true })
  comentario_pastoral: string | null;

  @ApiProperty({ example: false, description: 'Indica si el pastor o supervisor ya revisó el devocional' })
  @Column({ name: 'revisado_por_pastor', type: 'boolean', default: false })
  revisado_por_pastor: boolean;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z', description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;
}
