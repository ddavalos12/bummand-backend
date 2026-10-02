import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToOne, JoinColumn, Unique } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';
import { ModuloEvaluacion } from './modulo-evaluacion.entidad';
import { PeriodoEvaluacion } from './periodo-evaluacion.entidad';
import { Evaluador } from './evaluador.entidad';
import { EvaluacionPastor } from './evaluacion-pastor.entidad';

export enum EstadoEvaluacion {
  PENDIENTE = 'pendiente',
  COMPLETADO = 'completado',
}

@Entity('evaluaciones')
@Unique(['becario_id', 'periodo_id', 'modulo_id'])
export class Evaluacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ name: 'periodo_id' })
  periodo_id: number;

  @Column({ name: 'modulo_id' })
  modulo_id: number;

  @Column({ name: 'evaluador_id' })
  evaluador_id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  puntaje: number;

  @Column({ type: 'enum', enum: EstadoEvaluacion, default: EstadoEvaluacion.PENDIENTE })
  estado: EstadoEvaluacion;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'archivo_pdf', type: 'varchar', length: 255, nullable: true })
  archivo_pdf: string;

  @Column({ name: 'fecha_evaluacion', type: 'date', nullable: true })
  fecha_evaluacion: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Relaciones canónicas
  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @ManyToOne(() => PeriodoEvaluacion, (periodo) => periodo.evaluaciones)
  @JoinColumn({ name: 'periodo_id' })
  periodo: PeriodoEvaluacion;

  @ManyToOne(() => ModuloEvaluacion, (modulo) => modulo.evaluaciones)
  @JoinColumn({ name: 'modulo_id' })
  modulo: ModuloEvaluacion;

  @ManyToOne(() => Evaluador, (evaluador) => evaluador.evaluaciones)
  @JoinColumn({ name: 'evaluador_id' })
  evaluador: Evaluador;

  @OneToOne(() => EvaluacionPastor, (evaluacion_pastor) => evaluacion_pastor.evaluacion)
  detalle_pastor: EvaluacionPastor;

  // Getters / Setters de compatibilidad transitoria
  get creado_en(): Date { return this.created_at; }
  set creado_en(v: Date) { this.created_at = v; }
}
