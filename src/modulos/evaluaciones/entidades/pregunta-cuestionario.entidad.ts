import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cuestionario } from './cuestionario.entidad';

export interface OpcionPreguntaCuestionario {
  inciso: string;
  texto: string;
  puntaje: number;
  semaforo?: 'verde' | 'amarillo' | 'rojo' | string;
}

@Entity('preguntas_cuestionario')
export class PreguntaCuestionario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cuestionario_id', type: 'int' })
  cuestionario_id: number;

  @Column({ name: 'numero_orden', type: 'int' })
  numero_orden: number;

  @Column({ type: 'varchar', length: 150, default: 'General' })
  seccion: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  titulo: string;

  @Column({ type: 'text' })
  enunciado: string;

  @Column({ type: 'varchar', length: 50, default: 'likert' })
  tipo_pregunta: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  opciones: OpcionPreguntaCuestionario[];

  @Column({ name: 'peso_puntos', type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  peso_puntos: number;

  @Column({ type: 'boolean', default: true })
  obligatoria: boolean;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Cuestionario, (cuestionario) => cuestionario.preguntas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cuestionario_id' })
  cuestionario: Cuestionario;
}
