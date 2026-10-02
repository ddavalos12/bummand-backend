import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Evaluacion } from './evaluacion.entidad';

@Entity('modulos_evaluacion')
export class ModuloEvaluacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'integer' })
  orden: number;

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.modulo)
  evaluaciones: Evaluacion[];
}
