import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';

export enum EstadoCasoPastoral {
  PENDIENTE = 'PENDIENTE',
  EN_TUTORIA = 'EN_TUTORIA',
  RESUELTO = 'RESUELTO',
}

export enum PrioridadCasoPastoral {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA',
}

export interface NotaSeguimientoPastoral {
  fecha: string;
  autor: string;
  rol_autor: string;
  contenido: string;
  acuerdos?: string;
}

@Entity('casos_seguimiento_pastoral')
export class CasoSeguimientoPastoral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @Column({ type: 'varchar', length: 150, default: 'Formulario F-03 (Pastor)' })
  origen: string;

  @Column({ type: 'text' })
  observacion_pastoral: string;

  @Column({ type: 'text', nullable: true })
  plan_accion: string | null;

  @Column({ type: 'varchar', length: 20, default: EstadoCasoPastoral.PENDIENTE })
  estado: EstadoCasoPastoral;

  @Column({ type: 'varchar', length: 20, default: PrioridadCasoPastoral.ALTA })
  prioridad: PrioridadCasoPastoral;

  @Column({ name: 'responsable_nombre', type: 'varchar', length: 150, nullable: true })
  responsable_nombre: string | null;

  @Column({ name: 'notas_seguimiento', type: 'jsonb', default: () => "'[]'" })
  notas_seguimiento: NotaSeguimientoPastoral[];

  @Column({ name: 'conclusion_resolucion', type: 'text', nullable: true })
  conclusion_resolucion: string | null;

  @Column({ name: 'fecha_resolucion', type: 'date', nullable: true })
  fecha_resolucion: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
