import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';
import { AsistenciaEvento } from './asistencia-evento.entidad';

export enum TipoEvento {
  TALLER = 'taller',
  RETIRO = 'retiro',
  SERVICIO_DIACONAL = 'servicio_diaconal',
  REUNION = 'reunion',
  ESCUELA_LIDERES_ESPECIAL = 'escuela_lideres_especial',
}

export enum EstadoEvento {
  PROGRAMADO = 'programado',
  EN_CURSO = 'en_curso',
  FINALIZADO = 'finalizado',
  CANCELADO = 'cancelado',
}

@Entity('eventos')
export class Evento {
  @ApiProperty({ example: 1, description: 'Identificador único del evento' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'Identificador del usuario que convocó el evento', required: false })
  @Column({ name: 'creador_id', type: 'int', nullable: true })
  creador_id: number | null;

  @ApiProperty({ example: 'Encuentro de Liderazgo y Acción Diaconal', description: 'Título institucional del evento' })
  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @ApiProperty({ example: 'Jornada intensiva de formación y servicio diaconal', description: 'Descripción detallada de la convocatoria' })
  @Column({ type: 'text' })
  descripcion: string;

  @ApiProperty({ enum: TipoEvento, example: TipoEvento.ESCUELA_LIDERES_ESPECIAL, description: 'Clasificación tipológica del evento' })
  @Column({ name: 'tipo_evento', type: 'varchar', length: 50, default: TipoEvento.REUNION })
  tipo_evento: TipoEvento;

  @ApiProperty({ example: '2026-10-25', description: 'Fecha fijada para el evento' })
  @Column({ type: 'date' })
  fecha: Date;

  @ApiProperty({ example: '08:30', description: 'Hora de inicio programada (HH:MM)' })
  @Column({ name: 'hora_inicio', type: 'varchar', length: 10 })
  hora_inicio: string;

  @ApiProperty({ example: '13:30', description: 'Hora de conclusión proyectada (HH:MM)' })
  @Column({ name: 'hora_fin', type: 'varchar', length: 10 })
  hora_fin: string;

  @ApiProperty({ example: -16.500054, description: 'Latitud geográfica del recinto o punto de encuentro' })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitud: number;

  @ApiProperty({ example: -68.173455, description: 'Longitud geográfica del recinto o punto de encuentro' })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitud: number;

  @ApiProperty({ example: 100, description: 'Radio perimetral de tolerancia geodésica en metros', default: 100 })
  @Column({ name: 'radio_tolerancia_m', type: 'int', default: 100 })
  radio_tolerancia_m: number;

  @ApiProperty({ example: 'Av. Juan Pablo II esq. Calle Sbtte. Jorge Eulert 125, El Alto', description: 'Referencia domiciliaria o urbana del lugar' })
  @Column({ name: 'direccion_referencia', type: 'varchar', length: 255 })
  direccion_referencia: string;

  @ApiProperty({ enum: EstadoEvento, example: EstadoEvento.PROGRAMADO, description: 'Estado operativo del evento' })
  @Column({ type: 'varchar', length: 30, default: EstadoEvento.PROGRAMADO })
  estado: EstadoEvento;

  @ApiProperty({ description: 'Fecha de registro de la convocatoria' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ApiProperty({ description: 'Fecha de última modificación' })
  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creador_id' })
  creador?: Usuario;

  @OneToMany(() => AsistenciaEvento, (asistencia) => asistencia.evento)
  asistencias?: AsistenciaEvento[];
}
