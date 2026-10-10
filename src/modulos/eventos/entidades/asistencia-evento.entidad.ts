import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Evento } from './evento.entidad';
import { Becario } from '../../becarios/entidades/becario.entidad';

export enum EstadoAsistenciaEvento {
  PRESENTE = 'presente',
  RETRASO = 'retraso',
  AUSENTE = 'ausente',
  JUSTIFICADO = 'justificado',
  FUERA_DE_RADIO = 'fuera_de_radio',
}

@Entity('asistencias_eventos')
export class AsistenciaEvento {
  @ApiProperty({ example: 1, description: 'Identificador único de la marcación' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'Identificador del evento convocado' })
  @Column({ name: 'evento_id' })
  evento_id: number;

  @ApiProperty({ example: 10, description: 'Identificador del becario que registra la asistencia' })
  @Column({ name: 'becario_id' })
  becario_id: number;

  @ApiProperty({ example: '08:25:14', description: 'Hora exacta de la marcación en formato HH:MM:SS' })
  @Column({ name: 'hora_marcacion', type: 'varchar', length: 15 })
  hora_marcacion: string;

  @ApiProperty({ example: -16.500054, description: 'Latitud registrada por el dispositivo móvil' })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitud: number;

  @ApiProperty({ example: -68.173455, description: 'Longitud registrada por el dispositivo móvil' })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitud: number;

  @ApiProperty({ example: 24.5, description: 'Distancia calculada en metros respecto al epicentro del evento' })
  @Column({ name: 'distancia_m', type: 'decimal', precision: 8, scale: 2 })
  distancia_m: number;

  @ApiProperty({ example: true, description: 'Indica si la marcación se produjo dentro del radio de tolerancia' })
  @Column({ name: 'dentro_de_radio', type: 'boolean', default: false })
  dentro_de_radio: boolean;

  @ApiProperty({
    enum: EstadoAsistenciaEvento,
    example: EstadoAsistenciaEvento.PRESENTE,
    description: 'Estado de asistencia determinado institucionalmente',
  })
  @Column({ type: 'varchar', length: 30, default: EstadoAsistenciaEvento.PRESENTE })
  estado: EstadoAsistenciaEvento;

  @ApiProperty({ example: 'Llegada puntual al auditorio', description: 'Notas u observaciones del registro', required: false })
  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @ApiProperty({ description: 'Fecha y hora de creación del registro' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Evento, (evento) => evento.asistencias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evento_id' })
  evento: Evento;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;
}
