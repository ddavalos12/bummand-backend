import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Evaluacion } from './evaluacion.entidad';

export enum TipoEvaluador {
  PASTOR = 'pastor',
  BECARIO = 'becario',
  SUPERVISOR = 'supervisor',
  FACILITADOR = 'facilitador',
  TRABAJADOR_SOCIAL = 'trabajador_social',
}

@Entity('evaluadores')
export class Evaluador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'enum', enum: TipoEvaluador })
  tipo: TipoEvaluador;

  @Column({ type: 'varchar', length: 150, nullable: true })
  correo: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string;

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.evaluador)
  evaluaciones: Evaluacion[];
}
