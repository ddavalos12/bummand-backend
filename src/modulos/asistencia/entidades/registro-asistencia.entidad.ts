import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';

export enum TipoAsistencia {
  PRACTICAS = 'practicas',
  ESCUELA_LIDERES = 'escuela_lideres',
  ACCIONES_SERVICIO = 'acciones_servicio',
}

@Entity('registros_asistencia')
export class RegistroAsistencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ type: 'enum', enum: TipoAsistencia })
  tipo: TipoAsistencia;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ name: 'hora_ingreso', type: 'time', nullable: true })
  horaIngreso: string;

  @Column({ name: 'hora_salida', type: 'time', nullable: true })
  hora_salida: string;

  @Column({ name: 'lat_ingreso', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latIngreso: number;

  @Column({ name: 'lng_ingreso', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lngIngreso: number;

  @Column({ name: 'lat_salida', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latSalida: number;

  @Column({ name: 'lng_salida', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lngSalida: number;

  @Column({ name: 'horas_trabajadas', type: 'decimal', precision: 5, scale: 2, nullable: true })
  horasTrabajadas: number;

  @Column({ name: 'dentro_de_radio', type: 'boolean', default: false })
  dentroDeRadio: boolean;

  @Column({ name: 'dentro_de_horario', type: 'boolean', nullable: true })
  dentroDeHorario: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Becario, (becario) => becario.registros_asistencia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;
}

