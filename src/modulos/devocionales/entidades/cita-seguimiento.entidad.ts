import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';
import { Becario } from '../../becarios/entidades/becario.entidad';

export enum ModalidadCita {
  PRESENCIAL = 'presencial',
  VIRTUAL = 'virtual',
}

export enum EstadoCita {
  PROGRAMADA = 'programada',
  REALIZADA = 'realizada',
  REPROGRAMADA = 'reprogramada',
  CANCELADA = 'cancelada',
}

@Entity('citas_seguimiento')
export class CitaSeguimiento {
  @ApiProperty({ example: 1, description: 'Identificador único de la cita de seguimiento' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 2, description: 'Identificador del supervisor asignado' })
  @Column({ name: 'supervisor_id', type: 'int' })
  supervisor_id: number;

  @ApiProperty({ example: 5, description: 'Identificador del becario citado' })
  @Column({ name: 'becario_id', type: 'int' })
  becario_id: number;

  @ApiProperty({ example: '2026-11-05', description: 'Fecha pactada para la cita' })
  @Column({ name: 'fecha_cita', type: 'date' })
  fecha_cita: Date | string;

  @ApiProperty({ example: '10:00', description: 'Hora fijada para la cita (HH:mm)' })
  @Column({ name: 'hora_cita', type: 'varchar', length: 10 })
  hora_cita: string;

  @ApiProperty({
    enum: ModalidadCita,
    example: ModalidadCita.PRESENCIAL,
    description: 'Modalidad de encuentro',
  })
  @Column({ type: 'varchar', length: 20, default: ModalidadCita.PRESENCIAL })
  modalidad: ModalidadCita;

  @ApiProperty({
    example: 'Oficina Pastoral 2 / Enlace Google Meet',
    description: 'Ubicación física o enlace telemático',
  })
  @Column({ name: 'lugar_o_enlace', type: 'varchar', length: 255 })
  lugar_o_enlace: string;

  @ApiProperty({
    example: 'Revisión trimestral de devocionales y apoyo académico',
    description: 'Motivo y objetivos de la retroalimentación',
  })
  @Column({ name: 'motivo_retroalimentacion', type: 'text' })
  motivo_retroalimentacion: string;

  @ApiPropertyOptional({
    example: 'Josué 1:9',
    description: 'Cita bíblica de exhortación o meditación previa',
  })
  @Column({ name: 'cita_biblica', type: 'varchar', length: 120, nullable: true })
  cita_biblica: string | null;

  @ApiPropertyOptional({
    example: 'El becario se compromete a entregar reflexiones semanales los lunes.',
    description: 'Acuerdos establecidos y conclusiones de la retroalimentación',
  })
  @Column({ name: 'acuerdos_retroalimentacion', type: 'text', nullable: true })
  acuerdos_retroalimentacion: string | null;

  @ApiProperty({
    enum: EstadoCita,
    example: EstadoCita.PROGRAMADA,
    description: 'Estado de la cita',
  })
  @Column({ type: 'varchar', length: 20, default: EstadoCita.PROGRAMADA })
  estado: EstadoCita;

  @ApiProperty({ example: '2026-10-28T12:00:00.000Z', description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Usuario;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;
}
