import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';
import { PeriodoEvaluacion } from './periodo-evaluacion.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

export enum EstadoEntregaTarea {
  PENDIENTE = 'pendiente',
  ENTREGADO = 'entregado',
  REVISADO = 'revisado',
  OBSERVADO = 'observado',
}

@Entity('entregas_tareas_lideres')
@Unique(['becario_id', 'periodo_id', 'tarea_numero'])
export class EntregaTareaLideres {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ name: 'periodo_id' })
  periodo_id: number;

  @Column({ name: 'tarea_numero', type: 'int' })
  tarea_numero: number;

  @Column({ name: 'tarea_codigo', type: 'varchar', length: 50 })
  tarea_codigo: string;

  @Column({ name: 'titulo_tarea', type: 'varchar', length: 255 })
  titulo_tarea: string;

  @Column({ name: 'archivo_evidencia_url', type: 'text', nullable: true })
  archivo_evidencia_url: string | null;

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 255, nullable: true })
  nombre_archivo: string | null;

  @Column({ name: 'tamano_archivo', type: 'varchar', length: 50, nullable: true })
  tamano_archivo: string | null;

  @Column({ name: 'comentario_becario', type: 'text', nullable: true })
  comentario_becario: string | null;

  @Column({
    type: 'enum',
    enum: EstadoEntregaTarea,
    default: EstadoEntregaTarea.PENDIENTE,
  })
  estado: EstadoEntregaTarea;

  @Column({ name: 'puntaje_obtenido', type: 'decimal', precision: 5, scale: 2, nullable: true })
  puntaje_obtenido: number | null;

  @Column({ name: 'ponderacion_maxima', type: 'decimal', precision: 5, scale: 2, default: 8.33 })
  ponderacion_maxima: number;

  @Column({ name: 'comentario_revisor', type: 'text', nullable: true })
  comentario_revisor: string | null;

  @Column({ name: 'revisor_id', nullable: true })
  revisor_id: number | null;

  @Column({ name: 'fecha_entrega', type: 'timestamp', nullable: true })
  fecha_entrega: Date | null;

  @Column({ name: 'fecha_revision', type: 'timestamp', nullable: true })
  fecha_revision: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @ManyToOne(() => PeriodoEvaluacion)
  @JoinColumn({ name: 'periodo_id' })
  periodo: PeriodoEvaluacion;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'revisor_id' })
  revisor: Usuario;
}
