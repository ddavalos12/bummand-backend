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

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.periodo)
  evaluaciones: Evaluacion[];
}
