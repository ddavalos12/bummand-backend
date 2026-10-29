import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

export enum EstadoAprobacionPracticas {
  PENDIENTE = 'pendiente',
  REVISADO_SUPERVISOR = 'revisado_supervisor',
  APROBADO_ADMINISTRACION = 'aprobado_administracion',
  OBSERVADO = 'observado',
}

@Entity('aprobaciones_practicas')
export class AprobacionPracticas {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ name: 'supervisor_id' })
  supervisor_id: number;

  @Column({ type: 'varchar', length: 20 })
  periodo: string;

  @Column({ name: 'horas_aprobadas', type: 'decimal', precision: 6, scale: 2 })
  horas_aprobadas: number;

  @Column({ name: 'firma_digital', type: 'text', nullable: true })
  firma_digital: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoAprobacionPracticas.REVISADO_SUPERVISOR,
  })
  estado: EstadoAprobacionPracticas;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'revisado_por_supervisor_id', type: 'int', nullable: true })
  revisado_por_supervisor_id: number | null;

  @Column({ name: 'fecha_revision_supervisor', type: 'timestamp', nullable: true })
  fecha_revision_supervisor: Date | null;

  @Column({ name: 'observacion_supervisor', type: 'text', nullable: true })
  observacion_supervisor: string | null;

  @Column({ name: 'aprobado_por_admin_id', type: 'int', nullable: true })
  aprobado_por_admin_id: number | null;

  @Column({ name: 'fecha_aprobacion_admin', type: 'timestamp', nullable: true })
  fecha_aprobacion_admin: Date | null;

  @Column({ name: 'observacion_admin', type: 'text', nullable: true })
  observacion_admin: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Usuario;
}
