import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PreguntaCuestionario } from './pregunta-cuestionario.entidad';
import { ModuloEvaluacion } from './modulo-evaluacion.entidad';

@Entity('cuestionarios')
export class Cuestionario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 100, default: 'general' })
  tipo_evaluador: string;

  @Column({ name: 'modulo_id', type: 'int', nullable: true })
  modulo_id: number | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => PreguntaCuestionario, (pregunta) => pregunta.cuestionario, {
    cascade: true,
  })
  preguntas: PreguntaCuestionario[];

  @ManyToOne(() => ModuloEvaluacion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'modulo_id' })
  modulo?: ModuloEvaluacion;
}
