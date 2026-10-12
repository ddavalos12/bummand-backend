import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Evaluacion } from './evaluacion.entidad';

export enum EstadoPeriodo {
  ABIERTO = 'abierto',
  CERRADO = 'cerrado',
}

@Entity('periodos_evaluacion')
export class PeriodoEvaluacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fecha_fin: Date;

  @Column({ type: 'enum', enum: EstadoPeriodo, default: EstadoPeriodo.ABIERTO })
  estado: EstadoPeriodo;

  @Column({ name: 'peso_academica', type: 'decimal', precision: 5, scale: 2, default: 20 })
  peso_academica: number;

  @Column({ name: 'peso_liderazgo', type: 'decimal', precision: 5, scale: 2, default: 20 })
  peso_liderazgo: number;

  @Column({ name: 'peso_practicas', type: 'decimal', precision: 5, scale: 2, default: 20 })
  peso_practicas: number;

  @Column({ name: 'peso_mentor', type: 'decimal', precision: 5, scale: 2, default: 20 })
  peso_mentor: number;

  @Column({ name: 'peso_socioeconomica', type: 'decimal', precision: 5, scale: 2, default: 20 })
  peso_socioeconomica: number;

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.periodo)
  evaluaciones: Evaluacion[];
}
