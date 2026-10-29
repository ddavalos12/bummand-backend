import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';
import { Recorrido } from './recorrido.entidad';

export enum EstadoSolicitud {
  BORRADOR = 'borrador',
  PENDIENTE = 'pendiente',
  REVISADO_SUPERVISOR = 'revisado_supervisor',
  APROBADO_ADMINISTRACION = 'aprobado_administracion',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  OBSERVADO = 'observado',
}

@Entity('solicitudes_pasajes')
export class SolicitudPasajes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ type: 'varchar', length: 20 })
  periodo: string;

  @Column({ name: 'monto_total', type: 'decimal', precision: 8, scale: 2, default: 0 })
  monto_total: number;

  @Column({ name: 'monto_devolucion', type: 'decimal', precision: 8, scale: 2, default: 0 })
  monto_devolucion: number;

  @Column({ type: 'enum', enum: EstadoSolicitud, default: EstadoSolicitud.BORRADOR })
  estado: EstadoSolicitud;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'supervisor_id', type: 'int', nullable: true })
  supervisor_id: number;

  @Column({ name: 'datos_becario', type: 'jsonb', nullable: true })
  datos_becario: any;

  @Column({ name: 'fecha_envio', type: 'timestamp', nullable: true })
  fecha_envio: Date;

  @Column({ name: 'fecha_resolucion', type: 'timestamp', nullable: true })
  fecha_resolucion: Date;

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

  // Getters / Setters de compatibilidad
  get montoTotal(): number { return this.monto_total; }
  set montoTotal(v: number) { this.monto_total = v; }

  get montoDevolucion(): number { return this.monto_devolucion; }
  set montoDevolucion(v: number) { this.monto_devolucion = v; }

  get fechaEnvio(): Date { return this.fecha_envio; }
  set fechaEnvio(v: Date) { this.fecha_envio = v; }

  get fechaResolucion(): Date { return this.fecha_resolucion; }
  set fechaResolucion(v: Date) { this.fecha_resolucion = v; }

  get createdAt(): Date { return this.created_at; }
  set createdAt(v: Date) { this.created_at = v; }

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Usuario;

  @OneToMany(() => Recorrido, (recorrido) => recorrido.solicitud)
  recorridos: Recorrido[];
}

