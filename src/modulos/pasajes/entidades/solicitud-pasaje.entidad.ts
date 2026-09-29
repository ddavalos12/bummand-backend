import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';
import { Recorrido } from './recorrido.entidad';

export enum EstadoSolicitud {
  BORRADOR = 'borrador',
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
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
  montoTotal: number;

  @Column({ name: 'monto_devolucion', type: 'decimal', precision: 8, scale: 2, default: 0 })
  montoDevolucion: number;

  @Column({ type: 'enum', enum: EstadoSolicitud, default: EstadoSolicitud.BORRADOR })
  estado: EstadoSolicitud;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'supervisor_id', nullable: true })
  supervisor_id: number;

  @Column({ name: 'fecha_envio', type: 'timestamp', nullable: true })
  fechaEnvio: Date;

  @Column({ name: 'fecha_resolucion', type: 'timestamp', nullable: true })
  fechaResolucion: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Usuario;

  @OneToMany(() => Recorrido, (recorrido) => recorrido.solicitud)
  recorridos: Recorrido[];
}

